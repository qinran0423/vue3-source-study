import { expect, test, describe } from "vitest"
import { NodeTypes } from "../src/ast"
import { baseParse } from "../src/parser"
import { transform } from "../src/transform"

describe("transform", () => {
  test("happy", () => {
    const ast = baseParse("<div>hi,{{message}}</div>")

    const plugin = (node) => {
      if (node.type === NodeTypes.TEXT) {
        node.content = node.content + "mini-vue"
      }
    }

    transform(ast, {
      nodeTransforms: [plugin]
    })

    const nodeText = ast.children[0].children[0]

    expect(nodeText.content).toBe("hi,mini-vue")
  })
})
