/** A code editor formatter that manages line numbers, scrolling, and keyboard input. */
export interface IFormatter {
  /** Recalculates and renders line numbers to match the current content. */
  updateLineNumbers(): void
  /** Synchronizes the line number gutter scroll position with the editor. */
  syncScroll(): void
  /** Handles keydown events for editor-specific behavior (e.g. Tab indentation). */
  handleKeydown(event: KeyboardEvent): void
}
