import {
  ElementNode,
  NodesType,
  RootNode,
  TextNode,
  Token,
  TokenType,
  ChildNode,
  ElementStackNode
} from "./ast"

export function parser(tokens: Token[]) {
  const root: RootNode = {
    type: NodesType.Root,
    children: []
  }

  const elementStack: ElementStackNode[] = [root]

  while (tokens.length) {
    const parent = elementStack[elementStack.length - 1]

    const element = tokens[0]
    switch (element.type) {
      case TokenType.TAG:
        const elementNode: ElementNode = {
          type: NodesType.Element,
          tag: element.name,
          children: []
        }
        parent.children.push(elementNode)
        elementStack.push(elementNode)
        break
      case TokenType.TEXT:
        const textNode: TextNode = {
          type: NodesType.Text,
          content: element.content
        }
        parent.children.push(textNode)
        break
      case TokenType.TAGEND:
        elementStack.pop()
        break
    }
    tokens.shift()
  }

  return root
}
