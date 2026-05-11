export {}

declare global {
  interface Window {
    api: {
      getGameList: () => Promise<any>
    }
  }
}
