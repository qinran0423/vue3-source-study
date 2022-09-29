import { createVNodeCall, NodeTypes } from "../ast"

export function transformElement(node, context) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      const { children, tag } = node
      // 中间处理层

      // tag
      const vnodeTag = `"${tag}"`
      // props
      let vnodeProps
      // children
      let vnodeChildren = children[0]

      node.codegenNode = createVNodeCall(
        context,
        vnodeTag,
        vnodeProps,
        vnodeChildren
      )
    }
  }
}
