export interface IInput {
  getContents(): string
  //  trim(): void
  readonly size: number
  unlock(): void
  edited: boolean
}
