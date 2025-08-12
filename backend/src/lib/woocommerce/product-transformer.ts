import { WooCommerceProduct } from './types'

export interface MedusaProductInput {
  title: string
  handle?: string
  options: {
    title: string
    values: string[]
  }[]
  variants: {
    title: string
    sku: string
    options: {
      value: string
    }[]
    prices: {
      amount: number
      currency_code: string
    }[]
    manage_inventory: boolean
  }[]
  images?: {
    url: string
  }[]
  description?: string
  rawVariants?: {
    sku: string
    inventory_quantity: number
  }[]
}

interface AttributeStructure {
  name: string
  values: string[]
  position: number
  source: 'woocommerce_parent' | 'sku' | 'name' | 'fallback'
}

export class DynamicProductTransformer {
  
/**
 * Transform WooCommerce products using proper parent-variation relationship
 */
transformProductFamily(sanitubeProducts: WooCommerceProduct[]): MedusaProductInput[] {
  console.log(`🔍 Analyzing ${sanitubeProducts.length} products for parent-variation structure...`)
  
  const parentProducts = sanitubeProducts.filter(p => p.type === 'variable')
  const variations = sanitubeProducts.filter(p => p.type === 'variation')
  
  console.log(`📋 Found ${parentProducts.length} parent products and ${variations.length} variations`)
  
  // Early exit if no parent products found
  if (parentProducts.length === 0) {
    console.log(`❌ No parent products found. Cannot import variations without parents. Skipping all products.`)
    return []
  }
  
  const medusaProducts: MedusaProductInput[] = []
  
  // ✅ SIMPLIFIED: Only group variations by their parent SKU
  const variationsByParentSku = new Map<string, WooCommerceProduct[]>()
  
  variations.forEach(variation => {
    const parentSku = variation.parent || ''
    
    if (!variationsByParentSku.has(parentSku)) {
      variationsByParentSku.set(parentSku, [])
    }
    
    variationsByParentSku.get(parentSku)!.push(variation)
  })
  
  // Track products that don't get uploaded
  const skippedProducts: {
    parent?: WooCommerceProduct
    variations?: WooCommerceProduct[]
    reason: string
  }[] = []
  
  let totalVariationsProcessed = 0
  let totalVariationsSkipped = 0
  
  // ✅ SIMPLIFIED: Process each parent and find its variations by exact SKU match
  for (const parentProduct of parentProducts) {
    console.log(`\n📦 Processing parent: ${parentProduct.name} (SKU: ${parentProduct.sku})`)
    
    // ✅ EXACT MATCH ONLY: Find variations where parent field === parent SKU
    const childVariations = variationsByParentSku.get(parentProduct.sku) || []
    
    console.log(`   └── Found ${childVariations.length} variations with parent="${parentProduct.sku}"`)
    
    // Skip if no variations found for this parent
    if (childVariations.length === 0) {
      console.log(`   ⚠️  No variations found for parent SKU ${parentProduct.sku}, skipping`)
      skippedProducts.push({
        parent: parentProduct,
        reason: `No variations with parent="${parentProduct.sku}"`
      })
      continue
    }
    
    // Extract attributes from THIS specific parent
    const detectedAttributes = this.detectAttributeStructureFromParent(parentProduct, childVariations)
    
    // Skip if no attributes found (can't create proper options)
    if (detectedAttributes.length === 0) {
      console.log(`   ⚠️  No attributes found for parent ${parentProduct.sku}, skipping`)
      skippedProducts.push({
        parent: parentProduct,
        variations: childVariations,
        reason: `No detectable attributes for parent SKU ${parentProduct.sku}`
      })
      totalVariationsSkipped += childVariations.length
      continue
    }
    
    console.log(`🏷️  Detected attributes: ${detectedAttributes.map(a => a.name).join(', ')}`)
    
    // Create Medusa product
    const medusaProduct = this.createMedusaProductFromParent(parentProduct, childVariations, detectedAttributes)
    medusaProducts.push(medusaProduct)
    
    totalVariationsProcessed += childVariations.length
  }
  
  // ✅ REPORT: Show orphaned variations that have no matching parent SKU
  const orphanedVariations = variationsByParentSku.get('') || []
  const unprocessedVariations: WooCommerceProduct[] = []
  
  // Find variations whose parent SKU doesn't match any actual parent product
  variationsByParentSku.forEach((variations, parentSku) => {
    if (parentSku && parentSku !== '') {
      // Check if this parentSku exists in our parent products
      const hasMatchingParent = parentProducts.some(p => p.sku === parentSku)
      if (!hasMatchingParent) {
        console.log(`⚠️  Found ${variations.length} variations with parent="${parentSku}" but no matching parent product`)
        unprocessedVariations.push(...variations)
        
        skippedProducts.push({
          variations,
          reason: `Parent SKU "${parentSku}" not found in parent products`
        })
      }
    }
  })
  
  // Report orphaned variations (empty parent field)
  if (orphanedVariations.length > 0) {
    console.log(`\n⚠️  Found ${orphanedVariations.length} variations with empty parent field:`)
    orphanedVariations.slice(0, 5).forEach(orphan => {
      console.log(`   - ${orphan.name} (SKU: ${orphan.sku})`)
    })
    if (orphanedVariations.length > 5) {
      console.log(`   ... and ${orphanedVariations.length - 5} more`)
    }
    
    skippedProducts.push({
      variations: orphanedVariations,
      reason: 'Empty parent field'
    })
    
    totalVariationsSkipped += orphanedVariations.length
  }
  
  totalVariationsSkipped += unprocessedVariations.length
  
  // ✅ COMPREHENSIVE REPORTING
  console.log(`\n📊 IMPORT SUMMARY:`)
  console.log(`✅ Successfully created: ${medusaProducts.length} product families`)
  console.log(`✅ Variations processed: ${totalVariationsProcessed}`)
  console.log(`⚠️  Products skipped: ${skippedProducts.length} issues`)
  console.log(`⚠️  Variations skipped: ${totalVariationsSkipped}`)
  
  // Log detailed skip reasons
  if (skippedProducts.length > 0) {
    console.log(`\n🚫 SKIPPED PRODUCTS DETAILS:`)
    skippedProducts.forEach((skip, index) => {
      console.log(`${index + 1}. ${skip.reason}`)
      if (skip.parent) {
        console.log(`   Parent: ${skip.parent.name} (SKU: ${skip.parent.sku})`)
      }
      if (skip.variations && skip.variations.length > 0) {
        console.log(`   Affected variations: ${skip.variations.length}`)
        skip.variations.slice(0, 3).forEach(v => {
          console.log(`      - ${v.sku}: ${v.name}`)
        })
        if (skip.variations.length > 3) {
          console.log(`      ... and ${skip.variations.length - 3} more`)
        }
      }
      console.log('')
    })
  }
  
  return medusaProducts
}

  
  /**
   * Extract attributes directly from a specific parent product
   */
  private detectAttributeStructureFromParent(
    parentProduct: WooCommerceProduct,
    variations: WooCommerceProduct[]
  ): AttributeStructure[] {
    console.log(`🔍 Analyzing parent product attributes from: ${parentProduct.name}`)
    
    // Look at THIS parent's attributes
    if (parentProduct.attributes && parentProduct.attributes.length > 0) {
      console.log(`📋 Using ${parentProduct.attributes.length} attributes from parent product`)
      
      const attributes: AttributeStructure[] = parentProduct.attributes.map((attr, index) => {
        const cleanName = this.cleanAttributeName(attr.name)
        
        // Get possible values from parent attribute definition
        let possibleValues = attr.options || []
        
        // Also collect actual values from variations to ensure completeness
        const variationValues = new Set<string>()
        variations.forEach(variation => {
          if (variation.attributes && variation.attributes.length > 0) {
            const matchingAttr = variation.attributes.find(vAttr => 
              this.cleanAttributeName(vAttr.name) === cleanName
            )
            if (matchingAttr && matchingAttr.options && matchingAttr.options.length > 0) {
              variationValues.add(matchingAttr.options[0])
            }
          }
        })
        
        // Combine parent values with actual variation values
        const allValues = Array.from(new Set([...possibleValues, ...variationValues]))
        const sortedValues = this.sortAttributeValues(allValues, cleanName)
        
        console.log(`   ${index + 1}. ${cleanName}: [${sortedValues.join(', ')}]`)
        
        return {
          name: cleanName,
          values: sortedValues,
          position: index,
          source: 'woocommerce_parent' as const
        }
      })
      
      console.log(`✅ Extracted ${attributes.length} attributes from parent product`)
      return attributes
    }
    
    // Fallback: build from variations if parent has no attributes
    console.log(`⚠️  Parent has no attributes, analyzing variations...`)
    return this.buildAttributesFromVariations(variations)
  }
  
  /**
   * Build attributes from variations when parent has none
   */
  private buildAttributesFromVariations(variations: WooCommerceProduct[]): AttributeStructure[] {
    const attributeMap = new Map<string, Set<string>>()
    
    // Collect all attributes from all variations
    variations.forEach(variation => {
      if (variation.attributes && variation.attributes.length > 0) {
        variation.attributes.forEach(attr => {
          const cleanName = this.cleanAttributeName(attr.name)
          
          if (!attributeMap.has(cleanName)) {
            attributeMap.set(cleanName, new Set<string>())
          }
          
          if (attr.options && attr.options.length > 0) {
            attributeMap.get(cleanName)!.add(attr.options[0])
          }
        })
      }
    })
    
    // Convert to AttributeStructure array
    const attributes: AttributeStructure[] = []
    let position = 0
    
    attributeMap.forEach((values, name) => {
      const sortedValues = this.sortAttributeValues(Array.from(values), name)
      
      attributes.push({
        name,
        values: sortedValues,
        position: position++,
        source: 'sku' as const
      })
      
      console.log(`   ${position}. ${name}: [${sortedValues.join(', ')}]`)
    })
    
    console.log(`✅ Built ${attributes.length} attributes from variations`)
    return attributes
  }
  
  /**
   * Create Medusa product from a specific parent and its variations
   */
  private createMedusaProductFromParent(
    parentProduct: WooCommerceProduct,
    variations: WooCommerceProduct[],
    attributes: AttributeStructure[]
  ): MedusaProductInput {
    
    // Create options array from detected attributes
    const options = attributes.map(attr => ({
      title: attr.name,
      values: attr.values
    }))
    
    console.log(`📦 Creating product with ${options.length} options:`)
    options.forEach((option, i) => {
      console.log(`   ${i + 1}. ${option.title}: [${option.values.join(', ')}]`)
    })
    
    // Create variants from the specific variations of this parent
    const variants = variations.map(variation => {
      const optionValues = this.mapVariationToOptions(variation, attributes)
      
      return {
        title: this.cleanProductTitle(variation.name),
        sku: variation.sku,
        options: optionValues.map(value => ({ value })),
        prices: [{
          amount: Math.round(parseFloat(variation.price || '0') * 100),
          currency_code: 'usd'
        }],
        manage_inventory: true
      }
    })
    
    console.log(`✅ Created ${variants.length} variants with proper option mapping`)
    
    return {
      title: this.extractProductTitle(parentProduct.name),
      handle: this.generateHandle(parentProduct.name),
      options,
      variants,
      images: parentProduct.images?.map(img => ({ url: img.src })) || [],
      description: this.generateDescription(parentProduct.name, attributes),
      rawVariants: variations.map(v => ({
        sku: v.sku,
        inventory_quantity: v.stock_quantity || 0
      }))
    }
  }
  
  /**
   * Map a specific variation to its parent's attribute structure
   */
  private mapVariationToOptions(
    variation: WooCommerceProduct,
    parentAttributes: AttributeStructure[]
  ): string[] {
    
    const optionValues: string[] = []
    
    parentAttributes.forEach(attr => {
      // First try to get from variation's own attributes
      let value = this.getVariationAttributeValue(variation, attr.name)
      
      // If not found, try to extract from SKU or name
      if (!value) {
        value = this.extractValueFromVariant(variation, attr.name, attr.values)
      }
      
      // Default to first available value if nothing matches
      if (!value || !attr.values.includes(value)) {
        value = attr.values[0]
        console.log(`⚠️  Using default value "${value}" for ${attr.name} in ${variation.sku}`)
      }
      
      optionValues.push(value)
    })
    
    return optionValues
  }
  
  /**
   * Get attribute value from a variation's own attributes
   */
  private getVariationAttributeValue(variation: WooCommerceProduct, attributeName: string): string | null {
    if (!variation.attributes || variation.attributes.length === 0) {
      return null
    }
    
    const attr = variation.attributes.find(a => 
      this.cleanAttributeName(a.name).toLowerCase() === attributeName.toLowerCase()
    )
    
    return attr && attr.options && attr.options.length > 0 ? attr.options[0] : null
  }
  
  /**
   * Extract attribute value from SKU or product name
   */
  private extractValueFromVariant(variation: WooCommerceProduct, attributeName: string, possibleValues: string[]): string | null {
    const searchText = `${variation.name} ${variation.sku}`.toLowerCase()
    
    // Look for any of the possible values in the product name or SKU
    for (const value of possibleValues) {
      if (searchText.includes(value.toLowerCase())) {
        return value
      }
    }
    
    return null
  }
  
  /**
   * Sort attribute values in logical order
   */
  private sortAttributeValues(values: string[], attributeName: string): string[] {
    const lowerName = attributeName.toLowerCase()
    
    if (lowerName.includes('size') || lowerName.includes('tube')) {
      // Sort sizes numerically: 1", 1.5", 2", etc.
      return values.sort((a, b) => {
        const numA = this.extractNumericSize(a)
        const numB = this.extractNumericSize(b)
        return numA - numB
      })
    }
    
    if (lowerName.includes('alloy') || lowerName.includes('material')) {
      // Sort materials: T304 before T316, etc.
      return values.sort((a, b) => {
        // Handle T304, T316L format
        const getNumber = (str: string) => {
          const match = str.match(/T?(\d+)/i)
          return match ? parseInt(match[1]) : 999
        }
        
        return getNumber(a) - getNumber(b)
      })
    }
    
    // Default alphabetical sort
    return values.sort()
  }
  
  /**
   * Extract numeric value from size strings for proper sorting
   */
  private extractNumericSize(sizeStr: string): number {
    // Handle formats like: 1", 1-1/2", 2-1/2", etc.
    const match = sizeStr.match(/(\d+)(?:[-\s]*(\d+)\/(\d+))?/);
    
    if (!match) return 0;
    
    let result = parseInt(match[1]);
    
    // Handle fractions like "1-1/2" -> 1.5
    if (match[2] && match[3]) {
      result += parseInt(match[2]) / parseInt(match[3]);
    }
    
    return result;
  }
  
  /**
   * Clean attribute names from WooCommerce format
   */
  private cleanAttributeName(name: string): string {
    return name
      .replace(/^pa_/, '') // Remove WooCommerce prefix
      .replace(/attribute\s*\d+/gi, '') // Remove "Attribute 1" numbering
      .replace(/[-_]/g, ' ')
      .trim()
      .replace(/\b\w/g, l => l.toUpperCase()) // Title case
      .replace(/\s+/g, ' ') // Normalize whitespace
  }
  
  /**
   * Extract clean product title from parent product
   */
  private extractProductTitle(name: string): string {
    return name.trim()
  }
  
  /**
   * Clean individual variation titles
   */
  private cleanProductTitle(title: string): string {
    return title.replace(/[,&]+/g, '').trim()
  }
  
  /**
   * Generate URL-friendly handle
   */
  private generateHandle(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }
  
  /**
   * Generate product description
   */
  private generateDescription(name: string, attributes: AttributeStructure[]): string {
    const attributeList = attributes.map(a => a.name).join(', ')
    return `High-quality ${name} manufactured by Sanitube. Available in multiple ${attributeList.toLowerCase()} options for various industrial applications.`
  }
}
