"use client";
import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { getFamilyTreeFromFirebase } from './action';

// Dynamically import ForceGraph3D to avoid SSR issues
const ForceGraph3D = dynamic(() => import('react-force-graph').then(mod => mod.ForceGraph3D), {
  ssr: false
});

export default function FocusGraph() {
  const [data, setData] = useState({ nodes: [], links: [] });
  const fgRef = useRef();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Check if we are in the client
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const treeData = await getFamilyTreeFromFirebase();
      setData(treeData);
    };

    if (isClient) {
      fetchData();
    }
  }, [isClient]);

  const handleClick = (node) => {
    const distance = 40;
    const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

    fgRef.current.cameraPosition(
      { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
      node,
      3000
    );
  };

  return (
    isClient && (
      <ForceGraph3D
        ref={fgRef}
        graphData={data}
        nodeLabel="nom"
        linkLabel={(link) => link.relation}
        onNodeClick={handleClick}
        linkColor={() => 'rgba(255,255,255,0.5)'}
        linkDirectionalParticles={1}
        linkDirectionalParticleWidth={1}
      />
    )
  );
}
