import { Controller } from "@hotwired/stimulus"
import { assert } from '../utils'
import Simulator from "../simulator/simulator"
import moduleAdapterFactory from "../moduleAdapter/factory"

const GROUP_SIZE = 32

export default class IDEFacadeController extends Controller {
  static targets = [
    "textarea",
    "lineNumbers",
    "output",
    "runButton",
    "specialContainer",
    "generalContainer",
    "groupSelect",
    "specialBody",
    "generalBody",
    "assembleButton",
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
  declare specialBodyTarget: HTMLElement
  declare generalBodyTarget: HTMLElement
  declare listingTarget: HTMLElement
  declare listingToggleTarget: HTMLButtonElement
  declare panelTarget: HTMLElement

  private simulator!: Simulator
  private listingCollapsed = false
  private generalRegistersRendered = false
  private unpaddedSource: string | null = null
  private suppressSourceEdited = false

  /** Initializes the WASM module adapter, simulator, and register display on connect. */
  connect(): void {
    this.runButtonTarget.disabled = true
    this.textareaTarget.disabled = true
    //collapse the listing
    if (!this.listingCollapsed) this.toggleListingPanel()

    moduleAdapterFactory().then((adapter) => {
      if (adapter === null) {
        console.error("moduleAdapter is null")
        return
      }
      this.simulator = new Simulator(adapter)
      this.textareaTarget.disabled = false
      this.renderSpecialRegisters()
      this.renderGeneralRegisters()
    }).catch((err: unknown) => {
      console.error("could not initialize simulator", err)
    })
  }

  assembleUserProgram(): void {
    const source = this.unpaddedSource ?? this.textareaTarget.value
    const result = this.simulator.assemble(source)
    if (result) {
      this.listingTarget.textContent = this.simulator.getListing()
      this.unpaddedSource = source
      this.applyPadding()
      this.runButtonTarget.disabled = false
      this.listingToggleTarget.disabled = false
      if (this.listingCollapsed) this.toggleListingPanel()
    } else {
      //collapse the listing
      if (!this.listingCollapsed) this.toggleListingPanel()
      this.outputTarget.value = this.simulator.getStdOut()
      this.runButtonTarget.disabled = true
      this.listingToggleTarget.disabled = true
    }
  }

  toggleListingPanel(): void {
    this.listingCollapsed = !this.listingCollapsed
    this.panelTarget.classList.toggle("listing-panel--collapsed", this.listingCollapsed)
    if (this.listingCollapsed) {
      this.removePadding()
    } else if (this.listingTarget.textContent) {
      this.unpaddedSource = this.textareaTarget.value
      this.applyPadding()
    }
  }

  sourceEdited(): void {
    if (this.suppressSourceEdited || this.unpaddedSource === null) return
    const { selectionStart, selectionEnd } = this.textareaTarget
    const listingLines = (this.listingTarget.textContent ?? "").split("\n").length
    const sourceLines = this.unpaddedSource.split("\n").length
    const paddingCount = listingLines - sourceLines

    const currentValue = this.textareaTarget.value
    let value = currentValue
    let removed = 0
    while (removed < paddingCount && value.endsWith("\n")) {
      value = value.slice(0, -1)
      removed++
    }

    this.unpaddedSource = null
    this.suppressSourceEdited = true
    this.textareaTarget.value = value
    this.textareaTarget.selectionStart = Math.min(selectionStart, value.length)
    this.textareaTarget.selectionEnd = Math.min(selectionEnd, value.length)
    this.textareaTarget.dispatchEvent(new Event("input", { bubbles: true }))
    this.suppressSourceEdited = false
    this.runButtonTarget.disabled = true
    this.listingToggleTarget.disabled = true
    if (!this.listingCollapsed) this.toggleListingPanel()
  }

  beforeSave(): void {
    this.removePadding()
    this.textareaTarget.value = this.textareaTarget.value.replace(/\n{2,}$/, "\n")
  }

  private applyPadding(): void {
    if (!this.unpaddedSource) return
    const listingLines = (this.listingTarget.textContent ?? "").split("\n").length
    const sourceLines = this.unpaddedSource.split("\n").length
    const extra = listingLines - sourceLines
    if (extra > 0) {
      this.suppressSourceEdited = true
      this.textareaTarget.value = this.unpaddedSource + "\n".repeat(extra)
      this.textareaTarget.dispatchEvent(new Event("input", { bubbles: true }))
      this.suppressSourceEdited = false
    }
  }

  private removePadding(): void {
    this.textareaTarget.value = this.textareaTarget.value.replace(/\n{2,}$/, "\n")
    this.textareaTarget.dispatchEvent(new Event("input", { bubbles: true }))
    this.suppressSourceEdited = false
  }

  runUserProgram(): void {
    this.simulator.runUserProgram()
    this.outputTarget.value = this.simulator.getStdOut()
    this.renderSpecialRegisters()
    this.renderGeneralRegisters()
    this.openAllRegisterSubpanels()
  }

  private openAllRegisterSubpanels(): void {
    this.element.querySelectorAll<HTMLElement>(".register-subpanel").forEach((subpanel) => {
      const body = subpanel.querySelector<HTMLElement>(".register-subpanel-body")
      const arrow = subpanel.querySelector<HTMLElement>(".spin-arrow")
      if (body) body.classList.remove("register-subpanel-body--collapsed")
      if (arrow) arrow.classList.add("spin-arrow--open")
    })
  }

  toggleSubpanel(event: Event): void {
    const header = (event.currentTarget as HTMLElement)
    const body = header.nextElementSibling as HTMLElement
    const arrow = header.querySelector(".spin-arrow")
    if (!arrow) return
    body.classList.toggle("register-subpanel-body--collapsed")
    arrow.classList.toggle("spin-arrow--open")
  }

  /**
  * information hidden : the reorganization of display between groups of general registers
  * inputs: none
  * outputs:none
  * preconditions: General registers have been rendered
* General registers are formatted with ids of the form "gp-group-(index)" and all have the class of "register-group"
  * postconditions: the selected group is displayed
  **/
  switchRegisterTab(): void {
    if (!this.generalRegistersRendered) {
      throw new Error("general registers not rendered")
    }
    const selected = this.groupSelectTarget.value
    this.generalContainerTarget.querySelectorAll<HTMLElement>(".register-group").forEach((g) => {
      //NOTE: can this be iterated through cleaner??
      g.style.display = "none"
    })
    //unhide the selected group
    const target = document.getElementById(`gp-group-${selected}`)
    if (target) target.style.display = "block"
  }

  private renderSpecialRegisters(): void {
    this.specialContainerTarget.innerHTML = this.simulator.specialRegisters.map((reg) => {
      const tooltip = this.simulator.getRegisterDescription(reg)
      return this.createRegisterDiv(reg, tooltip)
    }).join("")
    this.attachTooltipListeners()
  }

  private tooltipEl: HTMLElement | null = null

  private attachTooltipListeners(): void {
    this.specialContainerTarget.querySelectorAll<HTMLElement>(".register-row[data-tooltip]").forEach((row) => {
      row.addEventListener("mouseenter", () => {
        const text = row.dataset.tooltip
        if (!text) return
        const toolTip = document.createElement("div")
        toolTip.className = "register-tooltip"
        toolTip.textContent = text
        document.body.appendChild(toolTip)
        const rect = row.getBoundingClientRect()
        const toolTipTop = rect.top + rect.height / 2 - toolTip.offsetHeight / 2
        toolTip.style.top = `${toolTipTop.toString()}px`
        const toolTipLeft = rect.left - toolTip.offsetWidth - 8
        toolTip.style.left = `${toolTipLeft.toString()}px`
        this.tooltipEl = toolTip
      })
      row.addEventListener("mouseleave", () => {
        this.tooltipEl?.remove()
        this.tooltipEl = null
      })
    })
  }

  private renderGeneralRegisters(): void {
    this.groupSelectTarget.innerHTML = this.renderDropDown(GROUP_SIZE)
    this.generalContainerTarget.innerHTML = this.renderRegisters(GROUP_SIZE)
    this.generalRegistersRendered = true
  }

  private renderDropDown(groupSize: number): string {
    assert(groupSize > 0 && Number.isInteger(groupSize), "groupSize must be a positive integer")
    if (groupSize <= 0) { return "" }
    const groupCount = Math.floor(this.simulator.generalRegisterCount / groupSize)
    const arr = new Array<string>(groupCount)
    for (let i = 0; i < groupCount; i++) {
      // -- derive the start and end values for the label
      const start = i * groupSize
      const end = start + groupSize - 1
      arr[i] = `<option value="${i.toString()}">$${start.toString()}\u2013$${end.toString()}</option>`
    }
    return arr.join("")
  }

  private renderRegisters(groupSize: number): string {
    assert(groupSize > 0 && Number.isInteger(groupSize), "groupSize must be a positive integer")
    if (groupSize <= 0) {
      return ""
    }

    //derive the group count
    const regCount = this.simulator.generalRegisterCount
    assert(Number.isInteger(regCount), "regCount must be a non-negative integer")

    const groupCount = Math.floor(regCount / groupSize)
    const arr = new Array<string>(this.simulator.generalRegisterCount + (2 * groupCount))
    arr[0] = '<div id="gp-group-0" class="register-group">'
    let p = 1;

    for (let i = 0; i < regCount; i++) {
      // -- if it's the start of a new group and index isn't zero
      if (i % groupSize === 0 && i != 0) {
        arr[p] = `</div><div id="gp-group-${(i / groupSize).toString()}" class="register-group" style="display: none;">`
        p++;
      }
      arr[p] = this.createRegisterDiv(i.toString())
      p++
      // if is the last register, append a closing div for a group
      if (i === regCount - 1) {
        arr[p] = "</div>"
      }
    }

    return arr.join("")
  }

  private static readonly ZERO_REGISTER = "0x0000000000000000"

  private createRegisterDiv(reg: string, tooltip?: string): string {
    const val = this.simulator.getRegisterValue(reg)
    const activeClass = val !== IDEFacadeController.ZERO_REGISTER ? " register-row--active" : ""
    const tooltipAttr = tooltip ? ` data-tooltip="${tooltip}"` : ""
    return `<div class="register-row${activeClass}"${tooltipAttr}><span class="register-name">$${reg}</span><span class="register-hex">${val}</span></div>`
  }
}
