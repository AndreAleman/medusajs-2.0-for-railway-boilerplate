// import axios, { AxiosInstance, AxiosResponse } from 'axios'
// import { WooCommerceProduct, WooCommerceAttribute, ApiCredentials } from './types'

// export class WooCommerceApiClient {
//   private client: AxiosInstance
  
//   constructor(credentials: ApiCredentials) {
//     this.client = axios.create({
//       baseURL: `${credentials.baseUrl}/wp-json/wc/${credentials.version}`,
//       timeout: parseInt(process.env.SANITUBE_WC_TIMEOUT || '30000'),
//       auth: {
//         username: credentials.consumerKey,
//         password: credentials.consumerSecret
//       }
//     })
    
//     // Add retry logic
//     this.client.interceptors.response.use(
//       (response) => response,
//       async (error) => {
//         if (error.response?.status === 429) {
//           // Rate limited - wait and retry
//           await new Promise(resolve => setTimeout(resolve, 2000))
//           return this.client.request(error.config)
//         }
//         return Promise.reject(error)
//       }
//     )
//   }

//   async testConnection(): Promise<boolean> {
//     try {
//       const response = await this.client.get('/products?per_page=1')
//       console.log('✅ WooCommerce API connection successful')
//       return true
//     } catch (error) {
//       console.error('❌ WooCommerce API connection failed:', error.response?.data || error.message)
//       return false
//     }
//   }

//   async getProducts(page: number = 1, perPage: number = 100): Promise<WooCommerceProduct[]> {
//     try {
//       const response: AxiosResponse<WooCommerceProduct[]> = await this.client.get(
//         `/products?page=${page}&per_page=${perPage}&status=publish`
//       )
//       return response.data
//     } catch (error) {
//       console.error('Error fetching products:', error)
//       throw error
//     }
//   }

//   async getAllAttributes(): Promise<WooCommerceAttribute[]> {
//     try {
//       const response: AxiosResponse<WooCommerceAttribute[]> = await this.client.get('/products/attributes')
//       return response.data
//     } catch (error) {
//       console.error('Error fetching attributes:', error)
//       throw error
//     }
//   }
// }

// // Factory function to create API client with environment variables
// export function createWooCommerceClient(): WooCommerceApiClient {
//   const credentials: ApiCredentials = {
//     baseUrl: process.env.SANITUBE_WC_BASE_URL!,
//     consumerKey: process.env.SANITUBE_WC_CONSUMER_KEY!,
//     consumerSecret: process.env.SANITUBE_WC_CONSUMER_SECRET!,
//     version: process.env.SANITUBE_WC_API_VERSION || 'v3'
//   }
  
//   return new WooCommerceApiClient(credentials)
// }
