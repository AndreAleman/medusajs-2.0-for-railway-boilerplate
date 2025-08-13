import 'dotenv/config'
import axios from 'axios'

// Use your existing types (Medusa AI confirmed they're correct)
import { WooCommerceProduct } from '../lib/woocommerce/types.js'
import { MedusaProductInput } from '../lib/woocommerce/types.js'

class WooToMedusaMigration {
  private wooClient: axios.AxiosInstance
  private medusaClient: axios.AxiosInstance
  private authToken: string | null = null

    constructor() {
    // WooCommerce client - ✅ FIXED: Use correct environment variable names
    this.wooClient = axios.create({
        baseURL: `${process.env.WOOCOMMERCE_URL}/wp-json/wc/${process.env.SANITUBE_WC_API_VERSION}`,
        auth: {
        username: process.env.WOOCOMMERCE_CONSUMER_KEY!,
        password: process.env.WOOCOMMERCE_CONSUMER_SECRET!
        },
        timeout: parseInt(process.env.SANITUBE_WC_TIMEOUT || '30000')
    })

    // Medusa client (unchanged)
    this.medusaClient = axios.create({
        baseURL: process.env.MEDUSA_API_URL || 'http://localhost:9000',
        headers: {
        'Content-Type': 'application/json'
        }
    })
    }


  /**
   * STEP 1: Transform WooCommerce product to Medusa format
   * Based on Medusa AI's exact transformation pattern
   */
  transformWooToMedusaProduct(wooProduct: WooCommerceProduct, wooVariations: any[] = []): MedusaProductInput {
    console.log(`🔄 Transforming WooCommerce product: ${wooProduct.name}`)

    // Map options (attributes used for variations) - Medusa AI pattern
    const options = (wooProduct.attributes || [])
      .filter((attr: any) => attr.variation)
      .map((attr: any) => ({
        title: attr.name,
        values: attr.options
      }))

    console.log(`   📋 Found ${options.length} options:`, options.map(o => o.title))

    // Map variants (for variable products) - Medusa AI pattern
    const variants = wooVariations.map((variation: any) => {
      // Dynamic options mapping - exactly as Medusa AI specified
      const variantOptions: Record<string, string> = {}
      ;(variation.attributes || []).forEach((attr: any) => {
        variantOptions[attr.name] = attr.option
      })

      console.log(`   🔧 Mapping variant ${variation.sku}:`, variantOptions)

      return {
        title: variation.name || `${wooProduct.name} Variant`,
        sku: variation.sku,
        options: variantOptions,
        prices: [
          {
            amount: Math.round(Number(variation.price) * 100), // Convert to cents
            currency_code: 'usd'
          }
        ],
        manage_inventory: variation.manage_stock,
        allow_backorder: variation.backorders_allowed,
        weight: Number(variation.weight) || undefined,
        length: Number(variation.dimensions?.length) || undefined,
        height: Number(variation.dimensions?.height) || undefined,
        width: Number(variation.dimensions?.width) || undefined,
        metadata: {
          woocommerce_id: variation.id
        }
      }
    })

    console.log(`   ✅ Transformed ${variants.length} variants`)

    // Build Medusa product - exactly as Medusa AI specified
    const medusaProduct: MedusaProductInput = {
        title: wooProduct.name,
        handle: wooProduct.slug,
        description: wooProduct.description,
        thumbnail: wooProduct.images?.[0]?.src,
        images: (wooProduct.images || []).map((img: any) => ({ url: img.src })),
        options,
        variants,
        metadata: {
            woocommerce_id: wooProduct.id
        },
        sales_channels: [
            { id: "sc_01K0AZA26A0C06GVADK4ZCA1EQ" }
    ]
    }

    console.log(`🎯 Transformation complete for: ${medusaProduct.title}`)
    return medusaProduct
  }

  /**
   * TEST: Fetch WooCommerce product and test transformation
   */
  async testTransformation(productId: number): Promise<void> {
    try {
      console.log(`🔍 Testing transformation for WooCommerce product ${productId}`)

      // Fetch parent product
      console.log('📡 Fetching WooCommerce parent product...')
      const parentResponse = await this.wooClient.get(`/products/${productId}`)
      const wooProduct = parentResponse.data

      // Fetch variations
      console.log('📡 Fetching WooCommerce variations...')
      const variationsResponse = await this.wooClient.get(`/products/${productId}/variations`)
      const wooVariations = variationsResponse.data

      console.log(`📊 Fetched: 1 parent + ${wooVariations.length} variations`)

      // Test transformation
      const medusaProduct = this.transformWooToMedusaProduct(wooProduct, wooVariations)

      // Show result
      console.log('\n🎯 TRANSFORMATION RESULT:')
      console.log('=====================================')
      console.log(JSON.stringify(medusaProduct, null, 2))
      console.log('=====================================\n')

      console.log('✅ Transformation test completed successfully!')

    } catch (error: any) {
      console.error('❌ Transformation test failed:', error.message)
      throw error
    }
  }






/**
 * Authenticate with Medusa admin
 */
async authenticateWithMedusa(): Promise<void> {
  if (this.authToken) return

  try {
    console.log('🔐 Authenticating with Medusa admin...')
    
    const response = await this.medusaClient.post('/auth/user/emailpass', {
      email: process.env.MEDUSA_ADMIN_EMAIL,
      password: process.env.MEDUSA_ADMIN_PASSWORD
    })

    this.authToken = response.data.token
    this.medusaClient.defaults.headers['Authorization'] = `Bearer ${this.authToken}`
    
    console.log('✅ Authenticated with Medusa successfully')
  } catch (error: any) {
    throw new Error(`Medusa authentication failed: ${error.response?.data?.message || error.message}`)
  }
}

/**
 * STEP 2: Create product in Medusa
 */
async createProductInMedusa(medusaProductData: MedusaProductInput): Promise<any> {
  try {
    console.log(`🏗️  STEP 2: Creating product in Medusa: ${medusaProductData.title}`)
    
    await this.authenticateWithMedusa()
    
    const response = await this.medusaClient.post('/admin/products', medusaProductData)
    const createdProduct = response.data.product
    
    console.log(`✅ Product created successfully!`)
    console.log(`   • Product ID: ${createdProduct.id}`)
    console.log(`   • Handle: ${createdProduct.handle}`)
    console.log(`   • Variants: ${createdProduct.variants?.length || 0}`)
    
    return createdProduct
    
  } catch (error: any) {
    console.error('❌ Failed to create product in Medusa:', error.response?.data || error.message)
    throw error
  }
}

/**
 * TEST: Full transformation and creation
 */
async testTransformationAndCreation(productId: number): Promise<void> {
  try {
    console.log(`🔍 Testing full transformation + creation for WooCommerce product ${productId}`)

    // Step 1: Transform (existing code)
    const parentResponse = await this.wooClient.get(`/products/${productId}`)
    const variationsResponse = await this.wooClient.get(`/products/${productId}/variations`)
    const medusaProduct = this.transformWooToMedusaProduct(parentResponse.data, variationsResponse.data)

    // Step 2: Create in Medusa
    const createdProduct = await this.createProductInMedusa(medusaProduct)

    console.log('\n🎉 SUCCESS! Product created in Medusa:')
    console.log(`   • Access via admin: http://localhost:7001/products/${createdProduct.id}`)
    console.log(`   • Store API: http://localhost:9000/store/products?handle=${createdProduct.handle}`)

  } catch (error: any) {
    console.error('❌ Full test failed:', error.message)
    throw error
  }
}





/**
 * STEP 3: Complete inventory setup - FIXED for correct JSON structure
 */
async completeInventorySetup(productId: string, wooCommerceVariants: any[]): Promise<void> {
  try {
    console.log(`🔧 STEP 3: Setting up inventory for product ${productId}`)
    
    await this.authenticateWithMedusa()
    
    // Get the product with inventory relationships
    const response = await this.medusaClient.get(`/admin/products/${productId}`, {
      params: {
        fields: '*variants,*variants.inventory_items,*variants.inventory_items.inventory'
      }
    })
    
    const product = response.data.product
    console.log(`📋 Found ${product.variants.length} variants to process`)
    
    for (const variant of product.variants) {
      try {
        // Find matching WooCommerce data for stock quantity
        const wooVariant = wooCommerceVariants.find(wv => wv.sku === variant.sku)
        const stockQuantity = wooVariant ? (wooVariant.stock_quantity || 0) : 0
        
        // ✅ FIXED: Use correct inventory structure
        if (variant.inventory_items?.length > 0 && process.env.MEDUSA_LOCATION_ID) {
          const inventoryItemId = variant.inventory_items[0].inventory_item_id
          
          console.log(`   📦 Setting ${stockQuantity} units for ${variant.sku}`)
          
          // Set inventory level at location
          await this.setInventoryLevel(inventoryItemId, process.env.MEDUSA_LOCATION_ID, stockQuantity)
          
        } else {
          console.log(`   ⚠️  Skipping ${variant.sku}: No inventory items found`)
        }
      } catch (error: any) {
        console.error(`   ❌ Failed to set inventory for ${variant.sku}:`, error.message)
      }
    }
    
    console.log('✅ Inventory setup completed')
    
  } catch (error: any) {
    console.error('❌ Failed to complete inventory setup:', error.response?.data || error.message)
    throw error
  }
}


/**
 * Helper: Set inventory level at location
 */
async setInventoryLevel(inventoryItemId: string, locationId: string, quantity: number): Promise<void> {
  try {
    // Check existing levels
    const levelsResponse = await this.medusaClient.get(`/admin/inventory-items/${inventoryItemId}/location-levels`)
    const existingLevels = levelsResponse.data.inventory_levels || []
    const existingLevel = existingLevels.find((level: any) => level.location_id === locationId)

    if (existingLevel) {
      // Update existing level
      await this.medusaClient.post(`/admin/inventory-items/${inventoryItemId}/location-levels/${existingLevel.id}`, {
        stocked_quantity: quantity
      })
    } else {
      // Create new level at location
      await this.medusaClient.post(`/admin/inventory-items/${inventoryItemId}/location-levels`, {
        location_id: locationId,
        stocked_quantity: quantity
      })
    }
  } catch (error: any) {
    throw new Error(`Inventory level update failed: ${error.response?.data?.message || error.message}`)
  }
}






/**
 * Check if product already exists in Medusa
 */
async checkProductExists(handle: string): Promise<string | null> {
  try {
    await this.authenticateWithMedusa()
    
    const response = await this.medusaClient.get('/admin/products', {
      params: { handle: handle }
    })
    
    const existingProduct = response.data.products?.[0]
    return existingProduct ? existingProduct.id : null
    
  } catch (error: any) {
    console.error('⚠️  Failed to check product existence:', error.message)
    return null
  }
}










/**
 * COMPLETE TEST: Full WooCommerce → Medusa migration
 */
/**
 * COMPLETE TEST: Full WooCommerce → Medusa migration (handles existing products)
 */
async testCompleteMigration(productId: number): Promise<void> {
  try {
    console.log(`🚀 Testing complete migration for WooCommerce product ${productId}`)

    // Step 1: Transform WooCommerce data
    const parentResponse = await this.wooClient.get(`/products/${productId}`)
    const variationsResponse = await this.wooClient.get(`/products/${productId}/variations`)
    const medusaProduct = this.transformWooToMedusaProduct(parentResponse.data, variationsResponse.data)

    // Step 2: Check if product already exists
    console.log(`🔍 Checking if product exists: ${medusaProduct.handle}`)
    const existingProductId = await this.checkProductExists(medusaProduct.handle!)

    let productToUpdate: string

    if (existingProductId) {
      console.log(`✅ Product already exists: ${existingProductId}`)
      console.log(`⏭️  Skipping creation, proceeding to inventory update...`)
      productToUpdate = existingProductId
    } else {
      console.log(`🆕 Product doesn't exist, creating new one...`)
      // Step 2b: Create new product in Medusa
      const createdProduct = await this.createProductInMedusa(medusaProduct)
      productToUpdate = createdProduct.id
    }

    // Step 3: Always update inventory (whether new or existing)
    console.log(`📦 Updating inventory for product: ${productToUpdate}`)
    await this.completeInventorySetup(productToUpdate, variationsResponse.data)

    console.log('\n🎉 COMPLETE MIGRATION SUCCESS!')
    console.log(`   • Product ID: ${productToUpdate}`)
    console.log(`   • Admin: http://localhost:9000/app/products/${productToUpdate}`)
    console.log(`   • Store API: http://localhost:9000/store/products?handle=${medusaProduct.handle}`)
    console.log(`   • Storefront: http://localhost:8000/products/${medusaProduct.handle}`)

  } catch (error: any) {
    console.error('❌ Complete migration failed:', error.message)
    throw error
  }
}




//end
}

// Test runner
async function main() {
  const action = process.argv[2] || 'transform'
  const productId = parseInt(process.argv[3] || '513')
  
  console.log(`🚀 Starting WooCommerce → Medusa migration`)
  console.log(`📦 Action: ${action}, Product ID: ${productId}\n`)

  const migration = new WooToMedusaMigration()
  
  try {
    if (action === 'transform') {
      await migration.testTransformation(productId)
    } else if (action === 'create') {
      await migration.testTransformationAndCreation(productId)
    } else if (action === 'complete') {
      await migration.testCompleteMigration(productId)
    } else {
      console.error('❌ Usage: npx tsx src/scripts/woo-to-medusa-clean.ts [transform|create|complete] [product-id]')
      process.exit(1)
    }
  } catch (error: any) {
    console.error('💥 Migration failed:', error.message)
    process.exit(1)
  }
}



export { WooToMedusaMigration }

// ✅ ADD THIS - Run if called directly
if (require.main === module) {
  main()
}