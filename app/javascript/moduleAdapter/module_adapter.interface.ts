export interface IModuleAdapter {
  assembleMMIXAL(sourceCode: string): boolean
  getStdOut(): string
  getStdErr(): string
  simulateMMIX(): void
  intitializeMMIX(): void
  finalizeMMIX(): void
  isHalted(): boolean
  performInstructions(instructions: number): void
}
