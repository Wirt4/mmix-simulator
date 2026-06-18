export interface IInput {
  getContents(): string
  unlock(): void
  edited: boolean
}
