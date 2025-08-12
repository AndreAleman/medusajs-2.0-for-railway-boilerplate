import 'dotenv/config'
import { createWooCommerceClient } from '../lib/woocommerce/api-client'
import { DynamicProductTransformer } from '../lib/woocommerce/product-transformer'

async function importProductsByList() {
  console.log('📦 One-Time Product Import by SKU Prefix List\n')
  
  // Define which product families to import
  const skuPrefixes = [
    '22MP',    // Hex nuts (7 products)
   // Add more product lines as needed
  ]
  
  console.log(`🎯 Importing product families: ${skuPrefixes.join(', ')}`)
  console.log(`📋 This will import all size variants for each family\n`)
  
  try {
    const client = createWooCommerceClient()
    let totalImportResults = []
    
    // ✅ FIXED: Process each SKU prefix separately
    for (const prefix of skuPrefixes) {
      console.log(`\n🔍 Fetching products with prefix: ${prefix}`)
      const prefixProducts = await client.getProductsByExistingSkus([prefix])
      console.log(`✅ Found ${prefixProducts.length} products for ${prefix}`)
      
      if (prefixProducts.length > 0) {
        // Step 2: Transform to Medusa format using dynamic transformer
        console.log(`\n🔄 Transforming ${prefix} products to Medusa format...`)
        const transformer = new DynamicProductTransformer()
        const medusaProducts = transformer.transformProductFamily(prefixProducts)
        
        console.log(`✅ Created ${medusaProducts.length} product families for ${prefix}`)
        
        // Step 3: Preview what will be imported for this family
        console.log(`\n📋 Import Preview for ${prefix.toUpperCase()}:`)
        medusaProducts.forEach((product, index) => {
          console.log(`${index + 1}. ${product.title}`)
          console.log(`   Handle: ${product.handle}`)
          console.log(`   Variants: ${product.variants.length}`)
          console.log(`   Options: ${product.options.map(o => `${o.title} (${o.values.join(', ')})`).join(', ')}`)
          console.log('   Variant Details:')
          product.variants.forEach((variant, i) => {
            const optionString = variant.options.map(opt => opt.value).join(' | ')
            const price = (variant.prices[0].amount / 100).toFixed(2)
            console.log(`     ${i + 1}. ${variant.sku}: ${optionString} - $${price}`)
          })
          console.log('')
        })
        
        // Step 4: Import to Medusa with SKU prefix for category creation
        console.log(`🚀 Importing ${prefix} family to Medusa...`)
        
        // ✅ FIXED: Pass both products AND skuPrefix parameters
        const importResults = await realImportToMedusa(medusaProducts, prefix)
        
        totalImportResults.push(...importResults)
        
        console.log(`✅ Successfully imported ${importResults.length} product families from ${prefix}`)
      } else {
        console.log(`⚠️  No products found for prefix: ${prefix}`)
      }
    }
    
    console.log('\n🎉 Complete Import Summary!')
    console.log(`✅ Total product families imported: ${totalImportResults.length}`)
    console.log(`📦 Total variants created: ${totalImportResults.reduce((sum, p) => sum + (p.variants?.length || 0), 0)}`)
    
  } catch (error) {
    console.error('❌ Import failed:', error)
  }
}


/**
 * Temporary simulation - you'll replace this with actual Medusa workflow execution
 * This shows what would be imported without actually creating products
 */
// async function simulateImport(products: any[]) {
//   console.log('📝 [SIMULATION] Would import these products to Medusa:')
//   products.forEach(product => {
//     console.log(`   ✅ ${product.title} (${product.variants.length} variants)`)
//     product.variants.forEach((variant: any) => {
//       const optionString = variant.options.map((opt: any) => opt.value).join(' | ')
//       console.log(`      - ${variant.sku}: ${optionString}`)
//     })
//   })
//   return products
// }


/**
 * Real import function - creates actual products in Medusa database
 */
/**
 * Real import function - creates actual products in Medusa database
 */
/**
 * Real import function - creates actual products in Medusa database
 *//**
 * Real import function - creates actual products in Medusa database
 */
/**
 * Real import function - creates products and inventory in Medusa database
 */
/**
 * Real import function - creates products with sales channel and inventory
 */
/**
 * Real import function - creates products with categories, sales channel and inventory
 */
async function realImportToMedusa(products: any[], skuPrefix: string) {
  console.log('📝 Creating products with categories and inventory in Medusa database...')
  
  const createdProducts = []
  const defaultLocationId = process.env.MEDUSA_LOCATION_ID || 'sloc_01K0F1QDD6BJH9VWB5TF91M8VY'
  const defaultSalesChannelId = process.env.MEDUSA_SALES_CHANNEL_ID || 'sc_01K0AZA26A0C06GVADK4ZCA1EQ'
  
  // ✅ NEW: Create or get category for this product family
  const categoryId = await ensureProductCategory(skuPrefix)
  
  for (const product of products) {
    try {
      console.log(`\n🔧 Creating product: ${product.title}`)
      
      const medusaProductData = {
        title: product.title,
        handle: product.handle,
        description: product.description || `High-quality ${product.title} from Sanitube`,
        options: product.options,
        variants: product.variants.map((variant) => {
          const optionsObject = {};
          variant.options.forEach((opt, idx) => {
            const optionTitle = product.options[idx]?.title;
            if (optionTitle) {
              optionsObject[optionTitle] = opt.value;
            }
          });
          return {
            title: variant.title,
            sku: variant.sku,
            options: optionsObject,
            prices: [{
              currency_code: 'usd',
              amount: variant.prices[0].amount
            }],
            manage_inventory: variant.manage_inventory
          }
        }),
        images: product.images || [],
        status: 'published',
        sales_channels: [
          { id: defaultSalesChannelId }
        ],
        // ✅ NEW: Associate with category if created successfully
        ...(categoryId && { categories: [{ id: categoryId }] })
      }
      
      const createdProduct = await createMedusaProduct(medusaProductData)
      console.log(`   ✅ Successfully created product with category: ${createdProduct.title} (ID: ${createdProduct.id})`)
      
      // Rest of inventory creation logic remains the same...
      console.log(`   📦 Setting up inventory for ${createdProduct.variants?.length || 0} variants...`)
      
      if (createdProduct.variants) {
        for (let i = 0; i < createdProduct.variants.length; i++) {
          const createdVariant = createdProduct.variants[i]
          const originalVariant = product.variants[i]
          
          try {
            const inventoryItem = await createInventoryItem(
              createdVariant.sku,
              originalVariant.title,
              originalVariant.inventory_quantity || 0,
              defaultLocationId
            )
            
            console.log(`      📋 Created inventory: ${createdVariant.sku} (${originalVariant.inventory_quantity || 0} units)`)
            
            await linkInventoryToVariant(
              createdProduct.id,
              createdVariant.id,
              inventoryItem.id
            )
            
            console.log(`      🔗 Linked inventory to variant: ${createdVariant.sku}`)
            
          } catch (inventoryError) {
            console.error(`      ❌ Failed to set inventory for ${createdVariant.sku}:`, inventoryError.message)
            continue
          }
        }
      }
      
      createdProducts.push(createdProduct)
      
    } catch (error) {
      console.error(`   ❌ Failed to create product: ${product.title}`)
      console.error(`   Error:`, error.message || error)
      continue
    }
  }
  
  return createdProducts
}



/**
 * Update inventory level for existing inventory item
 */
async function updateInventoryLevel(inventoryItemId: string, locationId: string, stockQuantity: number) {
  const adminApiUrl = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
  const adminToken = await getAdminToken()

  const updateData = {
    location_levels: [{
      location_id: locationId,
      stocked_quantity: stockQuantity
    }]
  }

  const response = await fetch(`${adminApiUrl}/admin/inventory-items/${inventoryItemId}/location-levels`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify(updateData)
  })

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`Inventory update failed: ${errorData}`)
  }

  return await response.json()
}



/**
 * Create inventory item with stock at default location
 */
/**
 * Create inventory item with stock at location (sales channel already associated)
 */
async function createInventoryItem(sku: string, title: string, stockQuantity: number, locationId: string) {
  const adminApiUrl = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
  const adminToken = await getAdminToken()
  
  // Check for existing inventory item first
  try {
    const existingResponse = await fetch(`${adminApiUrl}/admin/inventory-items?sku=${sku}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    })
    
    if (existingResponse.ok) {
      const existingResult = await existingResponse.json()
      
      if (existingResult.inventory_items && existingResult.inventory_items.length > 0) {
        const existingItem = existingResult.inventory_items[0]
        console.log(`      ♻️  Found existing inventory item: ${sku}`)
        
        // Update the stock quantity
        await updateInventoryLevel(existingItem.id, locationId, stockQuantity)
        console.log(`      📊 Updated stock: ${sku} (${stockQuantity} units)`)
        
        return existingItem
      }
    }
  } catch (error) {
    console.log(`      🔍 No existing inventory found for ${sku}, creating new...`)
  }
  
  // Create new inventory item
  const inventoryData = {
    sku: sku,
    title: title,
    location_levels: [{
      location_id: locationId,
      stocked_quantity: stockQuantity
    }]
  }
  
  const response = await fetch(`${adminApiUrl}/admin/inventory-items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify(inventoryData)
  })
  
  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`Inventory creation failed: ${errorData}`)
  }
  
  const result = await response.json()
  return result.inventory_item
}


/**
 * Link inventory item to product variant
 */
async function linkInventoryToVariant(productId: string, variantId: string, inventoryItemId: string) {
  const adminApiUrl = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
  const adminToken = await getAdminToken()
  
  const linkData = {
    inventory_item_id: inventoryItemId,
    required_quantity: 1
  }
  
  const response = await fetch(`${adminApiUrl}/admin/products/${productId}/variants/${variantId}/inventory-items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify(linkData)
  })
  
  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`Inventory linking failed: ${errorData}`)
  }
  
  return await response.json()
}






/**
 * Create or get category for product family
 */
async function ensureProductCategory(familyPrefix: string): Promise<string> {
  const adminApiUrl = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
  const adminToken = await getAdminToken()
  
  // Map SKU prefixes to category information
  const categoryMap: { [key: string]: { name: string, description: string } } = {
    '13h': {
      name: 'Hex Nuts',
      description: 'Union hexagonal nuts in various sizes and materials'
    },
    'tcbv': {
      name: 'Ball Valves',
      description: 'Three-piece ball valves for industrial applications'
    },
    '14a': {
      name: 'Ferrules',
      description: 'Tube end ferrules and fittings'
    }
    // Add more product families as needed
  }
  
  const categoryInfo = categoryMap[familyPrefix.toLowerCase()]
  if (!categoryInfo) {
    console.log(`   ⚠️  No category mapping for prefix: ${familyPrefix}`)
    return null
  }
  
  const categoryHandle = categoryInfo.name.toLowerCase().replace(/\s+/g, '-')
  
  try {
    // Check if category already exists
    const existingResponse = await fetch(`${adminApiUrl}/admin/product-categories?handle=${categoryHandle}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    })
    
    if (existingResponse.ok) {
      const existingResult = await existingResponse.json()
      
      if (existingResult.product_categories && existingResult.product_categories.length > 0) {
        const existingCategory = existingResult.product_categories[0]
        console.log(`   📁 Found existing category: ${categoryInfo.name}`)
        return existingCategory.id
      }
    }
    
    // Create new category
    const categoryData = {
      name: categoryInfo.name,
      handle: categoryHandle,
      description: categoryInfo.description,
      is_active: true,
      is_internal: false
    }
    
    const response = await fetch(`${adminApiUrl}/admin/product-categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(categoryData)
    })
    
    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Category creation failed: ${errorData}`)
    }
    
    const result = await response.json()
    console.log(`   📁 Created category: ${categoryInfo.name} (ID: ${result.product_category.id})`)
    return result.product_category.id
    
  } catch (error) {
    console.error(`   ❌ Failed to ensure category for ${familyPrefix}:`, error.message)
    return null
  }
}






/**
 * Get admin authentication token (reusable)
 */
async function getAdminToken(): Promise<string> {
  const adminApiUrl = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
  
  const authResponse = await fetch(`${adminApiUrl}/auth/user/emailpass`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: process.env.MEDUSA_ADMIN_EMAIL || 'admin@medusa-test.com',
      password: process.env.MEDUSA_ADMIN_PASSWORD || 'supersecret'
    })
  })
  
  if (!authResponse.ok) {
    const authError = await authResponse.text()
    throw new Error(`Authentication failed: ${authError}`)
  }
  
  const authResult = await authResponse.json()
  return authResult.token
}

/**
 * Create product using Medusa Admin API - RAILWAY PRODUCTION
 */
/**
 * Create product using Medusa Admin API with authentication
 */
/**
 * Create product using Medusa Admin API with JWT authentication
 */
/**
 * Create product using proper Medusa v2 authentication
 */
/**
 * Create product using Medusa Admin API with reusable authentication
 */
async function createMedusaProduct(productData: any) {
  const adminApiUrl = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
  
  try {
    console.log(`   🌐 Connecting to Medusa: ${adminApiUrl}`)
    
    // ✅ Use the existing getAdminToken helper
    const adminToken = await getAdminToken()
    console.log(`   🔐 Authenticated successfully with Medusa`)
    
    // Create product using the token
    const response = await fetch(`${adminApiUrl}/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(productData)
    })
    
    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorData}`)
    }
    
    const result = await response.json()
    return result.product
    
  } catch (error) {
    console.error('Failed to create product with Medusa auth:', error)
    throw error
  }
}









importProductsByList().catch(console.error)
