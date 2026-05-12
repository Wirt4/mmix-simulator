import { IRegisterPanel } from './register_panel.interface'
import { ISimulator } from '../simulator/simulator.interface'
import { assert } from '../utils'

const GROUP_SIZE = 32
const ZERO_REGISTER = "0x0000000000000000"

export default class RegisterPanel implements IRegisterPanel {
  private _generalRegistersRendered = false
  private _tooltipEl: HTMLElement | null = null

  constructor(
    private readonly specialContainerEl: HTMLElement,
    private readonly generalContainerEl: HTMLElement,
    private readonly groupSelectEl: HTMLSelectElement,
    private readonly simulator: ISimulator
  ) {}

  renderSpecialRegisters(): void {
    this.specialContainerEl.innerHTML = this.simulator.specialRegisters.map((reg) => {
      const tooltip = this.simulator.getRegisterDescription(reg)
      return this.createRegisterDiv(reg, tooltip)
    }).join("")
    this.attachTooltipListeners()
  }

  renderGeneralRegisters(): void {
    this.groupSelectEl.innerHTML = this.renderDropDown(GROUP_SIZE)
    this.generalContainerEl.innerHTML = this.renderRegisters(GROUP_SIZE)
    this._generalRegistersRendered = true
  }

  openAllSubpanels(): void {
    const registerPanel = this.specialContainerEl.closest(".register-panel")
    if (!registerPanel) return
    registerPanel.querySelectorAll<HTMLElement>(".register-subpanel").forEach((subpanel) => {
      const body = subpanel.querySelector<HTMLElement>(".register-subpanel-body")
      const arrow = subpanel.querySelector<HTMLElement>(".spin-arrow")
      if (body) body.classList.remove("register-subpanel-body--collapsed")
      if (arrow) arrow.classList.add("spin-arrow--open")
    })
  }

  switchTab(): void {
    if (!this._generalRegistersRendered) {
      throw new Error("general registers not rendered")
    }
    const selected = this.groupSelectEl.value
    this.generalContainerEl.querySelectorAll<HTMLElement>(".register-group").forEach((g) => {
      g.style.display = "none"
    })
    const target = document.getElementById(`gp-group-${selected}`)
    if (target) target.style.display = "block"
  }

  toggleSubpanel(event: Event): void {
    const header = event.currentTarget as HTMLElement
    const body = header.nextElementSibling as HTMLElement
    const arrow = header.querySelector(".spin-arrow")
    if (!arrow) return
    body.classList.toggle("register-subpanel-body--collapsed")
    arrow.classList.toggle("spin-arrow--open")
  }

  private attachTooltipListeners(): void {
    this.specialContainerEl.querySelectorAll<HTMLElement>(".register-row[data-tooltip]").forEach((row) => {
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
        this._tooltipEl = toolTip
      })
      row.addEventListener("mouseleave", () => {
        this._tooltipEl?.remove()
        this._tooltipEl = null
      })
    })
  }

  private renderDropDown(groupSize: number): string {
    assert(groupSize > 0 && Number.isInteger(groupSize), "groupSize must be a positive integer")
    if (groupSize <= 0) { return "" }
    const groupCount = Math.floor(this.simulator.generalRegisterCount / groupSize)
    const arr = new Array<string>(groupCount)
    for (let i = 0; i < groupCount; i++) {
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

    const regCount = this.simulator.generalRegisterCount
    assert(Number.isInteger(regCount), "regCount must be a non-negative integer")

    const groupCount = Math.floor(regCount / groupSize)
    const arr = new Array<string>(this.simulator.generalRegisterCount + (2 * groupCount))
    arr[0] = '<div id="gp-group-0" class="register-group">'
    let p = 1;

    for (let i = 0; i < regCount; i++) {
      if (i % groupSize === 0 && i != 0) {
        arr[p] = `</div><div id="gp-group-${(i / groupSize).toString()}" class="register-group" style="display: none;">`
        p++;
      }
      arr[p] = this.createRegisterDiv(i.toString())
      p++
      if (i === regCount - 1) {
        arr[p] = "</div>"
      }
    }

    return arr.join("")
  }

  private createRegisterDiv(reg: string, tooltip?: string): string {
    const val = this.simulator.getRegisterValue(reg)
    const activeClass = val !== ZERO_REGISTER ? " register-row--active" : ""
    const tooltipAttr = tooltip ? ` data-tooltip="${tooltip}"` : ""
    return `<div class="register-row${activeClass}"${tooltipAttr}><span class="register-name">$${reg}</span><span class="register-hex">${val}</span></div>`
  }
}
