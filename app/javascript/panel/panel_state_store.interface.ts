export interface PanelState {
  size: number | null
  collapsed: boolean
}

export interface IPanelStateStore {
  load(): PanelState
  save(update: Partial<PanelState>): void
}
