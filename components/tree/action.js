import { collection, getDocs, addDoc } from "firebase/firestore";
import { database } from "@/tool/firebase"; 

/**
 * Adds a disciple to the 'disciple' collection in Firestore.
 * 
 * @param {Object} disciple - The disciple data to be added.
 * @returns {Promise<void>} - A promise that resolves when the disciple is added.
 */
export const addDisciple = async (disciple) => {
  try {
    const docRef = await addDoc(collection(database, "disciple"), disciple); // Add disciple document
    console.log("Document written with ID: ", docRef.id); 
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};

/**
 * Adds a filiation (relationship) to the 'filiation' collection in Firestore.
 * 
 * @param {Object} filiation - The filiation data to be added.
 * @returns {Promise<void>} - A promise that resolves when the filiation is added.
 */
export const addFiliation = async (filiation) => {
  try {
    const docRef = await addDoc(collection(database, "filiation"), filiation); // Add filiation document
    console.log("Document written with ID: ", docRef.id); 
  } catch (e) {
    console.error("Error adding document: ", e); 
  }
};

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
export const getFamilyTreeFromFirebase = async () => {
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
