import { SingleProductFamilyImporter } from '../../../scripts/import-product-family'

const importer = new SingleProductFamilyImporter()

console.log('=== Testing Step 5: Single Product Family Import ===\n')

async function runSingleFamilyTests() {
  try {
    // Test 1: Import Union Hexagonal Nut family (multi-variant)
    console.log('Test 1: Import Union Hexagonal Nut family (parent ID: 513)')
    
    const result1 = await importer.importProductFamily(513)
    
    console.log('\n✅ Union Hexagonal Nut import results:')
    console.log(`   • Success: ${result1.success}`)
    console.log(`   • Parent: ${result1.stats.parentProductName} (${result1.stats.parentSku})`)
    console.log(`   • Family type: ${result1.stats.familyType}`)
    console.log(`   • Variations found: ${result1.stats.variationsFound}`)
    console.log(`   • Medusa products created: ${result1.stats.medusaProductsCreated}`)
    console.log(`   • Total variants: ${result1.stats.totalVariants}`)
    console.log(`   • Duration: ${Math.round(result1.duration / 1000)}s`)
    console.log(`   • Errors: ${result1.errors.length}`)

    // Show sample variant details
    if (result1.medusaProducts.length > 0 && result1.medusaProducts[0].variants.length > 0) {
      console.log('   • Sample variants:')
      result1.medusaProducts[0].variants.slice(0, 3).forEach((variant: any, i: number) => {
        console.log(`     ${i + 1}. ${variant.sku}: ${variant.options.map((opt: any) => opt.value).join(' / ')} - $${(variant.prices[0].amount / 100).toFixed(2)}`)
      })
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // Test 2: Import a different product family
    console.log('Test 2: Import different product family (first available variable product)')
    
    // We'll use a product ID that should exist - you can change this
    const testParentId = 842 // Female NPT x Clamp Adapters (from previous test results)
    
    const result2 = await importer.importProductFamily(testParentId)
    
    console.log('\n✅ Second family import results:')
    console.log(`   • Success: ${result2.success}`)
    console.log(`   • Parent: ${result2.stats.parentProductName} (${result2.stats.parentSku})`)
    console.log(`   • Family type: ${result2.stats.familyType}`)
    console.log(`   • Variations found: ${result2.stats.variationsFound}`)
    console.log(`   • Medusa products created: ${result2.stats.medusaProductsCreated}`)
    console.log(`   • Duration: ${Math.round(result2.duration / 1000)}s`)

    console.log('\n' + '='.repeat(50) + '\n')

    // Test 3: Test error handling (invalid product ID)
    console.log('Test 3: Test error handling (invalid product ID)')
    
    const result3 = await importer.importProductFamily(999999)
    
    console.log('\n✅ Error handling test results:')
    console.log(`   • Success: ${result3.success}`)
    console.log(`   • Errors: ${result3.errors.length}`)
    if (result3.errors.length > 0) {
      console.log(`   • Sample error: ${result3.errors[0]}`)
    }

    console.log('\n🎉 All single family import tests completed!')

  } catch (error: any) {
    console.error('❌ Single family import test failed:', error.message)
    throw error
  }
}

// Run the tests
runSingleFamilyTests()
  .then(() => {
    console.log('\n✅ Step 5 testing completed!')
  })
  .catch((error) => {
    console.error('\n💥 Step 5 testing failed:', error.message)
    process.exit(1)
  })
