import { WooCommerceBatchFetcher } from '../migration/batch-fetcher'
import { ProductFamilyOrganizer } from '../migration/family-organizer'  // ✅ Fixed path

const fetcher = new WooCommerceBatchFetcher()
const organizer = new ProductFamilyOrganizer()

console.log('=== Testing Step 2: Product Family Organizer ===\n')

async function runFamilyOrganizerTests() {
  try {
    // Test 1: Organize a small batch of mixed products
    console.log('Test 1: Organize mixed products (first 50 products)')
    
    const mixedBatch = await fetcher.fetchAllProducts({
      perPage: 50,
      maxPages: 1,
      delayMs: 1000
    })

    console.log(`\nOrganizing ${mixedBatch.products.length} fetched products...`)
    const organizationResult = organizer.organizeIntoFamilies(mixedBatch.products)

    console.log('\n✅ Mixed products organization results:')
    console.log(`   • Families created: ${organizationResult.stats.familiesCreated}`)
    console.log(`   • Multi-variant families: ${organizationResult.stats.multiVariantFamilies}`)
    console.log(`   • Single-variant families: ${organizationResult.stats.singleVariantFamilies}`)
    console.log(`   • Simple families: ${organizationResult.stats.simpleFamilies}`)
    console.log(`   • Orphaned variations: ${organizationResult.stats.orphanedVariations}`)

    console.log('\n' + '='.repeat(50) + '\n')

    // Test 2: Organize specific product family (Union Hexagonal Nut + variations)
    console.log('Test 2: Organize specific product family (Union Hexagonal Nut)')
    
    const parentProduct = await fetcher.fetchProductById(513)
    const variations = await fetcher.fetchVariationsForParent(513)
    const completeFamily = [parentProduct, ...variations]

    console.log(`\nOrganizing Union Hexagonal Nut family (${completeFamily.length} products)...`)
    const familyResult = organizer.organizeIntoFamilies(completeFamily)

    console.log('\n✅ Specific family organization results:')
    console.log(`   • Families created: ${familyResult.stats.familiesCreated}`)
    console.log(`   • Type: ${Array.from(familyResult.families.values())[0]?.type}`)
    console.log(`   • Variant count: ${Array.from(familyResult.families.values())[0]?.variantCount}`)

    // Get the family details
    const unionFamily = familyResult.families.get(513)
    if (unionFamily) {
      console.log(`   • Family details:`)
      console.log(`     - Parent: ${unionFamily.parent.name} (${unionFamily.parent.sku})`)
      console.log(`     - Variations: ${unionFamily.variations.length}`)
      unionFamily.variations.slice(0, 3).forEach((variation, i) => {
        console.log(`       ${i + 1}. ${variation.name} (${variation.sku})`)
      })
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // Test 3: Organize variable products only
    console.log('Test 3: Organize variable products only')
    
    const variableBatch = await fetcher.fetchAllProducts({
      type: 'variable',
      perPage: 20,
      maxPages: 1,
      delayMs: 1000
    })

    console.log(`\nOrganizing ${variableBatch.products.length} variable products...`)
    const variableResult = organizer.organizeIntoFamilies(variableBatch.products)

    console.log('\n✅ Variable products organization results:')
    console.log(`   • Families created: ${variableResult.stats.familiesCreated}`)
    console.log(`   • All should be single-variant (no variations fetched): ${variableResult.stats.singleVariantFamilies}`)

    console.log('\n' + '='.repeat(50) + '\n')

    // Test 4: Test utility methods
    console.log('Test 4: Test utility methods')
    
    const multiVariantFamilies = organizer.getFamiliesByType(organizationResult.families, 'multi-variant')
    const summary = organizer.getSummary(organizationResult.families)

    console.log('\n✅ Utility methods results:')
    console.log(`   • Multi-variant families found: ${multiVariantFamilies.length}`)
    if (multiVariantFamilies.length > 0) {
      console.log(`   • Sample multi-variant family: ${multiVariantFamilies[0].parent.name} (${multiVariantFamilies[0].variantCount} variants)`)
    }
    
    console.log('\n📊 Family Summary:')
    console.log(summary)

    console.log('\n🎉 All family organizer tests completed successfully!')

  } catch (error: any) {
    console.error('❌ Family organizer test failed:', error.message)
    throw error
  }
}

// Run the tests
runFamilyOrganizerTests()
  .then(() => {
    console.log('\n✅ Step 2 testing completed!')
  })
  .catch((error) => {
    console.error('\n💥 Step 2 testing failed:', error.message)
    process.exit(1)
  })
