import 'dotenv/config'
import axios from 'axios'

class DraftProductChecker {
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
   * Get all products and check their status
   */
  async checkAllProductStatus(): Promise<void> {
    try {
      await this.authenticate()

      console.log('📋 Fetching all products from Medusa...')
      
      // Get all products (not just published ones)
      const response = await this.apiClient.get('/admin/products', {
        params: {
          limit: 100 // Adjust if you have more than 100 products
        }
      })

      const products = response.data.products || []
      console.log(`📦 Found ${products.length} total products in Medusa`)

      if (products.length === 0) {
        console.log('⚠️  No products found in your Medusa backend')
        return
      }

      // Categorize products by status
      const publishedProducts = products.filter((p: any) => p.status === 'published')
      const draftProducts = products.filter((p: any) => p.status === 'draft')
      const otherStatusProducts = products.filter((p: any) => p.status !== 'published' && p.status !== 'draft')

      console.log('\n📊 Product Status Summary:')
      console.log(`   • Published: ${publishedProducts.length}`)
      console.log(`   • Draft: ${draftProducts.length}`)
      console.log(`   • Other status: ${otherStatusProducts.length}`)

      // Show published products
      if (publishedProducts.length > 0) {
        console.log('\n✅ PUBLISHED PRODUCTS (visible to storefront):')
        publishedProducts.forEach((product: any, i: number) => {
          console.log(`   ${i + 1}. "${product.title}" (${product.handle}) - ${product.variants?.length || 0} variants`)
        })
      }

      // Show draft products (the problematic ones)
      if (draftProducts.length > 0) {
        console.log('\n❌ DRAFT PRODUCTS (invisible to storefront):')
        draftProducts.forEach((product: any, i: number) => {
          console.log(`   ${i + 1}. "${product.title}" (${product.handle}) - ${product.variants?.length || 0} variants`)
          console.log(`      • ID: ${product.id}`)
          console.log(`      • Sales channels: ${product.sales_channels?.length || 0}`)
        })

        console.log('\n🎯 THESE DRAFT PRODUCTS NEED TO BE PUBLISHED!')
      }

      // Show other status products
      if (otherStatusProducts.length > 0) {
        console.log('\n⚠️  OTHER STATUS PRODUCTS:')
        otherStatusProducts.forEach((product: any, i: number) => {
          console.log(`   ${i + 1}. "${product.title}" (${product.handle}) - Status: ${product.status}`)
        })
      }

    } catch (error: any) {
      console.error('❌ Failed to check product status:', error.response?.data || error.message)
    }
  }

  /**
   * Publish a single product by ID
   */
  async publishProduct(productId: string, productTitle: string): Promise<void> {
    try {
      console.log(`   📢 Publishing: "${productTitle}"`)
      
      // ✅ FIXED: Use array format for status (Medusa v2 requirement)
      await this.apiClient.post(`/admin/products/${productId}`, {
        status: 'published'  // ✅ Keep as string - the error was misleading
      })
      
      console.log(`   ✅ Published successfully`)
    } catch (error: any) {
      console.error(`   ❌ Failed to publish "${productTitle}": ${error.response?.data?.message || error.message}`)
      throw error
    }
  }

  /**
   * Publish all draft products
   */
  async publishAllDraftProducts(): Promise<void> {
    try {
      await this.authenticate()

      // Get all draft products
const response = await this.apiClient.get('/admin/products', {
params: {

  status: ['draft'],  // ✅ Correct: array format

  limit: 100

}
})

      const draftProducts = response.data.products || []
      
      if (draftProducts.length === 0) {
        console.log('✅ No draft products found - all products are already published!')
        return
      }

      console.log(`📢 Publishing ${draftProducts.length} draft products...`)

      let published = 0
      let failed = 0

      for (const product of draftProducts) {
        try {
          await this.publishProduct(product.id, product.title)
          published++
          
        } catch (error: any) {
          failed++
        }
      }

      console.log(`\n📊 Publishing Results:`)
      console.log(`   • Successfully published: ${published}`)
      console.log(`   • Failed: ${failed}`)
      console.log(`   • Total: ${draftProducts.length}`)

      if (published > 0) {
        console.log('\n🎉 Products are now visible to your storefront!')
      }

    } catch (error: any) {
      console.error('❌ Failed to publish draft products:', error.response?.data || error.message)
    }
  }
}

// Command-line interface
async function main() {
  const action = process.argv[2] || 'check'
  
  if (!['check', 'publish'].includes(action)) {
    console.error('❌ Usage: npx tsx src/scripts/check-draft-products.ts [check|publish]')
    console.error('   check   - Show all products and their status (default)')
    console.error('   publish - Publish all draft products')
    process.exit(1)
  }

  const checker = new DraftProductChecker()
  
  try {
    if (action === 'check') {
      console.log('🔍 Checking product status in Medusa...')
      await checker.checkAllProductStatus()
    } else {
      console.log('📢 Publishing all draft products...')
      await checker.publishAllDraftProducts()
    }
    
  } catch (error: any) {
    console.error('💥 Script failed:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { DraftProductChecker }
