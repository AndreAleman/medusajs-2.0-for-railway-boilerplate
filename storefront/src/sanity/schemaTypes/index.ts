import { SchemaPluginOptions } from "sanity"
import productSchema from "./documents/product"
import { productTab } from "./documents/productTab"
import { youtube } from "./youTubeType"


export const schema: SchemaPluginOptions = {
  types: [productSchema, productTab, youtube], // Only your own schemas here!
  templates: (templates) => templates.filter(
    (template) => template.schemaType !== "product"
  ),
}
