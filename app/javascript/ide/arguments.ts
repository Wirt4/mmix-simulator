import { IArguments } from "./arguments.interface"

export class Arguments implements IArguments {
  getContents(): string[] {
    return []
  }
  hide(): void { }
  show(): void { }
  clear(): void { }
}
