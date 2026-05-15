import { EnumRegisterType, IRegisters, IRegisterData } from "./registers.interface"

const TYPE_CONFIG: Record<EnumRegisterType, { title: string; containerClass: string }> = {
  [EnumRegisterType.GENERAL]: { title: "General", containerClass: "general-container" },
  [EnumRegisterType.SPECIAL]: { title: "Special", containerClass: "special-container" },
}

export class Registers implements IRegisters {
  private container: HTMLElement
  private wrapper: HTMLElement
  private arrow: HTMLElement
  private isOpen: boolean
  private _tooltipEl: HTMLElement | null

  constructor(div: HTMLElement, type: EnumRegisterType) {
    this.isOpen = false
    const { title, containerClass } = TYPE_CONFIG[type]
    this.container = this.elementSelect(div, "register-group-container")
    this.container.classList.add(containerClass)
    const header = this.elementSelect(div, "register-subpanel-header")
    header.innerHTML += title
    this.wrapper = this.elementSelect(div, "register-subpanel-body")
    this.arrow = this.elementSelect(div, "spin-arrow")
    this._tooltipEl = null
  }

  render(registers: IRegisterData[]): void {
    const divs: string[] = new Array<string>(registers.length)
    for (let i = 0; i < registers.length; i++) {
      const zeroRegister = "0x0000000000000000"
      const { id, value, description } = registers[i]
      const activeClass = value !== zeroRegister ? " register-row--active" : ""
      const tooltip = description ? ` data-tooltip="${description}"` : ""

      const openDiv = `<div class="register-row${activeClass}"${tooltip}>`
      const identifier = `<span class="register-name">${id}</span>`
      const displayValue = `<span class="register-hex">${value}</span>`

      divs[i] = [openDiv, identifier, displayValue, "</div>"].join("")
    }
    this.container.innerHTML = divs.join("")
    this.attachTooltipListeners()
  }

  toggle(): void {
    this.wrapper.classList.toggle("register-subpanel-body--collapsed")
    this.arrow.classList.toggle("spin-arrow--open")
    this.isOpen = !this.isOpen
  }

  open(): void {
    this.toggleToState(this.isOpen)
  }

  close(): void {
    this.toggleToState(!this.isOpen)
  }

  private toggleToState(targetState: boolean) {
    if (targetState) return
    this.toggle()
  }

  private elementSelect(parent: HTMLElement, childName: string): HTMLElement {
    const child = parent.querySelector<HTMLElement>(`.${childName}`)
    if (!child) throw new Error(`Missing ${childName} element`)
    return child
  }

  private attachTooltipListeners(): void {
    this.container.querySelectorAll<HTMLElement>(".register-row[data-tooltip]").forEach((row) => {
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
}
