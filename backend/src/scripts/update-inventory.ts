import 'dotenv/config'
import axios from 'axios'

interface InventoryUpdateResult {
  success: boolean
  variantsUpdated: number
  errors: string[]
  duration: number
}

export class InventoryUpdater {
  private apiClient: axios.AxiosInstance
  private authToken: string | null = null

  constructor() {
    this.apiClient = axios.create({
      baseURL: process.env.MEDUSA_API_URL || 'http://localhost:9000',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    })
  }

  /**
   * AUTHENTICATION: Get JWT token from Medusa admin
   */
  async authenticate(): Promise<void> {
    if (this.authToken) return

    try {
      console.log('🔐 Authenticating with Medusa admin...')
      
      const response = await this.apiClient.post('/auth/user/emailpass', {
        email: process.env.MEDUSA_ADMIN_EMAIL,
        password: process.env.MEDUSA_ADMIN_PASSWORD
      })

      this.authToken = response.data.token
      this.apiClient.defaults.headers['Authorization'] = `Bearer ${this.authToken}`
      
      console.log('✅ Authenticated successfully')
    } catch (error: any) {
      throw new Error(`Authentication failed: ${error.response?.data?.message || error.message}`)
    }
  }

  /**
   * STEP 1: ASSIGN PRODUCT TO SALES CHANNEL
   * Uses correct Medusa v2 API: POST /admin/sales-channels/{id}/products with "add" array
   */
  async assignProductToSalesChannel(productId: string, salesChannelId: string): Promise<void> {
    try {
      console.log(`   🏪 STEP 1: Assigning product ${productId} to sales channel`)
      
      await this.apiClient.post(`/admin/sales-channels/${salesChannelId}/products`, {
        add: [productId]  // Medusa v2 expects "add" array with product IDs
      })
      
      console.log('   ✅ Product assigned to sales channel successfully')
    } catch (error: any) {
      console.error('   ❌ Failed to assign product to sales channel:', error.response?.data || error.message)
      throw error
    }
  }

  /**
   * HELPER: Find existing inventory item by SKU instead of creating new one
   * This prevents "already exists" errors mentioned in Medusa AI guidance
   */
  async findInventoryItemBySku(sku: string): Promise<any> {
    try {
      const response = await this.apiClient.get('/admin/inventory-items', {
        params: { sku: sku }
      })
      
      const inventoryItems = response.data.inventory_items || []
      return inventoryItems.find((item: any) => item.sku === sku) || null
    } catch (error: any) {
      console.error(`   ⚠️  Failed to find inventory item for SKU ${sku}:`, error.message)
      return null
    }
  }

  /**
   * STEP 2: LINK EXISTING INVENTORY ITEM TO VARIANT
   * Links the found inventory item to the product variant
   */
/**
 * STEP 2: LINK EXISTING INVENTORY ITEM TO VARIANT - FIXED for Medusa v2 API
 * Uses correct Medusa v2 API endpoint: /admin/products/{product_id}/variants/{variant_id}/inventory-items
 */
    async linkInventoryItemToVariant(productId: string, variantId: string, inventoryItemId: string): Promise<void> {
    try {
        console.log(`     🔗 STEP 2: Linking inventory item to variant ${variantId}`)
        
        // ✅ FIXED: Use correct Medusa v2 API endpoint structure
        await this.apiClient.post(`/admin/products/${productId}/variants/${variantId}/inventory-items`, {
        inventory_item_id: inventoryItemId,
        required_quantity: 1  // Required field in Medusa v2
        })
        
        console.log('     ✅ Inventory item linked to variant successfully')
    } catch (error: any) {
        console.error('     ❌ Failed to link inventory item to variant:', error.response?.data || error.message)
        throw error
    }
    }


  /**
   * STEP 3: ASSIGN INVENTORY TO LOCATION & SET LEVELS
   * Creates or updates inventory level at the specified location with the given quantity
   */
  async setInventoryLevelAtLocation(inventoryItemId: string, locationId: string, quantity: number): Promise<void> {
    try {
      console.log(`     📍 STEP 3: Setting inventory level (${quantity} units) at location`)
      
      // First check if inventory level already exists at this location
      const levelsResponse = await this.apiClient.get(`/admin/inventory-items/${inventoryItemId}/location-levels`)
      const existingLevels = levelsResponse.data.inventory_levels || []
      const existingLevel = existingLevels.find((level: any) => level.location_id === locationId)

      if (existingLevel) {
        // Update existing inventory level
        await this.apiClient.post(`/admin/inventory-items/${inventoryItemId}/location-levels/${existingLevel.id}`, {
          stocked_quantity: quantity
        })
        console.log('     ✅ Updated existing inventory level')
      } else {
        // Create new inventory level at location
        await this.apiClient.post(`/admin/inventory-items/${inventoryItemId}/location-levels`, {
          location_id: locationId,
          stocked_quantity: quantity
        })
        console.log('     ✅ Created new inventory level at location')
      }
    } catch (error: any) {
      console.error('     ❌ Failed to set inventory level:', error.response?.data || error.message)
      throw error
    }
  }



    

  /*
   * MAIN PROCESS: Update inventory for a single product
   * Orchestrates all three steps: sales channel + inventory location + inventory levels
   */
  async updateProductInventory(productHandle: string, wooCommerceVariants: any[]): Promise<InventoryUpdateResult> {
    console.log(`📦 Updating inventory for product: ${productHandle}`)
    
    const startTime = Date.now()
    const errors: string[] = []
    let variantsUpdated = 0

    try {
      await this.authenticate()

      // Get the Medusa product and its variants
      const medusaProduct = await this.getMedusaProduct(productHandle)
      if (!medusaProduct) {
        throw new Error(`Product not found: ${productHandle}`)
      }
      console.log('PARENT PRODUCT JSON:', JSON.stringify(medusaProduct, null, 2))

      console.log(`   📋 Found product: ${medusaProduct.title} with ${medusaProduct.variants.length} variants`)

      // STEP 1: Assign product to sales channel (if environment variable provided)
      if (process.env.MEDUSA_SALES_CHANNEL_ID) {
        await this.assignProductToSalesChannel(medusaProduct.id, process.env.MEDUSA_SALES_CHANNEL_ID)
      } else {
        console.log('   ⚠️  MEDUSA_SALES_CHANNEL_ID not set - skipping sales channel assignment')
      }

      // Process each variant for STEPS 2 & 3
      console.log('\n   🔧 Processing variants for inventory setup...')
      for (const medusaVariant of medusaProduct.variants) {
        try {
          console.log(`\n   📦 Processing variant: ${medusaVariant.sku}`)
          
          // Find matching WooCommerce variant for quantity data
          const wooVariant = wooCommerceVariants.find(wv => wv.sku === medusaVariant.sku)
          const newQuantity = wooVariant ? (wooVariant.stock_quantity || wooVariant.inventory_quantity || 0) : 0
          
          // Check if variant already has inventory item linked
          if (medusaVariant.inventory_item?.id) {
            console.log('     ✅ Variant already has inventory item linked')
            
            // Skip to STEP 3: Set inventory level
            if (process.env.MEDUSA_LOCATION_ID) {
              await this.setInventoryLevelAtLocation(
                medusaVariant.inventory_item.id, 
                process.env.MEDUSA_LOCATION_ID, 
                newQuantity
              )
              variantsUpdated++
            }
          } else {
            // Find existing inventory item by SKU (Medusa AI guidance)
            const existingInventoryItem = await this.findInventoryItemBySku(medusaVariant.sku)
            
            if (existingInventoryItem) {
              console.log('     ✅ Found existing inventory item by SKU')
              
              // STEP 2: Link existing inventory item to variant
              // STEP 2: Link existing inventory item to variant
                await this.linkInventoryItemToVariant(
                medusaProduct.id,     // ✅ Add product ID (required for correct endpoint)
                medusaVariant.id, 
                existingInventoryItem.id
                )
              
              // STEP 3: Set inventory level at location
              if (process.env.MEDUSA_LOCATION_ID) {
                await this.setInventoryLevelAtLocation(
                  existingInventoryItem.id, 
                  process.env.MEDUSA_LOCATION_ID, 
                  newQuantity
                )
                variantsUpdated++
              }
            } else {
              console.log('     ⚠️  No existing inventory item found for SKU - skipping variant')
            }
          }

        } catch (error: any) {
          const errorMsg = `Failed to process variant ${medusaVariant.sku}: ${error.message}`
          console.error(`     ❌ ${errorMsg}`)
          errors.push(errorMsg)
        }
      }

      const duration = Date.now() - startTime
      
      console.log(`\n📊 Inventory update complete for ${productHandle}:`)
      console.log(`   • Variants updated: ${variantsUpdated}`)
      console.log(`   • Errors: ${errors.length}`)
      console.log(`   • Duration: ${Math.round(duration / 1000)}s`)

      return {
        success: errors.length === 0,
        variantsUpdated,
        errors,
        duration
      }

    } catch (error: any) {
      const duration = Date.now() - startTime
      const errorMsg = `Inventory update failed: ${error.message}`
      console.error(`💥 ${errorMsg}`)
      errors.push(errorMsg)

      return {
        success: false,
        variantsUpdated,
        errors,
        duration
      }
    }
  }

  /**
   * HELPER: Get Medusa product by handle
   */
  private async getMedusaProduct(handle: string): Promise<any> {
    try {
      const response = await this.apiClient.get('/admin/products', {
        params: { handle: handle }
      })

      return response.data.products?.[0] || null
    } catch (error: any) {
      throw new Error(`Failed to fetch product ${handle}: ${error.message}`)
    }
  }
}

// Command-line interface for standalone use
async function main() {
  const productHandle = process.argv[2]
  const wooCommerceParentId = process.argv[3] ? parseInt(process.argv[3]) : null

  if (!productHandle) {
    console.error('❌ Usage: npx tsx src/scripts/update-inventory.ts <product-handle> [woocommerce-parent-id]')
    console.error('   Example: npx tsx src/scripts/update-inventory.ts union-hexagonal-nut 513')
    process.exit(1)
  }

  const updater = new InventoryUpdater()
  
  try {
    console.log(`🎯 Updating inventory for: ${productHandle}`)
    
    // If WooCommerce parent ID provided, fetch fresh data
    let wooCommerceVariants: any[] = []
    if (wooCommerceParentId) {
      const { WooCommerceBatchFetcher } = await import('../lib/woocommerce/migration/batch-fetcher.js')
      const fetcher = new WooCommerceBatchFetcher()
      wooCommerceVariants = await fetcher.fetchVariationsForParent(wooCommerceParentId)
      console.log(`📡 Fetched ${wooCommerceVariants.length} variants from WooCommerce`)
    } else {
      console.log('⚠️  No WooCommerce parent ID provided - using manual inventory data')
    }
    
    const result = await updater.updateProductInventory(productHandle, wooCommerceVariants)
    
    if (result.success) {
      console.log(`\n✅ Inventory update completed successfully!`)
      console.log(`📊 ${result.variantsUpdated} variants updated`)
    } else {
      console.log(`\n❌ Inventory update had errors:`)
      result.errors.forEach(error => console.log(`   • ${error}`))
      process.exit(1)
    }
    
  } catch (error: any) {
    console.error('💥 Inventory update script failed:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}
