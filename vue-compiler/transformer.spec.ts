import { expect, test } from "vitest"
import { NodesType, RootNode } from "./ast"

test("transformer", () => {
  const ast: RootNode = {
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

  const transformedAST = {
    type: "FunctionDecl",
    id: {
      type: "Identifier",
      name: "render"
    },
    params: [],
    body: [
      {
        type: "ReturnStatement",
        return: {
          type: "CallExpression",
          callee: { type: "Identifier", name: "h" },
          argument: [
            {
              type: "StringLiteral",
              value: "div"
            },
            {
              type: "ArrayExpression",
              elements: [
                {
                  type: "CallExpression",
                  callee: { type: "Identifier", name: "h" },
                  arguments: [
                    { type: "StringLiteral", value: "p" },
                    { type: "StringLiteral", value: "Vue" }
                  ]
                },
                {
                  type: "CallExpression",
                  callee: { type: "Identifier", name: "h" },
                  arguments: [
                    { type: "StringLiteral", value: "p" },
                    { type: "StringLiteral", value: "Template" }
                  ]
                }
              ]
            }
          ]
        }
      }
    ]
  }
})
