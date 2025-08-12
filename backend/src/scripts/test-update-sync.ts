// import 'dotenv/config'
// import { createWooCommerceClient } from '../lib/woocommerce/api-client'

// async function testUpdateSync() {
//   /**
//    * Test script to verify our update-only sync method works correctly.
//    * Uses sample SKUs to simulate products that exist in our Medusa catalog.
//    */
  
//   console.log('🧪 Testing Update-Only Sync Method...\n')
  
//   // Create WooCommerce API client
//   const client = createWooCommerceClient()
  
//   // Simulate SKUs that exist in our Medusa catalog
//   // In real usage, these would come from querying our Medusa database
//   const existingSkus = [
//     '13h',  // The ball valve we saw in our earlier test
//     // Add a few more if you know other good SKUs from your catalog analysis
//   ]
  
//   console.log(`🎯 Testing with ${existingSkus.length} sample existing SKUs:`)
//   existingSkus.forEach(sku => console.log(`   - ${sku}`))
//   console.log('')
  
//   try {
//     // Test the new getProductsByExistingSkus method
//     const productsToUpdate = await client.getProductsByExistingSkus(existingSkus)
    
//     // Display results for verification
//     console.log('\n🔍 Products Found for Update:')
//     productsToUpdate.forEach(product => {
//       console.log(`✅ ${product.sku}: ${product.name}`)
//       console.log(`   Price: $${product.price}`)
//       console.log(`   Stock: ${product.stock_quantity || 'N/A'}`)
//       console.log(`   Status: ${product.status}`)
//       console.log('')
//     })
    
//     console.log(`🎉 Step 1 Complete: Successfully retrieved ${productsToUpdate.length} products for update!`)
    
//   } catch (error) {
//     console.error('❌ Test failed:', error)
//   }
// }

// testUpdateSync().catch(console.error)
