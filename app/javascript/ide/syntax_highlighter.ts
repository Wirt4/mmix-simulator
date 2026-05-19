export function highlight(source: string): string {
  return source.split('\n').map(highlightLine).join('\n')
}

function highlightLine(line: string): string {
  if (line === "") return line

  const commentIdx = findCommentStart(line)

  if (commentIdx < 0) return highlightCode(line)

  return [highlightCode(line.substring(0, commentIdx)), span(line.substring(commentIdx), "hl-comment")].join("")
}

function findCommentStart(line: string): number {
  let inString = false

  for (let ndx = 0; ndx < line.length; ndx++) {
    const ch = line[ndx]

    if (ch === '"') {
      inString = !inString
      continue
    }

    if (!inString && ch === '%') {
      return ndx
    }

  }

  return -1
}

function highlightCode(code: string): string {
  if (code === "") return code

  const m = new MMIXMatch(code)

  if (!m.isValid) return span(code)

  const result = []

  if (m.label) {
    result.push(span(m.label, "hl-label"))
  }

  if (m.blankSpace) {
    result.push(escapeHtml(m.blankSpace))
  }

  if (m.opCode) {
    const cssClass = OPCODES.has(m.opCode) ? "hl-opcode" : "hl-expr"
    result.push(span(m.opCode, cssClass))
  }

  if (m.remainder) {
    result.push(span(m.remainder))
  }

  return result.join("")
}

class MMIXMatch {
  public isValid: boolean
  public label: string | null
  public blankSpace: string | null
  public opCode: string | null
  public remainder: string | null

  constructor(line: string) {
    const match = /^(\S+)?(\s+)(\S+)?(.*)$/.exec(line)
    if (!match) {
      this.isValid = false
      this.label = null
      this.blankSpace = null
      this.opCode = null
      this.remainder = null
      return
    }
    this.isValid = true
    const [, label, gap, opcode, remainder] = match
    this.label = label
    this.blankSpace = gap
    this.opCode = opcode
    this.remainder = remainder
  }
}

function span(content: string, cssClass: string = "hl-expr"): string {
  return `<span class="${cssClass}">${escapeHtml(content)}</span>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

const OPCODES = new Set([
  "TRAP", "FCMP", "FUN", "FEQL", "FADD", "FIX", "FSUB", "FIXU",
  "FLOT", "FLOTU", "SFLOT", "SFLOTU", "FMUL", "FCMPE", "FUNE", "FEQLE",
  "FDIV", "FSQRT", "FREM", "FINT", "MUL", "MULU", "DIV", "DIVU",
  "ADD", "ADDU", "SUB", "SUBU", "2ADDU", "4ADDU", "8ADDU", "16ADDU",
  "CMP", "CMPU", "NEG", "NEGU", "SL", "SLU", "SR", "SRU",
  "BN", "BZ", "BP", "BOD", "BNN", "BNZ", "BNP", "BEV",
  "PBN", "PBZ", "PBP", "PBOD", "PBNN", "PBNZ", "PBNP", "PBEV",
  "CSN", "CSZ", "CSP", "CSOD", "CSNN", "CSNZ", "CSNP", "CSEV",
  "ZSN", "ZSZ", "ZSP", "ZSOD", "ZSNN", "ZSNZ", "ZSNP", "ZSEV",
  "LDB", "LDBU", "LDW", "LDWU", "LDT", "LDTU", "LDO", "LDOU",
  "LDSF", "LDHT", "CSWAP", "LDUNC", "LDVTS", "PRELD", "PREGO", "GO",
  "STB", "STBU", "STW", "STWU", "STT", "STTU", "STO", "STOU",
  "STSF", "STHT", "STCO", "STUNC", "SYNCD", "PREST", "SYNCID", "PUSHGO",
  "OR", "ORN", "NOR", "XOR", "AND", "ANDN", "NAND", "NXOR",
  "BDIF", "WDIF", "TDIF", "ODIF", "MOR", "MXOR", "SETH", "SETMH",
  "SETML", "SETL", "INCH", "INCMH", "INCML", "INCL", "ORH", "ORMH",
  "ORML", "ORL", "ANDNH", "ANDNMH", "ANDNML", "ANDNL",
  "JMP", "PUSHJ", "GETA", "PUT", "POP", "RESUME", "SAVE", "UNSAVE",
  "SYNC", "SWYM", "GET", "TRIP", "SET", "LDA",
  "LOC", "IS", "GREG", "BYTE", "WYDE", "TETRA", "OCTA", "PREFIX"
])
