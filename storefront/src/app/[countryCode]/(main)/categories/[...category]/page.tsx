import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCategoryByHandle, listCategories } from "@lib/data/categories"
import { listRegions } from "@lib/data/regions"
import { StoreProductCategory, StoreRegion } from "@medusajs/types"
import CategoryTemplate from "@modules/categories/templates"
import CategoryHero from "@modules/categories/category-hero"  // Fixed import path
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

type Props = {
  params: { category: string[]; countryCode: string }
  searchParams: {
    sortBy?: SortOptions
    page?: string
  }
}

export async function generateStaticParams() {
  const product_categories = await listCategories()

  if (!product_categories) {
    return []
  }

  const countryCodes = await listRegions().then((regions: StoreRegion[]) =>
    regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
  )

  const categoryHandles = product_categories.map(
    (category: any) => category.handle
  )

  const staticParams = countryCodes
    ?.map((countryCode: string | undefined) =>
      categoryHandles.map((handle: any) => ({
        countryCode,
        category: [handle],
      }))
    )
    .flat()

  return staticParams
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { product_categories } = await getCategoryByHandle(
      params.category
    )

    const title = product_categories
      .map((category: StoreProductCategory) => category.name)
      .join(" | ")

    const description =
      product_categories[product_categories.length - 1].description ??
      `${title} category.`

    return {
      title: `${title} | Medusa Store`,
      description,
      alternates: {
        canonical: `${params.category.join("/")}`,
      },
    }
  } catch (error) {
    notFound()
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { sortBy, page } = searchParams

  const { product_categories } = await getCategoryByHandle(
    params.category
  )

  if (!product_categories) {
    notFound()
  }

  // Get the main category (last one in the hierarchy)
  const mainCategory = product_categories[product_categories.length - 1]
  
  // Build breadcrumbs from category hierarchy
  const breadcrumbs = [
    { label: "Home", href: `/${params.countryCode}` },
    { label: "Categories", href: `/${params.countryCode}/categories` }
  ]

  // Add parent categories to breadcrumbs
  product_categories.slice(0, -1).forEach((category, index) => {
    const categoryPath = params.category.slice(0, index + 1).join('/')
    breadcrumbs.push({
      label: category.name,
      href: `/${params.countryCode}/categories/${categoryPath}`
    })
  })

  return (
    <>
      {/* New Category Hero Section */}
      <CategoryHero 
        categoryName={mainCategory.name}
        description={mainCategory.description || `Browse our selection of ${mainCategory.name.toLowerCase()} products for sanitary and industrial applications.`}
        breadcrumbs={breadcrumbs}
      />

      {/* Existing Category Template */}
      <CategoryTemplate
        categories={product_categories}
        sortBy={sortBy}
        page={page}
        countryCode={params.countryCode}
      />
    </>
  )
}
