import { Controller } from "@hotwired/stimulus"
import { ISimulator } from "../simulator/simulator.interface"
// basic object for getting the result of a run from the simulator: halted, paused or timedout
import { RunResult } from "../simulator/run_result"
import Simulator from "../simulator/simulator"
import moduleAdapterFactory from "../moduleAdapter/factory"
import { IOutputPanel } from "../ide/output_panel.interface"
import { OutputPanel } from "../ide/output_panel"
import { IInput } from "../ide/input.interface"
import { Input } from "../ide/input"
import { IListing } from "../ide/listing.interface"
import { Listing } from "../ide/listing"
import { EnumRegisterType } from "../ide/registers.interface"
import { IRegistersPanel } from "../ide/registers_panel.interface"
import { RegistersPanel } from "../ide/registers_panel"
import { Registers } from "../ide/registers"
import { TabbedRegisters } from "../ide/tabbed_registers"
import { IArguments } from '../ide/arguments.interface'
import { Arguments } from '../ide/arguments'

export default class IDEFacadeController extends Controller {
  static targets = [
    "editorContainer",
    "textarea",
    "output",
    "runButton",
    "runAndDebugButton",
    "continueButton",
    "specialContainer",
    "generalContainer",
    "groupSelect",
    "listing",
    "listingToggle",
    "panel",
    "arguments",
    "argumentsButton"
  ]

  declare editorContainerTarget: HTMLElement
  declare textareaTarget: HTMLTextAreaElement
  declare outputTarget: HTMLElement
  declare runButtonTarget: HTMLButtonElement
  declare runAndDebugButtonTarget: HTMLButtonElement
  declare continueButtonTarget: HTMLButtonElement
  declare specialContainerTarget: HTMLElement
  declare generalContainerTarget: HTMLElement
  declare groupSelectTarget: HTMLSelectElement
  declare listingTarget: HTMLElement
  declare listingToggleTarget: HTMLButtonElement
  declare panelTarget: HTMLElement
  declare argumentsTarget: HTMLInputElement
  declare argumentsButtonTarget: HTMLButtonElement

  private simulator!: ISimulator
  private outputPanel!: IOutputPanel
  private inputFrame!: IInput
  private listingFrame!: IListing
  private registers!: IRegistersPanel
  private arguments!: IArguments
  // source lines with a gutter marker; markers on lines that emit no code are
  // tolerated — they arm nothing that can be hit, so the run simply never pauses there
  private _armedLines: number[] = []

  connect(): void {
    this.outputPanel = new OutputPanel(this.outputTarget)
    this.inputFrame = new Input(
      this.editorContainerTarget,
      this.textareaTarget,
      (lines) => {
        this._armedLines = lines
        this._updateRunAndDebugButton()
      }
    )
    this.listingFrame = new Listing(this.listingTarget, this.listingToggleTarget, this.panelTarget)
    this.arguments = new Arguments(this.argumentsTarget, this.argumentsButtonTarget)

    moduleAdapterFactory().then((adapter) => {
      if (adapter === null) {
        console.error("moduleAdapter is null")
        return
      }
      this.simulator = new Simulator(adapter)

      const specialSubpanel = this.specialContainerTarget.closest<HTMLElement>(".register-subpanel")
      if (!specialSubpanel) return
      const generalSubpanel = this.generalContainerTarget.closest<HTMLElement>(".register-subpanel")
      if (!generalSubpanel) return
      const specialRegisters = new Registers(specialSubpanel, EnumRegisterType.SPECIAL)
      const generalRegisters = new Registers(generalSubpanel, EnumRegisterType.GENERAL)
      const generalRegistersPerTab = 32
      const tabbedGeneralRegisters = new TabbedRegisters(generalRegisters, this.groupSelectTarget, generalRegistersPerTab)
      this.registers = new RegistersPanel(specialRegisters, tabbedGeneralRegisters)
      this.inputFrame.unlock()
      this.registers.render(this.simulator.getRegisters(EnumRegisterType.SPECIAL), this.simulator.getRegisters(EnumRegisterType.GENERAL))
    }).catch((err: unknown) => {
      console.error("could not initialize simulator", err)
    })
    this.resetDisplay()
  }

  assembleUserProgram(): void {
    //clear the output
    this.outputPanel.clear()
    const source = this.inputFrame.getContents()
    const result = this.simulator.assemble(source)
    this.runButtonTarget.disabled = !result
    if (result) {
      this.listingFrame.setContents(this.simulator.getListing())
      this.arguments.show()
      // unlock listing
      this.listingFrame.unlock()
      this.listingFrame.toggle()
    } else {
      this.listingFrame.default()
      this.outputPanel.setValue(this.simulator.getStdOut())
    }
    this._updateRunAndDebugButton()
  }

  toggleListingPanel(): void {
    this.listingFrame.toggle()
    if (this.listingFrame.isOpen) return
    this.inputFrame.edited = false
  }

  sourceEdited(): void {
    //clear the output
    this.resetDisplay()
    if (this.inputFrame.edited) return
    this.listingFrame.unlock()
    this.inputFrame.edited = true
  }

  private resetDisplay(): void {
    this.listingFrame.default()
    this.outputPanel.clear()
    this.outputPanel.hide()
    this.runButtonTarget.disabled = true
    this.continueButtonTarget.hidden = true
    this._updateRunAndDebugButton()
    this.arguments.clear()
    this.arguments.hide()
  }

  private _updateRunAndDebugButton(): void {
    this.runAndDebugButtonTarget.hidden = this._armedLines.length === 0
    this.runAndDebugButtonTarget.disabled = this.runButtonTarget.disabled
  }

  runUserProgram(): void {
    //opportunity to reduce duplication with below
    this.simulator.setBreakpoints([])
    this._displayRunResult(this.simulator.runUserProgram(this.arguments.getContents()))
  }

  runAndDebugUserProgram(): void {
    //opportunity to reduce duplication with above
    this.simulator.setBreakpoints(this._armedLines)
    this._displayRunResult(this.simulator.runUserProgram(this.arguments.getContents()))
  }

  resumeUserProgram(): void {
    this._displayRunResult(this.simulator.resume())
  }

  //information hidden: calls to register object
  //inputs: runResult object: the exit information of a run
  //outputs: edits to the "runAndDebugButton" display
  //preconditions
  //postconditions
  private _displayRunResult(result: RunResult): void {
    // pipe out the stdout to the display
    this.outputPanel.setValue(this.simulator.getStdOut())
    this.outputPanel.show()
    // get the register state (is this duplicated work?)
    this.registers.render(this.simulator.getRegisters(EnumRegisterType.SPECIAL), this.simulator.getRegisters(EnumRegisterType.GENERAL))
    // pop open the regsiters
    this.registers.openAll()

    // while paused, Continue is the only way to advance the run
    // if the result is paused, then unhide the continue button and hide the run button
    // else, hide the continue button and hide the run button
    const paused = result.status === "paused"
    this.continueButtonTarget.hidden = !paused
    //What is god's name are "runButtonTarget" and "continueButtonTarget"?
    this.runButtonTarget.disabled = paused
    // The naming here is unclear
    // updating the runand DebugButton appears to be the invariant postcondition
    this._updateRunAndDebugButton()
  }

  toggleSubpanel(event: Event): void {
    this.registers.toggle(event)
  }

  switchRegisterTab(): void {
    this.registers.switchTab()
  }

  toggleArguments(): void {
    this.arguments.toggle()
  }
}
