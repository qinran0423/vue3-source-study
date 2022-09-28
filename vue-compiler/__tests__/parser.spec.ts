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
        tag: "div",
        children: []
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

  test("hello world", () => {
    const ast = baseParse("<p>hi,{{message}}</p>")

    expect(ast.children[0]).toEqual({
      type: NodeTypes.ELEMENT,
      tag: "p",
      children: [
        {
          type: NodeTypes.TEXT,
          content: "hi,"
        },
        {
          type: NodeTypes.INTERPOLATION,
          content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: "message"
          }
        }
      ]
    })
  })

  test("Nested element", () => {
    const ast = baseParse("<div><p>hi</p>{{message}}</div>")
    expect(ast.children[0]).toEqual({
      type: NodeTypes.ELEMENT,
      tag: "div",
      children: [
        {
          type: NodeTypes.ELEMENT,
          tag: "p",
          children: [
            {
              type: NodeTypes.TEXT,
              content: "hi"
            }
          ]
        },
        {
          type: NodeTypes.INTERPOLATION,
          content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: "message"
          }
        }
      ]
    })
  })

  test("Should throw error when lock end tag", () => {
    expect(() => {
      baseParse("<div><span></div>")
    }).throw("缺少结束标签：span")
  })
})
