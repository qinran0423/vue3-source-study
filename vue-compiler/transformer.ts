import { NodesType, RootNode } from "./ast"
import { traverser } from "./traverser"

// 创建StringLiteral 节点
function createStringLiteral(value) {
  return {
    type: NodesType.StringLiteral,
    value
  }
}

// 创建Identifier节点
function createIdentifier(name) {
  return {
    type: NodesType.Identifier,
    name
  }
}

// 创建ArrayExpression节点
function createArrayExpression(elements) {
  return {
    type: NodesType.ArrayExpression,
    elements
  }
}

function createCallExpression(callee, params) {
  return {
    type: NodesType.CallExpression,
    callee: createIdentifier(callee),
    arguments: params
  }
}

export function transformer(ast: RootNode) {
  const newAst = {
    type: NodesType.FunctionDecl,
    body: []
  }

  traverser(ast, {
    Element: {
      enter(node, parent) {
        if (node.type === NodesType.Element) {
          let expression = {}
        }
      }
    },
    Text: {
      enter(node, parent) {}
    }
  })
}
