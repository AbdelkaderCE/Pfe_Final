import { createManualGroup } from './src/modules/pfe/groupe.service';

async function main() {
  try {
    const payload = {
      nom_ar: "Test Group",
      nom_en: "Test Group EN",
      coEncadrantId: 1, // Assume 1 exists
      members: [
        { etudiantId: 1, role: "chef_groupe" } // Assume 1 exists
      ]
    };
    console.log("Calling createManualGroup...");
    const res = await createManualGroup(payload);
    console.log("Success:", res);
  } catch (e) {
    console.error("Error:", e);
  }
}
main();
