import { Controller } from "@hotwired/stimulus"
import { assert } from '../utils'
import Simulator from "../simulator/simulator"
import moduleAdapterFactory from "../moduleAdapter/factory"

const GROUP_SIZE = 32

export default class IDEFacadeController extends Controller {
  static targets = ["textarea", "lineNumbers", "output", "runButton", "specialContainer", "generalContainer", "groupSelect", "specialBody", "generalBody"]

  declare textareaTarget: HTMLTextAreaElement
  declare outputTarget: HTMLTextAreaElement
  declare runButtonTarget: HTMLButtonElement
  declare specialContainerTarget: HTMLElement
  declare generalContainerTarget: HTMLElement
  declare groupSelectTarget: HTMLSelectElement
  declare specialBodyTarget: HTMLElement
  declare generalBodyTarget: HTMLElement

  private simulator!: Simulator
  private generalRegistersRendered = false

  /** Initializes the WASM module adapter, simulator, and register display on connect. */
  connect(): void {
    // initialize the simulator
    this.runButtonTarget.disabled = true
    this.textareaTarget.disabled = true
    moduleAdapterFactory().then((adapter) => {
      if (adapter === null) {
        console.error("moduleAdapter is null")
        return
      }
      this.simulator = new Simulator(this.textareaTarget, this.outputTarget, adapter)
      this.runButtonTarget.disabled = false
      this.textareaTarget.disabled = false
      this.renderSpecialRegisters()
      this.renderGeneralRegisters()
    }).catch((err: unknown) => {
      console.error("could not initialize simulator", err)
    })

  }

  /** Delegates program execution to the simulator. */
  runUserProgram(): void {
    this.simulator.runUserProgram()
    this.renderSpecialRegisters()
    this.renderGeneralRegisters()
  }

  /** Toggles a register subpanel open/closed when its header is clicked. */
  toggleSubpanel(event: Event): void {
    const header = (event.currentTarget as HTMLElement)
    const body = header.nextElementSibling as HTMLElement
    const arrow = header.querySelector(".spin-arrow") as HTMLElement
    if (!body || !arrow) return

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
    // check preconditions
    if (!this.generalRegistersRendered) {
      throw new Error("general registers not rendered")
    }
    // get index of group to display from the dropdown widget
    const selected = this.groupSelectTarget.value
    // hide all register groups
    this.generalContainerTarget.querySelectorAll<HTMLElement>(".register-group").forEach((g) => {
      //NOTE: can this be iterated through cleaner??
      g.style.display = "none"
    })
    //unhide the selected group
    const target = document.getElementById(`gp-group-${selected}`)
    if (target) target.style.display = "block"
  }

  private static readonly SPECIAL_REGISTER_DESCRIPTIONS: Record<string, string> = {
    rA: "Arithmetic status register",
    rB: "Bootstrap register (trip)",
    rC: "Cycle counter",
    rD: "Dividend register",
    rE: "Epsilon register",
    rF: "Failure location register",
    rG: "Global threshold register",
    rH: "Himult register",
    rI: "Interval counter",
    rJ: "Return-jump register",
    rK: "Interrupt mask register",
    rL: "Local threshold register",
    rM: "Multiplex mask register",
    rN: "Serial number",
    rO: "Register stack offset",
    rP: "Prediction register",
    rQ: "Interrupt request register",
    rR: "Remainder register",
    rS: "Register stack pointer",
    rT: "Trap address register",
    rU: "Usage counter",
    rV: "Virtual translation register",
    rW: "Where-interrupted register (trip)",
    rX: "Execution register (trip)",
    rY: "Y operand (trip)",
    rZ: "Z operand (trip)",
    rBB: "Bootstrap register (trap)",
    rTT: "Dynamic trap address register",
    rWW: "Where-interrupted register (trap)",
    rXX: "Execution register (trap)",
    rYY: "Y operand (trap)",
    rZZ: "Z operand (trap)",
  }

  private renderSpecialRegisters(): void {
    this.specialContainerTarget.innerHTML = this.simulator.specialRegisters.map((reg) => {
      const tooltip = IDEFacadeController.SPECIAL_REGISTER_DESCRIPTIONS[reg] ?? ""
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
        const tip = document.createElement("div")
        tip.className = "register-tooltip"
        tip.textContent = text
        document.body.appendChild(tip)
        const rect = row.getBoundingClientRect()
        tip.style.top = `${rect.top + rect.height / 2 - tip.offsetHeight / 2}px`
        tip.style.left = `${rect.left - tip.offsetWidth - 8}px`
        this.tooltipEl = tip
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
