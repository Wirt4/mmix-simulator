export function highlight(source: string): string {
  return source.split("\n").map(highlightLine).join("\n")
}

function highlightLine(line: string): string {
  if (line === "") return ""

  const commentIdx = findCommentStart(line)

  const codePart = commentIdx >= 0 ? line.substring(0, commentIdx) : line
  const commentPart = commentIdx >= 0 ? line.substring(commentIdx) : ""

  let result = highlightCode(codePart)

  if (commentPart) {
    result += `<span class="hl-comment">${escapeHtml(commentPart)}</span>`
  }

  return result
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function findCommentStart(line: string): number {
  let inString = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inString = !inString
    } else if (ch === '%' && !inString) {
      return i
    }
  }
  return -1
}

function highlightCode(code: string): string {
  if (code === "") return ""

  // Match: optional label, optional whitespace, optional opcode, optional operands
  const match = /^(\S+)?(\s+)(\S+)?(.*)$/.exec(code)
  if (!match) {
    // No structure found - treat as expression
    return `<span class="hl-expr">${escapeHtml(code)}</span>`
  }

  const [, label, gap1, opcode, rest] = match
  let result = ""

  if (label) {
    result += `<span class="hl-label">${escapeHtml(label)}</span>`
  }

  if (gap1) {
    result += escapeHtml(gap1)
  }

  if (opcode) {
    if (OPCODES.has(opcode)) {
      result += `<span class="hl-opcode">${escapeHtml(opcode)}</span>`
    } else {
      result += `<span class="hl-expr">${escapeHtml(opcode)}</span>`
    }
  }

  if (rest) {
    result += `<span class="hl-expr">${escapeHtml(rest)}</span>`
  }

  return result
}


