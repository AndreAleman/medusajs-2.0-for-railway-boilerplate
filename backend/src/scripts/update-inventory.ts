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
   * Authenticate with Medusa admin
   */
  async authenticate(): Promise<void> {
    if (this.authToken) return // Already authenticated

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
   * Publish a draft product to make it visible on the storefront
   */
  async publishProduct(productId: string): Promise<void> {
    try {
      console.log(`   📢 Publishing product: ${productId}`)
      
      await this.apiClient.post(`/admin/products/${productId}`, {
        status: 'published'
      })
      
      console.log('   ✅ Product published successfully')
    } catch (error: any) {
      console.error('   ❌ Failed to publish product:', error.response?.data || error.message)
      throw error
    }
  }

  /**
   * Assign product to sales channel
   */
  async assignProductToSalesChannel(productId: string, salesChannelId: string): Promise<void> {
    try {
      console.log(`   🏪 Assigning product ${productId} to sales channel ${salesChannelId}`)
      
      await this.apiClient.post(`/admin/sales-channels/${salesChannelId}/products`, {
        product_ids: [
          {
            id: productId
          }
        ]
      })
      
      console.log('   ✅ Product assigned to sales channel successfully')
    } catch (error: any) {
      console.error('   ❌ Failed to assign product to sales channel:', error.response?.data || error.message)
      throw error
    }
  }

  /**
   * Create inventory items for variants that don't have them
   */
  async createMissingInventoryItems(variants: any[]): Promise<void> {
    console.log('   🔧 Creating missing inventory items...')
    
    for (const variant of variants) {
      if (!variant.inventory_item?.id && variant.manage_inventory) {
        try {
          console.log(`     🏗️  Creating inventory item for ${variant.sku}...`)
          
          // Create inventory item
          const inventoryResponse = await this.apiClient.post('/admin/inventory-items', {
            sku: variant.sku,
            title: variant.title || variant.sku
          })
          
          const inventoryItemId = inventoryResponse.data.inventory_item.id
          console.log(`     ✅ Created inventory item: ${inventoryItemId}`)
          
          // Link inventory item to variant
          await this.apiClient.post(`/admin/product-variants/${variant.id}/inventory-items`, {
            inventory_item_id: inventoryItemId
          })
          
          console.log(`     🔗 Linked to variant ${variant.sku}`)
          
          // Update the variant object so we can use it immediately
          variant.inventory_item = { id: inventoryItemId }
          
        } catch (error: any) {
          console.error(`     ❌ Failed to create inventory item for ${variant.sku}:`, error.response?.data || error.message)
        }
      } else if (variant.inventory_item?.id) {
        console.log(`     ✅ ${variant.sku}: Inventory item exists (${variant.inventory_item.id})`)
      } else {
        console.log(`     ⚠️  ${variant.sku}: manage_inventory is false`)
      }
    }
  }

  /**
   * Update inventory for a product by its handle
   */
  async updateProductInventory(productHandle: string, wooCommerceVariants: any[]): Promise<InventoryUpdateResult> {
    console.log(`📦 Updating inventory for product: ${productHandle}`)
    
    const startTime = Date.now()
    const errors: string[] = []
    let variantsUpdated = 0

    try {
      await this.authenticate()

      // Step 1: Get the Medusa product and its variants
      const medusaProduct = await this.getMedusaProduct(productHandle)
      if (!medusaProduct) {
        throw new Error(`Product not found: ${productHandle}`)
      }

      console.log(`   📋 Found product: ${medusaProduct.title} with ${medusaProduct.variants.length} variants`)

      // ✅ DEBUG: Show SKUs from both sources
      console.log('\n🔍 DEBUG: WooCommerce variants SKUs:')
      wooCommerceVariants.forEach((wv, i) => {
        console.log(`   ${i + 1}. WooCommerce SKU: "${wv.sku}" (stock: ${wv.stock_quantity || wv.inventory_quantity || 0})`)
      })

      console.log('\n🔍 DEBUG: Medusa variants SKUs:')
      medusaProduct.variants.forEach((mv, i) => {
        console.log(`   ${i + 1}. Medusa SKU: "${mv.sku}" (manage_inventory: ${mv.manage_inventory})`)
      })

      console.log('\n🔍 DEBUG: SKU matching results:')
      medusaProduct.variants.forEach((mv) => {
        const wooVariant = wooCommerceVariants.find(wv => wv.sku === mv.sku)
        if (wooVariant) {
          console.log(`   ✅ MATCH: "${mv.sku}" found in both systems`)
        } else {
          console.log(`   ❌ NO MATCH: Medusa SKU "${mv.sku}" not found in WooCommerce data`)
        }
      })

      console.log('\n🔍 DEBUG: Full Medusa product structure:')
      console.log(`   • Product ID: ${medusaProduct.id}`)
      console.log(`   • Product title: "${medusaProduct.title}"`)
      console.log(`   • Product handle: "${medusaProduct.handle}"`)
      console.log(`   • Product status: ${medusaProduct.status}`)
      console.log(`   • Product type: ${medusaProduct.type || 'Not set'}`)
      console.log(`   • Sales channels: ${medusaProduct.sales_channels?.length || 0}`)
      console.log(`   • Options: ${medusaProduct.options?.length || 0}`)
      console.log(`   • Variants: ${medusaProduct.variants?.length || 0}`)

      // Check if this is actually a parent product with proper structure
      if (medusaProduct.options && medusaProduct.options.length > 0) {
        console.log('   ✅ This appears to be a parent product with options')
        medusaProduct.options.forEach((option: any, i: number) => {
          console.log(`     ${i + 1}. Option: ${option.title} - Values: [${option.values?.join(', ')}]`)
        })
      } else {
        console.log('   ❌ WARNING: No options found - this might not be a proper parent product')
      }

      // Step 2: Publish product if it's draft
      if (medusaProduct.status === 'draft') {
        console.log('\n   📢 Product is in draft status, publishing...')
        await this.publishProduct(medusaProduct.id)
      }

      // Step 3: ✅ NEW - Assign to sales channel if environment variable is provided
      if (process.env.MEDUSA_SALES_CHANNEL_ID) {
        console.log('\n   🏪 Assigning product to sales channel...')
        await this.assignProductToSalesChannel(
          medusaProduct.id, 
          process.env.MEDUSA_SALES_CHANNEL_ID
        )
      } else {
        console.log('\n   ⚠️  MEDUSA_SALES_CHANNEL_ID not set - skipping sales channel assignment')
      }

      // Step 4: Create missing inventory items
      console.log('\n')
      await this.createMissingInventoryItems(medusaProduct.variants)

      // Step 5: Update inventory levels
      console.log('\n   📊 Updating inventory levels:')
      for (const medusaVariant of medusaProduct.variants) {
        try {
          // Find matching WooCommerce variant by SKU
          const wooVariant = wooCommerceVariants.find(wv => wv.sku === medusaVariant.sku)
          
          if (!wooVariant) {
            console.log(`     ⚠️  No WooCommerce data found for SKU: ${medusaVariant.sku}`)
            continue
          }

          const newQuantity = wooVariant.stock_quantity || wooVariant.inventory_quantity || 0
          
          // Update inventory level if variant has inventory item
          if (medusaVariant.inventory_item?.id && newQuantity >= 0) {
            await this.updateVariantInventory(medusaVariant, newQuantity)
            variantsUpdated++
            console.log(`     ✅ ${medusaVariant.sku}: ${newQuantity} units`)
          } else {
            console.log(`     ⚠️  ${medusaVariant.sku}: No inventory item or invalid quantity`)
          }

        } catch (error: any) {
          const errorMsg = `Failed to update inventory for ${medusaVariant.sku}: ${error.message}`
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
   * Get Medusa product by handle
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

  /**
   * Update inventory for a specific variant
   */
  private async updateVariantInventory(variant: any, quantity: number): Promise<void> {
    try {
      // First, get current inventory levels to see if we need to create or update
      const levelsResponse = await this.apiClient.get(`/admin/inventory-items/${variant.inventory_item.id}/location-levels`)
      const existingLevels = levelsResponse.data.inventory_levels || []
      
      const locationId = process.env.MEDUSA_LOCATION_ID
      const existingLevel = existingLevels.find((level: any) => level.location_id === locationId)

      if (existingLevel) {
        // Update existing level
        await this.apiClient.post(`/admin/inventory-items/${variant.inventory_item.id}/location-levels/${existingLevel.id}`, {
          stocked_quantity: quantity
        })
      } else {
        // Create new level
        await this.apiClient.post(`/admin/inventory-items/${variant.inventory_item.id}/location-levels`, {
          location_id: locationId,
          stocked_quantity: quantity
        })
      }
    } catch (error: any) {
      throw new Error(`Failed to update inventory level: ${error.response?.data?.message || error.message}`)
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
      // You could add manual inventory data here or prompt for it
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
