import { Controller } from "@hotwired/stimulus"
import Simulator from "../simulator/simulator"
import { ISimulator } from "../simulator/simulator.interface"
import moduleAdapterFactory from "../moduleAdapter/factory"
import RegisterPanel from "../ide/register_panel"
import { IRegisterPanel } from "../ide/register_panel.interface"
import OutputPanel from "../ide/output_panel"
import { IOutputPanel } from "../ide/output_panel.interface"
import { IInput } from "../ide/input.interface"
import { Input } from "../ide/input"
import { IListing } from "../ide/listing.interface"
import { Listing } from "../ide/listing"

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
  private registerPanel!: IRegisterPanel
  private outputPanel!: IOutputPanel
  private inputFrame!: IInput
  private listingFrame!: IListing
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
      this.registerPanel = new RegisterPanel(
        this.specialContainerTarget,
        this.generalContainerTarget,
        this.groupSelectTarget,
        this.simulator
      )
      this.inputFrame.unlock()
      this.registerPanel.renderSpecialRegisters()
      this.registerPanel.renderGeneralRegisters()
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
    this.simulator.runUserProgram()
    this.outputPanel.setValue(this.simulator.getStdOut())
    this.registerPanel.renderSpecialRegisters()
    this.registerPanel.renderGeneralRegisters()
    this.registerPanel.openAllSubpanels()
  }

  toggleSubpanel(event: Event): void {
    this.registerPanel.toggleSubpanel(event)
  }

  switchRegisterTab(): void {
    this.registerPanel.switchTab()
  }
}
