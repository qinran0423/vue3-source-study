export enum TokenType {
  TAG,
  TEXT,
  TAGEND
}

export enum NodesType {
  Root = "Root",
  Element = "Element",
  Text = "Text"
}

export interface TokenTag {
  type: TokenType
  name: string
}

export interface TokenText {
  type: TokenType
  content: string
}

export interface Node {
  type: NodesType
}

export type ElementStackNode = RootNode | ElementNode

export type ChildNode = RootNode | ElementNode | TextNode

export interface RootNode extends Node {
  type: NodesType.Root
  children: ChildNode[]
}

export interface ElementNode extends Node {
  type: NodesType.Element
  tag: string | undefined
  children: ChildNode[]
}

export interface TextNode extends Node {
  type: NodesType.Text
  content: string | undefined
}

export type Token = {
  type: TokenType
  name?: string
  content?: string
}
