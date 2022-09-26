import { expect, test, describe } from "vitest"
import { NodeTypes } from "../src/ast"
import { baseParse } from "../src/parser"

describe("compiler: parser", () => {
  describe("Interpolation", () => {
    test("simple interpolation", () => {
      const ast = baseParse("{{ message }}")
      expect(ast.children[0]).toEqual({
        type: NodeTypes.INTERPOLATION,
        content: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: "message"
        }
      })
    })
  })

  describe("element", () => {
    test("simple element div", () => {
      const ast = baseParse("<div></div>")

      expect(ast.children[0]).toEqual({
        type: NodeTypes.ELEMENT,
        tag: "div"
      })
    })
  })

  describe("text", () => {
    test("simple text", () => {
      const ast = baseParse("some text")
      expect(ast.children[0]).toEqual({
        type: NodeTypes.TEXT,
        content: "some text"
      })
    })
  })
})
