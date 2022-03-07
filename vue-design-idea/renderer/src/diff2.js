
// 双端diff算法
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
