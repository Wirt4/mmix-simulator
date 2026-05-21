import { Controller } from "@hotwired/stimulus"
import Simulator from "../simulator/simulator"
import { ISimulator } from "../simulator/simulator.interface"
import moduleAdapterFactory from "../moduleAdapter/factory"
import OutputPanel from "../ide/output_panel"
import { IOutputPanel } from "../ide/output_panel.interface"
import { IInput } from "../ide/input.interface"
import { Input } from "../ide/input"
import { IListing } from "../ide/listing.interface"
import { Listing } from "../ide/listing"
import { EnumRegisterType } from "../ide/registers.interface"
import { IRegistersPanel } from "../ide/registers_panel.interface"
import { RegistersPanel } from "../ide/registers_panel"
import { Registers } from "../ide/registers"
import { TabbedRegisters } from "../ide/tabbed_registers"

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
    "panel"
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

  private simulator!: ISimulator
  private outputPanel!: IOutputPanel
  private inputFrame!: IInput
  private listingFrame!: IListing
  private registers!: IRegistersPanel
  private suppressSourceEdited = false

  connect(): void {
    this.outputPanel = new OutputPanel(this.outputTarget)
    this.inputFrame = new Input(this.textareaTarget)
    this.listingFrame = new Listing(this.listingTarget, this.listingToggleTarget, this.panelTarget)
    this.runButtonTarget.disabled = true

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
    // clear the output
    this.outputPanel.clear()
    // check if listing panel is open
    if (this.listingFrame.isOpen) {
      //pad the input with the difference in sizes
      this.inputFrame.pad(this.listingFrame.size - this.inputFrame.size)
    }
    // set listing back to default
    this.listingFrame.default()
    if (!this.inputFrame.edited) {
      this.listingFrame.unlock()
      this.inputFrame.edited = true
    }
    // lock the run button 
    this.runButtonTarget.disabled = true
  }

  beforeSave(): void {
    this.suppressSourceEdited = true
    this.inputFrame.trim()
    this.suppressSourceEdited = false
  }

  runUserProgram(): void {
    this.simulator.runUserProgram([])
    this.outputPanel.setValue(this.simulator.getStdOut())
    this.registers.render(this.simulator.getRegisters(EnumRegisterType.SPECIAL), this.simulator.getRegisters(EnumRegisterType.GENERAL))
    this.registers.openAll()
  }

  toggleSubpanel(event: Event): void {
    this.registers.toggle(event)
  }

  switchRegisterTab(): void {
    this.registers.switchTab()
  }
}
