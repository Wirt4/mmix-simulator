import { ISimulator } from './simulator.interface'
import { IModuleAdapter } from './../moduleAdapter/module_adapter.interface'

export default class Simulator implements ISimulator {
  private _inText: HTMLTextAreaElement
  private _outText: HTMLTextAreaElement
  private _moduleAdapter: IModuleAdapter

  constructor(inText: HTMLTextAreaElement, outText: HTMLTextAreaElement, moduleAdapter: IModuleAdapter) {
    this._inText = inText
    this._outText = outText
    this._moduleAdapter = moduleAdapter
  }

  public runUserProgram(): Promise<void> {
    const successfullyAssembled = this._moduleAdapter.assembleMMIXAL(this._inText.value)
    if (successfullyAssembled) {
      this._moduleAdapter.simulateMMIX()
    }
    const stdout = this._moduleAdapter.getStdOut()
    const stderr = this._moduleAdapter.getStdErr()
    this._outText.value = `${stdout}\n\n${stderr}`
    return Promise.resolve()
  }
}
