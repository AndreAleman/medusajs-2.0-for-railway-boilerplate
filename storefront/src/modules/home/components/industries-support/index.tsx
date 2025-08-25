"use client"

export default function IndustriesSupport() {
  return (
    <section className="py-20 px-4 bg-gray-100">
      <div className="max-w-6xl mx-auto text-center">
        {/* Top decorative line */}
        <div className="flex justify-center mb-12">
          <div className="w-16 h-1 bg-pink-400"></div>
        </div>

        {/* Main heading */}
        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-12">
          Industries We Support
        </h2>

        {/* Testimonial text */}
        <p className="text-2xl lg:text-3xl font-medium text-emerald-800 leading-relaxed mb-12 max-w-5xl mx-auto">
          Food processors like Babybel trust our sanitary fittings for smooth, 
          efficient production and minimal downtime.
        </p>

        {/* Babybel logo */}
        <div className="flex justify-center mb-12">
          <div className="w-24 h-24 flex items-center justify-center">
            <img
              src="/images/babybel-logo.png"
              alt="Babybel Logo"
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                // Fallback to a placeholder if logo fails to load
                const target = e.target as HTMLImageElement;
                target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Ccircle cx='48' cy='48' r='40' fill='%23dc2626'/%3E%3Ctext x='48' y='52' text-anchor='middle' dy='.3em' font-family='Arial' font-size='12' font-weight='bold' fill='white'%3EBabybel%3C/text%3E%3C/svg%3E";
              }}
            />
          </div>
        </div>

        {/* Bottom decorative line */}
        <div className="flex justify-center">
          <div className="w-16 h-1 bg-pink-400"></div>
        </div>
      </div>
    </section>
   )
}
