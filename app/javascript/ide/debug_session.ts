import { IDebugSession } from './debug_session.interface'

export class DebugSession implements IDebugSession {
  private _breakpoints: number[] = []

  constructor(private _onBreakpointsChange: () => void) {}

  get breakpoints(): number[] {
    return this._breakpoints
  }

  set breakpoints(lines: number[]) {
    this._breakpoints = lines
    this._onBreakpointsChange()
  }
}
