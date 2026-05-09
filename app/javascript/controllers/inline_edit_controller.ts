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
    const input = this.formTarget.querySelector<HTMLInputElement>("input[type='text']")
    if (input) {
      input.focus()
      input.select()
    }
  }

  submit() {
    (this.formTarget as HTMLFormElement).requestSubmit()
  }
}
