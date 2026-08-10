export interface IInput {
  getContents(): string
  unlock(): void
  edited: boolean
  //possibly add static extensions/config method?
}
