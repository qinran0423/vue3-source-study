

export function createRenderer(options) {
  const {
    createElement,
    insert,
    setElementText
  } = options

  function patch(n1, n2, container) {
    // 如果n1不存在 说明是首次  则需要挂载
    if (!n1) {
      mountElement(n2, container)
    } else {
      // n1存在，需要更新
    }
  }


  function mountElement(vnode, container) {
    // 创建Dom元素
    const el = createElement(vnode.type)
    // 处理子节点，如果子节点是字符串，代理元素具有文本节点
    if (typeof vnode.children === 'string') {
      setElementText(el, vnode.children)
    }

    insert(el, container)
  }


  function render(vnode, container) {
    if (vnode) {
      patch(container._vnode, vnode, container)
    } else {
      if (container._vnode) {
        container.innerHTML = ''
      }
    }

    container._vnode = vnode
  }

  return {
    render
  }
}