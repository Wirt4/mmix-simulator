import { Controller } from "@hotwired/stimulus"
import { ResizablePanel } from "../resizablePanel/resizable_panel"
import { PanelStateStore } from "../panel/panel_state_store"


export default class ResizableOutputPanelController extends Controller {
  //set the target to "resizable-output-panel" 
  static targets = ["resizableOutputPanel"]

  declare resizableOutputPanelTarget: HTMLElement

  private resizer!: ResizablePanel
  private panelState!: PanelStateStore

  //initialize the initial height
  connect(): void {
    this.panelState = new PanelStateStore("editor")

    this.resizer = new ResizablePanel({
      panel: this.resizableOutputPanelTarget,
      direction: "vertical",
      min: 60,
      invertDelta: false,
      onResizeEnd: (size) => { this.panelState.save({ size }) }
    })

    const state = this.panelState.load()
    if (state.size) {
      this.resizableOutputPanelTarget.style.height = `${String(state.size)}px`
    }
  }

  //expose "resize"
  resize(event: MouseEvent): void {
    this.resizer.startResize(event)
  }

}
