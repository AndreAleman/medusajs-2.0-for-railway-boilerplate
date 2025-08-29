import { getProductsListWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

const PRODUCT_LIMIT = 12

type PaginatedProductsParams = {
  limit: number
  offset: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  order?: string
  q?: string
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
  material,
  size,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
  material?: string
  size?: string
}) {
  const offset = (page - 1) * PRODUCT_LIMIT
  const queryParams: PaginatedProductsParams = {
    limit: PRODUCT_LIMIT,
    offset,
  }

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

  // Combine material and size into a single search query if needed
  if (material && size) {
    queryParams["q"] = `${material} ${size}`
  } else if (material) {
    queryParams["q"] = material
  } else if (size) {
    queryParams["q"] = size
  }

  const region = await getRegion(countryCode)
  if (!region) {
    return null
  }

  const {
    response: { products, count },
  } = await getProductsListWithSort({
    page,
    queryParams,
    sortBy,
    countryCode,
  })

  const totalPages = Math.ceil(count / PRODUCT_LIMIT)

  return (
    <>
      <ul
        className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8"
        data-testid="products-list"
      >
        {products.map((p) => (
          <li key={p.id}>
            <ProductPreview product={p} region={region} />
          </li>
        ))}
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