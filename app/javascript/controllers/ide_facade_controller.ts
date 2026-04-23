import { Controller } from "@hotwired/stimulus"
import type { IIDEFacadeController } from "./ide_facade_controller.interface"
import Formatter from "../formatter/formatter"
import Simulator from "../simulator/simulator"
import moduleAdapterFactory from "../moduleAdapter/factory"
export default class IDEFacadeController extends Controller implements IIDEFacadeController {
  static targets = ["textarea", "lineNumbers", "output", "runButton"]

  declare textareaTarget: HTMLTextAreaElement
  declare lineNumbersTarget: HTMLElement
  declare outputTarget: HTMLTextAreaElement
  declare runButtonTarget: HTMLButtonElement

  private formatter!: Formatter
  private simulator!: Simulator

  connect(): void {
    this.formatter = new Formatter(this.textareaTarget, this.lineNumbersTarget)
    this.formatter.updateLineNumbers()
    this.runButtonTarget.hidden = true
    moduleAdapterFactory().then((adapter) => {
      this.simulator = new Simulator(this.textareaTarget, this.outputTarget, adapter)
      this.runButtonTarget.hidden = false
    }).catch((err: unknown) => {
      console.error("could not initialize simulator", err)
    })
  }

  updateLineNumbers(): void {
    this.formatter.updateLineNumbers()
  }

  syncScroll(): void {
    this.formatter.syncScroll()
  }

  handleKeydown(event: KeyboardEvent): void {
    this.formatter.handleKeydown(event)
  }

  runUserProgram(): void {
    this.simulator.runUserProgram()
  }
}
