import type { PanelState, IPanelStateStore } from "./panel_state_store.interface"

const KEY_PREFIX = "ide-panel"

const DEFAULT_STATE: PanelState = { size: null, collapsed: false }

export class PanelStateStore implements IPanelStateStore {
  private key: string

  constructor(panelName: string) {
    this.key = `${KEY_PREFIX}-${panelName}`
  }

  load(): PanelState {
    try {
      const raw = localStorage.getItem(this.key)
      return raw ? { ...DEFAULT_STATE, ...(JSON.parse(raw) as Partial<PanelState>) } : { ...DEFAULT_STATE }
    } catch {
      return { ...DEFAULT_STATE }
    }
  }

  save(update: Partial<PanelState>): void {
    try {
      const current = this.load()
      localStorage.setItem(this.key, JSON.stringify({ ...current, ...update }))
    } catch {
      // localStorage unavailable
    }
  }
}
