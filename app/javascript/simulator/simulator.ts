import { ISimulator } from './simulator.interface'
import moduleAdapterFactory from './../moduleAdapter/factory'
import { IModuleAdapter } from './../moduleAdapter/module_adapter.interface'

export default class Simulator implements ISimulator {
  private _inText: HTMLTextAreaElement
  private _outText: HTMLTextAreaElement
  private _moduleAdapter: IModuleAdapter | null
  private _button: HTMLButtonElement
  constructor(inText: HTMLTextAreaElement, outText: HTMLTextAreaElement, button: HTMLButtonElement) {
    this._inText = inText
    this._outText = outText
    this._moduleAdapter = null
    this._button = button
    this._button.hidden = true
  }

  public init(): Promise<void> {
    return moduleAdapterFactory().then((adapter: IModuleAdapter) => {
      this._moduleAdapter = adapter
      this._button.hidden = false
    }).catch((err: any) => {
      console.error('could not resolve module adapter')
    })
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
    const stdout = this._moduleAdapter.getStdOut()
    const stderr = this._moduleAdapter.getStdErr()
    this._outText.value = `${stdout}\n\n${stderr}`
  }
}
