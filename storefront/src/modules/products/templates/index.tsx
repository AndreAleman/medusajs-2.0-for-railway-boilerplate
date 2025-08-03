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

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
   sanity?: {
    content: string
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
    <>
<div className="content-container flex flex-col small:flex-row small:items-start py-6 relative" id="pdp-root-container">
  {/* ...left image column... */}
  <div className="block w-full small:w-2/3 relative py-8" id="pdp-image-section">
    <ImageGallery images={product?.images || []} />
  </div>

  {/* Divider: Make sure this is not a child of the left or right column! */}
  <div
    className="hidden small:block w-px bg-gray-200 mx-6 self-stretch"
    id="pdp-vertical-divider"
  />

  {/* ...right info column... */}
  <div className="flex flex-col small:sticky small:top-48 small:py-0 small:w-1/3 w-full" id="pdp-info-section">
        <ProductOnboardingCta />

        {/* Info + Actions */}
        <div className="flex flex-col py-8 gap-y-6" id="pdp-details-section">
          <ProductInfo product={product} sanity={sanity} />
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

        {/* Tabs below actions, with y-gap-2 to actions */}
        <div className="mt-2"> {/* gap-y-2 created by margin-top on this container */}
          <ProductTabs product={product} />
        </div>
      </div>

    </div>

    </>
  )

}

export default ProductTemplate
