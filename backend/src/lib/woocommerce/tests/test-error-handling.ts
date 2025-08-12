import { WooCommerceBatchFetcher } from '../migration/batch-fetcher'

const fetcher = new WooCommerceBatchFetcher()

console.log('=== Testing Step 3: Error Handling and Retry Logic ===\n')

async function runErrorHandlingTests() {
  try {
    // Test 1: Normal operation with retry settings
    console.log('Test 1: Normal operation with retry settings')
    const normalBatch = await fetcher.fetchAllProducts({
      perPage: 20,
      maxPages: 2,
      delayMs: 1000,
      maxRetries: 3,
      retryDelayMs: 2000
    })
    
    console.log('✅ Normal operation results:')
    console.log(`   • Products fetched: ${normalBatch.totalFetched}`)
    console.log(`   • Pages fetched: ${normalBatch.pagesFetched}`)
    console.log(`   • Total retries used: ${normalBatch.retries}`)
    console.log(`   • Duration: ${Math.round(normalBatch.duration / 1000)}s`)
    console.log(`   • Errors: ${normalBatch.errors.length}`)

    console.log('\n' + '='.repeat(50) + '\n')

    // Test 2: Fetch product with retry (should succeed)
    console.log('Test 2: Fetch specific product with retry logic')
    const specificProduct = await fetcher.fetchProductById(513, 3)
    
    console.log('✅ Specific product with retry results:')
    console.log(`   • Name: ${specificProduct.name}`)
    console.log(`   • SKU: ${specificProduct.sku}`)
    console.log(`   • Type: ${specificProduct.type}`)

    console.log('\n' + '='.repeat(50) + '\n')

    // Test 3: Fetch variations with error handling
    console.log('Test 3: Fetch variations with error handling')
    const variations = await fetcher.fetchVariationsForParent(513)
    
    console.log('✅ Variations with error handling results:')
    console.log(`   • Variations found: ${variations.length}`)
    variations.slice(0, 3).forEach((variation, i) => {
      console.log(`   ${i + 1}. ${variation.name} (${variation.sku}) - $${variation.price}`)
    })

    console.log('\n' + '='.repeat(50) + '\n')

    // Test 4: Test with aggressive retry settings
    console.log('Test 4: Test with aggressive retry settings')
    const aggressiveBatch = await fetcher.fetchAllProducts({
      perPage: 30,
      maxPages: 1,
      delayMs: 500,
      maxRetries: 5,        // Higher retry count
      retryDelayMs: 1000    // Faster retry delay
    })
    
    console.log('✅ Aggressive retry test results:')
    console.log(`   • Products fetched: ${aggressiveBatch.totalFetched}`)
    console.log(`   • Total retries used: ${aggressiveBatch.retries}`)
    console.log(`   • Errors encountered: ${aggressiveBatch.errors.length}`)
    
    if (aggressiveBatch.errors.length > 0) {
      console.log('   • Error samples:')
      aggressiveBatch.errors.slice(0, 3).forEach((error, i) => {
        console.log(`     ${i + 1}. ${error}`)
      })
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // Test 5: Invalid product ID (should fail gracefully after retries)
    console.log('Test 5: Invalid product ID (should fail gracefully)')
    try {
      await fetcher.fetchProductById(999999, 2) // Non-existent product
      console.log('❌ Should have failed!')
    } catch (error: any) {
      console.log('✅ Invalid product ID handling:')
      console.log(`   • Error caught correctly: ${error.message}`)
      console.log(`   • Retries attempted before giving up`)
    }

    console.log('\n🎉 All error handling tests completed!')

  } catch (error: any) {
    console.error('❌ Error handling test failed:', error.message)
    throw error
  }
}

// Run the tests
runErrorHandlingTests()
  .then(() => {
    console.log('\n✅ Step 3 testing completed!')
  })
  .catch((error) => {
    console.error('\n💥 Step 3 testing failed:', error.message)
    process.exit(1)
  })
