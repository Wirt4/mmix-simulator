import { ISimulator } from './simulator.interface'
import moduleAdapterFactory from './../moduleAdapter/factory'
import { IModuleAdapter } from './../moduleAdapter/module_adapter.interface'

export default class Simulator implements ISimulator {
  private _inText: HTMLTextAreaElement
  private _outText: HTMLTextAreaElement
  private _moduleAdapter: IModuleAdapter | null
  constructor(inText: HTMLTextAreaElement, outText: HTMLTextAreaElement) {
    this._inText = inText
    this._outText = outText
    this._moduleAdapter = null
  }

  public async init(): Promise<void> {
    this._moduleAdapter = await moduleAdapterFactory()
  }

  public runUserProgram(): void {
    if (!this._moduleAdapter) {
      console.error("module adapter not intialized")
      return
    }
    const successfullyAssembled = this._moduleAdapter.assembleMMIXAL(this._inText.value)
    if (successfullyAssembled) {
      this._moduleAdapter.simulateMMIX()
    }
    this._outText.value = `stdout: ${this._moduleAdapter.getStdOut()}\n stderr: ${this._moduleAdapter.getStdErr()}`
  }
}
