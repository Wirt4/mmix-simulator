import { describe, expect, it } from "vitest"
import { highlight } from "../../../app/javascript/ide/syntax_highlighter"

describe("syntax_highlighter", () => {
  describe("comments", () => {
    it("highlights a full-line comment", () => {
      const result = highlight("% this is a comment")

      expect(result).toBe('<span class="hl-comment">% this is a comment</span>')
    })

    it("highlights an inline comment after code", () => {
      const result = highlight("        LOC   #100   % set location")

      expect(result).toContain('<span class="hl-comment">% set location</span>')
    })

    it("does not treat % inside a string as a comment", () => {
      const result = highlight('        BYTE  "100%",0')

      expect(result).not.toContain('hl-comment')
    })
  })

  describe("labels", () => {
    it("highlights a label at the start of a line", () => {
      const result = highlight("Main    GETA  $255,string")

      expect(result).toContain('<span class="hl-label">Main</span>')
    })

    it("highlights a label with mixed case", () => {
      const result = highlight("RLoop   SUB   $1,$1,1")

      expect(result).toContain('<span class="hl-label">RLoop</span>')
    })
  })

  describe("opcodes", () => {
    it("highlights a known opcode", () => {
      const result = highlight("        TRAP  0,Halt,0")

      expect(result).toContain('<span class="hl-opcode">TRAP</span>')
    })

    it("highlights LOC as an opcode", () => {
      const result = highlight("        LOC   #100")

      expect(result).toContain('<span class="hl-opcode">LOC</span>')
    })

    it("highlights BYTE as an opcode", () => {
      const result = highlight("        BYTE  \"Hello\",0")

      expect(result).toContain('<span class="hl-opcode">BYTE</span>')
    })

    it("highlights GREG as an opcode", () => {
      const result = highlight("        GREG  @")

      expect(result).toContain('<span class="hl-opcode">GREG</span>')
    })

    it("highlights SET as an opcode", () => {
      const result = highlight("        SET   $1,$2")

      expect(result).toContain('<span class="hl-opcode">SET</span>')
    })

    it("does not highlight an unknown word as an opcode", () => {
      const result = highlight("        foo   bar")

      expect(result).not.toContain('hl-opcode')
      expect(result).toContain('<span class="hl-expr">foo</span>')
    })
  })

  describe("expressions", () => {
    it("highlights operands as expressions", () => {
      const result = highlight("        GETA  $255,string")

      expect(result).toContain('<span class="hl-expr">  $255,string</span>')
    })

    it("highlights hex values in operands", () => {
      const result = highlight("        LOC   #100")

      expect(result).toContain('<span class="hl-expr">   #100</span>')
    })
  })

  describe("multiline", () => {
    it("highlights multiple lines independently", () => {
      const source = "Main    LDA   $255,Text\n        TRAP  0,Fputs,StdOut"
      const result = highlight(source)

      expect(result).toContain('<span class="hl-label">Main</span>')
      expect(result).toContain('<span class="hl-opcode">LDA</span>')
      expect(result).toContain('<span class="hl-opcode">TRAP</span>')
    })

    it("preserves empty lines", () => {
      const source = "Main    LDA   $255,Text\n\n        TRAP  0,Halt,0"
      const result = highlight(source)
      const lines = result.split("\n")

      expect(lines).toHaveLength(3)
      expect(lines[1]).toBe("")
    })
  })

  describe("edge cases", () => {
    it("handles empty string", () => {
      const result = highlight("")

      expect(result).toBe("")
    })

    it("escapes HTML entities in source", () => {
      const result = highlight("% <script>alert('xss')</script>")

      expect(result).toContain("&lt;script&gt;")
      expect(result).not.toContain("<script>")
    })

    it("handles a line with only a label and opcode, no operands", () => {
      const result = highlight("Main    SYNC")

      expect(result).toContain('<span class="hl-label">Main</span>')
      expect(result).toContain('<span class="hl-opcode">SYNC</span>')
    })

    it("handles a line that is only whitespace and opcode (no label)", () => {
      const result = highlight("        ADD   $1,$2,$3")

      expect(result).not.toContain('hl-label')
      expect(result).toContain('<span class="hl-opcode">ADD</span>')
    })
  })
})
