"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { getFamilyTreeFromFirebase } from './action';
import { ForceGraph3D } from 'react-force-graph';
import SpriteText from 'three-spritetext';


export default function FocusGraph() {
  const [data, setData] = useState({ nodes: [], links: [] });
  const fgRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      const treeData = await getFamilyTreeFromFirebase();
      setData(treeData);
      console.log(treeData)
    };
    fetchData();
  }, []);

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

  const nodeThreeObject = (node) => {
    const sphereGeometry = new THREE.SphereGeometry(node.nom === "Jésus " ? 10 : 5, 32, 32); // Change size based on node name
    const sphereMaterial = new THREE.MeshBasicMaterial({ 
        color: node.nom === "Jésus " ? 0xFFFFFF : 
        node.testament === "encien" ? 0xF47512 : 0xD9EB71 });
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
