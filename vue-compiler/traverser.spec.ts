import { expect, test } from "vitest"
import { NodesType } from "./ast"
import { taverser } from "./taverser"

test("traverse", () => {
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

  const callArr: any = []
  const visitor = {
    Root: {
      enter() {
        callArr.push("root-enter")
      },
      exit() {
        callArr.push("root-exit")
      }
    },
    Element: {
      enter() {
        callArr.push("element-enter")
      },
      exit() {
        callArr.push("element-exit")
      }
    },
    Text: {
      enter() {
        callArr.push("text-enter")
      },
      exit() {
        callArr.push("text-exit")
      }
    }
  }

  taverser(ast, visitor)

  expect(callArr).toEqual([
    "root-enter",
    "element-enter",
    "element-enter",
    "text-enter",
    "text-exit",
    "element-exit",
    "element-enter",
    "text-enter",
    "text-exit",
    "element-exit",
    "element-exit",
    "root-exit"
  ])
})
