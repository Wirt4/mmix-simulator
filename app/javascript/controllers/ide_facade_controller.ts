import { Controller } from "@hotwired/stimulus"
import { ISimulator } from "../simulator/simulator.interface"
import { IDebugSession } from "../ide/debug_session.interface"
import { DebugSession } from "../ide/debug_session"
import Simulator from "../simulator/simulator"
import { IModuleAdapter } from "../moduleAdapter/module_adapter.interface"
import moduleAdapterFactory from "../moduleAdapter/factory"
import { IRegisterData } from "../register_types.interface"
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
import { EnumExecutionResult } from '../enums/enumExecutionResult'

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
  private debugSession!: IDebugSession

  // source lines with a gutter marker; markers on lines that emit no code are
  // tolerated — they arm nothing that can be hit, so the run simply never pauses there
  connect(): void {
    this.outputPanel = new OutputPanel(this.outputTarget)
    this.debugSession = new DebugSession(this._updateRunAndDebugButton.bind(this))
    this.inputFrame = new Input(
      this.editorContainerTarget,
      this.textareaTarget,
      this.debugSession
    )
    this.listingFrame = new Listing(this.listingTarget, this.listingToggleTarget, this.panelTarget)
    this.arguments = new Arguments(this.argumentsTarget, this.argumentsButtonTarget)

    moduleAdapterFactory().then(this._initializeModuleDisplay.bind(this)).catch((err: unknown) => {
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
    //abstraction level mixing again
    this.runAndDebugButtonTarget.hidden = this.debugSession.breakpoints.length === 0
    this.runAndDebugButtonTarget.disabled = this.runButtonTarget.disabled
  }

  runUserProgram(): void {
    this.simulator.reset()
    this.simulator.setArguments(this.arguments.getContents())
    let stopped = false;
    let result: EnumExecutionResult
    while (!stopped) {
      result = this.simulator.executeInstruction()
      this.outputPanel.setValue(this.simulator.getStdOut())
      this.outputPanel.show()
    }
  }

  runAndDebugUserProgram(): void {
    throw new Error("not implemented")
  }

  resumeUserProgram(): void {
    throw new Error("not implemented")
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

  private _displayRunResult(result: number): void {
    this.outputPanel.setValue(this.simulator.getStdOut())
    this.outputPanel.show()
    this.registers.render(
      this.simulator.getRegisters(EnumRegisterType.SPECIAL),
      this.simulator.getRegisters(EnumRegisterType.GENERAL)
    )
    this.registers.openAll()

    //default settings for run/nav buttons
    this.continueButtonTarget.hidden = true
    this.runButtonTarget.disabled = false
    //check if the result has been paused
    if (result > 0) {
      this.continueButtonTarget.hidden = false
      this.runButtonTarget.disabled = true
    }
    this._updateRunAndDebugButton()
  }

  private _initializeModuleDisplay(moduleAdapter: IModuleAdapter | null): void {
    if (moduleAdapter === null) {
      console.error("moduleAdapter is null")
      return
    }
    this.simulator = new Simulator(moduleAdapter)
    //use the simulator to populate the registers
    this._renderRegisters(this.simulator.getRegisters(EnumRegisterType.SPECIAL), this.simulator.getRegisters(EnumRegisterType.GENERAL), 32)
    this.inputFrame.unlock()
  }

  private _renderRegisters(specialRegisterData: IRegisterData[], generalRegisterData: IRegisterData[], generalRegistersPerTab: number): void {
    //assert generalRegistersPerTab is a positive whole number
    if (generalRegistersPerTab <= 0 || Math.floor(generalRegistersPerTab) !== generalRegistersPerTab) {
      throw "generalRegistersPerTab must be a positive whole number"
    }
    //get subpanels
    const specialSubpanel = this._subpanelFor(this.specialContainerTarget)
    const generalSubpanel = this._subpanelFor(this.generalContainerTarget)
    // assert the register subpanels are valid
    if (specialSubpanel == null || generalSubpanel == null) {
      throw "subpanels must be valid"
    }

    //use the subpanel data and general registersPer tab info to generate the register object
    const specialRegisters = new Registers(specialSubpanel, EnumRegisterType.SPECIAL)
    const generalRegisters = new Registers(generalSubpanel, EnumRegisterType.GENERAL)
    const tabbedGeneralRegisters = new TabbedRegisters(generalRegisters, this.groupSelectTarget, generalRegistersPerTab)
    this.registers = new RegistersPanel(specialRegisters, tabbedGeneralRegisters)

    //render the simulator's register data
    this.registers.render(specialRegisterData, generalRegisterData)
  }

  private _subpanelFor(container: HTMLElement) {
    return container.closest<HTMLElement>(".register-subpanel")
  }
}
