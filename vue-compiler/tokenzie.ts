import { Token, TokenTag, TokenText, TokenType } from "./ast"

enum STATE {
  INITIAL,
  TAGOPEN,
  TAGNAME,
  TEXT,
  TAGEND,
  TAGENDNAME
}

function isAlpha(char) {
  return (char >= "a" && char <= "z") || (char >= "A" && char <= "Z")
}

export function tokenzie(code: string) {
  // 初始状态
  let currentState = STATE.INITIAL
  const tokens: Token[] = []
  const chars: string[] = []
  while (code) {
    const char = code[0]

    switch (currentState) {
      case STATE.INITIAL:
        if (char === "<") {
          currentState = STATE.TAGOPEN
          code = code.slice(1)
        } else if (isAlpha(char)) {
          currentState = STATE.TEXT
          chars.push(char)
          code = code.slice(1)
        }
        break

      case STATE.TAGOPEN:
        if (isAlpha(char)) {
          currentState = STATE.TAGNAME
          chars.push(char)
          code = code.slice(1)
        } else if (char === "/") {
          currentState = STATE.TAGEND
          code = code.slice(1)
        }
        break
      case STATE.TAGNAME:
        if (isAlpha(char)) {
          chars.push(char)
          code = code.slice(1)
        } else if (char === ">") {
          currentState = STATE.INITIAL
          tokens.push({
            type: TokenType.TAG,
            name: chars.join("")
          })
          chars.length = 0
          code = code.slice(1)
        }
        break
      case STATE.TEXT:
        if (isAlpha(char)) {
          chars.push(char)
          code = code.slice(1)
        } else if (char === "<") {
          currentState = STATE.TAGOPEN
          tokens.push({
            type: TokenType.TEXT,
            content: chars.join("")
          })
          chars.length = 0
          code = code.slice(1)
        }
        break
      case STATE.TAGEND:
        if (isAlpha(char)) {
          currentState = STATE.TAGENDNAME
          chars.push(char)
          code = code.slice(1)
        }
        break
      case STATE.TAGENDNAME:
        if (isAlpha(code)) {
          chars.push(char)
          code = code.slice(1)
        } else if (char === ">") {
          currentState = STATE.INITIAL
          tokens.push({
            type: TokenType.TAGEND,
            name: chars.join("")
          })

          chars.length = 0
          code = code.slice(1)
        }
        break
    }
  }

  return tokens
}
