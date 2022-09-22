import { expect, test } from "vitest"
import { TokenType } from "./ast"
import { tokenzie } from "./tokenzie"

test("tokenzie", () => {
  const code = "<p>Vue</p>"

  const tokens = [
    { type: TokenType.TAG, name: "p" },
    { type: TokenType.TEXT, content: "Vue" },
    { type: TokenType.TAGEND, name: "p" }
  ]

  expect(tokenzie(code)).toEqual(tokens)
})

test("tag", () => {
  const code = "<p>"
  const tokens = [{ type: TokenType.TAG, name: "p" }]
  expect(tokenzie(code)).toEqual(tokens)
})

test("text && tagEnd", () => {
  const code = "Vue</p>"
  const tokens = [
    { type: TokenType.TEXT, content: "Vue" },
    { type: TokenType.TAGEND, name: "p" }
  ]
  expect(tokenzie(code)).toEqual(tokens)
})

test("div && p", () => {
  const code = "<div><p>Vue</p><p>Template</p></div>"
  const tokens = [
    { type: TokenType.TAG, name: "div" },
    { type: TokenType.TAG, name: "p" },
    { type: TokenType.TEXT, content: "Vue" },
    { type: TokenType.TAGEND, name: "p" },
    { type: TokenType.TAG, name: "p" },
    { type: TokenType.TEXT, content: "Template" },
    { type: TokenType.TAGEND, name: "p" },
    { type: TokenType.TAGEND, name: "div" }
  ]

  expect(tokenzie(code)).toEqual(tokens)
})
