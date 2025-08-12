import { WooCommerceProduct,  MedusaProductInput} from './types'

export class DynamicProductTransformer {
  transformProductFamily(
    sanitubeProducts: WooCommerceProduct[], 
    salesChannelId: string,
    inventoryLocationId: string
  ): MedusaProductInput[] {
    // ✅ STEP 1: INPUT VALIDATION (completed)
    if (!Array.isArray(sanitubeProducts)) {
      throw new Error('Input must be an array of WooCommerce products')
    }
    
    if (sanitubeProducts.length === 0) {
      console.log('⚠️  No products provided for transformation')
      return []
    }
    
    console.log(`🔍 Analyzing ${sanitubeProducts.length} products for transformation...`)

    // ✅ STEP 2: PRODUCT SEPARATION (completed)
    const parentProducts = sanitubeProducts.filter(p => p.type === 'variable')
    const variations = sanitubeProducts.filter(p => p.type === 'variation')
    const simpleProducts = sanitubeProducts.filter(p => p.type === 'simple')

    console.log(`📋 Found ${parentProducts.length} parent products, ${variations.length} variations, and ${simpleProducts.length} simple products`)

    // ✅ STEP 3: EARLY EXIT CHECK (completed)
    if (parentProducts.length === 0 && simpleProducts.length === 0) {
      console.log(`❌ No parent or simple products found. Only variations exist and cannot be imported without parents.`)
      return []
    }

    console.log(`✅ Found processable products - continuing with transformation...`)

    // ✅ STEP 4: VARIATION GROUPING (completed)
    // ✅ STEP 4: VARIATION GROUPING (completed)
    // ✅ STEP 4: VARIATION GROUPING (FIXED)
// ✅ STEP 4: VARIATION GROUPING (FIXED)
const variationsByParentId = new Map<string, WooCommerceProduct[]>()

variations.forEach(variation => {
  // ✅ Use parent_id instead of parent (actual WooCommerce field name)
  const parentId = variation.parent_id ? variation.parent_id.toString() : ''
  
  console.log(`🔍 Debug: Variation ${variation.sku} has parent_id: ${variation.parent_id}`)
  
  if (!variationsByParentId.has(parentId)) {
    variationsByParentId.set(parentId, [])
  }
  
  variationsByParentId.get(parentId)!.push(variation)
})

console.log(`🔗 Grouped variations into ${variationsByParentId.size} parent groups`)
console.log(`🔍 Debug: Group keys:`, Array.from(variationsByParentId.keys()))

   // ✅ INITIALIZE RESULT ARRAY
  const medusaProducts: MedusaProductInput[] = []
  
// ✅ STEP 5: PARENT PROCESSING LOOP (updated)
for (const parentProduct of parentProducts) {
  console.log(`\n📦 Processing parent: ${parentProduct.name} (ID: ${parentProduct.id}, SKU: ${parentProduct.sku})`)
  
  const childVariations = variationsByParentId.get(parentProduct.id.toString()) || []
  
  console.log(`   └── Found ${childVariations.length} variations`)
  
  if (childVariations.length === 0) {
    // Parent with no variations - create single-variant product
    const singleVariantProduct = this.createSingleVariantProduct(parentProduct, salesChannelId, inventoryLocationId)
    medusaProducts.push(singleVariantProduct)
  } else {
    // Parent with variations - create multi-variant product
    try {
      const multiVariantProduct = this.createMedusaProductFromParent(parentProduct, childVariations, salesChannelId, inventoryLocationId)
      medusaProducts.push(multiVariantProduct)
    } catch (error) {
      console.log(`   ❌ Failed to create multi-variant product: ${error.message}`)
      // Could add to skipped products array here if needed
    }
  }
}


  // ✅ STEP 6: SIMPLE PRODUCT PROCESSING (updated)
  console.log(`\n🔧 Processing ${simpleProducts.length} simple products...`)

  for (const simpleProduct of simpleProducts) {
    console.log(`\n📦 Processing simple: ${simpleProduct.name} (ID: ${simpleProduct.id}, SKU: ${simpleProduct.sku})`)
    
    const singleVariantProduct = this.createSingleVariantProduct(simpleProduct, salesChannelId, inventoryLocationId)
    medusaProducts.push(singleVariantProduct)
  }

  console.log(`\n✅ Completed processing all products`)

  // ✅ STEP 7: COMPLETION REPORTING (updated)
  console.log(`\n📊 Transformation Summary:`)
  console.log(`   • Parent products processed: ${parentProducts.length}`)
  console.log(`   • Simple products processed: ${simpleProducts.length}`)
  console.log(`   • Total variations found: ${variations.length}`)
  console.log(`   • Variation groups created: ${variationsByParentId.size}`)
  console.log(`   • Products ready for Medusa import: ${medusaProducts.length}`) // ✅ Now shows actual count

  return medusaProducts
  }



private createSingleVariantProduct(
  product: WooCommerceProduct,
  salesChannelId: string,
  inventoryLocationId: string
): MedusaProductInput {
  console.log(`🔨 Creating single-variant product: ${product.name}`)

  const cleanTitle = product.name.trim()
  const handle = product.slug || this.generateHandle(product.name, product.sku)
  const priceAmount = Math.round(parseFloat(product.price || '0') * 100)

  const variant = {
    title: cleanTitle,
    sku: product.sku,
    options: {},
    prices: [{
      amount: priceAmount,
      currency_code: 'usd'
    }],
    manage_inventory: true
  }

  // ✅ CLEANED: Removed invalid fields
  const medusaProduct: MedusaProductInput = {
    title: cleanTitle,
    handle: handle,
    sales_channels: [{ id: salesChannelId }],
    options: [],
    variants: [variant],
    images: product.images?.map(img => ({ url: img.src })) || [],
    description: product.description || product.short_description || ''
  }

  console.log(`   ✅ Created single-variant: ${product.sku} with price $${(priceAmount / 100).toFixed(2)}`)
  return medusaProduct
}



  /**
   * Generate URL-friendly handle from product name and SKU
   */
  private generateHandle(name: string, sku: string): string {
    // Use product name if available, fallback to SKU
    const baseText = name || sku
    
    return baseText
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, '')     // Remove leading/trailing hyphens
      .substring(0, 50)            // Limit length
  }






/**
 * Create multi-variant product from parent + variations + attributes
 */
private createMedusaProductFromParent(
  parentProduct: WooCommerceProduct,
  variations: WooCommerceProduct[],
  salesChannelId: string,
  inventoryLocationId: string
): MedusaProductInput {
  console.log(`🔨 Creating multi-variant product: ${parentProduct.name} with ${variations.length} variants`)
  
  const attributes = this.extractVariationAttributes(parentProduct, variations)
  
  if (attributes.length === 0) {
    throw new Error(`No variation attributes found for parent ${parentProduct.sku}`)
  }
  
  const options = attributes.map(attr => ({
    title: attr.name,
    values: attr.values
  }))
  
  console.log(`🏷️  Created ${options.length} options: ${options.map(o => o.title).join(', ')}`)
  
  const variants = variations.map(variation => {
    const priceAmount = Math.round(parseFloat(variation.price || parentProduct.price || '0') * 100)
    
    return {
      title: variation.name,
      sku: variation.sku,
      options: this.mapVariationToOptions(variation, attributes),
      prices: [{
        amount: priceAmount,
        currency_code: 'usd'
      }],
      manage_inventory: true
    }
  })
  
  const cleanTitle = parentProduct.name.trim()
  const handle = parentProduct.slug || this.generateHandle(parentProduct.name, parentProduct.sku)
  
  // ✅ CLEANED: Removed invalid fields
  const medusaProduct: MedusaProductInput = {
    title: cleanTitle,
    handle: handle,
    sales_channels: [{ id: salesChannelId }],
    options: options,
    variants: variants,
    images: parentProduct.images?.map(img => ({ url: img.src })) || [],
    description: parentProduct.description || parentProduct.short_description || ''
  }
  
  console.log(`   ✅ Created multi-variant product: ${variants.length} variants with ${options.length} options`)
  return medusaProduct
}


/**
 * Extract variation attributes from parent product
 */
private extractVariationAttributes(parentProduct: WooCommerceProduct, variations: WooCommerceProduct[]): { name: string, values: string[] }[] {
  if (!parentProduct.attributes || parentProduct.attributes.length === 0) {
    console.log(`⚠️  No attributes found on parent ${parentProduct.sku}, analyzing variations...`)
    return this.buildAttributesFromVariations(variations)
  }
  
  // Filter for variation attributes only
  const variationAttributes = parentProduct.attributes.filter(attr => attr.variation === true)
  
  return variationAttributes.map(attr => {
    // Get values from parent options, plus scan variations for additional values
    const parentValues = attr.options || []
    const variationValues = new Set<string>()
    
    variations.forEach(variation => {
      if (variation.attributes) {
        const matchingAttr = variation.attributes.find(vAttr => 
          vAttr.slug === attr.slug || vAttr.name === attr.name
        )
        if (matchingAttr && matchingAttr.options && matchingAttr.options.length > 0) {
          variationValues.add(matchingAttr.options[0])
        }
      }
    })
    
    // Combine and deduplicate values
    const allValues = Array.from(new Set([...parentValues, ...variationValues]))
    const sortedValues = this.sortAttributeValues(allValues, attr.name)
    
    return {
      name: this.cleanAttributeName(attr.name),
      values: sortedValues
    }
  })
}

/**
 * Map variation to parent option structure
 */
/**
 * Map variation to parent option structure - FIXED for Medusa v2 API format
 */
private mapVariationToOptions(variation: WooCommerceProduct, attributes: { name: string, values: string[] }[]): Record<string, string> {
  const optionsObject: Record<string, string> = {}
  
  attributes.forEach(attr => {
    let value = 'Unknown'
    
    if (variation.attributes) {
      const matchingAttr = variation.attributes.find(vAttr => 
        vAttr.name === attr.name
      )
      
      if (matchingAttr && matchingAttr.options && matchingAttr.options.length > 0 && matchingAttr.options[0] !== undefined) {
        value = matchingAttr.options[0]
      } else if (matchingAttr && matchingAttr.option && typeof matchingAttr.option === 'string') {
        value = matchingAttr.option
      }
    }
    
    // Use the attribute name as the key, value as the value
    optionsObject[attr.name] = value
  })
  
  return optionsObject  // ✅ Return object instead of array
}



/**
 * Clean attribute names (remove WooCommerce prefixes)
 */
private cleanAttributeName(name: string): string {
  return name
    .replace(/^pa_/, '') // Remove WooCommerce prefix
    .replace(/_/g, ' ')  // Replace underscores with spaces
    .replace(/\b\w/g, l => l.toUpperCase()) // Title case
}

/**
 * Sort attribute values logically
 */
private sortAttributeValues(values: string[], attributeName: string): string[] {
  // For now, just sort alphabetically - we can add size-specific logic later
  return values.sort()
}

/**
 * Build attributes from variations (fallback method)
 */
private buildAttributesFromVariations(variations: WooCommerceProduct[]): { name: string, values: string[] }[] {
  console.log(`🚧 Building attributes from ${variations.length} variations (fallback method)`)
  // For now, return empty array - implement if needed
  return []
}













}
