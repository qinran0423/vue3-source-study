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

const update = (instance.update = effect.run.bind(effect) as SchedulerJob)
```

new ReactiveEffect后续解刨，这里ReactiveEffect我们叫做scheduler

首次执行会按照ReactiveEffect的第一个参数就是componentUpdateFn执行，当componentUpdateFn执行的过程中有响应式数据发生变化，则按照scheduler执行,则也会执行queueJob, 传入的是instance.update,可以理解为执行更新的操作

```js
/packages/runtime-core/src/scheduler.ts
const queue: SchedulerJob[] = []
export function queueJob(job: SchedulerJob) {
  // the dedupe search uses the startIndex argument of Array.includes()
  // by default the search index includes the current job that is being run
  // so it cannot recursively trigger itself again.
  // if the job is a watch() callback, the search will start with a +1 index to
  // allow it recursively trigger itself - it is the user's responsibility to
  // ensure it doesn't end up in an infinite loop.
  if (
    (!queue.length ||
      !queue.includes(
        job,
        isFlushing && job.allowRecurse ? flushIndex + 1 : flushIndex
      )) &&
    job !== currentPreFlushParentJob
  ) {
    if (job.id == null) {
      queue.push(job)
    } else {
      queue.splice(findInsertionIndex(job.id), 0, job)
    }
    queueFlush()
  }
}
```

定义了一个全局的数组queue,然后吧传入的job存在queue里面，这里做了一个判断(!queue.includes)，已经存过的就不需要在存了。然后执行了queueFlush

```js
const resolvedPromise: Promise<any> = Promise.resolve()
function queueFlush() {
  if (!isFlushing && !isFlushPending) {
    isFlushPending = true
    currentFlushPromise = resolvedPromise.then(flushJobs)
  }
}
```

可以看到执行了一个promise.resolve,成功了之后执行了flushJobs

根据上面的例子，数据更新了100次，只有第一次的时候更新的操作会存在queue,也不可能去创建100个promise,利用了一个开关isFlushPending,第一次设置成true,之后都不会在去创建promise

```js
function flushJobs(seen?: CountMap) {
  isFlushPending = false
  isFlushing = true
  if (__DEV__) {
    seen = seen || new Map()
  }

  flushPreFlushCbs(seen)

  // Sort queue before flush.
  // This ensures that:
  // 1. Components are updated from parent to child. (because parent is always
  //    created before the child so its render effect will have smaller
  //    priority number)
  // 2. If a component is unmounted during a parent component's update,
  //    its update can be skipped.
  queue.sort((a, b) => getId(a) - getId(b))

  // conditional usage of checkRecursiveUpdate must be determined out of
  // try ... catch block since Rollup by default de-optimizes treeshaking
  // inside try-catch. This can leave all warning code unshaked. Although
  // they would get eventually shaken by a minifier like terser, some minifiers
  // would fail to do that (e.g. https://github.com/evanw/esbuild/issues/1610)
  const check = __DEV__
    ? (job: SchedulerJob) => checkRecursiveUpdates(seen!, job)
    : NOOP

  try {
    for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
      const job = queue[flushIndex]
      if (job && job.active !== false) {
        if (__DEV__ && check(job)) {
          continue
        }
        // console.log(`running:`, job.id)
        callWithErrorHandling(job, null, ErrorCodes.SCHEDULER)
      }
    }
  } finally {
    flushIndex = 0
    queue.length = 0

    flushPostFlushCbs(seen)

    isFlushing = false
    currentFlushPromise = null
    // some postFlushCb queued jobs!
    // keep flushing until it drains.
    if (
      queue.length ||
      pendingPreFlushCbs.length ||
      pendingPostFlushCbs.length
    ) {
      flushJobs(seen)
    }
  }
}
```

首先第一步把刚才设置的开关打开isFlushPending设置为false,然后去遍历queue，拿到每一个值job去执行,callWithErrorHandling,此时queue只有一个值

```js
/packages/runtime-core/src/errorHandling.ts
export function callWithErrorHandling(
  fn: Function,
  instance: ComponentInternalInstance | null,
  type: ErrorTypes,
  args?: unknown[]
) {
  let res
  try {
    res = args ? fn(...args) : fn()
  } catch (err) {
    handleError(err, instance, type)
  }
  return res
}

```

执行传入的fn，执行完成之后我们的例子在视图中就可以看到效果了