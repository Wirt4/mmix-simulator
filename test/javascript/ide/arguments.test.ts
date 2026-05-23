import { describe, it, expect, beforeEach } from "vitest"
import { Arguments } from "../../../app/javascript/ide/arguments"
import { IArguments } from "../../../app/javascript/ide/arguments.interface"

describe("arugments tests", () => {

  let nput: HTMLInputElement
  let btn: HTMLButtonElement
  let args: IArguments

  beforeEach(() => {
    nput = document.createElement("input")
    btn = document.createElement("button")
    args = new Arguments(nput, btn)
  })

  it("hide() sets the element's type to 'hidden' and disables the button", () => {
    btn.disabled = false
    nput.type = "text"
    args.hide()
    expect(nput.type).toEqual("hidden")
    expect(btn.disabled).toEqual(true)
  })

  it("show() enables the button element with no change to input type", () => {
    nput.type = "hidden"
    args.show()
    expect(nput.type).toEqual("hidden")
    expect(btn.disabled).not.toEqual(true)
  })

  it("getContents() returns an array of arguments", () => {
    const expected = ["foo", "bar", "fizz"]
    nput.value = "foo bar fizz"
    expect(args.getContents()).toEqual(expected)
  })

  it("getContents() is tolerant of different spacing", () => {
    const expected = ["alpha", "beta", "omega"]
    nput.value = "alpha    beta\tomega"
    expect(args.getContents()).toEqual(expected)
  })

  it("clear() wipes the input element", () => {
    nput.value = "do ray mi"
    args.clear()
    expect(nput.value.length).toEqual(0)
  })

  it("toggle() switches the input field's visibility", () => {
    args.hide()
    args.show()

    expect(nput.type).toEqual("hidden")
    args.toggle()
    expect(nput.type).toEqual("text")
    args.toggle()
    expect(nput.type).toEqual("hidden")
  })
})
