import { describe, it, expect } from "vitest"
import { highlight } from "../../../app/javascript/ide/syntax_highlighter"

const HELLO_WORLD = `        LOC   #100                   % Set the address of the program
                                     % initially to 0x100.

Main    GETA  $255,string            % Put the address of the string
                                     % into register 255.

        TRAP  0,Fputs,StdOut         % Write the string pointed to by
                                     % register 255 to the standard
                                     % output file.

        TRAP  0,Halt,0               % End process.

string  BYTE  "Hello, World!",#a,0   % String to be printed.  #a is
                                     % newline, 0 terminates the
                                     % string.`

const DATA_SEGMENT = `        LOC   Data_Segment
        GREG  @
Fname   BYTE  "stress.txt",0
        LOC   (@+7)&-8
Buf     OCTA  Fname,TextRead`

const ARITHMETIC = `        LOC   #100
Main    SET   $1,42
        SET   $2,8
        ADD   $3,$1,$2
        ADDU  $4,$1,$2
        SUB   $5,$1,$2
        MUL   $6,$1,$2
        DIV   $7,$1,$2
        TRAP  0,Halt,0`

const BRANCHING = `        LOC   #100
Main    SETL  $1,10
Loop    SUB   $1,$1,1
        BN    $1,Done
        JMP   Loop
Done    TRAP  0,Halt,0`

describe("syntax highlighter snapshots", () => {
  it("hello world program", () => {
    expect(highlight(HELLO_WORLD)).toMatchSnapshot()
  })

  it("data segment with GREG and OCTA", () => {
    expect(highlight(DATA_SEGMENT)).toMatchSnapshot()
  })

  it("arithmetic operations", () => {
    expect(highlight(ARITHMETIC)).toMatchSnapshot()
  })

  it("branching and jumps", () => {
    expect(highlight(BRANCHING)).toMatchSnapshot()
  })

  it("single comment-only line", () => {
    expect(highlight("% just a comment")).toMatchSnapshot()
  })

  it("line with label, opcode, operands, and comment", () => {
    expect(highlight("Main    GETA  $255,string  % load address")).toMatchSnapshot()
  })

  it("line with only whitespace and opcode", () => {
    expect(highlight("        TRAP  0,Halt,0")).toMatchSnapshot()
  })

  it("empty input", () => {
    expect(highlight("")).toMatchSnapshot()
  })
})
