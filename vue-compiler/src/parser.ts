import { NodeTypes } from "./ast"

const enum TagType {
  Start,
  End
}

export function baseParse(content: string) {
  const context = createParseContext(content)
  return createRoot(parserChildren(context, []))
}

function createRoot(children) {
  return {
    children,
    type: NodeTypes.ROOT
  }
}

function parserChildren(context, ancestors) {
  const nodes: any = []

  while (!isEnd(context, ancestors)) {
    const s = context.source
    let node
    if (s.startsWith("{{")) {
      node = parseInterpolation(context)
    } else if (s[0] === "<") {
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors)
      }
    } else {
      node = parseText(context)
    }
    nodes.push(node)
  }
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

function parseElement(context, ancestors) {
  const element: any = parseTag(context, TagType.Start)
  ancestors.push(element.tag)
  element.children = parserChildren(context, ancestors)
  ancestors.pop()

  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End)
  } else {
    throw new Error(`缺少结束标签：${element.tag}`)
  }

  return element
}

function startsWithEndTagOpen(source, tag) {
  return (
    source.startsWith("</") &&
    source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase()
  )
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
  let endIndex = context.source.length
  let endTokens = ["<", "{{"]

  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i])
    if (index !== -1 && endIndex > index) {
      endIndex = index
    }
  }

  const content = parseTextData(context, endIndex)

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
function isEnd(context: any, ancestors) {
  const s = context.source

  if (s.startsWith("</")) {
    for (let i = 0; i < ancestors.length; i++) {
      const tag = ancestors[i]
      if (startsWithEndTagOpen(s, tag)) {
        return true
      }
    }
  }

  return !s
}
