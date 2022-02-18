

export function renderer(vnode, container) {

  if (typeof vnode.tag === 'string') {
    // 标签
    mountElement(vnode, container)
  } else if (typeof vnode.tag === 'object') {
    // 组件
    mountComponent(vnode, container)
  }
}

function mountElement(vnode, container) {
  // 使用vnode.tag 作为便签名创建DOM元素
  const el = document.createElement(vnode.tag)
  for (const key in vnode.props) {
    if (/^on/.test(key)) {
      // 如果是key 是on 开头 说明是事件
      el.addEventListener(key.slice(2).toLowerCase(), vnode.props[key])
    }
  }

  // children
  if (typeof vnode.children === 'string') {
    // children 是字符串，  文本子节点
    el.appendChild(document.createTextNode(vnode.children))
  } else if (Array.isArray(vnode.children)) {
    vnode.children.forEach(child => {
      renderer(child, el)
    });
  }

  container.appendChild(el)
}


function mountComponent(vnode, container) {
  const subtree = vnode.tag.render()
  // 递归的调用renderer渲染subtree
  renderer(subtree, container)
}


