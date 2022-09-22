import { RootNode } from "./ast"

interface VisitorOption {
  enter: () => void
  exit: () => void
}

interface Visitor {
  Root: VisitorOption
  Element: VisitorOption
  Text: VisitorOption
}

export function taverser(rootNode: RootNode, visitor: Visitor) {
  function traverseNode(node, parent?) {}

  traverseNode(rootNode)
}
