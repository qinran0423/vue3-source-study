import { effect, reactive } from '../../reactivity/effect.js';
export function shouldSetAsProps(el, key, value) {
  if (key === 'form' && el.tagName === 'INPUT') return false
  return key in el
}


// 任务缓存队列，用一个Set数据结构来表示
const queue = new Set()
// 一个标志， 代表是否正在刷新任务队列
let isFlushing = false

const p = Promise.resolve()

function queueJob(job) {
  queue.add(job)
  // 如果还没有开始刷新队列，则刷新之
  if (!isFlushing) {
    // 将该标志设置成true, 避免重复刷新
    isFlushing = true
    // 在微任务中刷新换从队列
    p.then(() => {
      try {
        // 执行任务队列的任务
        queue.forEach(job => job())
      } finally {
        isFlushing = false
        queue.length = 0
      }
    })

  }
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
      if (!n1) {
        // 挂载组件
        mountComponent(n2, container, anchor)
      } else {
        // 更新组件
        patchComponent(n1, n2, anchor)
      }
    }
  }


  function mountComponent(vnode, container, anchor) {
    // 通过vnode获取组件的选项对象
    const componentOptions = vnode.type
    // 获取组件的render
    const { render, data } = componentOptions
    const state = reactive(data())
    // 执行渲染函数，获取组件要渲染的内容，
    effect(() => {
      const subTree = render.call(state, state)
      // 最后执行patch 来挂载组件所描述的内容
      patch(null, subTree, container, anchor)
    }, {
      scheudler: queueJob
    })

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


  // 快速diff算法
  function patchKeyedChildren(n1, n2, container) {
    debugger
    const newChildren = n2.children
    const oldChildren = n1.children

    // 处理相同的前置节点
    // 索引j指向新旧两组子节点的开头
    let j = 0;
    let oldVNode = oldChildren[j]
    let newVNode = newChildren[j]
    // while循环向后遍历，直到遇到拥有不同key值得节点
    while (oldVNode.key === newVNode.key) {
      // 调用patch函数进行更新
      patch(oldVNode, newVNode, container)
      // 更新索引j 让其递增
      j++

      oldVNode = oldChildren[j]
      newVNode = newChildren[j]
    }

    // 更新相同的后置节点
    // 索引oldEnd指向旧的一组子节点的最后一个节点
    let oldEnd = oldChildren.length - 1
    // 索引newEnd执行新的一组子节点的最后一个节点
    let newEnd = newChildren.length - 1

    oldVNode = oldChildren[oldEnd]
    newVNode = newChildren[newEnd]

    // while循环从后向前遍历，直到遇到拥有不同key值得节点为止
    while (oldVNode.key === newVNode.key) {
      // 调用patch函数进行更新
      patch(oldVNode, newVNode, container)
      // 递减oldEnd 和 newEnd
      oldEnd--
      newEnd--
      oldVNode = oldChildren[oldEnd]
      newVNode = newChildren[newEnd]
    }

    // 预处理完毕后， 如果满足如下条件，则说明从j --> nextEnd之间的节点作为新节点插入
    if (j > oldEnd && j <= newEnd) {
      // 锚点的索引
      const anchorIndex = newEnd + 1
      // 锚点元素
      const anchor = anchorIndex < newChildren.length ? newChildren[anchorIndex].el : null

      // 采用while循环，调用patch函数逐个挂载新增节点
      while (j <= newEnd) {
        patch(null, newChildren[j++], container, anchor)
      }
    } else if (j > newEnd && j <= oldEnd) {
      // 卸载
      while (j <= oldEnd) {
        unmount(oldChildren[j++])
      }
    } else {
      // 以上情况都不满足
      // 构造source 数组
      // 新的一组子节点中剩余未处理节点的数量
      const count = newEnd - j + 1
      const source = new Array(count)
      source.fill(-1)

      // oldStart 和 newStart分别为起始索引 j
      const oldStart = j
      const newStart = j

      let moved = false
      let pos = 0

      // 构建索引表
      const keyIndex = {}
      for (let i = newStart; i <= newEnd; i++) {
        keyIndex[newChildren[i].key] = i
      }
      // 代表更新过得节点数量
      let patched = 0
      for (let i = oldStart; i <= oldEnd; i++) {
        const oldVNode = oldChildren[i]
        // 遍历新的一组子节点
        // for (let k = newStart; k <= newEnd; k++) {
        //   const newVNode = newChildren[k]
        //   if (oldVNode.key === newVNode.key) {
        //     patch(oldVNode, newVNode, container)
        //     source[k - newStart] = i
        //   }
        // }
        // 替换上面的
        // 通过索引表快速找到新的一组节点中具有相同key值得节点位置
        if (patched <= count) {
          const k = keyIndex[oldVNode.key]

          if (typeof k !== 'undefined') {
            newVNode = newChildren[k]
            patch(oldVNode, newVNode, container)
            patched++
            source[k - newStart] = i

            // 判断节点是否需要移动
            if (k < pos) {
              moved = true
            } else {
              pos = k
            }
          } else {
            unmount(oldVNode)
          }
        } else {
          unmount(oldVNode)
        }

      }

      if (moved) {
        // 如果moved为真，则需要进行DOM的移动操作‘
        const seq = getSequence(source)

        // s指向最长递增子序列的最后一个元素
        let s = seq.length - 1
        // i指向新的一组子节点的最后一个元素
        let i = count - 1

        // for循环使得递减
        for (i; i >= 0; i--) {
          if (i !== seq[s]) {
            // 如果节点的索引i不等于seq[s]的值，说明该节点需要移动
            const pos = i + newStart
            const newVNode = newChildren[pos]
            // 该节点在新的children中的真实位置索引
            const nextPos = pos + 1
            // 锚点
            const anchor = nextPos < newChildren.length ? newChildren[nextPos].el : null
            patch(null, newVNode, container, anchor)
          } else if (i !== seq[s]) {
            const pos = i + newStart
            const newVNode = newChildren[pos]
            // 该节点在新的children中的真实位置索引
            const nextPos = pos + 1
            // 锚点
            const anchor = nextPos < newChildren.length ? newChildren[nextPos].el : null
            insert(newVNode.el, container, anchor)
          } else {
            // 当i === seq[s]时，说明该位置的节点不需要移动
            s--
          }
        }
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



function getSequence(arr) {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}
