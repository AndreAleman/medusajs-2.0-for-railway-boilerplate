import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { WooCommerceProduct, WooCommerceAttribute, ApiCredentials } from './types'

export class WooCommerceApiClient {
  private client: AxiosInstance
  
  constructor(credentials: ApiCredentials) {
    // Initialize axios client with proper WooCommerce API endpoint
    this.client = axios.create({
      baseURL: `${credentials.baseUrl}/wp-json/wc/${credentials.version}`,
      timeout: parseInt(process.env.SANITUBE_WC_TIMEOUT || '30000'),
      auth: {
        username: credentials.consumerKey,
        password: credentials.consumerSecret
      }
    })
    
    // Add retry logic for rate limiting (429 errors)
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 429) {
          await new Promise(resolve => setTimeout(resolve, 2000))
          return this.client.request(error.config)
        }
        return Promise.reject(error)
      }
    )
  }

  async testConnection(): Promise<boolean> {
    // Test basic connectivity to Sanitube's WooCommerce API
    try {
      const response = await this.client.get('/products?per_page=1')
      console.log('✅ WooCommerce API connection successful')
      console.log(`📡 Connected to: ${this.client.defaults.baseURL}`)
      return true
    } catch (error) {
      console.error('❌ WooCommerce API connection failed:', error.response?.data || error.message)
      console.error(`🌐 Attempted URL: ${this.client.defaults.baseURL}/products`)
      return false
    }
  }

  async getProducts(page: number = 1, perPage: number = 100): Promise<WooCommerceProduct[]> {
    // Fetch paginated products from Sanitube (used for bulk operations)
    try {
      const response: AxiosResponse<WooCommerceProduct[]> = await this.client.get(
        `/products?page=${page}&per_page=${perPage}&status=publish`
      )
      return response.data
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    }
  }

  async getAllAttributes(): Promise<WooCommerceAttribute[]> {
    // Discover all product attributes across Sanitube's catalog
    try {
      const response: AxiosResponse<WooCommerceAttribute[]> = await this.client.get('/products/attributes')
      return response.data
    } catch (error) {
      console.error('Error fetching attributes:', error)
      throw error
    }
  }


async getProductsByExistingSkus(existingSkus: string[]): Promise<WooCommerceProduct[]> {
  try {
    console.log(`🔍 Searching for products with SKU prefixes: ${existingSkus.join(', ')}`)
    
    const matchingProducts: WooCommerceProduct[] = []
    let page = 1
    let totalScanned = 0
    let hasMorePages = true
    
    // Continue scanning until we've checked all products in Sanitube's catalog
    while (hasMorePages) {
      console.log(`📄 Scanning page ${page}...`)
      
      const response = await this.client.get(`/products?page=${page}&per_page=100&status=publish`)
      const pageProducts = response.data
      
      totalScanned += pageProducts.length
      
      // Use prefix matching to find products starting with our SKU prefixes
      const pageMatches = pageProducts.filter((product: WooCommerceProduct) => {
        return product.sku && existingSkus.some(prefix => 
          product.sku.toLowerCase().startsWith(prefix.toLowerCase())
        )
      })
      
      matchingProducts.push(...pageMatches)
      
      if (pageMatches.length > 0) {
        console.log(`✅ Found ${pageMatches.length} products with matching prefixes on page ${page}`)
        // Show which specific SKUs were found
        pageMatches.forEach(product => {
          console.log(`   - ${product.sku}: ${product.name}`)
        })
      }
      
      // Check if we've reached the end of Sanitube's catalog
      // If we got less than 100 products, there are no more pages
      hasMorePages = pageProducts.length === 100
      page++
      
      // Progress update every 5 pages
      if (page % 5 === 0) {
        console.log(`📊 Progress: Scanned ${totalScanned} products so far, found ${matchingProducts.length} matches`)
      }
    }
    
    console.log(`\n📊 Complete Catalog Scan Results:`)
    console.log(`📦 Total Sanitube products scanned: ${totalScanned}`)
    console.log(`🔄 Products found with matching prefixes: ${matchingProducts.length}`)
    console.log(`📄 Pages scanned: ${page - 1}`)
    
    // Show all found SKUs for verification
    if (matchingProducts.length > 0) {
      console.log(`\n🎯 All matching SKUs found:`)
      matchingProducts.forEach(product => {
        console.log(`   ✅ ${product.sku}`)
      })
    }
    
    return matchingProducts
    
  } catch (error) {
    console.error('❌ Error in complete catalog scan:', error)
    throw error
  }
}





}

// Factory function to create API client with environment variables
export function createWooCommerceClient(): WooCommerceApiClient {
  // Load API credentials from environment variables
  const credentials: ApiCredentials = {
    baseUrl: process.env.SANITUBE_WC_BASE_URL!,
    consumerKey: process.env.SANITUBE_WC_CONSUMER_KEY!,
    consumerSecret: process.env.SANITUBE_WC_CONSUMER_SECRET!,
    version: process.env.SANITUBE_WC_API_VERSION || 'v3'
  }
  
  return new WooCommerceApiClient(credentials)
}
