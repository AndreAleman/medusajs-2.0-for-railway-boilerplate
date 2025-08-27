import { getProductsListWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { useMemo } from "react"

const PRODUCT_LIMIT = 12

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  order?: string
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
  categories,              // Keep for client-side filtering
  material,               // Keep for client-side filtering
  size,                   // Keep for client-side filtering
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
  categories?: string
  material?: string
  size?: string
}) {
  const queryParams: PaginatedProductsParams = {
    limit: 100, // Fetch more products for client-side filtering
  }

  // Only use MedusaJS supported parameters
  if (collectionId) {
    queryParams["collection_id"] = [collectionId]
  }

  if (categoryId) {
    queryParams["category_id"] = [categoryId]
  }

  if (productsIds) {
    queryParams["id"] = productsIds
  }

  if (sortBy === "created_at") {
    queryParams["order"] = "created_at"
  }

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

 let {
  response: { products: allProducts, count },
} = await getProductsListWithSort({
  page: 1,
  queryParams,
  sortBy,
  countryCode,
} )

// ADD THIS DEBUG CODE HERE:
console.log('=== DEBUG: Product Data ===')
console.log('First product:', allProducts[0])
console.log('Product categories:', allProducts[0]?.categories)
console.log('Filter parameters:', { categories, material, size })
console.log('Total products:', allProducts.length)




  
  // Client-side filtering based on URL parameters
  const filteredProducts = allProducts.filter((product) => {
    // Filter by categories
    if (categories) {
      // Check if product title or handle contains the category
      const productCategory = product.title?.toLowerCase() || ''
      const productHandle = product.handle?.toLowerCase() || ''
      if (!productCategory.includes(categories.toLowerCase()) && 
          !productHandle.includes(categories.toLowerCase())) {
        return false
      }
    }

    // Filter by material (check in title or description)
    if (material) {
      const productTitle = product.title?.toLowerCase() || ''
      const productDescription = product.description?.toLowerCase() || ''
      if (!productTitle.includes(material.toLowerCase()) && 
          !productDescription.includes(material.toLowerCase())) {
        return false
      }
    }

    // Filter by size (check in title or description)
    if (size) {
      const productTitle = product.title?.toLowerCase() || ''
      const productDescription = product.description?.toLowerCase() || ''
      if (!productTitle.includes(size) && !productDescription.includes(size)) {
        return false
      }
    }

    return true
  })

  // Paginate the filtered results
  const startIndex = (page - 1) * PRODUCT_LIMIT
  const endIndex = startIndex + PRODUCT_LIMIT
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)
  const totalPages = Math.ceil(filteredProducts.length / PRODUCT_LIMIT)

  return (
    <>
      <ul
        className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8"
        data-testid="products-list"
      >
        {paginatedProducts.map((p) => {
          return (
            <li key={p.id}>
              <ProductPreview product={p} region={region} />
            </li>
          )
        })}
      </ul>
      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  )
}
