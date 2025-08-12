export interface ProductFamily {
  familyId: number
  parent: any
  variations: any[]
  type: 'multi-variant' | 'single-variant' | 'simple'
  variantCount: number
}

export interface OrganizationResult {
  families: Map<number, ProductFamily>
  stats: {
    totalProducts: number
    variableProducts: number
    simpleProducts: number
    variations: number
    orphanedVariations: number
    familiesCreated: number
    multiVariantFamilies: number
    singleVariantFamilies: number
    simpleFamilies: number
  }
  errors: string[]
}

export class ProductFamilyOrganizer {
  
  /**
   * Organize products into families for transformation
   */
  organizeIntoFamilies(allProducts: any[]): OrganizationResult {
    console.log(`📋 Organizing ${allProducts.length} products into families...`)

    const families = new Map<number, ProductFamily>()
    const errors: string[] = []
    const processedVariations = new Set<number>()

    // Separate products by type
    const variableProducts = allProducts.filter(p => p.type === 'variable')
    const simpleProducts = allProducts.filter(p => p.type === 'simple')
    const variations = allProducts.filter(p => p.type === 'variation')

    console.log(`   • Variable products (parents): ${variableProducts.length}`)
    console.log(`   • Simple products: ${simpleProducts.length}`)
    console.log(`   • Variations: ${variations.length}`)

    // Create families for variable products with their variations
    for (const parent of variableProducts) {
      try {
        // Find all variations for this parent
        const childVariations = variations.filter(v => v.parent_id === parent.id)
        
        // Set parent_id properly for transformer compatibility
        childVariations.forEach(variation => {
          variation.parent_id = parent.id
          processedVariations.add(variation.id)
        })

        // Determine family type
        const familyType = childVariations.length > 0 ? 'multi-variant' : 'single-variant'

        // Create family
        const family: ProductFamily = {
          familyId: parent.id,
          parent: parent,
          variations: childVariations,
          type: familyType,
          variantCount: childVariations.length
        }

        families.set(parent.id, family)

        console.log(`   📦 ${parent.name} (${parent.sku}): ${childVariations.length} variations [${familyType}]`)

      } catch (error: any) {
        const errorMsg = `Failed to process variable product ${parent.id}: ${error.message}`
        console.error(`   ❌ ${errorMsg}`)
        errors.push(errorMsg)
      }
    }

    // Create families for simple products
    for (const simple of simpleProducts) {
      try {
        const family: ProductFamily = {
          familyId: simple.id,
          parent: simple,
          variations: [],
          type: 'simple',
          variantCount: 0
        }

        families.set(simple.id, family)

      } catch (error: any) {
        const errorMsg = `Failed to process simple product ${simple.id}: ${error.message}`
        console.error(`   ❌ ${errorMsg}`)
        errors.push(errorMsg)
      }
    }

    // Check for orphaned variations
    const orphanedVariations = variations.filter(v => !processedVariations.has(v.id))
    if (orphanedVariations.length > 0) {
      console.log(`   ⚠️  Found ${orphanedVariations.length} orphaned variations:`)
      orphanedVariations.forEach(orphan => {
        console.log(`      • ${orphan.name} (${orphan.sku}) - parent_id: ${orphan.parent_id}`)
        errors.push(`Orphaned variation: ${orphan.sku} (parent_id: ${orphan.parent_id})`)
      })
    }

    // Calculate statistics
    const stats = {
      totalProducts: allProducts.length,
      variableProducts: variableProducts.length,
      simpleProducts: simpleProducts.length,
      variations: variations.length,
      orphanedVariations: orphanedVariations.length,
      familiesCreated: families.size,
      multiVariantFamilies: Array.from(families.values()).filter(f => f.type === 'multi-variant').length,
      singleVariantFamilies: Array.from(families.values()).filter(f => f.type === 'single-variant').length,
      simpleFamilies: Array.from(families.values()).filter(f => f.type === 'simple').length
    }

    console.log(`\n✅ Organization complete:`)
    console.log(`   • Families created: ${stats.familiesCreated}`)
    console.log(`   • Multi-variant families: ${stats.multiVariantFamilies}`)
    console.log(`   • Single-variant families: ${stats.singleVariantFamilies}`) 
    console.log(`   • Simple families: ${stats.simpleFamilies}`)
    console.log(`   • Orphaned variations: ${stats.orphanedVariations}`)
    console.log(`   • Errors: ${errors.length}`)

    return {
      families,
      stats,
      errors
    }
  }

  /**
   * Get family by ID
   */
  getFamily(families: Map<number, ProductFamily>, familyId: number): ProductFamily | undefined {
    return families.get(familyId)
  }

  /**
   * Get families by type
   */
  getFamiliesByType(families: Map<number, ProductFamily>, type: 'multi-variant' | 'single-variant' | 'simple'): ProductFamily[] {
    return Array.from(families.values()).filter(family => family.type === type)
  }

  /**
   * Get summary statistics
   */
  getSummary(families: Map<number, ProductFamily>): string {
    const familiesArray = Array.from(families.values())
    const totalVariants = familiesArray.reduce((sum, family) => sum + family.variantCount, 0)
    
    return `
Family Organization Summary:
  • Total families: ${families.size}
  • Multi-variant: ${familiesArray.filter(f => f.type === 'multi-variant').length}
  • Single-variant: ${familiesArray.filter(f => f.type === 'single-variant').length}
  • Simple: ${familiesArray.filter(f => f.type === 'simple').length}
  • Total variants: ${totalVariants}
  • Avg variants per multi-variant family: ${(totalVariants / familiesArray.filter(f => f.type === 'multi-variant').length || 0).toFixed(1)}
`
  }
}
