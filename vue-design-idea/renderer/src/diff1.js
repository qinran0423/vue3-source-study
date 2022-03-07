// 简单diff

const oldChildren = n1.children
const newChildren = n2.children
// 旧的一组子节点的长度
const oldLen = oldChildren.length
// 新的一组子节点的长度
const newLen = newChildren.length
// 两组子节点的公共长度， 即两者中较短的那一组子节点的长度
const commonLength = Math.min(oldLen, newLen)

for (let i = 0; i < commonLength; i++) {
  patch(oldChildren[i], newChildren[i], container)
}

if (newLen > oldLen) {
  for (let i = commonLength; i < newLen; i++) {
    patch(null, newChildren[i], container)
  }
} else if (oldLen > newLen) {
  for (let i = commonLength; i < oldLen; i++) {
    unmount(oldChildren[i])
  }
}

// 遍历新的children
for (let i = 0; i < newChildren.length; i++) {
  const newVNode = newChildren[i]
  // 遍历旧的children
  for (let j = 0; j < oldChildren.length; j++) {
    const oldVNode = oldChildren[j]
    // 如果找到具有相同的key值得两个节点，说明可以复用，仍然需要调用patch函数更新
    if (newVNode.key === oldVNode.key) {
      patch(oldVNode, newVNode, container)
      break
    }
  }
}

let lastIndex = 0
for (let i = 0; i < newChildren.length; i++) {
  const newVNode = newChildren[i]
  // 遍历旧的children
  // 在第一场循环中定义变量find,代表是否在旧的一组子节点中找到可复用的节点
  let find = false
  for (let j = 0; j < oldChildren.length; j++) {
    const oldVNode = oldChildren[j]
    // 如果找到具有相同的key值得两个节点，说明可以复用，仍然需要调用patch函数更新
    if (newVNode.key === oldVNode.key) {
      find = true
      patch(oldVNode, newVNode, container)
      if (j < lastIndex) {
        // 如果当前找到的节点在旧children中的索引小于最大索引值lastIndex
        // 说明该节点对应的真实DOM需要移动

        // 先获取newVnode的前一个vnode, prevVNode
        const prevVNode = newChildren[i - 1]
        if (prevVNode) {
          // 由于我们要将newVnode对应的真实DOM移动到prevVNode所对应真实DOM后面
          // 所以我们需要获取prevVNode所对应真实DOM的下一个兄弟节点，并将其作为锚点
          const anchor = prevVNode.el.nextSibling

          // 调用insert方法将newVNode对应的真实DOM插入到锚点元素前面
          // 也就是preVNode对应真实DOM的后面
          insert(newVNode.el, container, anchor)
        }
      } else {
        // 如果当前找到的节点在旧children中的索引不小于最大索引值
        // 则更新lastIndex的值
        lastIndex = j
      }
      break
    }
    // 如果代码运行到这里， find仍然为false
    // 说明当前newVNode没有在旧的一组子节点中找到可复用的节点
    // 则需要新增挂载
    if (!find) {

      const prevVNode = newChildren[i - 1]
      let anchor = null
      if (prevVNode) {
        anchor = prevVNode.el.nextSibling
      } else {
        anchor = container.firstChild
      }
    }

    patch(null, newVNode, container, anchor)
  }
}

for (let i = 0; i < oldChildren.length; i++) {
  const oldVNode = oldChildren[i]

  const has = newChildren.find(
    vnode => vnode.key === oldVNode.key
  )

  if (!has) {
    unmount(oldVNode)
  }
}