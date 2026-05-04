export interface ResizablePanelConfig {
  panel: HTMLElement
  direction: "vertical" | "horizontal"
  min: number
  max?: number
  invertDelta?: boolean
  onResize?: (size: number) => void
  onResizeEnd?: (size: number) => void
}

export interface IResizablePanel {
  startResize(event: MouseEvent): void
  destroy(): void
}
