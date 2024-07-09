import { collection, getDocs } from "firebase/firestore";
import { database } from "@/tool/firebase"; // Assurez-vous que votre configuration Firebase est correcte


// Ajouter un disciple
const addDisciple = async (disciple) => {
    try {
      const docRef = await addDoc(collection(database, "disciple"), disciple);
      console.log("Document written with ID: ", docRef.id);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };
  
  // Ajouter une relation de filiation
export const addFiliation = async (filiation) => {
    try {
      const docRef = await addDoc(collection(database, "filiation"), filiation);
      console.log("Document written with ID: ", docRef.id);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };
  
  // Exemple d'utilisation
export const addSampleData = async () => {
    const jesus = { nom: "Jesus", filiationId: "A" };
    const mary = { nom: "Mary" };
    const joseph = { nom: "Joseph" };
  
    await addDisciple(jesus);
    await addDisciple(mary);
    await addDisciple(joseph);
  
    const motherRelation = { sourceId: "2", targetId: "1", relation: "mother" }; // Mary -> Jesus
    const fatherRelation = { sourceId: "3", targetId: "1", relation: "father" }; // Joseph -> Jesus
  
    await addFiliation(motherRelation);
    await addFiliation(fatherRelation);
};
  
export const getFamilyTreeFromFirebase = async () => {
  const disciplesSnapshot = await getDocs(collection(database, 'persons'));
  const filiationsSnapshot = await getDocs(collection(database, 'relations'));

  const nodes = [];
  const links = [];

  const disciplesMap = new Map();

  // Récupération des nœuds et création d'une map pour accès rapide
  disciplesSnapshot.forEach(doc => {
    const discipleData = { id: doc.id, ...doc.data() };
    nodes.push(discipleData);
    disciplesMap.set(discipleData.nom, discipleData); // Utilisation du nom comme clé
  });

  // Création des liens en utilisant users_1 et users_2
  filiationsSnapshot.forEach(doc => {
    const data = doc.data();
    const source = disciplesMap.get(data.users_1);
    const target = disciplesMap.get(data.users_2);

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
