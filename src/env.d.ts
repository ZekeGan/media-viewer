import type { MediaApi } from '../shared/model'
import type { DesktopApi } from '../shared/workspace'
import type { ExplorerApi } from '../shared/explorer'
declare global {
  interface Window {
    media: MediaApi
    desktop: DesktopApi
    explorer: ExplorerApi
  }
}
