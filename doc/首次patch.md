# 首次patch 

## Element节点初次渲染

```js
<script src="../dist/vue.global.js"></script>

<div id="app">
  <h1>{{title}}</h1>
</div>

<script>
  const {
    createApp,
    ref
  } = Vue
  createApp({
      setup() {
        const title = ref('vue3')
        return {
          title
        }
      }
    })
    .mount('#app')
</script>
```

接上一个[初始化流程](https://github.com/qinran0423/vue3-source-study/blob/main/doc/%E5%88%9D%E5%A7%8B%E5%8C%96%E6%B5%81%E7%A8%8B.md)

这次应该是创建element,希望创建的是h1

patch进入的应该是processElement

### processElement

因为第一次 所以会执行mountElement

### mountElement

```js
el = vnode.el = hostCreateElement(
        vnode.type as string,
        isSVG,
        props && props.is,
        props
      )
```

首先根据type 创建element

然后判断children是什么类型，这个例子中children就是一个text,执行hostSetElementText给textContent赋值

有props就处理props

### hostInsert

```js
hostInsert(el, container, anchor)
```

执行完这一步页面就显示出来了

## Component初次渲染

```js
<script src="../dist/vue.global.js"></script>

<div id="app">
  <h1>{{title}}</h1>
  <comp></comp>
</div>

<script>
  const {
    createApp,
    ref
  } = Vue
  createApp({
      setup() {
        const title = ref('vue3')
        return {
          title
        }
      }
    })
    .component('comp', {
      template: `
        <div>comp</div>
        `
    })
    .mount('#app')
</script>
```

h1上面已经解刨过，直接看comp

接上一个[初始化流程](https://github.com/qinran0423/vue3-source-study/blob/main/doc/%E5%88%9D%E5%A7%8B%E5%8C%96%E6%B5%81%E7%A8%8B.md)

进入patch函数  就会走processComponent

### processComponent

第一次会执行挂载组件mountComponent

### mountComponent

接着逻辑就和根组件处理的方式基本上一样了

1. 获取组件实例` instance` 这时是一个空的
2. `setupComponent` 初始化
3. `setupRenderEffect` 建立render的副作用 更新机制

#### setupComponent

`setupComponent`中执行`setupStatefulComponent返回一个有状态的组件`

`setupStatefulComponent`中判断`setup`是否存在，如果存在则执行得到`setupResult`,`handleSetupResult`将`setupResult`添加在`instance.setupState`

最后执行`finishComponentSetup`，这里如果没有render就会生成一个 添加到`instance.render`中, 

兼容vue2

```js
setCurrentInstance(instance)
pauseTracking()
applyOptions(instance)
resetTracking()
unsetCurrentInstance()
```

#### setupRenderEffect

1. 创建更新函数`componetUpdateFn`
2. 创建`componentUpdateFn` 的副作用 `new ReactiveEffect`
3. `update`

会执行componentUpdateFn中首先挂载逻辑中的patch,进入patch 然后就会执行processElement去创建div了就和刚开始Element的渲染逻辑一样了

![image-20220119173842500](/Users/mick/Library/Application Support/typora-user-images/image-20220119173842500.png)