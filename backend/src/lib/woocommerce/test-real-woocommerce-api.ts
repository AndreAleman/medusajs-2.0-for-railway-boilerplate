import 'dotenv/config'  
import { DynamicProductTransformer } from './transformer'
import { writeFileSync } from 'fs'
import { join } from 'path'
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api'

// Initialize WooCommerce API client using your .env credentials
const WooCommerce = new WooCommerceRestApi({
  url: process.env.WOOCOMMERCE_URL!,
  consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY!,
  consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET!,
  version: 'wc/v3'
})

const transformer = new DynamicProductTransformer()

console.log('=== Testing with REAL Sanitube WooCommerce Data ===\n')

async function fetchRealSanitubeData() {
  try {
    const PRODUCT_ID = 513  // ✅ Change this to your desired product ID
    
    console.log(`🔍 Fetching product (ID: ${PRODUCT_ID}) from Sanitube database...`)
    
    // Fetch the parent product
    const parentResponse = await WooCommerce.get(`products/${PRODUCT_ID}`)
    const parentProduct = parentResponse.data
    
    console.log(`✅ Found parent: ${parentProduct.name} (${parentProduct.sku})`)
    console.log(`   Type: ${parentProduct.type}`)
    console.log(`   Attributes: ${parentProduct.attributes?.length || 0}`)
    console.log(`   Stock Quantity: ${parentProduct.stock_quantity || 'N/A'}`)  // ✅ Add inventory info
    
    // Fetch all variations for this parent
    console.log(`\n🔍 Fetching all variations with parent ID ${PRODUCT_ID}...`)
    const variationsResponse = await WooCommerce.get('products', {
      parent: PRODUCT_ID,  // ✅ Use dynamic product ID
      per_page: 100
    })
    
    const variations = variationsResponse.data
    console.log(`✅ Found ${variations.length} variations`)
    
    // Log variation details WITH inventory
    variations.forEach((variation: any, index: number) => {
      console.log(`   ${index + 1}. ${variation.name} (${variation.sku}) - $${variation.price} | Stock: ${variation.stock_quantity || 0}`)  // ✅ Add inventory info
    })
    
    // Combine parent + variations for transformation
    const completeProductFamily = [parentProduct, ...variations]
    
    console.log(`\n📦 Total products for transformation: ${completeProductFamily.length}`)
    console.log('   • 1 parent (variable)')
    console.log(`   • ${variations.length} variations`)
    
    return completeProductFamily
    
  } catch (error) {
    console.error('❌ Error fetching from WooCommerce API:', error.response?.data || error.message)
    throw error
  }
}


async function runRealDataTransformation() {
  try {
    // Your actual sales channel and inventory location IDs
    const salesChannelId = process.env.MEDUSA_SALES_CHANNEL_ID || 'sc_your_channel_id'
    const inventoryLocationId = process.env.MEDUSA_INVENTORY_LOCATION_ID || 'loc_your_location_id'
    
    console.log(`🏪 Using Sales Channel: ${salesChannelId}`)
    console.log(`📍 Using Inventory Location: ${inventoryLocationId}\n`)
    
    // Fetch real data from Sanitube
    const realProductFamily = await fetchRealSanitubeData()
    
    console.log('\n🚀 Starting transformation of REAL Sanitube data...')
    
    // Transform using your existing transformer
    const result = transformer.transformProductFamily(
      realProductFamily, 
      salesChannelId, 
      inventoryLocationId
    )
    
    console.log('\n✅ Transformation completed successfully!')
    console.log(`📊 Results: ${result.length} Medusa product(s) created`)
    
    // Create comprehensive output file with REAL data
    const outputContent = `
=================================================================
REAL SANITUBE WOOCOMMERCE TO MEDUSA TRANSFORMATION
Product: 28WA Polished Lateral (ID: 585)
Source: Live Sanitube WooCommerce Database
Generated: ${new Date().toISOString()}
=================================================================

SECTION 1: ORIGINAL WOOCOMMERCE DATA (FROM SANITUBE DATABASE)
=================================================================

Parent Product:
${JSON.stringify(realProductFamily.filter(p => p.type === 'variable')[0], null, 2)}

Variations:
${JSON.stringify(realProductFamily.filter(p => p.type === 'variation'), null, 2)}

=================================================================
SECTION 2: TRANSFORMED MEDUSA OUTPUT
=================================================================

${JSON.stringify(result, null, 2)}

=================================================================
SECTION 3: REAL DATA ANALYSIS
=================================================================

WooCommerce Source Data:
- Parent Product: ${realProductFamily.filter(p => p.type === 'variable').length}
- Variations: ${realProductFamily.filter(p => p.type === 'variation').length}
- Total Products: ${realProductFamily.length}

Parent Product Details:
- Name: ${realProductFamily[0].name}
- SKU: ${realProductFamily[0].sku}
- Type: ${realProductFamily[0].type}
- Attributes: ${realProductFamily[0].attributes?.length || 0}

Attribute Structure:
${realProductFamily[0].attributes?.map((attr: any, i: number) => 
  `  ${i + 1}. ${attr.name} (variation: ${attr.variation}): [${attr.options?.join(', ') || 'No options'}]`
).join('\n') || 'No attributes found'}

Variation Sample (First 5):
${realProductFamily.filter(p => p.type === 'variation').slice(0, 5).map((variation: any, i: number) => 
  `  ${i + 1}. ${variation.sku}: $${variation.price} (Stock: ${variation.stock_quantity || 0})`
).join('\n')}



// ✅ INSERT THE NEW INVENTORY SECTIONS HERE:

Variation Inventory Details:
${result[0]?.variants?.map((variant: any, i: number) => 
  `  ${i + 1}. ${variant.sku}: $${(variant.prices[0].amount / 100).toFixed(2)} | Stock: ${variant.inventory_quantity || 0}`
).join('\n') || 'No variants found'}

Total Inventory Value:
${result[0]?.variants ? 
  `  Total Stock Units: ${result[0].variants.reduce((sum: number, v: any) => sum + (v.inventory_quantity || 0), 0)}` + '\n' +
  `  Total Inventory Value: $${result[0].variants.reduce((sum: number, v: any) => sum + ((v.prices[0].amount / 100) * (v.inventory_quantity || 0)), 0).toFixed(2)}`
  : 'No inventory data'}




Medusa Transformation Results:
- Products Created: ${result.length}
- Options per Product: ${result[0]?.options?.length || 0}
- Variants per Product: ${result[0]?.variants?.length || 0}
- Sales Channel: ${result[0]?.sales_channels?.[0]?.id || 'Not found'}
- Inventory Location: ${result[0]?.location_id || 'Not found'}

Options Structure (Real Data):
${result[0]?.options?.map((opt: any, i: number) => 
  `  ${i + 1}. ${opt.title}: [${opt.values.join(', ')}]`
).join('\n') || 'No options found'}

Price Range:
${result[0]?.variants ? 
  `  Lowest: $${Math.min(...result[0].variants.map((v: any) => v.prices[0].amount / 100)).toFixed(2)}` + '\n' +
  `  Highest: $${Math.max(...result[0].variants.map((v: any) => v.prices[0].amount / 100)).toFixed(2)}` 
  : 'No pricing data'}

Real Deep-Link URLs (Based on Actual Attributes):
${result[0]?.options?.length >= 2 ? 
  `- /products/${result[0].handle}?${result[0].options[0].title.toLowerCase().replace(/\s+/g, '-')}=${result[0].options[0].values[0].toLowerCase().replace(/[^a-z0-9]/g, '')}&${result[0].options[1].title.toLowerCase().replace(/\s+/g, '-')}=${result[0].options[1].values[0].toLowerCase().replace(/[^a-z0-9]/g, '')}` 
  : 'Options structure incomplete'}

=================================================================
DATABASE CONNECTION INFO
=================================================================

WooCommerce URL: ${process.env.WOOCOMMERCE_URL}
API Version: wc/v3
Fetch Timestamp: ${new Date().toISOString()}
Parent Product ID: 585
Variations Found: ${realProductFamily.filter(p => p.type === 'variation').length}

=================================================================
END OF REAL DATA REPORT
=================================================================
`

    // Write to file
    const outputPath = join(process.cwd(), 'sanitube-real-transformation.txt')
    writeFileSync(outputPath, outputContent)
    
    console.log(`\n📄 Complete results saved to: ${outputPath}`)
    console.log('\nFile contains:')
    console.log('  • REAL WooCommerce data from Sanitube database')
    console.log('  • Transformed Medusa product output')
    console.log('  • Analysis of actual product attributes and pricing')
    console.log('  • Real deep-link URL examples based on your data')
    
    return result
    
  } catch (error) {
    console.error('❌ Transformation failed:', error.message)
    throw error
  }
}

// Run the real data test
runRealDataTransformation()
  .then(() => {
    console.log('\n🎉 Real Sanitube data transformation test completed successfully!')
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error.message)
    process.exit(1)
  })
