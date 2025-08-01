import type { 
  SubscriberArgs, 
  SubscriberConfig,
} from "@medusajs/medusa"
import { 
  sanitySyncProductsWorkflow,
} from "../workflows/sanity-sync-products"

export default async function upsertSanityProduct({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  // Debug statement: See when the subscriber runs and with which product ID
  console.log(
    `[Sanity Sync Subscriber] Triggered for product id:`,
    data.id
  );

  await sanitySyncProductsWorkflow(container).run({
    input: {
      product_ids: [data.id],
    },
  });
}


export const config: SubscriberConfig = {
  event: ["product.created", "product.updated"],
}