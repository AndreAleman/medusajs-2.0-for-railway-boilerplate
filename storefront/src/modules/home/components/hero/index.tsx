// src/modules/home/components/hero-stagger.tsx
import Image from "next/image"

export default function Hero() {
  return (
    <section className="bg-white pt-0 pb-8 md:pb-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* 60 / 40 on lg, fixed px on xl */}
        <div className="grid items-center gap-12 
                        lg:grid-cols-[60%_40%] 
                        xl:grid-cols-[593px_478px] xl:gap-[94px]">
          {/* ───────────── text column */}
          <div className="space-y-6 xl:max-w-[593px]">
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight text-gray-900">
              High-Quality<br />Sanitary Parts for<br />Every Need
            </h1>

            <p className="text-lg text-gray-600 max-w-xl">
              From large-scale food production to small-batch brewing, our
              stainless-steel fittings deliver reliability, hygiene, and
              performance you can trust.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-4">
              {/* filled primary */}
              <a
                href="/products"
                className="inline-flex items-center justify-center rounded-md bg-[--brand-green]
                           px-6 py-3 text-blue font-semibold hover:opacity-90
                           focus-visible:outline focus-visible:outline-2
                           focus-visible:outline-offset-2 focus-visible:outline-[--brand-green]">
                Browse&nbsp;Products
              </a>

              {/* outlined secondary */}
              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-md border border-[--brand-green]
                           bg-white px-6 py-3 text-[--brand-green] font-semibold hover:bg-gray-50
                           focus-visible:outline focus-visible:outline-2
                           focus-visible:outline-offset-2 focus-visible:outline-[--brand-green]">
                Contact&nbsp;Us
              </a>
            </div>
          </div>

          {/* ───────────── photo mosaic */}
          <div className="grid grid-cols-2 gap-4 lg:order-last xl:w-[478px]">
            {/* left column – shifted up */}
            <div className="-translate-y-8 md:-translate-y-4 sm:translate-y-0 transition-transform">
              {[1, 2, 3].map((n) => (
                <Image
                  key={n}
                  src={`/images/home_page${n}.svg`}   // images in /public/images
                  alt=""
                  width={231}
                  height={251}
                  className="h-56 w-full object-cover rounded-md shadow
                             [mask-image:linear-gradient(180deg,transparent_0%,black_35%,black_65%,transparent_100%)]"
                  priority={n === 1}
                />
              ))}
            </div>

            {/* right column – shifted down */}
            <div className="translate-y-16 md:translate-y-8 sm:translate-y-0 transition-transform">
              {[4, 5, 6].map((n) => (
                <Image
                  key={n}
                  src={`/images/home_page${n}.svg`}
                  alt=""
                  width={231}
                  height={251}
                  className="h-56 w-full object-cover rounded-md shadow
                             [mask-image:linear-gradient(180deg,transparent_0%,black_35%,black_65%,transparent_100%)]"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
