import { Metadata } from "next"
import { listCategories } from "@lib/data/categories"
import { StoreProductCategory } from "@medusajs/types"

type Props = {
  params: {
    countryCode: string
  }
}

export const metadata: Metadata = {
  title: "Product Categories - Sanitube",
  description: "Browse our complete range of sanitary stainless steel products including tubes, valves, and fittings.",
}

export default async function CategoriesPage({ params }: Props) {
  const categories = await listCategories()

  const breadcrumbs = [
    { label: "Home", href: `/${params.countryCode}` }
  ]

  return (
    <>
      {/* Categories Hero Section */}
      <section className="py-16 px-4 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumbs */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-600">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center">
                  <a 
                    href={crumb.href}
                    className="hover:text-emerald-800 transition-colors"
                  >
                    {crumb.label}
                  </a>
                </li>
              ))}
              <li className="flex items-center">
                <svg className="w-4 h-4 mx-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-gray-900 font-medium">Categories</span>
              </li>
            </ol>
          </nav>

          {/* Page Title and Description */}
          <div className="max-w-4xl">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Product Categories
            </h1>
            
            <p className="text-lg text-gray-600 leading-relaxed mb-4">
              Explore our complete range of sanitary stainless steel products. From precision-engineered tubing to industrial valves and fittings, find the perfect solution for your application.
            </p>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories?.map((category: StoreProductCategory) => (
              <div key={category.id} className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                {/* Category Image Placeholder */}
                <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-500 text-lg font-medium">{category.name}</span>
                </div>
                
                {/* Category Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {category.name}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {category.description || `Browse our selection of ${category.name.toLowerCase()} products for sanitary and industrial applications.`}
                  </p>
                  
                  <a 
                    href={`/${params.countryCode}/categories/${category.handle}`}
                    className="inline-flex items-center text-emerald-800 font-medium hover:text-emerald-900 transition-colors"
                  >
                    View Products
                    <svg 
                      className="ml-2 w-4 h-4" 
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
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
