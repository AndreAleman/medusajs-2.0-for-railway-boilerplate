import { Metadata } from "next"

import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import { getBaseURL } from "@lib/util/env"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: "Stainless Steel Tubing, Fittings, and Valves | Cowbird Depot",
  description: "Your premium source for stainless steel tubing, fittings, and valves",
  openGraph: {
    title: "Stainless Steel Tubing, Fittings, and Valves | Cowbird Depot",
    description: "Your premium source for stainless steel tubing, fittings, and valves",
    url: getBaseURL(),
    siteName: "Cowbird Depot",
    images: [
      {
        url: "images/og-image.jpeg", // Place your image in the public folder
        width: 1200,
        height: 630,
        alt: "Cowbird Depot - Stainless Steel Products",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stainless Steel Tubing, Fittings, and Valves | Cowbird Depot",
    description: "Your premium source for stainless steel tubing, fittings, and valves",
    images: ["/og-image.jpg"],
  },
}

export default async function PageLayout(props: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      {props.children}
      <Footer />
    </>
  )
}
