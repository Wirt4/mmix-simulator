import { describe, it, expect } from "vitest"
import TextFormatController from "../../app/javascript/controllers/text_format_controller"

describe("TextFormatController targets", () => {
  it("does not include 'lineNumbers' in static targets", () => {
    expect(TextFormatController.targets).not.toContain("lineNumbers")
  })

  it("does not include 'highlight' in static targets", () => {
    expect(TextFormatController.targets).not.toContain("highlight")
  })
})

describe("TextFormatController methods", () => {
  it("has no updateHighlight method", () => {
    const proto = TextFormatController.prototype as unknown as Record<string, unknown>
    expect(proto.updateHighlight).toBeUndefined()
  })

  it("has no handleKeydown method", () => {
    const proto = TextFormatController.prototype as unknown as Record<string, unknown>
    expect(proto.handleKeydown).toBeUndefined()
  })

  it("has no updateLineNumbers method", () => {
    const proto = TextFormatController.prototype as unknown as Record<string, unknown>
    expect(proto.updateLineNumbers).toBeUndefined()
  })
})
