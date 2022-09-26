import { NodeTypes } from "./ast"

const enum TagType {
  Start,
  End
}

export function baseParse(content: string) {
  const context = createParseContext(content)
  return createRoot(parserChildren(context))
}

function createRoot(children) {
  return {
    children
  }
}

function parserChildren(context) {
  const nodes: any = []
  const s = context.source
  let node
  if (s.startsWith("{{")) {
    node = parseInterpolation(context)
  } else if (s[0] === "<") {
    if (/[a-z]/i.test(s[1])) {
      node = parseElement(context)
    }
  } else {
    node = parseText(context)
  }
  nodes.push(node)

  return nodes
}

function parseInterpolation(context) {
  const openDelimiter = "{{"
  const closeDelimiter = "}}"

  const closeIndex = context.source.indexOf(
    closeDelimiter,
    openDelimiter.length
  )

  advanceBy(context, openDelimiter.length)
  // 需要获取内容的长度
  const rawContentLength = closeIndex - openDelimiter.length
  // 获取内容

  // const content = context.source.slice(0, rawContentLength).trim()

  // advanceBy(context, rawContentLength + closeDelimiter.length)

  const rawContent = parseTextData(context, rawContentLength)

  const content = rawContent.trim()

  advanceBy(context, closeDelimiter.length)

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content
    }
  }
}

function parseElement(context) {
  const element = parseTag(context, TagType.Start)

  parseTag(context, TagType.End)

  return element
}

function parseTag(context: any, type: TagType) {
  const match: any = /^<\/?([a-z]*)/i.exec(context.source)

  const tag = match[1]

  advanceBy(context, match[0].length)
  advanceBy(context, 1)

  if (type === TagType.End) return

  return {
    type: NodeTypes.ELEMENT,
    tag
  }
}

function parseText(context) {
  const content = parseTextData(context, context.source.length)
  return {
    type: NodeTypes.TEXT,
    content
  }
}

function parseTextData(context: any, length) {
  const content = context.source.slice(0, length)

  advanceBy(context, content.length)
  return content
}

function advanceBy(context: any, length: number) {
  context.source = context.source.slice(length)
}

function createParseContext(content: string) {
  return {
    source: content
  }
}
