import { Controller } from "@hotwired/stimulus"
import type { IIDEFacadeController } from "./ide_facade_controller.interface"
import Formatter from "../formatter/formatter"
import Simulator from "../simulator/simulator"
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
    this.simulator = new Simulator(this.textareaTarget, this.outputTarget, this.runButtonTarget)
    this.simulator.init().catch((err: any) => console.error(`could not initialize simulator: ${err.toString()}`))
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
