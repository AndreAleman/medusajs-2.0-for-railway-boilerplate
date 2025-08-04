import { SchemaPluginOptions } from "sanity"
import productSchema from "./documents/product"
import { productTab } from "./documents/productTab"
import { youTubeType } from './youTubeType'
// 🚫 Do NOT import or add 'table' from the table plugin here

export const schema: SchemaPluginOptions = {
  types: [productSchema, productTab, youTubeType], // Only your own schemas here!
  templates: (templates) => templates.filter(
    (template) => template.schemaType !== "product"
  ),
}
