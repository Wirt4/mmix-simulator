import { Controller } from "@hotwired/stimulus"

export default class InlineEditController extends Controller {
  static targets = ["display", "form"]

  declare displayTarget: HTMLElement
  declare formTarget: HTMLElement

  connect() {
    this.formTarget.hidden = true
  }

  edit() {
    this.displayTarget.hidden = true
    this.formTarget.hidden = false
    const input = this.formTarget.querySelector("input[type='text']") as HTMLInputElement | null
    input?.focus()
    input?.select()
  }

  submit() {
    (this.formTarget as HTMLFormElement).requestSubmit()
  }
}
