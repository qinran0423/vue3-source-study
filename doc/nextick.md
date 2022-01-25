# nextTick

例子

```js

<script src="../dist/vue.global.js"></script>

<div id="app">
  <h1>{{obj.num}}</h1>
  <button @click="onClick">点击</button>
</div>

<script>
  const { reactive, createApp, onMounted, getCurrentInstance} = Vue
  createApp({
    setup() {
      const obj = reactive({
        num: 0
      })
      const instacne = getCurrentInstance()
      function onClick() {
        for (let i = 0; i < 100; i++) {
          console.log('update');
          obj.num = i
        }
      }
      return {obj, onClick}
    }
  })
  .mount('#app')
</script>
```

这里可以想象，每次点击的时候，obj.num都要重新设置，这里设置了100次，难道视图也要更新100次吗？肯定不是的吗，这里利用到了异步更新，下面就来看看异步更新是怎么实现的。

还记得这段代码吗？

```js
// 副作用：如果componentUpdateFn执行的过程中有响应式数据发生变化
    // 则按照参数2的(() => queueJob(instance.update))方式执行参数1
    const effect = (instance.effect = new ReactiveEffect(
      componentUpdateFn,
      () => queueJob(instance.update),
      instance.scope // track it in component's effect scope
    ))
```

new ReactiveEffect后续解刨，这里ReactiveEffect我们叫做scheduler

首次执行会按照ReactiveEffect的第一个参数就是componentUpdateFn执行，当componentUpdateFn执行的过程中有响应式数据发生变化，则按照scheduler执行