import { EnumRegisterType, IRegisters, IRegisterData } from "./registers.interface"

const TYPE_CONFIG: Record<EnumRegisterType, { label: string; containerClass: string }> = {
  [EnumRegisterType.GENERAL]: { containerClass: "general-container", label: "general-purpose-registers" },
  [EnumRegisterType.SPECIAL]: { containerClass: "special-container", label: "special-registers" },
}

export class Registers implements IRegisters {
  private container: HTMLElement
  private wrapper: HTMLElement
  private arrow: HTMLElement
  private isOpen: boolean
  private _tooltipEl: HTMLElement | null

  constructor(div: HTMLElement, type: EnumRegisterType) {
    this.isOpen = false
    const { label, containerClass } = TYPE_CONFIG[type]
    this.container = this.elementSelect(div, "register-group-container")
    this.container.classList.add(containerClass)
    const header = this.elementSelect(div, "register-subpanel-header")
    header.classList.add(label)
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

  private temp(): void {
    // information hidden: 
    // - selection of html elements by class
    // - attaching mouse listeners to selected elements
    // - generating html elements for tootip style 
    // inputs: NodeList Object "registerRows"
    // outputs: none
    // precondtions: registerRows do not have tooltips attached or mouse events added
    // postcondtions: registerRows have tooltips attaced and mose events listeners set 
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
  // information hidden: 
  // - selection of html elements by class
  // - attaching mouse listeners to selected elements
  // - generating html elements for tootip style 
  // inputs: NodeList Object "registerRows"
  // outputs: none
  // precondtions: registerRows do not have tooltips attached or mouse events added
  // postcondtions: registerRows have tooltips attaced and mose events listeners set 

  private attachTooltipListeners(registerRows: NodeList): void {
    // define a temporary elements
    const toolTip = new ToolTip()

    // iterate through registerRows with ForEach loop
    registerRows.forEach(row => {
      if (!(row instanceof HTMLElement && row.classList.contains("register-row[data-tooltip]"))) return;
      const txt = row.dataset.tooltip
      if (!txt) return
      toolTip.setText(txt)
      row.addEventListener("mouseover", toolTip.addDiv)
      row.addEventListener("mouseleave", toolTip.removeDiv)

    })
  }
}

class ToolTip {
  private txt = ""
  private tempDiv: HTMLElement | null = null

  setText(txt: string): void {
    this.txt = txt
  }

  addDiv(): void {
    // create the document element
    const div = document.createElement("div")
    // set the contents
    div.textContent = this.txt
    //place it
    document.appendChild(div)
    //size it
    const { top, left } = this.size(div)
    //style it
    div.style.top = `${top.toString()}px`
    div.style.left = `${left.toString()}px`
    div.className = "register-tooltip"
    // set tempDiv to refer to it
    this.tempDiv = div
  }
  removeDiv(): void {
    //remove tempDiv from the parent node
    this.tempDiv?.remove()
    //nullify tempDiv
    this.tempDiv = null
  }

  // information hidden: how the element is placed in the document, and has it's bounding box sized appropriatley
  // inputs: an HTMLElement and a leftMargin
  // ouputs: {number, number} object containing top and left
  // preconditions: div is a child of the document
  // postconditions: none
  private size(div: HTMLElement, leftMargin: number = 8): { top: number, left: number } {
    // set result to 0,0
    const result = { top: 0, left: 0 }
    // if div is not a child of document, return early
    if (!document.contains(div)) return result
    // get the bounding box
    const rect = div.getBoundingClientRect()
    // calculate the top coordinate
    result.top = this.calculateTopCoord(div, rect)//rect.top + (rect.height / 2) - (div.offsetHeight / 2)
    // calculate the left coordinate (with a margin to avoid butt edges)
    result.left = rect.left - div.offsetWidth - leftMargin
    // return the answer
    return result
  }

  private calculateTopCoord(div: HTMLElement, rect: DOMRect): number {
    // set result to the top edge position of the div
    let result = rect.top
    // shift result down to vertical midpoint
    result += rect.height / 2
    // back it up by half the div's height
    result -= div.offsetHeight / 2
    // return the adjusted result
    return result
  }
}
