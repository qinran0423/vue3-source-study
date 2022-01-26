# Slot

### 默认

例子

```js
<script src="../dist/vue.global.js"></script>

<div id="app">
  <comp>111</comp>
</div>

<script>
  Vue.createApp({
      data() {
        return {
          title: 'randy'
        }
      },
    })
    .component('comp', {
      template: `
        <div><slot></slot></div>
        `
    })
    .mount('#app')
</script>
```

首先我比较关注的是渲染函数是什么样子的

```js
<div id="app">
  <comp>111</comp>
</div>
// 转化成render => 
import { createTextVNode as _createTextVNode, resolveComponent as _resolveComponent, withCtx as _withCtx, createVNode as _createVNode, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

export function render(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_comp = _resolveComponent("comp")

  return (_openBlock(), _createElementBlock("div", { id: "app" }, [
    _createVNode(_component_comp, null, {
      default: _withCtx(() => [
        _createTextVNode("111")
      ], undefined, true),
      _: 1 /* STABLE */
    })
  ]))
}
```



```js
<div><slot></slot></div>
// 转化成render => 

import { renderSlot as _renderSlot, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

export function render(_ctx, _cache, $props, $setup, $data, $options) {
  return (_openBlock(), _createElementBlock("div", null, [
    _renderSlot(_ctx.$slots, "default")
  ]))
}

```

可以看到renderSlot中第一个参数是ctx.$slots

组件在初始化slot的应该是在initSlots方法

```js

export const initSlots = (
  instance: ComponentInternalInstance,
  children: VNodeNormalizedChildren
) => {
  if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    const type = (children as RawSlots)._
    if (type) {
      // users can get the shallow readonly version of the slots object through `this.$slots`,
      // we should avoid the proxy object polluting the slots of the internal instance
      instance.slots = toRaw(children as InternalSlots)
      // make compiler marker non-enumerable
      def(children as InternalSlots, '_', type)
    } else {
      normalizeObjectSlots(
        children as RawSlots,
        (instance.slots = {}),
        instance
      )
    }
  } else {
    instance.slots = {}
    if (children) {
      normalizeVNodeSlots(instance, children)
    }
  }
  def(instance.slots, InternalObjectKey, 1)
}
```

```js
children: {
      default: _withCtx(() => [
        _createTextVNode("111")
      ], undefined, true),
      _: 1 /* STABLE */
    }
```

拿到这个children直接给instance.slot赋值，所以ctx.$slots应该就是这个instance.slot

_renderSlot做了什么事情呢 ？

```js
export function renderSlot(
  slots: Slots,
  name: string,
  props: Data = {},
  // this is not a user-facing function, so the fallback is always generated by
  // the compiler and guaranteed to be a function returning an array
  fallback?: () => VNodeArrayChildren,
  noSlotted?: boolean
): VNode {
  if (currentRenderingInstance!.isCE) {
    return createVNode(
      'slot',
      name === 'default' ? null : { name },
      fallback && fallback()
    )
  }

  let slot = slots[name]
  // a compiled slot disables block tracking by default to avoid manual
  // invocation interfering with template-based block tracking, but in
  // `renderSlot` we can be sure that it's template-based so we can force
  // enable it.
  if (slot && (slot as ContextualRenderFn)._c) {
    ;(slot as ContextualRenderFn)._d = false
  }
  openBlock()
  const validSlotContent = slot && ensureValidVNode(slot(props))
  const rendered = createBlock(
    Fragment,
    { key: props.key || `_${name}` },
    validSlotContent || (fallback ? fallback() : []),
    validSlotContent && (slots as RawSlots)._ === SlotFlags.STABLE
      ? PatchFlags.STABLE_FRAGMENT
      : PatchFlags.BAIL
  )
  if (!noSlotted && rendered.scopeId) {
    rendered.slotScopeIds = [rendered.scopeId + '-s']
  }
  if (slot && (slot as ContextualRenderFn)._c) {
    ;(slot as ContextualRenderFn)._d = true
  }
  return rendered
}
```

拿到name对应的值slot[name],但是这个值是一个函数，所以要执行一下，并传入参数props然后创建了一个Fragement  的 vnode 

总结一下：大致的意思就是  slot 渲染，就是拿到组件里面的children内容 创建了一个Fragement的vnode ,所以当patch的时候就会走processFragment

### 具名插槽

例子

```js
<div id="app">
  <comp>
    <template v-slot:header>header</template>
    <div>content</div>
    <template v-slot:footer>footer</template>
  </comp>
</div>

```

转换成的渲染函数

```js
import { createTextVNode as _createTextVNode, createElementVNode as _createElementVNode, resolveComponent as _resolveComponent, withCtx as _withCtx, createVNode as _createVNode, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

export function render(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_comp = _resolveComponent("comp")

  return (_openBlock(), _createElementBlock("div", { id: "app" }, [
    _createVNode(_component_comp, null, {
      header: _withCtx(() => [
        _createTextVNode("header")
      ]),
      footer: _withCtx(() => [
        _createTextVNode("footer")
      ]),
      default: _withCtx(() => [
        _createElementVNode("div", null, "content")
      ], undefined, true),
      _: 1 /* STABLE */
    })
  ]))
}
```

看到children其实就是一个对象，里面的由header、footer、default三个属性，大致可以猜测 拿到这个对象和slot的name属性一一对象渲染，下面验证一下

setupComponent中 执行了initSlots

拿到这个children直接给instance.slot赋值，和上面的处理方式是一样的

下面看下组件的渲染函数

```js
<div>
  <slot name="header"></slot>
  <slot></slot>
  <slot name="footer"></slot>
</div>
// 转化成=> 
import { renderSlot as _renderSlot, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

export function render(_ctx, _cache, $props, $setup, $data, $options) {
  return (_openBlock(), _createElementBlock("div", null, [
    _renderSlot(_ctx.$slots, "header"),
    _renderSlot(_ctx.$slots, "default"),
    _renderSlot(_ctx.$slots, "footer")
  ]))
}

```

根据上面的对renderSlot的解析，大概就可以值到了renderSlot中传入了ctx.$slots也就是instance.slot(children),然后传入了name，去一一匹配,然后创建了一个Fragement的vnode ,所以当patch的时候就会processFragment

### 作用域插槽

例子

```js
<div id="app">
  <comp>
    <template v-slot:default="item">content {{item.age}}</template>
  </comp>
</div>
//转换成render=>
import { toDisplayString as _toDisplayString, createTextVNode as _createTextVNode, resolveComponent as _resolveComponent, withCtx as _withCtx, createVNode as _createVNode, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

export function render(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_comp = _resolveComponent("comp")

  return (_openBlock(), _createElementBlock("div", { id: "app" }, [
    _createVNode(_component_comp, null, {
      default: _withCtx((item) => [
        _createTextVNode("content " + _toDisplayString(item.age), 1 /* TEXT */)
      ]),
      _: 1 /* STABLE */
    })
  ]))
}

```

其实处理的方式和上面的基本上都是差不多，只不过有一点一直没有注意到，为什么children这个对象中的default属性对应的值是一个函数，而且有入参item,大概可以想到这个就是来处理作用域插槽

看下组件的render

```js
<div>
  <slot :age="age"></slot>
</div>
// 转换成render =>
import { renderSlot as _renderSlot, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

export function render(_ctx, _cache, $props, $setup, $data, $options) {
  return (_openBlock(), _createElementBlock("div", null, [
    _renderSlot(_ctx.$slots, "default", { age: _ctx.age })
  ]))
}

```

根据上面的说明：拿到name对应的值slot[name],但是这个值是一个函数，所以要执行一下，并传入参数props然后创建了一个Fragement  的 vnode 

这里可以看到props就是{age: _ctx.age}，所以当执行slot的时候把这个参数传入了进去，item.age自然能够访问

总结：作用域插槽就是在执行slot函数的时候，把props传入进去，从而在外侧就可以拿到这个props就可以使用了