// import { createWooCommerceClient } from './api-client'

// export async function testSanitubeConnection() {
//   console.log('🔌 Testing connection to Sanitube WooCommerce API...')
  
//   const client = createWooCommerceClient()
  
//   // Test basic connectivity
//   const isConnected = await client.testConnection()
//   if (!isConnected) {
//     return false
//   }
  
//   try {
//     // Test product data extraction
//     console.log('📦 Fetching sample products...')
//     const products = await client.getProducts(1, 5)
//     console.log(`✅ Retrieved ${products.length} products`)
    
//     // Test attribute discovery
//     console.log('🏷️  Discovering product attributes...')
//     const attributes = await client.getAllAttributes()
//     console.log(`✅ Found ${attributes.length} product attributes`)
    
//     // Show sample data structure
//     if (products.length > 0) {
//       console.log('\n📊 Sample Product Structure:')
//       console.log(`- Name: ${products[0].name}`)
//       console.log(`- SKU: ${products[0].sku}`)
//       console.log(`- Attributes: ${products[0].attributes.length}`)
//       console.log(`- Type: ${products[0].type}`)
//     }
    
//     return true
//   } catch (error) {
//     console.error('❌ API test failed:', error)
//     return false
//   }
// }
