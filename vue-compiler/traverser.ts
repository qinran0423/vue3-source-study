import { NodesType, RootNode, ChildNode, ElementNode } from "./ast"

type ParentNode = RootNode | ElementNode | undefined
type MethodFn = (node: RootNode | ChildNode, parent: ParentNode) => void

interface VisitorOption {
  enter: MethodFn
  exit: MethodFn
}

export interface Visitor {
  Root: VisitorOption
  Element: VisitorOption
  Text: VisitorOption
}

export function taverser(rootNode: RootNode, visitor: Visitor) {
  function traverseArray(array, parent) {
    array.forEach((node) => {
      traverseNode(node, parent)
    })
  }

  function traverseNode(node: RootNode | ChildNode, parent?: ParentNode) {
    const visitorObj = visitor[node.type]

    if (visitorObj) {
      visitorObj.enter(node, parent)
    }

    switch (node.type) {
      case NodesType.Root:
        traverseArray(node.children, node)
        break
      case NodesType.Element:
        traverseArray(node.children, node)
        break
      case NodesType.Text:
        break
    }

    if (visitorObj) {
      visitorObj.exit(node, parent)
    }
  }

  traverseNode(rootNode)
}
