
export function shouldSetAsProps(el, key, value) {
  if (key === 'form' && el.tagName === 'INPUT') return false
  return key in el
}



export function createRenderer(options) {
  const {
    createElement,
    insert,
    setElementText,
    patchProps
  } = options

  function patch(n1, n2, container) {

    // 如果新旧vnode的类型不同，则直接讲旧vnode卸载
    if (n1 && n1.type !== n2.type) {
      unmount(n1)
      n1 = null
    }
    const { type } = n2
    // 如果n2.type的值是字符串类型，则它描述的事普通便签元素
    if (typeof type === 'string') {
      // 如果n1不存在 说明是首次  则需要挂载
      if (!n1) {
        mountElement(n2, container)
      } else {
        // n1存在，需要更新
        patchElement(n1, n2)
      }
    } else if (typeof type === 'object') {
      // 如果n2.type是对象，则它描述的事组件
    }
  }


  function patchElement(n1, n2) {
    const el = n2.el = n1.el
    const oldProps = n1.props
    const newProps = n2.props
    // 更新props
    for (const key in newProps) {
      if (newProps[key] !== oldProps[key]) {
        patchProps(el, key, oldProps[key], newProps[key])
      }
    }


    for (const key in oldProps) {
      if (!(key in newProps)) {
        patchProps(el, key, oldProps[key], null)
      }
    }

    // 更新children
    patchChildren(n1, n2, container)
  }
  function patchChildren(n1, n2, container) {
    // 判断新子节点的类型是否是文本节点
    if (typeof n2.children === 'string') {
      if (Array.isArray(n1.children)) {
        n1.children.forEach((c) => unmount(c))
      }
      setElementText(container, n2.children)
    } else if (Array.isArray(n2.children)) {
      // 新子节点是一组子节点
      // TODO diff
      if (Array.isArray(n1.children)) {
        n1.children.forEach(c => unmount(c))

        n2.children.forEach(c => patch(null, c, container))
      } else {
        setElementText(container, '')

        n2.children.forEach(c => patch(null, c, container))
      }

    } else {
      // 新子节点不存在

      if (Array.isArray(n1.children)) {
        n1.children.forEach(c => unmount(c))
      } else if (typeof n1.children === 'string') {
        setElementText(container, '')
      }
    }
  }

  function mountElement(vnode, container) {
    // 创建Dom元素
    const el = vnode.el = createElement(vnode.type)

    if (vnode.props) {
      for (const key in vnode.props) {
        // el.setAttribute(key, vnode.props[key])
        patchProps(el, key, null, vnode.props[key])
      }
    }

    // 处理子节点，如果子节点是字符串，代理元素具有文本节点
    if (typeof vnode.children === 'string') {
      setElementText(el, vnode.children)
    } else if (Array.isArray(vnode.children)) {
      vnode.children.forEach(child => {
        patch(null, child, el)
      });
    }

    insert(el, container)
  }


  function render(vnode, container) {
    if (vnode) {
      patch(container._vnode, vnode, container)
    } else {
      if (container._vnode) {
        const el = container._vnode.el

        unmount(container._vnode)
      }
    }

    container._vnode = vnode
  }


  function unmount(vnode) {
    const parent = vnode.el.parentNode

    if (parent) parent.removeChild(el)
  }

  return {
    render
  }
}


