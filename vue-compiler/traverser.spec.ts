import { expect, test } from "vitest"
import { NodesType, RootNode } from "./ast"
import { taverser, Visitor } from "./traverser"

test("traverse", () => {
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

  const callArr: any = []
  const visitor: Visitor = {
    Root: {
      enter(node, parent) {
        callArr.push(["root-enter", node.type, ""])
      },
      exit(node, parent) {
        callArr.push(["root-exit", node.type, ""])
      }
    },
    Element: {
      enter(node, parent) {
        callArr.push(["element-enter", node.type, parent!.type])
      },
      exit(node, parent) {
        callArr.push(["element-exit", node.type, parent!.type])
      }
    },
    Text: {
      enter(node, parent) {
        callArr.push(["text-enter", node.type, parent!.type])
      },
      exit(node, parent) {
        callArr.push(["text-exit", node.type, parent!.type])
      }
    }
  }

  taverser(ast, visitor)

  expect(callArr).toEqual([
    ["root-enter", NodesType.Root, ""],
    ["element-enter", NodesType.Element, NodesType.Root],
    ["element-enter", NodesType.Element, NodesType.Element],
    ["text-enter", NodesType.Text, NodesType.Element],
    ["text-exit", NodesType.Text, NodesType.Element],
    ["element-exit", NodesType.Element, NodesType.Element],
    ["element-enter", NodesType.Element, NodesType.Element],
    ["text-enter", NodesType.Text, NodesType.Element],
    ["text-exit", NodesType.Text, NodesType.Element],
    ["element-exit", NodesType.Element, NodesType.Element],
    ["element-exit", NodesType.Element, NodesType.Root],
    ["root-exit", NodesType.Root, ""]
  ])
})
