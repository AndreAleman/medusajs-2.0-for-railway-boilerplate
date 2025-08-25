import { HttpTypes } from "@medusajs/types"
import ProductGrid from "./product-grid"

type ExploreRangeProps = {
  collections: HttpTypes.StoreCollection[]
  region: HttpTypes.StoreRegion
}

export default function ExploreRange({
  collections,
  region,
}: ExploreRangeProps) {
  // Get featured products from the first collection or create sample data
  const featuredProducts = collections[0]?.products?.slice(0, 4) || []

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-12">
          <div className="mb-6 lg:mb-0">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Explore Our Range
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl">
              Browse our curated selection and choose the perfect fit for your project.
            </p>
          </div>
          
          <div className="flex-shrink-0">
            <button className="inline-flex items-center px-6 py-3 bg-emerald-800 text-white font-medium rounded-lg hover:bg-emerald-900 transition-colors duration-200">
              View All Product
              <svg 
                className="ml-2 w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M17 8l4 4m0 0l-4 4m4-4H3" 
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <ProductGrid products={featuredProducts} region={region} />
        
        {/* Navigation Dots */}
        <div className="flex items-center justify-center mt-8 space-x-2">
          <div className="w-8 h-1 bg-emerald-800 rounded-full"></div>
          <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
        </div>
        
        {/* Navigation Arrows */}
        <div className="flex justify-end mt-4 space-x-2">
          <button className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
            </svg>
          </button>
          <button className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}
