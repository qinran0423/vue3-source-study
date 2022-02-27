import { createRenderer } from "./renderer"

const vnode = {
  type: 'h1',
  children: 'hello'
}


// 创建一个渲染器
const renderer = createRenderer({
  createElement(tag) {
    return document.createElement(tag)
  },
  setElementText(el, text) {
    el.context = text
  },
  insert(el, parent, anchor = null) {
    parent.insertBefore(el, anchor)
  }
})
// 调用render函数渲染该vnode
renderer.render(vnode, document.querySelector('#app'))


