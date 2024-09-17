import { collection, getDocs, addDoc } from "firebase/firestore";
import { database } from "@/tool/firebase"; 
/**
 * Listen for changes in the 'personnages' collection in Firebase.
 * This function sets up a real-time listener that triggers the callback whenever there is a change.
 *
 * @param {Function} callback - The function to call when there is a change in the data.
 * @returns {Function} - The unsubscribe function to stop listening for changes.
 */
export const onPersonnageChange = (callback) => {
  // Reference to the 'personnages' collection in Firestore
  const personnagesRef = collection(database, "persons");

  // Set up a real-time listener for changes
  const unsubscribe = onSnapshot(personnagesRef, (snapshot) => {
      const updatedData = [];

      // Loop through the changes and build the updated data
      snapshot.forEach((doc) => {
          updatedData.push({
              id: doc.id,
              ...doc.data(), // Spread document data (nom, testament, etc.)
          });
      });

      // Call the callback with the updated data
      callback(updatedData);
  }, (error) => {
      console.error("Error listening to personnage changes:", error);
  });

  // Return the unsubscribe function to stop listening when not needed
  return unsubscribe;
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
