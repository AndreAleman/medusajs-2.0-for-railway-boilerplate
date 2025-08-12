import 'dotenv/config'
import { DynamicProductTransformer } from '../lib/woocommerce/transformer'
import { WooCommerceBatchFetcher } from '../lib/woocommerce/migration/batch-fetcher'
import { ProductFamilyOrganizer } from '../lib/woocommerce/migration/family-organizer'
import { writeFileSync } from 'fs'
import { join } from 'path'

// Your actual Medusa configuration
const SALES_CHANNEL_ID = process.env.MEDUSA_SALES_CHANNEL_ID || 'sc_01H2XQZJV8Y2K3M4N5P6Q7R8S9'
const INVENTORY_LOCATION_ID = process.env.MEDUSA_LOCATION_ID || 'loc_your_actual_location_id'

interface SingleFamilyImportResult {
  success: boolean
  productFamily: any[]
  medusaProducts: any[]
  stats: {
    parentProductName: string
    parentSku: string
    variationsFound: number
    medusaProductsCreated: number
    totalVariants: number
    familyType: 'multi-variant' | 'single-variant'
  }
  errors: string[]
  duration: number
}

class SingleProductFamilyImporter {
  private transformer: DynamicProductTransformer
  private fetcher: WooCommerceBatchFetcher
  private organizer: ProductFamilyOrganizer

  constructor() {
    this.transformer = new DynamicProductTransformer()
    this.fetcher = new WooCommerceBatchFetcher()
    this.organizer = new ProductFamilyOrganizer()
  }

  /**
   * Import a single product family by parent ID
   */
  async importProductFamily(parentId: number): Promise<SingleFamilyImportResult> {
    console.log(`🚀 Starting single family import for parent ID: ${parentId}`)
    console.log(`🏪 Sales Channel: ${SALES_CHANNEL_ID}`)
    console.log(`📍 Inventory Location: ${INVENTORY_LOCATION_ID}\n`)

    const startTime = Date.now()
    const errors: string[] = []

    try {
      // Step 1: Fetch parent product
      console.log('📋 Step 1: Fetching parent product...')
      const parentProduct = await this.fetcher.fetchProductById(parentId)
      
      if (parentProduct.type !== 'variable' && parentProduct.type !== 'simple') {
        throw new Error(`Invalid parent product type: ${parentProduct.type}. Expected 'variable' or 'simple'.`)
      }

      console.log(`   ✅ Parent: ${parentProduct.name} (${parentProduct.sku}) - Type: ${parentProduct.type}`)

      // Step 2: Fetch variations (if parent is variable)
      let variations: any[] = []
      if (parentProduct.type === 'variable') {
        console.log('\n📋 Step 2: Fetching variations...')
        variations = await this.fetcher.fetchVariationsForParent(parentId)
        console.log(`   ✅ Variations: ${variations.length} found`)
      } else {
        console.log('\n📋 Step 2: Skipping variations (simple product)')
      }

      // Step 3: Organize into family
      console.log('\n📋 Step 3: Organizing product family...')
      const completeFamily = [parentProduct, ...variations]
      const organizationResult = this.organizer.organizeIntoFamilies(completeFamily)
      
      if (organizationResult.families.size !== 1) {
        throw new Error(`Expected 1 family, got ${organizationResult.families.size}`)
      }

      const family = Array.from(organizationResult.families.values())[0]
      console.log(`   ✅ Family organized: ${family.type} with ${family.variantCount} variations`)

      // Step 4: Transform to Medusa format
      console.log('\n📋 Step 4: Transforming to Medusa format...')
      const medusaProducts = this.transformer.transformProductFamily(
        completeFamily,
        SALES_CHANNEL_ID,
        INVENTORY_LOCATION_ID
      )

      console.log(`   ✅ Transformation complete: ${medusaProducts.length} Medusa products created`)

      // Calculate stats
      const totalVariants = medusaProducts.reduce((sum, product) => sum + product.variants.length, 0)
      const stats = {
        parentProductName: parentProduct.name,
        parentSku: parentProduct.sku,
        variationsFound: variations.length,
        medusaProductsCreated: medusaProducts.length,
        totalVariants: totalVariants,
        familyType: family.type as 'multi-variant' | 'single-variant'
      }

      const duration = Date.now() - startTime

      console.log(`\n🎉 Single family import completed successfully!`)
      console.log(`   • Duration: ${Math.round(duration / 1000)}s`)
      console.log(`   • Family type: ${stats.familyType}`)
      console.log(`   • Total variants: ${stats.totalVariants}`)

      return {
        success: true,
        productFamily: completeFamily,
        medusaProducts,
        stats,
        errors: organizationResult.errors,
        duration
      }

    } catch (error: any) {
      const duration = Date.now() - startTime
      const errorMsg = `Single family import failed: ${error.message}`
      console.error(`💥 ${errorMsg}`)
      errors.push(errorMsg)

      return {
        success: false,
        productFamily: [],
        medusaProducts: [],
        stats: {
          parentProductName: 'Unknown',
          parentSku: 'Unknown',
          variationsFound: 0,
          medusaProductsCreated: 0,
          totalVariants: 0,
          familyType: 'single-variant'
        },
        errors,
        duration
      }
    }
  }

  /**
   * Generate detailed import report
   */
  generateImportReport(result: SingleFamilyImportResult, parentId: number): string {
    const timestamp = new Date().toISOString()
    
    return `
=================================================================
SINGLE PRODUCT FAMILY IMPORT REPORT
Parent ID: ${parentId}
Generated: ${timestamp}
Duration: ${Math.round(result.duration / 1000)} seconds
Success: ${result.success ? 'YES' : 'NO'}
=================================================================

FAMILY INFORMATION
=================================================================

Parent Product:
  • Name: ${result.stats.parentProductName}
  • SKU: ${result.stats.parentSku}
  • Type: ${result.stats.familyType}
  • Variations Found: ${result.stats.variationsFound}

Transformation Results:
  • Medusa Products Created: ${result.stats.medusaProductsCreated}
  • Total Variants Created: ${result.stats.totalVariants}
  • Sales Channel: ${SALES_CHANNEL_ID}
  • Inventory Location: ${INVENTORY_LOCATION_ID}

=================================================================
WOOCOMMERCE SOURCE DATA
=================================================================

${JSON.stringify(result.productFamily, null, 2)}

=================================================================
MEDUSA TRANSFORMATION OUTPUT
=================================================================

${JSON.stringify(result.medusaProducts, null, 2)}

=================================================================
MEDUSA INTEGRATION INSTRUCTIONS
=================================================================

To import this product family into Medusa v2, use:

import { createProductsWorkflow } from '@medusajs/medusa/core-flows'

const container = // your Medusa container
const medusaProducts = ${JSON.stringify(result.medusaProducts, null, 2)}

await createProductsWorkflow(container).run({
  input: { products: medusaProducts }
})

=================================================================
VARIANT DETAILS (FOR DEEP-LINKING)
=================================================================

${result.medusaProducts.map(product => 
  product.variants.map((variant: any, i: number) => 
    `${i + 1}. ${variant.sku}: ${variant.options.map((opt: any) => opt.value).join(' / ')} - $${(variant.prices[0].amount / 100).toFixed(2)}`
  ).join('\n')
).join('\n')}

Deep-Link URLs:
${result.medusaProducts.length > 0 && result.medusaProducts[0].options.length > 0 ?
  result.medusaProducts[0].options.map((opt: any, i: number) => 
    `/products/${result.medusaProducts[0].handle}?${opt.title.toLowerCase().replace(/\s+/g, '-')}=${opt.values[0].toLowerCase().replace(/[^a-z0-9]/g, '')}`
  ).join('\n') : 'No options available for deep-linking'
}

=================================================================
ERRORS (if any)
=================================================================

${result.errors.length > 0 ? result.errors.join('\n') : 'No errors encountered!'}

=================================================================
NEXT STEPS
=================================================================

1. Review the Medusa transformation output above
2. Run the integration code to import into Medusa
3. Verify the product appears correctly in Medusa admin
4. Test deep-linking URLs in your storefront
5. Validate variant selection and pricing

=================================================================
END OF REPORT
=================================================================
`
  }

  /**
   * Save import results to file
   */
  async saveImportResults(result: SingleFamilyImportResult, parentId: number): Promise<string> {
    const report = this.generateImportReport(result, parentId)
    const timestamp = Date.now()
    const filename = `single-family-import-${parentId}-${timestamp}.txt`
    const filepath = join(process.cwd(), filename)
    
    writeFileSync(filepath, report)
    
    console.log(`📄 Import report saved: ${filepath}`)
    return filepath
  }
}

// Command-line interface
async function main() {
  const parentId = process.argv[2] ? parseInt(process.argv[2]) : 513 // Default to Union Hexagonal Nut
  
  if (!parentId || isNaN(parentId)) {
    console.error('❌ Usage: npx tsx src/scripts/import-product-family.ts <parent-id>')
    console.error('   Example: npx tsx src/scripts/import-product-family.ts 513')
    process.exit(1)
  }

  const importer = new SingleProductFamilyImporter()
  
  try {
    console.log(`🎯 Importing product family with parent ID: ${parentId}`)
    
    const result = await importer.importProductFamily(parentId)
    const reportPath = await importer.saveImportResults(result, parentId)
    
    if (result.success) {
      console.log('\n✅ Single product family import completed successfully!')
      console.log(`📊 ${result.stats.medusaProductsCreated} Medusa products ready for import`)
      console.log(`📄 Complete report: ${reportPath}`)
    } else {
      console.log('\n❌ Single product family import failed!')
      console.log(`📄 Error report: ${reportPath}`)
      process.exit(1)
    }
    
  } catch (error: any) {
    console.error('💥 Import script failed:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { SingleProductFamilyImporter }
