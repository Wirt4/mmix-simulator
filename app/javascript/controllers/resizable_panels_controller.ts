import { Controller } from "@hotwired/stimulus"

const STORAGE_KEY = "ide-panel-state"

interface PanelState {
  editorHeight: number | null
  outputHeight: number | null
  registerWidth: number | null
  editorCollapsed: boolean
  outputCollapsed: boolean
  registerCollapsed: boolean
}

function loadState(): Partial<PanelState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveState(state: Partial<PanelState>): void {
  try {
    const current = loadState()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...state }))
  } catch {
    // localStorage unavailable
  }
}

export default class ResizablePanelsController extends Controller {
  static targets = [
    "editorPanel", "outputPanel", "registerPanel", "registerScroll",
    "editorToggle", "outputToggle", "registerToggle",
    "editorResize", "outputResize", "registerResize",
    "ideMain", "ideContent"
  ]

  declare editorPanelTarget: HTMLElement
  declare outputPanelTarget: HTMLElement
  declare registerPanelTarget: HTMLElement
  declare registerScrollTarget: HTMLElement
  declare editorToggleTarget: HTMLElement
  declare outputToggleTarget: HTMLElement
  declare registerToggleTarget: HTMLElement
  declare editorResizeTarget: HTMLElement
  declare outputResizeTarget: HTMLElement
  declare registerResizeTarget: HTMLElement
  declare ideMainTarget: HTMLElement
  declare ideContentTarget: HTMLElement

  private dragging: string | null = null
  private startY = 0
  private startX = 0
  private startSize = 0

  private boundMouseMove = this.onMouseMove.bind(this)
  private boundMouseUp = this.onMouseUp.bind(this)

  connect(): void {
    const state = loadState()

    if (state.editorCollapsed) this.setCollapsed("editor", true)
    if (state.outputCollapsed) this.setCollapsed("output", true)
    if (state.registerCollapsed) this.setCollapsed("register", true)

    if (state.editorHeight && !state.editorCollapsed) {
      this.editorPanelTarget.style.height = `${state.editorHeight}px`
    }
    if (state.outputHeight && !state.outputCollapsed) {
      this.outputPanelTarget.style.height = `${state.outputHeight}px`
    }
    if (state.registerWidth && !state.registerCollapsed) {
      this.applyRegisterWidth(state.registerWidth)
    }
  }

  toggleEditor(): void {
    const collapsed = !this.editorPanelTarget.classList.contains("panel-collapsed")
    this.setCollapsed("editor", collapsed)
    saveState({ editorCollapsed: collapsed })
  }

  toggleOutput(): void {
    const collapsed = !this.outputPanelTarget.classList.contains("panel-collapsed")
    this.setCollapsed("output", collapsed)
    saveState({ outputCollapsed: collapsed })
  }

  toggleRegister(): void {
    const collapsed = this.registerScrollTarget.style.display !== "none"
    this.setCollapsed("register", collapsed)
    saveState({ registerCollapsed: collapsed })
  }

  startEditorResize(event: MouseEvent): void {
    event.preventDefault()
    this.dragging = "editor"
    this.startY = event.clientY
    this.startSize = this.editorPanelTarget.getBoundingClientRect().height
    document.addEventListener("mousemove", this.boundMouseMove)
    document.addEventListener("mouseup", this.boundMouseUp)
    document.body.style.cursor = "ns-resize"
    document.body.style.userSelect = "none"
  }

  startOutputResize(event: MouseEvent): void {
    event.preventDefault()
    this.dragging = "output"
    this.startY = event.clientY
    this.startSize = this.outputPanelTarget.getBoundingClientRect().height
    document.addEventListener("mousemove", this.boundMouseMove)
    document.addEventListener("mouseup", this.boundMouseUp)
    document.body.style.cursor = "ns-resize"
    document.body.style.userSelect = "none"
  }

  startRegisterResize(event: MouseEvent): void {
    event.preventDefault()
    this.dragging = "register"
    this.startX = event.clientX
    this.startSize = this.registerPanelTarget.getBoundingClientRect().width
    document.addEventListener("mousemove", this.boundMouseMove)
    document.addEventListener("mouseup", this.boundMouseUp)
    document.body.style.cursor = "ew-resize"
    document.body.style.userSelect = "none"
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.dragging) return

    if (this.dragging === "editor") {
      const delta = event.clientY - this.startY
      const newHeight = Math.max(60, this.startSize + delta)
      this.editorPanelTarget.style.height = `${newHeight}px`
    } else if (this.dragging === "output") {
      const delta = event.clientY - this.startY
      const newHeight = Math.max(60, this.startSize + delta)
      this.outputPanelTarget.style.height = `${newHeight}px`
    } else if (this.dragging === "register") {
      // Dragging left edge of register panel: moving left = wider
      const delta = this.startX - event.clientX
      const newWidth = Math.max(150, Math.min(600, this.startSize + delta))
      this.applyRegisterWidth(newWidth)
    }
  }

  private onMouseUp(): void {
    if (this.dragging === "editor") {
      saveState({ editorHeight: this.editorPanelTarget.getBoundingClientRect().height })
    } else if (this.dragging === "output") {
      saveState({ outputHeight: this.outputPanelTarget.getBoundingClientRect().height })
    } else if (this.dragging === "register") {
      saveState({ registerWidth: this.registerPanelTarget.getBoundingClientRect().width })
    }

    this.dragging = null
    document.removeEventListener("mousemove", this.boundMouseMove)
    document.removeEventListener("mouseup", this.boundMouseUp)
    document.body.style.cursor = ""
    document.body.style.userSelect = ""
  }

  private setCollapsed(panel: string, collapsed: boolean): void {
    if (panel === "editor") {
      this.editorPanelTarget.classList.toggle("panel-collapsed", collapsed)
      this.editorToggleTarget.textContent = collapsed ? "+" : "-"
      this.editorResizeTarget.style.display = collapsed ? "none" : ""
    } else if (panel === "output") {
      this.outputPanelTarget.classList.toggle("panel-collapsed", collapsed)
      this.outputToggleTarget.textContent = collapsed ? "+" : "-"
      this.outputResizeTarget.style.display = collapsed ? "none" : ""
    } else if (panel === "register") {
      this.registerScrollTarget.style.display = collapsed ? "none" : ""
      this.registerToggleTarget.textContent = collapsed ? "+" : "-"
      this.registerResizeTarget.style.display = collapsed ? "none" : ""
      this.registerPanelTarget.classList.toggle("register-panel--collapsed", collapsed)
      if (collapsed) {
        this.ideMainTarget.style.marginRight = "0"
        this.ideContentTarget.closest(".ide-layout")
          ?.classList.add("register-collapsed")
      } else {
        this.ideMainTarget.style.marginRight = ""
        this.ideContentTarget.closest(".ide-layout")
          ?.classList.remove("register-collapsed")
      }
    }
  }

  private applyRegisterWidth(width: number): void {
    this.registerPanelTarget.style.width = `${width}px`
    this.ideMainTarget.style.marginRight = `${width + 16}px`
    // Update grid column
    const layout = this.ideContentTarget.closest(".ide-layout") as HTMLElement
    if (layout) {
      layout.style.gridTemplateColumns = `1fr ${width}px`
    }
  }
}
