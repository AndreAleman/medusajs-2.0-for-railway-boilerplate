import { createWorkflow, WorkflowData, createStep, StepResponse } from "@medusajs/workflows-sdk";
import * as fs from "fs";
import * as path from "path";
import csvParser from "csv-parser";

type ProductImportWorkflowInput = {
  csvFilePath: string;
};

// Step 1: Parse CSV file
const parseCsvStep = createStep(
  "parse-csv-step",
  async (csvFilePath: string): Promise<StepResponse<any[], any[]>> => {
    const results: any[] = [];
    const fullPath = path.resolve(__dirname, "../data", csvFilePath);
    
    const csvData = await new Promise<any[]>((resolve, reject) => {
      fs.createReadStream(fullPath)
        .pipe(csvParser())
        .on("data", (data) => results.push(data))
        .on("end", () => resolve(results))
        .on("error", (error) => reject(error));
    });
    
    return new StepResponse(csvData, csvData);
  }
);

// Step 2: Process parsed data and transform to Medusa format
const processCsvDataStep = createStep(
  "process-csv-data-step",
  async (data: any[]): Promise<StepResponse<any, any>> => {
    console.log(`Successfully parsed ${data.length} rows from CSV`);
    console.log("Sample row:", data[0]);
    
    // Group variations by parent_sku to create product families
    const productFamilies = new Map();
    
    data.forEach((row) => {
      const parentSku = row.parent_sku || row.sku;
      if (!productFamilies.has(parentSku)) {
        productFamilies.set(parentSku, {
          parent_sku: parentSku,
          name: row.name.split(',')[0].trim(), // Extract base name before comma
          description: row.description || row.short_description || '',
          variants: []
        });
      }
      
      productFamilies.get(parentSku).variants.push({
        sku: row.sku,
        name: row.name,
        price: parseFloat(row.regular_price) || 0,
        weight: parseFloat(row.weight_lbs) || 0,
        stock: parseInt(row.stock) || 0,
        alloy: row.attribute_1_values || 'T304',
        size: row.attribute_2_values || '',
        in_stock: row.in_stock === 't'
      });
    });
    
    const result = {
      totalRows: data.length,
      productFamilies: Array.from(productFamilies.values())
    };
    
    return new StepResponse(result, result);
  }
);

// Step 3: Create products using direct API calls
const createProductsStep = createStep(
  "create-products-step",
  async (processedData: any, { container }): Promise<StepResponse<any, any>> => {
    console.log(`Creating ${processedData.productFamilies.length} products in Medusa...`);
    
    try {
      const productModuleService = container.resolve("productModuleService");
      const createdProducts = [];
      
      for (const family of processedData.productFamilies) {
        console.log(`Creating product: ${family.name}`);
        
        // Create the base product
        const productData = {
          title: family.name,
          subtitle: `${family.parent_sku} - Industrial Hardware`,
          description: family.description || `High-quality ${family.name.toLowerCase()} for industrial applications`,
          handle: family.parent_sku.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          is_giftcard: false,
          discountable: true,
          status: "published"
        };
        
        const [createdProduct] = await productModuleService.createProducts([productData]);
        console.log(`Created product: ${createdProduct.title} (ID: ${createdProduct.id})`);
        
        // Create product options
        const alloyValues = [...new Set(family.variants.map(v => v.alloy))];
        const sizeValues = [...new Set(family.variants.map(v => v.size))];
        
        const alloyOption = await productModuleService.createProductOptions([{
          title: "Alloy",
          product_id: createdProduct.id,
          values: alloyValues.map(value => ({ value }))
        }]);
        
        const sizeOption = await productModuleService.createProductOptions([{
          title: "Size",
          product_id: createdProduct.id,
          values: sizeValues.map(value => ({ value }))
        }]);
        
        console.log(`Created options for product ${createdProduct.id}`);
        
        // Create variants
        for (const variant of family.variants) {
          const variantData = {
            title: variant.name,
            sku: variant.sku,
            product_id: createdProduct.id,
            manage_inventory: true,
            allow_backorder: false,
            weight: variant.weight,
            options: {
              [alloyOption[0].id]: variant.alloy,
              [sizeOption[0].id]: variant.size
            }
          };
          
          const [createdVariant] = await productModuleService.createProductVariants([variantData]);
          console.log(`Created variant: ${createdVariant.sku}`);
        }
        
        createdProducts.push(createdProduct);
      }
      
      console.log(`Successfully created ${createdProducts.length} products!`);
      
      return new StepResponse({
        success: true,
        createdProducts,
        totalProductsCreated: createdProducts.length,
        originalData: processedData
      }, {
        success: true,
        createdProducts,
        totalProductsCreated: createdProducts.length
      });
      
    } catch (error) {
      console.error("Error creating products:", error);
      throw error;
    }
  }
);

// Main workflow
export const productImportWorkflow = createWorkflow(
  "product-import-workflow",
  (input: WorkflowData<ProductImportWorkflowInput>) => {
    const csvData = parseCsvStep(input.csvFilePath);
    const processedData = processCsvDataStep(csvData);
    const createdProducts = createProductsStep(processedData);
    
    return createdProducts;
  }
);