export interface IInput {
  /**returns the code entered by the user in the editable form **/
  getContents(): string
  pad(lines: number): void
  readonly size: number
}
