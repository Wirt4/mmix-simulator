import { Controller } from "@hotwired/stimulus"
import { PanelStateStore } from "../panel/panel_state_store"
import { ResizablePanel } from "../resizablePanel/resizable_panel"
import { TogglePanel } from "./togglePanels/toggle_panel"

export default class ResizablePanelsController extends Controller {
  static targets = [
    "editorPanel", "registerPanel", "registerScroll",
    "editorToggle", "outputToggle", "registerToggle",
    "editorResize", "outputResize", "registerVerticalResize",
    "ideMain", "ideContent"
  ]

  declare editorPanelTarget: HTMLElement
  declare registerPanelTarget: HTMLElement
  declare registerScrollTarget: HTMLElement
  declare editorToggleTarget: HTMLElement
  declare outputToggleTarget: HTMLElement
  declare registerToggleTarget: HTMLElement
  declare editorResizeTarget: HTMLElement
  declare outputResizeTarget: HTMLElement
  declare registerVerticalResizeTarget: HTMLElement
  declare ideMainTarget: HTMLElement
  declare ideContentTarget: HTMLElement

  private editorState!: PanelStateStore
  private registerState!: PanelStateStore
  private registerHeightState!: PanelStateStore

  private editorResizer!: ResizablePanel
  private registerVerticalResizer!: ResizablePanel

  private editorToggler!: TogglePanel
  private registerToggler!: TogglePanel

  connect(): void {
    this.editorState = new PanelStateStore("editor")
    this.registerState = new PanelStateStore("register")
    this.registerHeightState = new PanelStateStore("register-height")

    this.editorResizer = new ResizablePanel({
      panel: this.editorPanelTarget,
      direction: "vertical",
      min: 60,
      onResizeEnd: (size) => { this.editorState.save({ size }) }
    })

    this.registerVerticalResizer = new ResizablePanel({
      panel: this.registerPanelTarget,
      direction: "vertical",
      min: 100,
      onResizeEnd: (size) => { this.registerHeightState.save({ size }) }
    })

    this.editorToggler = new TogglePanel({
      toggleButton: this.editorToggleTarget,
      resizeHandle: this.editorResizeTarget,
      onCollapse: () => {
        this.editorPanelTarget.classList.add("panel-collapsed")
        this.editorState.save({ collapsed: true })
      },
      onExpand: () => {
        this.editorPanelTarget.classList.remove("panel-collapsed")
        this.editorState.save({ collapsed: false })
      }
    })

    this.registerToggler = new TogglePanel({
      toggleButton: this.registerToggleTarget,
      resizeHandle: this.registerVerticalResizeTarget,
      onCollapse: () => {
        this.registerScrollTarget.style.display = "none"
        this.registerPanelTarget.classList.add("register-panel--collapsed")
        this.ideMainTarget.style.marginRight = "0"
        this.ideContentTarget.closest(".ide-layout")
          ?.classList.add("register-collapsed")
        this.registerState.save({ collapsed: true })
      },
      onExpand: () => {
        this.registerScrollTarget.style.display = ""
        this.registerPanelTarget.classList.remove("register-panel--collapsed")
        this.ideMainTarget.style.marginRight = ""
        this.ideContentTarget.closest(".ide-layout")
          ?.classList.remove("register-collapsed")
        this.registerState.save({ collapsed: false })
      }
    })

    this.restoreState()
  }

  toggleEditor(): void { this.editorToggler.toggle() }
  toggleRegister(): void { this.registerToggler.toggle() }

  startEditorResize(event: MouseEvent): void { this.editorResizer.startResize(event) }
  startRegisterVerticalResize(event: MouseEvent): void { this.registerVerticalResizer.startResize(event) }

  private restoreState(): void {
    const editor = this.editorState.load()
    const register = this.registerState.load()

    if (editor.collapsed) this.editorToggler.collapse()
    if (register.collapsed) this.registerToggler.collapse()

    if (editor.size && !editor.collapsed) {
      this.editorPanelTarget.style.height = `${String(editor.size)}px`
    }
    const registerHeight = this.registerHeightState.load()
    if (registerHeight.size && !register.collapsed) {
      this.registerPanelTarget.style.height = `${String(registerHeight.size)}px`
    }
  }

}
