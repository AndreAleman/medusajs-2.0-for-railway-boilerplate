import { WooCommerceBatchFetcher } from '../migration/batch-fetcher'

const fetcher = new WooCommerceBatchFetcher()

console.log('=== Testing Step 1: Batch Fetching Utility ===\n')

async function runBatchFetcherTests() {
  try {
    // Test 1: Fetch first page only (small test)
    console.log('Test 1: Fetch first page only (10 products)')
    const smallBatch = await fetcher.fetchAllProducts({
      perPage: 10,
      maxPages: 1,
      delayMs: 100
    })
    
    console.log('✅ Small batch results:')
    console.log(`   • Products fetched: ${smallBatch.totalFetched}`)
    console.log(`   • Pages fetched: ${smallBatch.pagesFetched}`)
    console.log(`   • Duration: ${smallBatch.duration}ms`)
    console.log(`   • Errors: ${smallBatch.errors.length}`)
    
    if (smallBatch.products.length > 0) {
      console.log(`   • Sample product: ${smallBatch.products[0].name} (${smallBatch.products[0].sku})`)
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // Test 2: Fetch specific product by ID
    console.log('Test 2: Fetch specific product by ID (513 - Union Hexagonal Nut)')
    const specificProduct = await fetcher.fetchProductById(513)
    
    console.log('✅ Specific product results:')
    console.log(`   • Name: ${specificProduct.name}`)
    console.log(`   • SKU: ${specificProduct.sku}`)
    console.log(`   • Type: ${specificProduct.type}`)
    console.log(`   • Attributes: ${specificProduct.attributes?.length || 0}`)

    console.log('\n' + '='.repeat(50) + '\n')

    // Test 3: Fetch variations for specific parent
    console.log('Test 3: Fetch variations for parent 513')
    const variations = await fetcher.fetchVariationsForParent(513)
    
    console.log('✅ Variations results:')
    console.log(`   • Variations found: ${variations.length}`)
    variations.slice(0, 3).forEach((variation, i) => {
      console.log(`   ${i + 1}. ${variation.name} (${variation.sku}) - $${variation.price}`)
    })

    console.log('\n' + '='.repeat(50) + '\n')

    // Test 4: Fetch variable products only
    console.log('Test 4: Fetch variable products only (max 2 pages)')
    const variableProducts = await fetcher.fetchAllProducts({
      type: 'variable',
      perPage: 20,
      maxPages: 2,
      delayMs: 200
    })
    
    console.log('✅ Variable products results:')
    console.log(`   • Variable products found: ${variableProducts.totalFetched}`)
    console.log(`   • Pages processed: ${variableProducts.pagesFetched}`)
    
    if (variableProducts.products.length > 0) {
      console.log('   • Sample variable products:')
      variableProducts.products.slice(0, 5).forEach((product, i) => {
        console.log(`     ${i + 1}. ${product.name} (${product.sku})`)
      })
    }

    console.log('\n🎉 All batch fetcher tests completed successfully!')

  } catch (error: any) {
    console.error('❌ Batch fetcher test failed:', error.message)
    throw error
  }
}

// Run the tests
runBatchFetcherTests()
  .then(() => {
    console.log('\n✅ Step 1 testing completed!')
  })
  .catch((error) => {
    console.error('\n💥 Step 1 testing failed:', error.message)
    process.exit(1)
  })
