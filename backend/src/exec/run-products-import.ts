import { productImportWorkflow } from "../workflows/product-import";

export default async function () {
  try {
    console.log("Starting product import workflow...");
    const workflowInput = {
      csvFilePath: "products_13h_to_import.csv"
    };
    const { result } = await productImportWorkflow().run({ input: workflowInput });
    console.log("Workflow completed successfully!");
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Workflow failed:", error);
    process.exit(1);
  }
}




