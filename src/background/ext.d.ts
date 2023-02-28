declare namespace browser {
  namespace storage {
    function get(
      keys: string | string[] | null,
      callback?: (items: Record<string, any>) => void
    ): void

    function set(callback?: (items: Record<string, any>) => void): void
  }
  namespace browserAction {
    function setBadgeText(details: { text: string; tabId?: number }): void
  }
}
