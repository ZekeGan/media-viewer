export {}

declare global {
  interface Window {
    electron: {
      ping: () => string
    }
  }
}
