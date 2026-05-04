import type { TogglePanelConfig, ITogglePanelController } from "./toggle_panel_controller.interface"

export class TogglePanel implements ITogglePanelController {
  private toggleButton: HTMLElement
  private resizeHandle: HTMLElement
  private onCollapseCallback: () => void
  private onExpandCallback: () => void
  private _collapsed = false

  constructor(config: TogglePanelConfig) {
    this.toggleButton = config.toggleButton
    this.resizeHandle = config.resizeHandle
    this.onCollapseCallback = config.onCollapse
    this.onExpandCallback = config.onExpand
  }

  get isCollapsed(): boolean {
    return this._collapsed
  }

  toggle(): void {
    if (this._collapsed) {
      this.expand()
    } else {
      this.collapse()
    }
  }

  collapse(): void {
    this._collapsed = true
    this.toggleButton.textContent = "+"
    this.resizeHandle.style.display = "none"
    this.onCollapseCallback()
  }

  expand(): void {
    this._collapsed = false
    this.toggleButton.textContent = "-"
    this.resizeHandle.style.display = ""
    this.onExpandCallback()
  }
}
