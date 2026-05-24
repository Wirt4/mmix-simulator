import { IOutputPanel } from './output_panel.interface'

export default class OutputPanel implements IOutputPanel {
  private textarea: HTMLTextAreaElement

  constructor(private container: HTMLElement) {
    const ta = container.querySelector<HTMLTextAreaElement>("textarea")
    if (!ta) throw new Error("OutputPanel: no textarea found in container")
    this.textarea = ta
    this.textarea.value = ""
    this.hide()
  }
  clear(): void {
    this.textarea.value = ""
    this.hide()
  }
  setValue(text: string): void {
    this.textarea.value = text
    if (text) {
      this.show()
    } else {
      this.hide()
    }
  }

  hide(): void {
    this.container.hidden = true
  }

  show(): void {
    this.container.hidden = false
  }
}
