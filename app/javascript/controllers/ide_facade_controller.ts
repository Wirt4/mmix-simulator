import { Controller } from "@hotwired/stimulus"
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
  * information hidden
  * inputs: none
  * outputs:none
  * preconditions
  * postconditions
  **/
  switchGroup(): void {
    const selected = this.groupSelectTarget.value
    this.generalContainerTarget.querySelectorAll<HTMLElement>(".register-group").forEach((g) => {
      g.style.display = "none"
    })
    const target = document.getElementById(`gp-group-${selected}`)
    if (target) target.style.display = "block"
  }

  /**
  * information hidden
  * inputs: none
  * outputs: none
  * preconditions
  * postconditions
  */
  private renderSpecialRegisters(): void {
    this.specialContainerTarget.innerHTML = this.simulator.specialRegisters.map((reg) =>
      `<div class="register-row">
        <span class="register-name">${reg}</span>
        <span class="register-hex">${this.simulator.getRegisterValue(reg)}</span>
      </div>`
    ).join("")
  }

  /*
  *information hidden
  * inputs: none
  * outputs: none
  * preconditions:
  * postconditions:
  * */
  private renderGeneralRegisters(): void {
    const groupCount = this.simulator.generalRegisterCount / GROUP_SIZE
    const options: string[] = []
    const groups: string[] = []

    for (let group = 0; group < groupCount; group++) {
      const start = group * GROUP_SIZE
      const end = start + GROUP_SIZE - 1
      options.push(`<option value="${group}">$${start}\u2013$${end}</option>`)

      const rows: string[] = []
      for (let i = 0; i < GROUP_SIZE; i++) {
        rows.push(
          `<div class="register-row">
            <span class="register-name">$${start + i}</span>
            <span class="register-hex">${this.simulator.getRegisterValue(new String(start + i))}</span>
          </div>`
        )
      }
      const display = group === 0 ? "" : " style=\"display: none;\""
      groups.push(`<div id="gp-group-${group}" class="register-group"${display}>${rows.join("")}</div>`)
    }

    this.groupSelectTarget.innerHTML = options.join("")
    this.generalContainerTarget.innerHTML = groups.join("")
  }
}
