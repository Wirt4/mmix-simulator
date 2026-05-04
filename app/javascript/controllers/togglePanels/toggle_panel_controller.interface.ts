export interface TogglePanelConfig {
  toggleButton: HTMLElement
  resizeHandle: HTMLElement
  onCollapse: () => void
  onExpand: () => void
}

export interface ITogglePanelController {
  collapse(): void
  expand(): void
  toggle(): void
  isCollapsed: boolean
}
