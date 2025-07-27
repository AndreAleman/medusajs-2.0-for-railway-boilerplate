import {
  Logger,
} from "@medusajs/framework/types"
import {
  SanityClient,
} from "@sanity/client"

// other imports...

const SyncDocumentTypes = {
  PRODUCT: "product",
} as const

type SyncDocumentTypes =
  (typeof SyncDocumentTypes)[keyof typeof SyncDocumentTypes];

type ModuleOptions = {
  api_token: string;
  project_id: string;
  api_version: string;
  dataset: "production" | "development";
  type_map?: Record<SyncDocumentTypes, string>;
  studio_url?: string;
}


class SanityModuleService {
  private client: SanityClient
  private studioUrl?: string
  private logger: Logger

  // TODO
}

export default SanityModuleService