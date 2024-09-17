"use client"
import React, { useState, useEffect, useRef, useCallback } from 'react';
import SpriteText from 'three-spritetext';
import { getFamilyTreeFromFirebase, onPersonnageChange } from './action';
import dynamic from 'next/dynamic';

/**
 * Dynamically imports the `ForceGraph3D` component from the `react-force-graph` library.
 * This approach uses Next.js's `dynamic` function to enable client-side rendering only,
 * as specified by `ssr: false`. This prevents server-side rendering of the `ForceGraph3D` component,
 * which is important for components that rely on browser-specific APIs or have large bundles.
 * 
 * The `ForceGraph3D` component is imported asynchronously and made available for use in the component.
 * The `then` method ensures that the import resolves to the `ForceGraph3D` export from the module.
 * 
 * @type {React.ComponentType}
 */
const ForceGraph3D = dynamic(() => import('react-force-graph').then(mod => mod.ForceGraph3D), { ssr: false });

/**
 * PageGenealogie is a React component that renders a 3D force graph using the `react-force-graph` library.
 * It visualizes a family tree with nodes and links, where each node represents a person and each link
 * represents a relationship between people. The component fetches family tree data from Firebase,
 * sets up the graph with custom node and link rendering, and provides interactivity for clicking on nodes.
 * 
 * The component uses:
 * - `useState` to manage the graph data (nodes and links).
 * - `useEffect` to fetch data from Firebase when the component mounts.
 * - `useRef` to keep a reference to the ForceGraph3D instance for camera manipulation.
 * - `useCallback` to handle node click events, adjusting the camera position to focus on the clicked node.
 * 
 * Nodes are represented as spheres with labels, and their appearance is customized based on their properties.
 * Links are rendered with text sprites and have dynamic visual properties.
 * 
 * @component
 * @example
 * // Usage
 * <PageGenealogie />
 */
const PageGenealogie = () => {
  const [data, setData] = useState({ nodes: [], links: [] });
  const fgRef = useRef();

  // Function to update the graph data
  const fetchAndUpdateTreeData = async () => {
    try {
      const treeData = await getFamilyTreeFromFirebase();
      setData(treeData);
    } catch (error) {
      console.log("Error fetching family tree data:", error);
    }
  };

  // Fetch data initially and set up real-time listener
  useEffect(() => {
    // Fetch initial tree data
    fetchAndUpdateTreeData();

    // Set up real-time listener for any changes (new, update, delete)
    const unsubscribe = onPersonnageChange(() => {
      // When a change is detected, fetch the updated tree data
      fetchAndUpdateTreeData();
    });

    // Clean up the listener when component unmounts
    return () => unsubscribe();
  }, []);

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
    const sphereGeometry = new THREE.SphereGeometry(node.nom === "Jesus" ? 10 : 5, 32, 32); // Change size based on node name
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: node.nom === "Jesus" ? 0xFFFFFF :
        node.testament === "encien" ? 0xF47512 : 0xD9EB71
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

    // Add label as a child of the sphere
    const sprite = new SpriteText(node.nom);
    sprite.color = node.nom === "Jesus" ? '#ff0000' : 'white';
    sprite.textHeight = node.nom === "Jesus" ? 8 : 4;
    sphere.add(sprite);

    // Adjust label position
    sprite.position.set(0, 0, node.nom === "Jesus" ? 10 : 6);

    return sphere;
  };

  return (
    <ForceGraph3D
      ref={fgRef}
      graphData={data}
      nodeColor={node => node.nom === "Jesus" ? "#F5501C" : "#D9EB71"}
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

export default PageGenealogie