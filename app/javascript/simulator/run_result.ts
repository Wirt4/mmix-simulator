/** Reason execution stopped after runUserProgram() or resume(). */
export type RunResult =
  | { status: "halted" }
  | { status: "paused", atLine: number }
  | { status: "timeout" }
