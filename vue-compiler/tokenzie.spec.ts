import { expect, test } from "vitest"
import { tokenzie } from "./tokenzie"

test("tokenzie", () => {
  const code = "<p>Vue</p>"

  const tokens = [
    { type: "tag", name: "p" },
    { type: "text", content: "Vue" },
    { type: "tagEnd", name: "p" }
  ]

  expect(tokenzie(code)).toEqual(tokens)
})

test("tag", () => {
  const code = "<p>"
  const tokens = [{ type: "tag", name: "p" }]
  expect(tokenzie(code)).toEqual(tokens)
})

test("text && tagEnd", () => {
  const code = "Vue</p>"
  const tokens = [
    { type: "text", content: "Vue" },
    { type: "tagEnd", name: "p" }
  ]
  expect(tokenzie(code)).toEqual(tokens)
})
