// src/modules/products/templates/index.tsx
import { PortableText } from "@portabletext/react"

import React, { Suspense } from "react"
// import { htmlToBlockContent } from "@/lib/htmlToBlockContent" // COMMENTED OUT
import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import ProductActionsWrapper from "./product-actions-wrapper"
import { HttpTypes } from "@medusajs/types"
import SanityTabs from "../components/sanity-tabs"




type SanityTab = {
  _key: string
  title: string
  content: any[]
}

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  sanity?: {
    description?: any[]  // ← ADD THIS (PortableText blocks)
    content?: string     // ← Keep this for other content
    tabs?: SanityTab[]
  }
}





const ProductTemplate: React.FC<ProductTemplateProps> = async ({
  product,
  region,
  countryCode,
  sanity,
}) => {
      console.log('sanity.description:', sanity)
  if (!product || !product.id) {
    return notFound()
  }

  console.log('in the /module/product', sanity)

  // Get HTML description from metadata (following your existing pattern)
  const htmlDescription = 
    (product.metadata && 
     typeof product.metadata === 'object' && 
     'woocommerce_description' in product.metadata &&
     typeof product.metadata.woocommerce_description === 'string') 
      ? product.metadata.woocommerce_description 
      : (typeof product.description === 'string' ? product.description : '')

  // Convert HTML to PortableText using Sanity's approach - COMMENTED OUT
  // const descriptionBlocks = htmlDescription ? await htmlToBlockContent(htmlDescription) : []
  
  // Use empty array for now
  const descriptionBlocks: any[] = []

  // Create tabs array
  const allTabs: SanityTab[] = []
  
  // Add converted HTML description as a tab
  if (descriptionBlocks.length > 0) {
    allTabs.push({
      _key: 'description',
      title: 'Description',
      content: descriptionBlocks
    })
  }

  // Add any existing Sanity tabs
  if (sanity?.tabs) {
    allTabs.push(...sanity.tabs)
  }

  return (
    <div className="bg-white">
      {/* Main Product Section */}
      <div className="content-container">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-start gap-8 lg:gap-8 py-8 lg:py-12">
            
            {/* Left Column - Image Gallery with Hover Zoom */}
            <div className="w-full lg:w-1/2">
              <div className="sticky top-8">
                <ImageGallery images={product?.images || []} />
              </div>
            </div>

            {/* Right Column - Product Details with Improved Spacing */}
            <div className="w-full lg:w-1/2">
              <div className="lg:sticky lg:top-8 space-y-8 lg:pl-4 lg:pr-8 xl:pr-12">
                
                {/* Onboarding CTA */}
                <ProductOnboardingCta />

                {/* Product Info */}
                <div className="space-y-6">
                  <ProductInfo
                    product={product}
                    sanity={{ content: sanity?.content ?? "" }}
                  />
                </div>

                {/* Enhanced Product Actions with Quantity Selector */}
                <div className="space-y-6">
                  <Suspense
                    fallback={
                      <ProductActions
                        disabled={true}
                        product={product}
                        region={region}
                      />
                    }
                  >
                    <ProductActionsWrapper id={product.id} region={region} />
                  </Suspense>
                </div>

                {/* Standard Product Tabs */}
                <div className="border-t border-ui-border-base pt-8">
                  <ProductTabs product={product} />
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

{/* TEST SECTION: Render Sanity Data from Studio */}
{/* TEST SECTION: Render All Sanity Data */}
<div className="bg-gray-50">
  <div className="content-container">
    <div className="max-w-6xl mx-auto py-12">
      
      {/* Render Description PortableText */}
      {sanity?.description && Array.isArray(sanity.description) && (
        <div className="mb-8 p-6 bg-white rounded border">
          <h2 className="text-xl font-bold mb-4">Product Description</h2>
          <div className="prose max-w-none">
            <PortableText 
              value={sanity.description} 
              components={{
                types: {
                  productTable: ({ value }: any) => (
                    <div className="my-6 overflow-auto">
                      <table className="min-w-full border-collapse border border-gray-300 rounded-lg">
                        <tbody>
                          {value.rows?.map((row: any, i: number) => (
                            <tr key={i} className={i === 0 ? "bg-gray-50" : ""}>
                              {row.cells?.map((cell: any, j: number) => (
                                <td
                                  key={j}
                                  colSpan={cell.colspan || 1}
                                  rowSpan={cell.rowspan || 1}
                                  className="border border-gray-300 px-4 py-2 text-sm min-h-[40px]"
                                >
                                  {cell.text || '\u00A0'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ),
                },
              }} 
            />
          </div>
        </div>
      )}

      {/* Render Tabs */}
      {sanity?.tabs && Array.isArray(sanity.tabs) && sanity.tabs.length > 0 && (
        <div className="mb-8 p-6 bg-white rounded border">
          <h2 className="text-xl font-bold mb-4">Product Tabs</h2>
          <SanityTabs tabs={sanity.tabs} />
        </div>
      )}

      {/* Debug Section */}
      <div className="p-4 bg-white rounded border">
        <h3 className="font-semibold mb-2">Debug: Data Check</h3>
        <p>Description blocks: {sanity?.description?.length || 0}</p>
        <p>Tabs count: {sanity?.tabs?.length || 0}</p>
      </div>
    </div>
  </div>
</div>



      {/* Sanity Tabs Section - Shows converted HTML + any Sanity tabs 
      {allTabs.length > 0 && (
        <div className="bg-ui-bg-subtle">
          <div className="content-container">
            <div className="max-w-6xl mx-auto py-12">
              <SanityTabs tabs={allTabs} />
            </div>
          </div>
        </div>
      )}*/}

      {/* Related Products Section - Category-Based Recommendations */}
      <div className="content-container">
        <div className="max-w-6xl mx-auto py-12">
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-ui-fg-base mb-2">
                Related Products
              </h2>
              <p className="text-ui-fg-subtle">
                You might also like these products
              </p>
            </div>
            
            <Suspense fallback={<SkeletonRelatedProducts />}>
              <RelatedProducts product={product} countryCode={countryCode} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTemplate
