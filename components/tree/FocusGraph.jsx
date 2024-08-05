"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import SpriteText from 'three-spritetext';
import { ForceGraph3D } from 'react-force-graph';
import { collection, getDocs } from "firebase/firestore";
import { database } from "@/tool/firebase"; 

export default function FocusGraph() {
  const [data, setData] = useState({ nodes: [], links: [] });
  const fgRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const treeData = await getFamilyTreeFromFirebase();
        setData(treeData);
        console.log(treeData)
      } catch (error) {
        console.log(error)
      }
    };
    fetchData();
  }, []);


  /**
   * Retrieves the family tree from Firestore.
   * 
   * @returns {Promise<Object>} - A promise that resolves to an object containing nodes and links.
   * 
   * The returned object has the following structure:
   * {
   *   nodes: Array<{id: string, ...data}>,
   *   links: Array<{source: string, target: string, relation: string}>
   * }
   * 
   * Nodes represent persons and links represent relationships between them.
   */
  const getFamilyTreeFromFirebase = async () => {
    const disciplesSnapshot = await getDocs(collection(database, 'persons')); // Retrieve all documents from 'persons' collection
    const filiationsSnapshot = await getDocs(collection(database, 'relations')); // Retrieve all documents from 'relations' collection

    const nodes = []; // Array to store person nodes
    const links = []; // Array to store relationship links
    const disciplesMap = new Map(); // Map for quick access to disciples by name

    // Populate nodes array and disciplesMap with person data
    disciplesSnapshot.forEach(doc => {
      const discipleData = { id: doc.id, ...doc.data() };
      nodes.push(discipleData);
      disciplesMap.set(discipleData.nom, discipleData);
    });

    // Create links between persons based on relationship data
    filiationsSnapshot.forEach(doc => {
      const data = doc.data();
      const source = disciplesMap.get(data.users_1);
      const target = disciplesMap.get(data.users_2);

      // Only create a link if both source and target persons are found
      if (source && target) {
        links.push({
          source: source.id,
          target: target.id,
          relation: data.relation_type
        });
      }
    });

    return { nodes, links };
  };

  /**
 * Handles the click event on a node in the ForceGraph3D.
 * This function adjusts the camera position to focus on the clicked node.
 * 
 * @param {Object} node - The node that was clicked. It contains properties like x, y, z.
 * 
 * @returns {void}
 */
  const handleClick = useCallback((node) => {
    if (fgRef.current) {
      const distance = 40;
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

      fgRef.current.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
        node,
        3000
      );
    } else {
      console.error('fgRef.current is undefined');
    }
  }, []);

  /**
   * Creates a Three.js mesh for a node in the ForceGraph3D.
   * This function creates a sphere with a label to represent a node.
   * 
   * @param {Object} node - The node data containing properties like nom and testament.
   * 
   * @returns {THREE.Mesh} - A Three.js mesh representing the node, including a sphere and a label.
   */
  const nodeThreeObject = (node) => {
    const sphereGeometry = new THREE.SphereGeometry(node.nom === "Jésus " ? 10 : 5, 32, 32); // Change size based on node name
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: node.nom === "Jésus " ? 0xFFFFFF :
        node.testament === "encien" ? 0xF47512 : 0xD9EB71
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

    // Add label as a child of the sphere
    const sprite = new SpriteText(node.nom);
    sprite.color = node.nom === "Jésus " ? '#ff0000' : 'white';
    sprite.textHeight = node.nom === "Jésus " ? 8 : 4;
    sphere.add(sprite);

    // Adjust label position
    sprite.position.set(0, 0, node.nom === "Jésus " ? 10 : 6);

    return sphere;
  };

  return (
    <ForceGraph3D
      ref={fgRef}
      graphData={data}
      nodeColor={node => node.nom === "Jésus " ? "#F5501C" : "#D9EB71"}
      nodeLabel="nom"
      onNodeClick={handleClick}
      nodeThreeObject={nodeThreeObject}
      nodeThreeObjectExtend={true}
      nodeAutoColorBy={link => link.relation}
      linkLabel={(link) => link.relation}
      linkDirectionalParticles={1}
      linkWidth={1}
      linkDirectionalParticleWidth={2}
      linkAutoColorBy={link => link.relation}
      linkThreeObjectExtend={true}
      linkThreeObject={link => {
        // extend link with text sprite
        const sprite = new SpriteText(`${link.relation}`);
        sprite.color = 'lightgrey';
        sprite.textHeight = 1.5;
        return sprite;
      }}
      linkPositionUpdate={(sprite, { start, end }) => {
        const middlePos = Object.assign(...['x', 'y', 'z'].map(c => ({
          [c]: start[c] + (end[c] - start[c]) / 2 // calc middle point
        })));

        // Position sprite
        Object.assign(sprite.position, middlePos);
      }}
    />
  );
}
