import React, { Suspense } from "react"

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
import dynamic from "next/dynamic"

const SanityTabs = dynamic(
  () => import("../components/sanity-tabs"),
  { ssr: false }
)

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
    content?: string
    tabs?: SanityTab[]
  }
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  sanity,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  console.log('in the /module/product', sanity)

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

      {/* Custom Sanity Content Section - Rich Content with Videos/Images/Tables */}
      {sanity?.tabs && sanity.tabs.length > 0 && (
        <div className="bg-ui-bg-subtle">
          <div className="content-container">
            <div className="max-w-6xl mx-auto py-12">
              <SanityTabs tabs={sanity.tabs} />
            </div>
          </div>
        </div>
      )}

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