# effect

看几个基本的测试文件

### 测试一

```js
it('should run the passed function once (wrapped by a effect)', () => {
  const fnSpy = jest.fn(() => {})
  effect(fnSpy)
  expect(fnSpy).toHaveBeenCalledTimes(1)
})
```

这里模拟了一个函数fnSpy，用effect包裹了fnSpy,但是呢fnSpy自动执行了一次。所以猜测，当effect执行的时候，effect内部包裹的函数将自动执行。

```js
/packages/reactivity/src/effect.ts
export function effect<T = any>(
  fn: () => T,
  options?: ReactiveEffectOptions
): ReactiveEffectRunner {
  if ((fn as ReactiveEffectRunner).effect) {
    fn = (fn as ReactiveEffectRunner).effect.fn
  }

  const _effect = new ReactiveEffect(fn)
  if (options) {
    extend(_effect, options)
    if (options.scope) recordEffectScope(_effect, options.scope)
  }
  if (!options || !options.lazy) {
    _effect.run()
  }
  const runner = _effect.run.bind(_effect) as ReactiveEffectRunner
  runner.effect = _effect
  return runner
}
```

定义了effect,然后new ReactiveEffect并且把effect的参数传入了进去，返回`_effect`实例，然后执行了`_effect.run`。这里我猜测当执行`_effect.run`的时候，effect传入的这个参数会被执行。下面来验证一下。首先看下ReactiveEffect这个类是怎么实现。

```js
export class ReactiveEffect<T = any> {
  active = true
  deps: Dep[] = []

  // can be attached after creation
  computed?: boolean
  allowRecurse?: boolean
  onStop?: () => void
  // dev only
  onTrack?: (event: DebuggerEvent) => void
  // dev only
  onTrigger?: (event: DebuggerEvent) => void

  constructor(
    public fn: () => T,
    public scheduler: EffectScheduler | null = null,
    scope?: EffectScope | null
  ) {
    recordEffectScope(this, scope)
  }

  run() {
		···
      return this.fn()

		···
  }
	···
}
```

这里很容易就可以看明白，构造函数接受了fn参数，然后定义了run 方法，当执行run方法的时候，则执行this.fn()

### 测试二

```js
it('should observe basic properties', () => {
    let dummy
    const counter = reactive({ num: 0 })
    effect(() => (dummy = counter.num))

    expect(dummy).toBe(0)
    counter.num = 7
    expect(dummy).toBe(7)
  })
```

effect传入一个函数，在这个函数有响应式数据，当响应式数据发生变化的时候，传入的函数会再次执行

再次回到effect函数中，每次执行effect都会new ReactiveEffect，得到`_effect`实例，然后执行`_effect.run`

```js
const effectStack: ReactiveEffect[] = []
let activeEffect: ReactiveEffect | undefined
export class ReactiveEffect<T = any> {
  active = true
  deps: Dep[] = []

  // can be attached after creation
  computed?: boolean
  allowRecurse?: boolean
  onStop?: () => void
  // dev only
  onTrack?: (event: DebuggerEvent) => void
  // dev only
  onTrigger?: (event: DebuggerEvent) => void

  constructor(
    public fn: () => T,
    public scheduler: EffectScheduler | null = null,
    scope?: EffectScope | null
  ) {
    recordEffectScope(this, scope)
  }

  run() {
    if (!this.active) {
      return this.fn()
    }
    if (!effectStack.includes(this)) {
      try {
        effectStack.push((activeEffect = this))
        enableTracking()

        trackOpBit = 1 << ++effectTrackDepth

        if (effectTrackDepth <= maxMarkerBits) {
          initDepMarkers(this)
        } else {
          cleanupEffect(this)
        }
        return this.fn()
      } finally {
        if (effectTrackDepth <= maxMarkerBits) {
          finalizeDepMarkers(this)
        }

        trackOpBit = 1 << --effectTrackDepth

        resetTracking()
        effectStack.pop()
        const n = effectStack.length
        activeEffect = n > 0 ? effectStack[n - 1] : undefined
      }
    }
  }

}
```

提前定义了两个变量 effectStack、activeEffect。当执行run的时候，会判断effectStack中是否已经存过activeEffect,如果没有存过则执行`effectStack.push((activeEffect = this))`这里做了两步操作，一个是将this赋值给activeEffect, 然后将activeEffect保存在effectStack。然后执行了this.fn。当执行了this.fn就出触发依赖收集，则会执行track。然后把activeEffect收集到dep中，完成依赖收集。

```js
// 依赖收集
export function track(target: object, type: TrackOpTypes, key: unknown) {
  if (!isTracking()) {
    return
  }
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = createDep()))
  }
  trackEffects(dep, eventInfo)
}

export function trackEffects(
  dep: Dep,
  debuggerEventExtraInfo?: DebuggerEventExtraInfo
) {
	···
  dep.add(activeEffect!)
	···
}
```

当响应式数据发生了变化，则会触发set。然后会触发trigger去触发依赖更新

```js
export function triggerEffects(
  dep: Dep | ReactiveEffect[],
  debuggerEventExtraInfo?: DebuggerEventExtraInfo
) {
  // spread into array for stabilization
  for (const effect of isArray(dep) ? dep : [...dep]) {
    ···
    effect.run()
    ···
  }
}
```

因为执行了run ,所以之前传入的fn会再次执行，所以测试可以通过

### 测试三

```js
it('should return a new reactive version of the function', () => {
    function greet() {
      return 'Hello World'
    }
    const effect1 = effect(greet)
    const effect2 = effect(greet)
    expect(typeof effect1).toBe('function')
    expect(typeof effect2).toBe('function')
    expect(effect1).not.toBe(greet)
    expect(effect1).not.toBe(effect2)
  })
```

测试用例中effect会返回一个函数。看着这个函数是一个什么样的函数。

```js
export function effect<T = any>(
  fn: () => T,
  options?: ReactiveEffectOptions
): ReactiveEffectRunner {
  if ((fn as ReactiveEffectRunner).effect) {
    fn = (fn as ReactiveEffectRunner).effect.fn
  }

  const _effect = new ReactiveEffect(fn)
	···
  const runner = _effect.run.bind(_effect) as ReactiveEffectRunner
  runner.effect = _effect
  return runner
}
```

其实返回的就是`_effect.run`

### 测试四

```js
it('scheduler', () => {
    let dummy
    let run: any
    const scheduler = jest.fn(() => {
      run = runner
    })
    const obj = reactive({ foo: 1 })
    const runner = effect(
      () => {
        dummy = obj.foo
      },
      { scheduler }
    )
    expect(scheduler).not.toHaveBeenCalled()
    expect(dummy).toBe(1)
    // should be called on first trigger
    obj.foo++
    expect(scheduler).toHaveBeenCalledTimes(1)
    // should not run yet
    expect(dummy).toBe(1)
    // manually run
    run()
    // should have run
    expect(dummy).toBe(2)
  })

```

首先模拟一个函数scheduler, 然后用对象包裹放到effect的第二个参数中。当响应式数据发生改变的时候，则执行了scheduler。

```js

export const extend = Object.assign

export function effect<T = any>(
  fn: () => T,
  options?: ReactiveEffectOptions
): ReactiveEffectRunner {
  if ((fn as ReactiveEffectRunner).effect) {
    fn = (fn as ReactiveEffectRunner).effect.fn
  }

  const _effect = new ReactiveEffect(fn)
  if (options) {
    extend(_effect, options)
    if (options.scope) recordEffectScope(_effect, options.scope)
  }
  if (!options || !options.lazy) {
    _effect.run()
  }
  const runner = _effect.run.bind(_effect) as ReactiveEffectRunner
  runner.effect = _effect
  return runner
}
```

effect的第二个参数options, 代码中做了判断，如果以后这个options参数，则执行将options和`_effect`合并到`_effect`上，此时`_effect`就有了scheduler属性。当响应式数据发生变化的时候，执行trigger，接着执行triggerEffect时。

```js
export function triggerEffects(
  dep: Dep | ReactiveEffect[],
  debuggerEventExtraInfo?: DebuggerEventExtraInfo
) {
  // spread into array for stabilization
  for (const effect of isArray(dep) ? dep : [...dep]) {
    if (effect !== activeEffect || effect.allowRecurse) {
      if (__DEV__ && effect.onTrigger) {
        effect.onTrigger(extend({ effect }, debuggerEventExtraInfo))
      }
      if (effect.scheduler) {
        effect.scheduler()
      } else {
        effect.run()
      }
    }
  }
}
```

如果scheduler存在的时候则执行scheduler，就不会执行run了。

#### 回想一下：

```js
const effect = (instance.effect = new ReactiveEffect(
  componentUpdateFn,
  () => queueJob(instance.update),
  instance.scope // track it in component's effect scope
))
```

这段代码是渲染时候执行的，首次渲染则执行componentUpdateFn,componentUpdateFn中响应式数据发生变化的时候，会去执行triggerEffect,去遍历dep,拿到effect,判断effect中schduler是否存在，这里scheduler刚好存在，则执行scheduler。

### 测试四

```js
it('stop', () => {
    let dummy
    const obj = reactive({ prop: 1 })
    const runner = effect(() => {
      dummy = obj.prop
    })
    obj.prop = 2
    expect(dummy).toBe(2)
    stop(runner)
    obj.prop = 3
    expect(dummy).toBe(2)

    // stopped effect should still be manually callable
    runner()
    expect(dummy).toBe(3)
  })
```

这段测试代码中将effect返回的函数用stop包裹了一下，然后当响应式数据发生了变化，就不会在触发依赖更新了。

猜测：当执行stop的时候，将dep的对应的依赖删掉？

```js

export function stop(runner: ReactiveEffectRunner) {
  runner.effect.stop()
}
```

stop的参数是runner，也就是测试中effect执行返回的runner。

```js
export function effect<T = any>(
  fn: () => T,
  options?: ReactiveEffectOptions
): ReactiveEffectRunner {
  const _effect = new ReactiveEffect(fn)
  const runner = _effect.run.bind(_effect) as ReactiveEffectRunner
  runner.effect = _effect
  return runner
}
```

上面说到runner其实就是`_effect.run`，然后有吧`new ReactiveEffect`的实例`_effect`挂到了runner.effect上面。stop中就是执行的这个实例上面的stop。

```js
export class ReactiveEffect<T = any> {
  active = true
  deps: Dep[] = []

  // can be attached after creation
  computed?: boolean
  allowRecurse?: boolean
  onStop?: () => void
  // dev only
  onTrack?: (event: DebuggerEvent) => void
  // dev only
  onTrigger?: (event: DebuggerEvent) => void

  constructor(
    public fn: () => T,
    public scheduler: EffectScheduler | null = null,
    scope?: EffectScope | null
  ) {
    recordEffectScope(this, scope)
  }

  run() {
    ···
  }

  stop() {
    if (this.active) {
      cleanupEffect(this)
      if (this.onStop) {
        this.onStop()
      }
      this.active = false
    }
  }
}
function cleanupEffect(effect: ReactiveEffect) {
  const { deps } = effect
  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect)
    }
    deps.length = 0
  }
}
```

在执行stop的时候，this.active判断是否已经清空过了（性能优化）。然后执行了cleanupEffect(this)，可以想到这一步就是清除依赖的。在cleanupEffect中首先是从实例中拿到deps。

疑问：那这个deps是什么时候存的呢？

回忆一下收集依赖的时候：

```js
export function trackEffects(
  dep: Dep,
  debuggerEventExtraInfo?: DebuggerEventExtraInfo
) {
  let shouldTrack = false
  if (effectTrackDepth <= maxMarkerBits) {
    if (!newTracked(dep)) {
      dep.n |= trackOpBit // set newly tracked
      shouldTrack = !wasTracked(dep)
    }
  } else {
    // Full cleanup mode.
    shouldTrack = !dep.has(activeEffect!)
  }

  if (shouldTrack) {
    dep.add(activeEffect!)
    activeEffect!.deps.push(dep)
  }
}
```

当dep收集到当前的activeEffect,反向activeEffect中的deps也收集了dep。

理解一下：为什么要反向收集？因为要知道当前的副作用被拿些dep收集了，后续清除依赖的时候，可以一并把这些dep中的activeEffect全部清掉。

上面说到拿到deps，然后遍历删除对应的activeEffect就可以了。所以此时当响应式数据再次发生变化的时候就找不到对应的依赖了。

### 测试五

```js
import {
  reactive,
  effect,
  stop,
  toRaw,
  TrackOpTypes,
  TriggerOpTypes,
  DebuggerEvent,
  markRaw,
  shallowReactive,
  readonly,
  ReactiveEffectRunner
} from '../src/index'

it('events: onStop', () => {
  const onStop = jest.fn()
  const runner = effect(() => {}, {
    onStop
  })

  stop(runner)
  expect(onStop).toHaveBeenCalled()
})
```

测试中，模拟了函数onStop,然后将这个函数传入了effect的第二个参数。

stop是已经定义好的方法，当执行了stop并且传入了runner,结果发现onStop执行了。

看下stop方法

```js
export function stop(runner: ReactiveEffectRunner) {
  runner.effect.stop()
}
```

再来会议一下这个runner是什么。

```js
export function effect<T = any>(
  fn: () => T,
  options?: ReactiveEffectOptions
): ReactiveEffectRunner {
  const _effect = new ReactiveEffect(fn)
  if (options) {
    extend(_effect, options)
    if (options.scope) recordEffectScope(_effect, options.scope)
  }
  const runner = _effect.run.bind(_effect) as ReactiveEffectRunner
  runner.effect = _effect
  return runner
}
```

runner其实就是`_effect.run`（触发副作用），把`_effect`保存到了runner.effect上面了。而上面的stop的方法接受参数runner，然后拿到了runner的effect调用了stop。

在调用了stop中执行了这样的代码

```js
stop() {
    if (this.active) {
      cleanupEffect(this)
      if (this.onStop) {
        this.onStop()
      }
      this.active = false
    }
  }
```

如果`this.onStop`存在在执行`this.onStop`

由于`extend(_effect, options)`所以effect的第二个参数`{onStop}`会被合并到实例上面，所以onStop会被调用
