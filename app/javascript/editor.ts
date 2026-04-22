import type { SelectionRange, IEditor } from "./editor.interface"

/**
 * A code editor that pairs a textarea with a line number gutter.
 * Supports Tab-key indentation and synchronized scrolling.
 */
export default class Editor implements IEditor {
  private readonly textarea: HTMLTextAreaElement
  private readonly lineNumbers: HTMLElement

  constructor(textarea: HTMLTextAreaElement, lineNumbers: HTMLElement) {
    this.textarea = textarea
    this.lineNumbers = lineNumbers
  }

  /**
   * Recalculates and renders line numbers to match the current textarea content.
   */
  updateLineNumbers(): void {
    const numLines = this.textarea.value.split("\n").length
    this.lineNumbers.innerHTML = this._generateLineNumbers(numLines)
  }

  /**
   * Synchronizes the line number gutter scroll position with the textarea.
   */
  syncScroll(): void {
    this.lineNumbers.scrollTop = this.textarea.scrollTop
  }

  /**
   * Handles keydown events on the textarea. Intercepts Tab to insert spaces
   * instead of the default focus change.
   */
  handleKeydown(event: KeyboardEvent): void {
    if (event.key === "Tab") {
      const numSpaces = 2
      event.preventDefault()
      const selection: SelectionRange = { start: this.textarea.selectionStart, end: this.textarea.selectionEnd }
      this._insertChars(selection, numSpaces, " ")
      this._advanceSelection(selection.start, numSpaces)
      this.updateLineNumbers()
    }
  }

  /**
   * Generates HTML span elements for each line number.
   */
  private _generateLineNumbers(numLines: number): string {
    const numbers: string[] = []
    for (let i = 1; i <= numLines; i++) {
      numbers.push(`<span>${String(i)}</span>`)
    }
    return numbers.join("")
  }

  /**
   * Replaces the current selection with repeated characters.
   */
  private _insertChars({ start, end }: SelectionRange, delimiterCount: number, char: string): void {
    const { value } = this.textarea
    const space = char.repeat(delimiterCount)
    const newValue = value.substring(0, start) + space + value.substring(end)
    this.textarea.value = newValue
  }

  /**
   * Moves the cursor forward after an insertion.
   */
  private _advanceSelection(start: number, numChars: number): void {
    this.textarea.selectionStart = this.textarea.selectionEnd = start + numChars
  }
}
