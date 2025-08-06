// src/sanity/lib/image.ts
import imageUrlBuilder from '@sanity/image-url'
import { client } from './client' // Adjust if your client is defined elsewhere

// Make sure client is the "sanity" JS client configured with your projectId/dataset
const builder = imageUrlBuilder(client)

export function urlFor(source: any) {
  return builder.image(source)
}


