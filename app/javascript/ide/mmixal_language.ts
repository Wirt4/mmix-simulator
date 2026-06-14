import { StreamLanguage } from "@codemirror/language"
import { tags } from "@lezer/highlight"
import { OpCode, AssemblerDirective } from "../simulator/opcodes"

const OPCODES = new Set(Object.values(OpCode))
const DIRECTIVES = new Set(Object.values(AssemblerDirective))

interface MmixalState {
  inString: boolean
}

export const mmixal = StreamLanguage.define<MmixalState>({
  name: "mmixal",

  startState(): MmixalState {
    return { inString: false }
  },

  token(stream, state) {
    if (stream.match(/\s+/)) return null

    if (state.inString) {
      if (stream.match(/[^"]+/)) return "string"
      if (stream.eat('"')) { state.inString = false; return "string" }
    }

    if (stream.match(/%.*/)) return "comment"

    if (stream.eat('"')) {
      state.inString = true
      stream.match(/[^"]*/)
      if (stream.eat('"')) state.inString = false
      return "string"
    }

    if (stream.match(/[A-Za-z_][A-Za-z0-9_]*/)) {
      const word = stream.current()
      if (OPCODES.has(word as OpCode)) return "keyword"
      if (DIRECTIVES.has(word as AssemblerDirective)) return "definitionKeyword"
      return "variableName"
    }

    if (stream.match(/#[0-9A-Fa-f]+/) || stream.match(/[0-9]+/)) return "number"

    stream.next()
    return null
  },

  languageData: {
    commentTokens: { line: "%" },
  },
})

export const mmixalHighlightStyle = [
  { tag: tags.comment, class: "hl-comment" },
  { tag: tags.keyword, class: "hl-opcode" },
  { tag: tags.definitionKeyword, class: "hl-directive" },
  { tag: tags.variableName, class: "hl-label" },
  { tag: tags.number, class: "hl-expr" },
  { tag: tags.string, class: "hl-expr" },
]
