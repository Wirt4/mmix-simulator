import { Controller } from "@hotwired/stimulus"
import type { IIDEFacadeController } from "./ide_facade_controller.interface"
import Formatter from "../formatter/formatter"
import Simulator from "../simulator/simulator"
import ModuleAdapter from '../moduleAdapter/module_adapter'
import createModule from "../../../wasm/build/wasm/mmix.js"
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

    createModule({ locateFile: (path: string) => path.endsWith('.wasm') ? '/mmix.wasm' : path }).then((wasmModule) => {
      this.simulator = new Simulator(this.textareaTarget, this.outputTarget, new ModuleAdapter(wasmModule))
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
