import 'dotenv/config'
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api'

export interface BatchFetchOptions {
  perPage?: number
  maxPages?: number
  delayMs?: number
  maxRetries?: number        // ✅ NEW: Maximum retry attempts
  retryDelayMs?: number      // ✅ NEW: Delay between retries
  status?: 'publish' | 'draft' | 'private' | 'any'
  type?: 'simple' | 'grouped' | 'external' | 'variable' | 'variation'
  parent?: number
}

export interface BatchFetchResult {
  products: any[]
  totalFetched: number
  pagesFetched: number
  errors: string[]
  retries: number            // ✅ NEW: Total retry attempts made
  duration: number
}

export class WooCommerceBatchFetcher {
  private wooCommerce: WooCommerceRestApi

  constructor() {
    this.wooCommerce = new WooCommerceRestApi({
      url: process.env.WOOCOMMERCE_URL!,
      consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY!,
      consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET!,
      version: 'wc/v3'
    })
  }

  /**
   * Fetch all products with pagination, rate limiting, and retry logic
   */
  async fetchAllProducts(options: BatchFetchOptions = {}): Promise<BatchFetchResult> {
    const {
      perPage = 90,
      maxPages = 999,
      delayMs = 1000,
      maxRetries = 3,         // ✅ NEW: Default 3 retry attempts
      retryDelayMs = 2000,    // ✅ NEW: 2 second delay between retries
      status = 'publish',
      type,
      parent
    } = options

    console.log('🔍 Starting batch fetch from WooCommerce...')
    console.log(`   • Per page: ${perPage}`)
    console.log(`   • Max pages: ${maxPages}`)
    console.log(`   • Delay: ${delayMs}ms`)
    console.log(`   • Max retries: ${maxRetries}`)
    console.log(`   • Status filter: ${status}`)
    if (type) console.log(`   • Type filter: ${type}`)
    if (parent) console.log(`   • Parent filter: ${parent}`)

    const startTime = Date.now()
    const allProducts: any[] = []
    const errors: string[] = []
    
    let page = 1
    let hasMore = true
    let pagesFetched = 0
    let totalRetries = 0

    while (hasMore && page <= maxPages) {
      const pageResult = await this.fetchPageWithRetry(
        page, 
        { perPage, status, type, parent },
        maxRetries,
        retryDelayMs
      )

      if (pageResult.success) {
        allProducts.push(...pageResult.products)
        pagesFetched++
        hasMore = pageResult.products.length === perPage
        
        console.log(`   ✅ Page ${page}: ${pageResult.products.length} products`)
      } else {
        errors.push(...pageResult.errors)
        console.log(`   ❌ Page ${page}: Failed after ${pageResult.retries} retries`)
        
        // Decision: Continue to next page or stop entirely?
        // For now, continue to next page to get partial results
        hasMore = pageResult.products.length === perPage
      }

      totalRetries += pageResult.retries
      page++

      // Rate limiting delay (except for last page)
      if (hasMore && delayMs > 0) {
        console.log(`   ⏸️  Waiting ${delayMs}ms...`)
        await this.delay(delayMs)
      }
    }

    const duration = Date.now() - startTime
    
    console.log(`\n📊 Batch fetch completed:`)
    console.log(`   • Total products: ${allProducts.length}`)
    console.log(`   • Pages fetched: ${pagesFetched}`)
    console.log(`   • Total retries: ${totalRetries}`)
    console.log(`   • Duration: ${Math.round(duration / 1000)}s`)
    console.log(`   • Errors: ${errors.length}`)

    return {
      products: allProducts,
      totalFetched: allProducts.length,
      pagesFetched,
      errors,
      retries: totalRetries,
      duration
    }
  }

  /**
   * Fetch a single page with retry logic
   */
  private async fetchPageWithRetry(
    page: number, 
    queryParams: any, 
    maxRetries: number, 
    retryDelayMs: number
  ): Promise<{ success: boolean, products: any[], errors: string[], retries: number }> {
    
    let attempt = 0
    const errors: string[] = []

    while (attempt <= maxRetries) {
      try {
        console.log(`📄 Fetching page ${page}${attempt > 0 ? ` (retry ${attempt}/${maxRetries})` : ''}...`)

        const response = await this.wooCommerce.get('products', {
          ...queryParams,
          page: page
        })

        return {
          success: true,
          products: response.data,
          errors: [],
          retries: attempt
        }

      } catch (error: any) {
        attempt++
        const errorMsg = this.parseError(error, page, attempt)
        console.error(`   ❌ ${errorMsg}`)
        errors.push(errorMsg)

        // If we have retries left, wait and try again
        if (attempt <= maxRetries) {
          const delay = this.calculateRetryDelay(attempt, retryDelayMs, error)
          console.log(`   🔄 Retrying in ${delay}ms...`)
          await this.delay(delay)
        }
      }
    }

    return {
      success: false,
      products: [],
      errors,
      retries: attempt - 1
    }
  }

  /**
   * Parse error messages for better debugging
   */
  private parseError(error: any, page: number, attempt: number): string {
    const status = error.response?.status
    const statusText = error.response?.statusText
    const message = error.response?.data?.message || error.message

    // Identify specific error types
    if (status === 429) {
      return `Page ${page} attempt ${attempt}: Rate limited (429) - ${message}`
    } else if (status >= 500) {
      return `Page ${page} attempt ${attempt}: Server error (${status}) - ${statusText}`
    } else if (status === 404) {
      return `Page ${page} attempt ${attempt}: Not found (404) - likely reached end of pages`
    } else if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return `Page ${page} attempt ${attempt}: Connection issue (${error.code})`
    } else {
      return `Page ${page} attempt ${attempt}: ${status || 'Unknown'} - ${message}`
    }
  }

  /**
   * Calculate retry delay with exponential backoff for certain errors
   */
  private calculateRetryDelay(attempt: number, baseDelay: number, error: any): number {
    const status = error.response?.status

    // Exponential backoff for rate limiting and server errors
    if (status === 429 || status >= 500) {
      return Math.min(baseDelay * Math.pow(2, attempt - 1), 30000) // Max 30 seconds
    }

    // Fixed delay for other errors
    return baseDelay
  }

  /**
   * Fetch specific product by ID with retry logic
   */
  async fetchProductById(productId: number, maxRetries: number = 3): Promise<any> {
    console.log(`🔍 Fetching product ID: ${productId}`)
    
    let attempt = 0
    
    while (attempt <= maxRetries) {
      try {
        const response = await this.wooCommerce.get(`products/${productId}`)
        console.log(`✅ Found: ${response.data.name} (${response.data.sku})`)
        return response.data
      } catch (error: any) {
        attempt++
        const errorMsg = this.parseError(error, productId, attempt)
        console.error(`❌ ${errorMsg}`)

        if (attempt <= maxRetries) {
          const delay = this.calculateRetryDelay(attempt, 2000, error)
          console.log(`   🔄 Retrying in ${delay}ms...`)
          await this.delay(delay)
        } else {
          throw new Error(`Failed to fetch product ${productId} after ${maxRetries} retries: ${error.message}`)
        }
      }
    }
  }

  /**
   * Fetch all variations for a parent product with retry logic
   */
  async fetchVariationsForParent(parentId: number): Promise<any[]> {
    console.log(`🔍 Fetching variations for parent ID: ${parentId}`)
    
    const result = await this.fetchAllProducts({
      parent: parentId,
      perPage: 100,
      status: 'any',
      maxRetries: 3,
      retryDelayMs: 2000
    })

    // Set parent_id field for transformer compatibility
    result.products.forEach(variation => {
      variation.parent_id = parentId
    })

    console.log(`✅ Found ${result.products.length} variations for parent ${parentId}`)
    
    if (result.errors.length > 0) {
      console.log(`⚠️  ${result.errors.length} errors occurred while fetching variations`)
    }
    
    return result.products
  }

  /**
   * Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
