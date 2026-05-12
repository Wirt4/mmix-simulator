import { Controller } from "@hotwired/stimulus"
import Simulator from "../simulator/simulator"
import moduleAdapterFactory from "../moduleAdapter/factory"
import ListingPanel from "../ide/listing_panel"
import { IListingPanel } from "../ide/listing_panel.interface"
import RegisterPanel from "../ide/register_panel"
import { IRegisterPanel } from "../ide/register_panel.interface"
import OutputPanel from "../ide/output_panel"
import { IOutputPanel } from "../ide/output_panel.interface"

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

  private simulator!: Simulator
  private listingPanel!: IListingPanel
  private registerPanel!: IRegisterPanel
  private outputPanel!: IOutputPanel

  connect(): void {
    this.outputPanel = new OutputPanel(this.outputTarget)
    this.listingPanel = new ListingPanel(
      this.panelTarget,
      this.listingTarget,
      this.listingToggleTarget,
      this.textareaTarget
    )
    // collapse the listing panel on initial connect
    this.listingPanel.collapse()
    this.runButtonTarget.disabled = true
    this.textareaTarget.disabled = true

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
      this.textareaTarget.disabled = false
      this.registerPanel.renderSpecialRegisters()
      this.registerPanel.renderGeneralRegisters()
    }).catch((err: unknown) => {
      console.error("could not initialize simulator", err)
    })
  }

  assembleUserProgram(): void {
    const source = this.listingPanel.getSource()
    const result = this.simulator.assemble(source)
    if (result) {
      this.listingPanel.setListing(this.simulator.getListing())
      this.listingPanel.setUnpaddedSource(source)
      this.listingPanel.applyPadding()
      this.runButtonTarget.disabled = false
      this.listingPanel.enableToggle()
      this.listingPanel.expand()
    } else {
      this.listingPanel.collapse()
      this.outputPanel.setValue(this.simulator.getStdOut())
      this.runButtonTarget.disabled = true
      this.listingPanel.disableToggle()
    }
  }

  toggleListingPanel(): void {
    if (this.listingPanel.isCollapsed) {
      this.listingPanel.expand()
    } else {
      this.listingPanel.collapse()
    }
  }

  sourceEdited(): void {
    const wasEdited = this.listingPanel.handleSourceEdited()
    if (wasEdited) {
      this.runButtonTarget.disabled = true
      this.listingPanel.disableToggle()
      this.listingPanel.collapse()
    }
  }

  beforeSave(): void {
    this.listingPanel.removePaddingForSave()
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
