import { Controller } from "@hotwired/stimulus"
import { assert } from '../utils'
import Simulator from "../simulator/simulator"
import moduleAdapterFactory from "../moduleAdapter/factory"

const GROUP_SIZE = 32

export default class IDEFacadeController extends Controller {
  static targets = ["textarea", "lineNumbers", "output", "runButton", "specialContainer", "generalContainer", "groupSelect"]

  declare textareaTarget: HTMLTextAreaElement
  declare outputTarget: HTMLTextAreaElement
  declare runButtonTarget: HTMLButtonElement
  declare specialContainerTarget: HTMLElement
  declare generalContainerTarget: HTMLElement
  declare groupSelectTarget: HTMLSelectElement

  private simulator!: Simulator
  private generalRegistersRendered = false

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

  /**
    handleKeydown(event: KeyboardEvent): void {
      this.formatter.handleKeydown(event)
    }
  */
  runUserProgram(): void {
    this.simulator.runUserProgram()
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

  private renderSpecialRegisters(): void {
    this.specialContainerTarget.innerHTML = this.simulator.specialRegisters.map((reg) => this.createRegisterDiv(reg)).join("")
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
      arr[p] = this.createRegisterDiv("$" + i.toString())
      p++
      // if is the last register, append a closing div for a group
      if (i === regCount - 1) {
        arr[p] = "</div>"
      }
    }

    return arr.join("")
  }

  private createRegisterDiv(reg: string): string {
    const val = this.simulator.getRegisterValue(reg)
    return `<div class="register-row"><span class="register-name">${reg}</span><span class="register-hex">${val}</span></div>`
  }
}
