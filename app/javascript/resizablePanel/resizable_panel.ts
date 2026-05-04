import type { ResizablePanelConfig, IResizablePanel } from "./resizable_panel.interface"

export class ResizablePanel implements IResizablePanel {
  private panel: HTMLElement
  private direction: "vertical" | "horizontal"
  private min: number
  private max: number
  private invertDelta: boolean
  private onResize: (size: number) => void
  private onResizeEnd: (size: number) => void

  private startPos = 0
  private startSize = 0
  private boundMouseMove = this.handleMouseMove.bind(this)
  private boundMouseUp = this.handleMouseUp.bind(this)

  constructor(config: ResizablePanelConfig) {
    this.panel = config.panel
    this.direction = config.direction
    this.min = config.min
    this.max = config.max ?? Infinity
    this.invertDelta = config.invertDelta ?? false
    this.onResize = config.onResize ?? (() => { /* noop */ })
    this.onResizeEnd = config.onResizeEnd ?? (() => { /* noop */ })
  }

  startResize(event: MouseEvent): void {
    event.preventDefault()
    const rect = this.panel.getBoundingClientRect()

    if (this.direction === "vertical") {
      this.startPos = event.clientY
      this.startSize = rect.height
      document.body.style.cursor = "ns-resize"
    } else {
      this.startPos = event.clientX
      this.startSize = rect.width
      document.body.style.cursor = "ew-resize"
    }

    document.body.style.userSelect = "none"
    document.addEventListener("mousemove", this.boundMouseMove)
    document.addEventListener("mouseup", this.boundMouseUp)
  }

  destroy(): void {
    document.removeEventListener("mousemove", this.boundMouseMove)
    document.removeEventListener("mouseup", this.boundMouseUp)
  }

  private handleMouseMove(event: MouseEvent): void {
    const currentPos = this.direction === "vertical" ? event.clientY : event.clientX
    const rawDelta = currentPos - this.startPos
    const delta = this.invertDelta ? -rawDelta : rawDelta
    const newSize = Math.max(this.min, Math.min(this.max, this.startSize + delta))

    if (this.direction === "vertical") {
      this.panel.style.height = `${String(newSize)}px`
    } else {
      this.panel.style.width = `${String(newSize)}px`
    }

    this.onResize(newSize)
  }

  private handleMouseUp(): void {
    document.removeEventListener("mousemove", this.boundMouseMove)
    document.removeEventListener("mouseup", this.boundMouseUp)
    document.body.style.cursor = ""
    document.body.style.userSelect = ""

    const rect = this.panel.getBoundingClientRect()
    const size = this.direction === "vertical" ? rect.height : rect.width
    this.onResizeEnd(size)
  }
}
