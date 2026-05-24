import { Controller } from "@hotwired/stimulus"
import { ISimulator } from "../simulator/simulator.interface"
import Simulator from "../simulator/simulator"
import moduleAdapterFactory from "../moduleAdapter/factory"
import { IOutputPanel } from "../ide/output_panel.interface"
import OutputPanel from "../ide/output_panel"
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
    "textarea",
    "output",
    "runButton",
    "specialContainer",
    "generalContainer",
    "groupSelect",
    "listing",
    "listingToggle",
    "panel",
    "arguments",
    "argumentsButton"
  ]

  declare textareaTarget: HTMLTextAreaElement
  declare outputTarget: HTMLTextAreaElement
  declare runButtonTarget: HTMLButtonElement
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
  private suppressSourceEdited = false

  connect(): void {
    this.outputPanel = new OutputPanel(this.outputTarget)
    this.inputFrame = new Input(this.textareaTarget)
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
    if (result) {
      this.listingFrame.setContents(this.simulator.getListing())
      //extend input frame to be same height as listing
      this.inputFrame.pad(this.listingFrame.size - this.inputFrame.size)
      this.runButtonTarget.disabled = false
      this.arguments.show()
      // unlock listing
      this.listingFrame.unlock()
      this.listingFrame.toggle()
    } else {
      this.listingFrame.default()
      this.outputPanel.setValue(this.simulator.getStdOut())
      this.runButtonTarget.disabled = true
    }
  }

  toggleListingPanel(): void {
    this.listingFrame.toggle()
    if (!this.listingFrame.isOpen) {
      this.suppressSourceEdited = true
      this.inputFrame.trim()
      this.suppressSourceEdited = false
      this.inputFrame.edited = false
    }
  }

  sourceEdited(): void {
    if (this.suppressSourceEdited) return

    this.resetDisplay()

    if (this.listingFrame.isOpen) {
      this.inputFrame.pad(this.listingFrame.size - this.inputFrame.size)
    }

    if (!this.inputFrame.edited) {
      this.listingFrame.unlock()
      this.inputFrame.edited = true
    }
  }

  private resetDisplay(): void {
    this.listingFrame.default()
    this.outputPanel.clear()
    this.outputPanel.show()
    this.runButtonTarget.disabled = true
    this.arguments.clear()
    this.arguments.hide()
  }


  beforeSave(): void {
    this.suppressSourceEdited = true
    this.inputFrame.trim()
    this.suppressSourceEdited = false
  }

  runUserProgram(): void {
    this.simulator.runUserProgram(this.arguments.getContents())
    this.outputPanel.setValue(this.simulator.getStdOut())
    this.outputPanel.show()
    this.registers.render(this.simulator.getRegisters(EnumRegisterType.SPECIAL), this.simulator.getRegisters(EnumRegisterType.GENERAL))
    this.registers.openAll()
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
