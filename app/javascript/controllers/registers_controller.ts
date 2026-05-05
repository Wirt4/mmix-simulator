import { Controller } from "@hotwired/stimulus"

const SPECIAL_REGISTERS = [
  "rA", "rB", "rC", "rD", "rE", "rF", "rG", "rH",
  "rI", "rJ", "rK", "rL", "rM", "rN", "rO", "rP",
  "rQ", "rR", "rS", "rT", "rTT", "rU", "rV", "rW",
  "rX", "rY", "rZ", "rBB", "rWW", "rXX", "rYY", "rZZ"
]

const GENERAL_REGISTER_COUNT = 256
const GROUP_SIZE = 32
const DEFAULT_VALUE = "0x0000000000000000"

export default class RegistersController extends Controller {
  static targets = ["specialContainer", "generalContainer", "groupSelect"]

  declare specialContainerTarget: HTMLElement
  declare generalContainerTarget: HTMLElement
  declare groupSelectTarget: HTMLSelectElement

  connect(): void {
    this.renderSpecialRegisters()
    this.renderGeneralRegisters()
  }

  switchGroup(): void {
    const selected = this.groupSelectTarget.value
    this.generalContainerTarget.querySelectorAll<HTMLElement>(".register-group").forEach((g) => {
      g.style.display = "none"
    })
    const target = document.getElementById(`gp-group-${selected}`)
    if (target) target.style.display = "block"
  }

  private renderSpecialRegisters(): void {
    this.specialContainerTarget.innerHTML = SPECIAL_REGISTERS.map((reg) =>
      `<div class="register-row">
        <span class="register-name">${reg}</span>
        <span class="register-hex">${DEFAULT_VALUE}</span>
      </div>`
    ).join("")
  }

  private renderGeneralRegisters(): void {
    const groupCount = GENERAL_REGISTER_COUNT / GROUP_SIZE
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
            <span class="register-hex">${DEFAULT_VALUE}</span>
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
