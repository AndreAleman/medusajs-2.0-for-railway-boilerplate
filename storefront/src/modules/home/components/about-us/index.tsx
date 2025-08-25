"use client"

type Props = {
  title?: string
  description?: string
  readMoreUrl?: string
}

export default function AboutUs({ 
  title = "About Us",
  description = "Welcome to Sanitube™, the leading manufacturer of sanitary-grade stainless steel tube, valves, and fittings. Sanitube products are precision engineered to meet 3A specifications and to withstand the most challenging operating environments in the food, dairy, beverage, cosmetic, pharmaceutical, and industrial markets.",
  readMoreUrl = "/about"
}: Props) {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left Column - Content */}
          <div>
            {/* Main heading */}
            <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-8">
              {title}
            </h2>

            {/* Description */}
            <p className="text-lg text-gray-600 mb-12 leading-relaxed">
              {description}
            </p>

            {/* Read more button */}
            <a 
              href={readMoreUrl}
              className="inline-flex items-center px-8 py-4 bg-emerald-800 text-white font-medium hover:bg-emerald-900 transition-colors duration-200"
            >
              Read more
              <svg 
                className="ml-3 w-5 h-5" 
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

          {/* Right Column - Overlapping Photos */}
          <div className="relative">
            {/* Large background photo */}
            <div className="w-full aspect-[4/3] bg-gray-100 overflow-hidden">
              <img
                src="/images/about-main-large.jpg"
                alt="Industrial stainless steel equipment"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='450' viewBox='0 0 600 450'%3E%3Crect width='600' height='450' fill='%23f3f4f6'/%3E%3Ctext x='300' y='225' text-anchor='middle' dy='.3em' font-family='Arial' font-size='18' fill='%236b7280'%3EMain Industrial Image%3C/text%3E%3C/svg%3E";
                }}
              />
            </div>

            {/* Small overlapping photo - bottom left corner */}
            <div className="absolute bottom-0 left-0 w-1/2 aspect-square bg-white p-2">
              <div className="w-full h-full bg-gray-100 overflow-hidden">
                <img
                  src="/images/about-small-overlay.jpg"
                  alt="Stainless steel fittings detail"
                  className="w-full h-full object-cover"
                  onError={(e ) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f3f4f6'/%3E%3Ctext x='150' y='150' text-anchor='middle' dy='.3em' font-family='Arial' font-size='14' fill='%236b7280'%3EDetail Image%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
   )
}
