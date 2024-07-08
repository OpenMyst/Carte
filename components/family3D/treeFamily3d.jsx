// components/FamilyTree3D.js

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import getFamilytree from './familyTree';

function TreeNode({ person }) {
  return (
    <mesh position={person.position}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color="blue" />
      <textGeometry args={[person.name, { size: 0.5, height: 0.1 }]} />
    </mesh>
  );
}

export default function FamilyTree3D() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const res = await getFamilytree()
      setData( res );
    }

    fetchData();
  }, []);

  return (
    <Canvas>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls />
      {data.map(person => (
        <TreeNode key={person.id} person={person} />
      ))}
    </Canvas>
  );
}
