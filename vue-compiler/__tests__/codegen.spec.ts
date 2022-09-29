import { expect, test, describe } from "vitest"
import { generate } from "../src/codegen"
import { baseParse } from "../src/parser"
import { transform } from "../src/transform"
import { transformElement } from "../src/transforms/transformElement"
import { transformExpression } from "../src/transforms/transformExpression"
import { transformText } from "../src/transforms/transformText"

describe("codegen", () => {
  test("string", () => {
    const ast = baseParse("hi")

    transform(ast)
    const { code } = generate(ast)

    expect(code).toMatchSnapshot()
  })

  test("interpolation", () => {
    const ast = baseParse("{{message}}")
    transform(ast, {
      nodeTransforms: [transformExpression]
    })

    const { code } = generate(ast)

    expect(code).toMatchSnapshot()
  })

  test("element", () => {
    const ast: any = baseParse("<div>hi, {{message}}</div>")
    transform(ast, {
      nodeTransforms: [transformExpression, transformElement, transformText]
    })

    const { code } = generate(ast)

    expect(code).toMatchSnapshot()
  })
})
