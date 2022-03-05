
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

  function patch(n1, n2, container, anchor) {

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
        mountElement(n2, container, anchor)
      } else {
        // n1存在，需要更新
        patchElement(n1, n2, container)
      }
    } else if (typeof type === 'object') {
      // 如果n2.type是对象，则它描述的事组件
    }
  }


  function patchElement(n1, n2, container) {
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
    patchChildren(n1, n2, el)
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

        patchKeyedChildren(n1, n2, container)
        // const oldChildren = n1.children
        // const newChildren = n2.children
        // // 旧的一组子节点的长度
        // const oldLen = oldChildren.length
        // // 新的一组子节点的长度
        // const newLen = newChildren.length
        // // 两组子节点的公共长度， 即两者中较短的那一组子节点的长度
        // const commonLength = Math.min(oldLen, newLen)

        // for (let i = 0; i < commonLength; i++) {
        //   patch(oldChildren[i], newChildren[i], container)
        // }

        // if (newLen > oldLen) {
        //   for (let i = commonLength; i < newLen; i++) {
        //     patch(null, newChildren[i], container)
        //   }
        // } else if (oldLen > newLen) {
        //   for (let i = commonLength; i < oldLen; i++) {
        //     unmount(oldChildren[i])
        //   }
        // }

        // 遍历新的children
        // for (let i = 0; i < newChildren.length; i++) {
        //   const newVNode = newChildren[i]
        //   // 遍历旧的children
        //   for (let j = 0; j < oldChildren.length; j++) {
        //     const oldVNode = oldChildren[j]
        //     // 如果找到具有相同的key值得两个节点，说明可以复用，仍然需要调用patch函数更新
        //     if (newVNode.key === oldVNode.key) {
        //       patch(oldVNode, newVNode, container)
        //       break
        //     }
        //   }
        // }

        // let lastIndex = 0
        // for (let i = 0; i < newChildren.length; i++) {
        //   const newVNode = newChildren[i]
        //   // 遍历旧的children
        //   // 在第一场循环中定义变量find,代表是否在旧的一组子节点中找到可复用的节点
        //   let find = false
        //   for (let j = 0; j < oldChildren.length; j++) {
        //     const oldVNode = oldChildren[j]
        //     // 如果找到具有相同的key值得两个节点，说明可以复用，仍然需要调用patch函数更新
        //     if (newVNode.key === oldVNode.key) {
        //       find = true
        //       patch(oldVNode, newVNode, container)
        //       if (j < lastIndex) {
        //         // 如果当前找到的节点在旧children中的索引小于最大索引值lastIndex
        //         // 说明该节点对应的真实DOM需要移动

        //         // 先获取newVnode的前一个vnode, prevVNode
        //         const prevVNode = newChildren[i - 1]
        //         if (prevVNode) {
        //           // 由于我们要将newVnode对应的真实DOM移动到prevVNode所对应真实DOM后面
        //           // 所以我们需要获取prevVNode所对应真实DOM的下一个兄弟节点，并将其作为锚点
        //           const anchor = prevVNode.el.nextSibling

        //           // 调用insert方法将newVNode对应的真实DOM插入到锚点元素前面
        //           // 也就是preVNode对应真实DOM的后面
        //           insert(newVNode.el, container, anchor)
        //         }
        //       } else {
        //         // 如果当前找到的节点在旧children中的索引不小于最大索引值
        //         // 则更新lastIndex的值
        //         lastIndex = j
        //       }
        //       break
        //     }
        //     // 如果代码运行到这里， find仍然为false
        //     // 说明当前newVNode没有在旧的一组子节点中找到可复用的节点
        //     // 则需要新增挂载
        //     if (!find) {

        //       const prevVNode = newChildren[i - 1]
        //       let anchor = null
        //       if (prevVNode) {
        //         anchor = prevVNode.el.nextSibling
        //       } else {
        //         anchor = container.firstChild
        //       }
        //     }

        //     patch(null, newVNode, container, anchor)
        //   }
        // }

        // for (let i = 0; i < oldChildren.length; i++) {
        //   const oldVNode = oldChildren[i]

        //   const has = newChildren.find(
        //     vnode => vnode.key === oldVNode.key
        //   )

        //   if (!has) {
        //     unmount(oldVNode)
        //   }
        // }

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


  function patchKeyedChildren(n1, n2, container) {
    const oldChildren = n1.children
    const newChildren = n2.children

    // 四个索引值
    let oldStartIdx = 0
    let oldEndIdx = oldChildren.length - 1
    let newStartIdx = 0
    let newEndIdx = newChildren.length - 1

    // 四个索引值指向的vnode节点
    let oldStartVNode = oldChildren[oldStartIdx]
    let oldEndVNode = oldChildren[oldEndIdx]
    let newStartVNode = newChildren[newStartIdx]
    let newEndVNode = newChildren[newEndIdx]

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      if (!oldStartVNode) {
        oldStartVNode = oldChildren[++oldStartIdx]
      } if (oldStartVNode.key === newStartVNode.key) {
        // 第一步 比较oldStartVNode  和  newStartVNode
      } else if (oldEndVNode.key === newEndVNode.key) {
        // 第二步 oldEndVNode  和  newEndVNode
        patch(oldEndVNode, newEndVNode, container)

        oldEndVNode = oldChildren[--oldEndIdx]
        newEndVNode = newChildren[--newEndIdx]

      } else if (oldStartVNode.key === newEndVNode.key) {
        // 第三步  oldStartVNode 和 newEndVNode
        patch(oldStartVNode, newEndVNode, container)

        insert(oldStartVNode.el, container, oldEndVNode.el.nextSibling)

        oldStartVNode = oldChildren[++oldStartIdx]
        newEndVNode = newChildren[--newEndIdx]

      } else if (oldEndVNode.key === newStartVNode.key) {
        // 第四步  oldEndVNode 和 newStartVNode

        patch(oldEndVNode, newStartVNode, container)

        insert(oldEndVNode.el, container, oldStartVNode.el)

        oldEndVNode = oldChildren[--oldEndIdx]
        newStartVNode = newChildren[++newStartIdx]


      } else {
        // 以上情况都不存在  则找到新的头部节点 在老的子节点中对应的节点
        const idxInOld = oldChildren.findIndex(
          node => node.key === newStartVNode.key
        )
        // idxInOld大于0 说明找到了可复用的节点，并且需要将其对应的真实DOM移动到头部
        if (idxInOld > 0) {
          const vnodeToMove = oldChildren[idxInOld]
          // 打补丁
          patch(vnodeToMove, newStartVNode, container)
          // 移动
          insert(vnodeToMove.el, container, oldStartVNode.el)
          // 由于位置idxInOld处的节点所对应的真实DOM已经移动到了别处， 则设置undefined
          oldChildren[idxInOld] = undefined

        } else {
          patch(null, newStartVNode, container, oldStartVNode.el)
        }
        // 最后更新newStartIdx 到下一个位置
        newStartVNode = newChildren[++newStartIdx]
      }
    }

    // 循环结束后检查索引值的情况
    if (oldEndIdx < oldStartIdx && newStartIdx <= newEndIdx) {
      for (let i = 0; i <= newEndIdx; i++) {
        patch(null, newChildren[i], container, oldStartVNode.el)
      }
    } else if (newEndIdx < newStartIdx && oldEndIdx <= oldEndIdx) {
      for (let i = 0; i <= oldEndIdx; i++) {
        unmount(oldChildren[i])
      }
    }
  }


  function mountElement(vnode, container, anchor) {
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
        patch(null, child, el, anchor)
      });
    }

    insert(el, container, anchor)
  }


  function render(vnode, container) {
    if (vnode) {
      patch(container._vnode, vnode, container, null)
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

    if (parent) parent.removeChild(vnode.el)
  }

  return {
    render
  }
}



