
export const KeepAlive = {
  // KeepAlive组件独有的属性，用作标识
  _isKeepAlive: true,
  setup(props, { slots }) {
    // 创建一个缓存对象
    // key: vnode.type
    // value: vnode
    const cache = new Map()
    // 当前KeepAlive组件的实例
    const instance = currentInstance

    const { move, createElement } = instance.keepAliveCtx

    const storageContainer = createElement('div')

    instance._deActivate = (vnode) => {
      move(vnode, storageContainer)
    }

    instance._activate = (vnode, container, anchor) => {
      move(vnode, container, anchor)
    }

    return () => {

      let rawVNode = slots.default()
      if (typeof rawVNode.type !== 'object') {
        return rawVNode
      }


      const cacheVNode = cache.get(rawVNode.type)
      if (cacheVNode) {

        rawVNode.component = cacheVNode.component

        rawVNode.keptAlive = true

      } else {
        cache.set(rawVNode.type, rawVNode)
      }

      rawVNode.shouldKeepAlive = true

      rawVNode.keepAliveInstance = instance

      return rawVNode

    }
  }
}
