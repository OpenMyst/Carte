"use client"
import React, { useState, useEffect, useRef } from 'react'
import { ForceGraph3D } from 'react-force-graph'
import { getFamilyTreeFromFirebase } from './action'
// const genRandomTree = (N = 300, reverse = false) => {
//   return {
//     nodes: [...Array(N).keys()].map(i => ({ id: i })),
//     links: [...Array(N).keys()]
//       .filter(id => id)
//       .map(id => ({
//         [reverse ? 'target' : 'source']: id,
//         [reverse ? 'source' : 'target']: Math.round(Math.random() * (id - 1))
//       }))
//   };
// }
const PageGenialogique = () => {
  const [data, setData] = useState({ nodes: [], links: [] });
  const fgRef = useRef();

  useEffect(() => {
    
    async function fetchData() {
      const treeData = await getFamilyTreeFromFirebase();
      setData(treeData);
    }

    fetchData();
  }, []);

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
    <ForceGraph3D
      ref={fgRef}
      graphData={data}
      nodeLabel="nom"
      linkLabel={data.links.relation}
      onNodeClick={handleClick}
      linkColor={() => 'rgba(255,255,255,0.5)'}
      linkDirectionalParticles={1}
      linkDirectionalParticleWidth={1} />
  )
}

export default PageGenialogique