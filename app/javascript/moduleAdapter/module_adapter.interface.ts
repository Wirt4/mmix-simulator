export interface IModuleAdapter {
  assembleMMIXAL(sourceCode: string): boolean
  getStdOut(): string
  getStdErr(): string
  intitializeMMIX(): void
  finalizeMMIX(): void
  isHalted(): boolean
  performInstructions(instructions: number): void
}
