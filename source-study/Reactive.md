# Reactive

options api 是在源码内部去调用reactive来做响应式

composition api  则是用户通过 vue.reactive

```js
const app = Vue.createApp({
    setup() {
        const state = Vue.reactive({
            num: 1
        })

        return state
    }
})
```





packages\reactivity\src\reactive.ts

流程

- reactive

- createReactiveObject

  - 判断目标对象是否是一个object 如果不是则直接返回

  - ···（各种判断 后续详看）

  - new Proxy(target,mutableHandlers)

    ```js
    export const mutableHandlers: ProxyHandler<object> = {
      get,
      set,
      deleteProperty,
      has,
      ownKeys
    }
    ```

- get 就是 createGetter()

  - 如果传入的值是个object  则递归调用reactive

- track(target, TrackOpTypes.GET, key) 依赖收集

  ```js
  {
  
    { num: 1} :  { num:  [effect ] }
  
  }
  
  ```

  

- trackEffects

- trigger 触发依赖

  - 出发dep中所有的依赖执行run 

