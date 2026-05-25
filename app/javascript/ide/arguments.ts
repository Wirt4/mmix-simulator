import { IArguments } from "./arguments.interface"

export class Arguments implements IArguments {

  constructor(private input: HTMLInputElement, private button: HTMLButtonElement) { }

  getContents(): string[] {
    return this.input.value.split(/\s+/)
  }

  hide(): void {
    this.button.disabled = true
    this.hideField()
  }

  show(): void {
    this.button.disabled = false
  }

  clear(): void {
    this.input.value = ""
  }

  toggle(): void {
    if (this.fieldHidden) {
      this.showField()
      return
    }
    this.hideField()
  }

  private showField(): void {
    this.setType("text")
  }

  private hideField(): void {
    this.setType("hidden")
  }

  private get fieldHidden(): boolean {
    return this.input.type === "hidden"
  }

  private setType(type: string): void {
    this.input.type = type
  }

}
