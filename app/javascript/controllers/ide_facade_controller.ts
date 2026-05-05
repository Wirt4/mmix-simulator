import { Controller } from "@hotwired/stimulus"
import Simulator from "../simulator/simulator"
import moduleAdapterFactory from "../moduleAdapter/factory"

export default class IDEFacadeController extends Controller {
  static targets = ["textarea", "lineNumbers", "output", "runButton"]

  declare textareaTarget: HTMLTextAreaElement
  declare outputTarget: HTMLTextAreaElement
  declare runButtonTarget: HTMLButtonElement

  private simulator!: Simulator

  connect(): void {
    // initialize the simulator
    this.runButtonTarget.disabled = true
    this.textareaTarget.disabled = true
    moduleAdapterFactory().then((adapter) => {
      if (adapter === null) {
        console.error("moduleAdapter is null")
        return
      }
      this.simulator = new Simulator(this.textareaTarget, this.outputTarget, adapter)
      this.runButtonTarget.disabled = false
      this.textareaTarget.disabled = false
    }).catch((err: unknown) => {
      console.error("could not initialize simulator", err)
    })
  }

  /**
    handleKeydown(event: KeyboardEvent): void {
      this.formatter.handleKeydown(event)
    }
  */
  runUserProgram(): void {
    this.simulator.runUserProgram()
  }
}
