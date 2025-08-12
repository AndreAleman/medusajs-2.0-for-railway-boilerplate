import 'dotenv/config'
import { SingleProductFamilyImporter } from './import-product-family'
import axios from 'axios'

// Medusa API configuration
const MEDUSA_API_URL = process.env.MEDUSA_API_URL || 'http://localhost:9000'
const MEDUSA_API_KEY = process.env.MEDUSA_API_KEY || 'your_api_key_here'

interface MedusaImportResult {
  success: boolean
  productId?: string
  productHandle?: string
  variantsCreated: number
  errors: string[]
  duration: number
}

class MedusaApiImporter {
  private apiClient: axios.AxiosInstance
  private authToken: string | null = null

  constructor() {
    this.apiClient = axios.create({
      baseURL: MEDUSA_API_URL,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    })
  }

  /**
   * Authenticate with Medusa v2 and get JWT token
   */
  async authenticate(): Promise<void> {
    try {
      console.log('🔐 Authenticating with Medusa admin...')
      
      const response = await this.apiClient.post('/auth/user/emailpass', {
        email: process.env.MEDUSA_ADMIN_EMAIL,
        password: process.env.MEDUSA_ADMIN_PASSWORD
      })

      // Medusa v2 returns the token in 'token' field
      this.authToken = response.data.token
      
      if (!this.authToken) {
        throw new Error('No token received from Medusa authentication')
      }

      // Set the token for all subsequent requests
      this.apiClient.defaults.headers['Authorization'] = `Bearer ${this.authToken}`
      
      console.log('✅ Authenticated with Medusa successfully')
    } catch (error: any) {
      console.error('❌ Authentication failed:', error.response?.data || error.message)
      throw new Error(`Failed to authenticate with Medusa: ${error.response?.data?.message || error.message}`)
    }
  }

  /**
   * Import a single product family with authentication
   */
  async importProductFamilyToMedusa(parentId: number): Promise<MedusaImportResult> {
    console.log(`🚀 Starting API import for WooCommerce parent ID: ${parentId}`)
    
    const startTime = Date.now()
    const errors: string[] = []

    try {
      // Step 1: Authenticate first
      await this.authenticate()

      // Step 2: Transform WooCommerce product to Medusa format  
      console.log('📋 Step 1: Transforming WooCommerce product...')
      const importer = new SingleProductFamilyImporter()
      const transformResult = await importer.importProductFamily(parentId)

      if (!transformResult.success) {
        return {
          success: false,
          variantsCreated: 0,
          errors: transformResult.errors,
          duration: Date.now() - startTime
        }
      }



      // Step 3: Import to Medusa via createProductsWorkflow API
      console.log('📋 Step 2: Importing to Medusa via API...')
    const medusaProduct = transformResult.medusaProducts[0]
          console.log(`   ✅ Transformed: ${medusaProduct.title} with ${medusaProduct.variants.length} variants`)
    // ✅ Pass the original WooCommerce variations for inventory data
    const medusaResult = await this.createProductInMedusa(
      medusaProduct, 
      transformResult.productFamily.filter(p => p.type === 'variation')
    )

      const duration = Date.now() - startTime
      
      console.log(`🎉 API import completed successfully!`)
      console.log(`   • Product ID: ${medusaResult.productId}`)
      console.log(`   • Handle: ${medusaResult.productHandle}`)
      console.log(`   • Variants: ${medusaResult.variantsCreated}`)
      console.log(`   • Duration: ${Math.round(duration / 1000)}s`)

      return {
        success: true,
        productId: medusaResult.productId,
        productHandle: medusaResult.productHandle,
        variantsCreated: medusaResult.variantsCreated,
        errors: [],
        duration
      }

    } catch (error: any) {
      const duration = Date.now() - startTime
      const errorMsg = `API import failed: ${error.message}`
      console.error(`💥 ${errorMsg}`)
      errors.push(errorMsg)

      return {
        success: false,
        variantsCreated: 0,
        errors,
        duration
      }
    }
  }

  /**
   * Create product in Medusa using createProductsWorkflow API
   */
/**
 * Create product in Medusa using the correct v2 API endpoint
 */
/**
 * Create product and set inventory levels in Medusa
 */
/**
 * Create product and set inventory levels in Medusa
 */
private async createProductInMedusa(medusaProduct: any, originalVariants: any[]): Promise<{ productId: string, productHandle: string, variantsCreated: number }> {
  try {
    console.log(`   🔨 Calling Medusa Products API...`)
    
    // Step 1: Create the product (clean payload without inventory fields)
    const response = await this.apiClient.post('/admin/products', medusaProduct)
    const createdProduct = response.data.product

    console.log(`   ✅ Product created: ${createdProduct.id}`)

    // Step 2: Set inventory levels for each variant (separate step)
    if (createdProduct.variants && createdProduct.variants.length > 0) {
      await this.setInventoryLevels(createdProduct.variants, originalVariants)
    }

    return {
      productId: createdProduct.id,
      productHandle: createdProduct.handle,
      variantsCreated: createdProduct.variants?.length || 0
    }

  } catch (error: any) {
    console.error(`   ❌ Medusa API error:`, error.response?.data || error.message)
    throw new Error(`Medusa API failed: ${error.response?.data?.message || error.message}`)
  }
}

/**
 * Set inventory levels using Medusa's inventory workflow
 */
private async setInventoryLevels(createdVariants: any[], originalVariants: any[]): Promise<void> {
  console.log(`   📦 Setting inventory levels for ${createdVariants.length} variants...`)

  const inventoryLevels = []

  for (let i = 0; i < createdVariants.length && i < originalVariants.length; i++) {
    const createdVariant = createdVariants[i]
    const originalVariant = originalVariants[i]

    // Get inventory quantity from your WooCommerce data
    const inventoryQuantity = originalVariant.inventory_quantity || originalVariant.stock_quantity || 0

    if (inventoryQuantity > 0 && createdVariant.inventory_item?.id) {
      inventoryLevels.push({
        inventory_item_id: createdVariant.inventory_item.id,
        location_id: process.env.MEDUSA_LOCATION_ID,
        stocked_quantity: inventoryQuantity
      })

      console.log(`     📊 Queued ${inventoryQuantity} units for variant ${createdVariant.sku}`)
    }
  }

  // Batch set inventory levels if we have any
  if (inventoryLevels.length > 0) {
    try {
      await this.apiClient.post('/admin/workflows-executions/batch-inventory-levels', {
        input: {
          create: inventoryLevels
        }
      })
      console.log(`   ✅ Set inventory levels for ${inventoryLevels.length} variants`)
    } catch (error: any) {
      console.error(`   ⚠️  Failed to set inventory levels:`, error.response?.data || error.message)
      // Don't fail the entire import if inventory fails
    }
  }
}


  /**
   * Verify product was created successfully in Medusa
   */
  async verifyProduct(productHandle: string): Promise<boolean> {
    try {
      console.log(`🔍 Verifying product: ${productHandle}`)
      
      const response = await this.apiClient.get(`/store/products?handle=${productHandle}`)
      const products = response.data.products

      if (products && products.length > 0) {
        const product = products[0]
        console.log(`   ✅ Product verified: ${product.title} (${product.variants?.length || 0} variants)`)
        return true
      } else {
        console.log(`   ❌ Product not found in Medusa`)
        return false
      }

    } catch (error: any) {
      console.error(`   ❌ Verification failed:`, error.message)
      return false
    }
  }
}

// Command-line interface
async function main() {
  const parentId = process.argv[2] ? parseInt(process.argv[2]) : 513 // Default to Union Hexagonal Nut
  
  if (!parentId || isNaN(parentId)) {
    console.error('❌ Usage: npx tsx src/scripts/import-to-medusa-api.ts <parent-id>')
    console.error('   Example: npx tsx src/scripts/import-to-medusa-api.ts 513')
    process.exit(1)
  }

  const apiImporter = new MedusaApiImporter()
  
  try {
    console.log(`🎯 API Import: WooCommerce parent ID ${parentId} → Medusa`)
    console.log(`🌐 Medusa API: ${MEDUSA_API_URL}`)
    console.log(`🔑 Using API key: ${MEDUSA_API_KEY ? 'Configured' : 'Missing'}\n`)
    
    // Import the product family
    const result = await apiImporter.importProductFamilyToMedusa(parentId)
    
    if (result.success && result.productHandle) {
      // Verify the product was created
      const verified = await apiImporter.verifyProduct(result.productHandle)
      
      if (verified) {
        console.log('\n✅ Complete success! Product imported and verified in Medusa')
        console.log(`📊 ${result.variantsCreated} variants created`)
        console.log(`🔗 Product URL: /products/${result.productHandle}`)
        console.log(`🆔 Medusa Product ID: ${result.productId}`)
      } else {
        console.log('\n⚠️  Import claimed success but verification failed')
      }
    } else {
      console.log('\n❌ API import failed!')
      result.errors.forEach(error => console.log(`   • ${error}`))
      process.exit(1)
    }
    
  } catch (error: any) {
    console.error('💥 Import script failed:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { MedusaApiImporter }
