import { expect, test } from "vitest"
import { NodesType, TokenType } from "./ast"
import { parser } from "./parser"

test("parser", () => {
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

  const ast = {
    type: NodesType.Root,
    children: [
      {
        type: NodesType.Element,
        tag: "div",
        children: [
          {
            type: NodesType.Element,
            tag: "p",
            children: [
              {
                type: NodesType.Text,
                content: "Vue"
              }
            ]
          },
          {
            type: NodesType.Element,
            tag: "p",
            children: [
              {
                type: NodesType.Text,
                content: "Template"
              }
            ]
          }
        ]
      }
    ]
  }

  expect(parser(tokens)).toEqual(ast)
})

test("one tag", () => {
  const tokens = [
    { type: TokenType.TAG, name: "p" },
    { type: TokenType.TEXT, content: "Vue" },
    { type: TokenType.TAGEND, name: "p" }
  ]

  const ast = {
    type: NodesType.Root,
    children: [
      {
        type: NodesType.Element,
        tag: "p",
        children: [
          {
            type: NodesType.Text,
            content: "Vue"
          }
        ]
      }
    ]
  }
  expect(parser(tokens)).toEqual(ast)
})
