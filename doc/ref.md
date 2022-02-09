# ref

### 第一个测试

```js
it('should hold a value', () => {
  const a = ref(1)
  expect(a.value).toBe(1)
  a.value = 2
  expect(a.value).toBe(2)
})
```

`ref(1)`返回a， a.value 为1，当修改了a.value为2，此时a.value为2

看下ref在哪里定义的

```js
/packages/reactivity/src/ref.ts
export function ref(value?: unknown) {
  return createRef(value, false)
}

function createRef(rawValue: unknown, shallow: boolean) {
  if (isRef(rawValue)) {
    return rawValue
  }
  return new RefImpl(rawValue, shallow)
}

class RefImpl<T> {
  private _value: T
  private _rawValue: T

  public dep?: Dep = undefined
  public readonly __v_isRef = true

  constructor(value: T, public readonly _shallow: boolean) {
    this._rawValue = _shallow ? value : toRaw(value)
    this._value = _shallow ? value : toReactive(value)
  }

  get value() {
    trackRefValue(this)
    return this._value
  }

  set value(newVal) {
    newVal = this._shallow ? newVal : toRaw(newVal)
    if (hasChanged(newVal, this._rawValue)) {
      this._rawValue = newVal
      this._value = this._shallow ? newVal : toReactive(newVal)
      triggerRefValue(this, newVal)
    }
  }
}
```

`ref`是由函数`createRef`返回的结果，`createRef`返回了一个`new RefImpl`的实例。

RefImpl是一个类，当访问这个实例的value会访问get, 当修改value会触发set。在构造函数把参数value赋值给了`this._value`。所以当访问value的时候，get函数会返回`this._value`

修改value的时候，触发了set，然后给`this._value`重新赋值

### 第二个测试

```js
it('should be reactive', () => {
  const a = ref(1)
  let dummy
  let calls = 0
  effect(() => {
    calls++
    dummy = a.value
  })
  expect(calls).toBe(1)
  expect(dummy).toBe(1)
  a.value = 2
  expect(calls).toBe(2)
  expect(dummy).toBe(2)
  // same value should not trigger
  a.value = 2
  expect(calls).toBe(2)
})
```

基于`a.value`生成了一个副作用，给`a.value`重新赋值，副作用会再次触发。如果`a.value`赋的值和之前的一样则不会触发副作用。

这里就是一个响应式的东西，需要对依赖的收集和触发。

#### 依赖收集

当访问`a.value`的时候，会触发get。

```js
get value() {
  trackRefValue(this)
  return this._value
}
```

```js
export function trackRefValue(ref: RefBase<any>) {
  if (isTracking()) {
    ref = toRaw(ref)
    if (!ref.dep) {
      ref.dep = createDep()
    }
    if (__DEV__) {
      trackEffects(ref.dep, {
        target: ref,
        type: TrackOpTypes.GET,
        key: 'value'
      })
    } else {
      trackEffects(ref.dep)
    }
  }
}

/packages/reactivity/src/dep.ts
export const createDep = (effects?: ReactiveEffect[]): Dep => {
  const dep = new Set<ReactiveEffect>(effects) as Dep
  dep.w = 0
  dep.n = 0
  return dep
}
```

调用trackRefValue, 将ref实例传入。isTracking判断依赖是否已经收集过了。默认`ref.dep`是undefined,然后通过createDep创建一个dep，然后通过trackEffects收集依赖。

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

懵了一下。 这收集的依赖是什么？activeEffect....

再看下刚才的例子。effect内部的参数会默认执行一次，此时就是访问`a.value`回忆一下effect

##### 回忆effect

```js
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

执行了_effect.run，然后将`activeEffect = this`

所以回答上面的疑惑，activeEffect就是ReactiveEffect的实例，每次执行effect都会生成一个ReactiveEffect的实例，这个实例就是要收集的依赖

#### 触发依赖

当修改`a.value`的值会触发set

```js
class RefImpl<T> {
  private _value: T
  private _rawValue: T

  public dep?: Dep = undefined
  public readonly __v_isRef = true

  constructor(value: T, public readonly _shallow: boolean) {
    this._rawValue = _shallow ? value : toRaw(value)
    this._value = _shallow ? value : toReactive(value)
  }

  get value() {
    trackRefValue(this)
    return this._value
  }

  set value(newVal) {
    newVal = this._shallow ? newVal : toRaw(newVal)
    if (hasChanged(newVal, this._rawValue)) {
      this._rawValue = newVal
      this._value = this._shallow ? newVal : toReactive(newVal)
      triggerRefValue(this, newVal)
    }
  }
}

```

这边有点疑惑，更新value的值，为啥还要做`hasChanged(newVal, this._rawValue)` `this._rawValue`又是啥玩意？

看下构造函数 将value的值先后赋值给了`this._rawValue` `this._value`

这里主要是对性能的处理。

首先对value的值备份一下，每次修改value的时候，判断新的值和备份的值有没有变化，如果有变化则重新赋值，触发依赖的更新。如果没有变化则什么都不干，更没有必要去重新触发依赖更新了。这也就提前解决了测试中的最后一步。

值发生了变化，对`this._value`和`this._rawValue`从新赋值。然后触发依赖更新。

```js
export function triggerRefValue(ref: RefBase<any>, newVal?: any) {
  ref = toRaw(ref)
  if (ref.dep) {
    if (__DEV__) {
      triggerEffects(ref.dep, {
        target: ref,
        type: TriggerOpTypes.SET,
        key: 'value',
        newValue: newVal
      })
    } else {
      triggerEffects(ref.dep)
    }
  }
}

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

这里就是拿到ref中dep收集的所有依赖的集合进行遍历，然后执行run()重新执行副作用函数。

### 第三个测试

```js
it('should make nested properties reactive', () => {
  const a = ref({
    count: 1
  })
  let dummy
  effect(() => {
    dummy = a.value.count
  })
  expect(dummy).toBe(1)
  a.value.count = 2
  expect(dummy).toBe(2)
})
```

这里主要是对ref传入的对象的处理。

再次看下RefImpl这个类

```js
class RefImpl<T> {
  private _value: T
  private _rawValue: T

  public dep?: Dep = undefined
  public readonly __v_isRef = true

  constructor(value: T, public readonly _shallow: boolean) {
    this._rawValue = _shallow ? value : toRaw(value)
    this._value = _shallow ? value : toReactive(value)
  }

  get value() {
    trackRefValue(this)
    return this._value
  }

  set value(newVal) {
    newVal = this._shallow ? newVal : toRaw(newVal)
    if (hasChanged(newVal, this._rawValue)) {
      this._rawValue = newVal
      this._value = this._shallow ? newVal : toReactive(newVal)
      triggerRefValue(this, newVal)
    }
  }
}

```

看下_shallow这个参数，ref传入的这个参数是false

所以不论是构造函数初始化给`this._value`赋值还是修改value的值得时候，都是toReactive(value)的返回值

```js
export const toReactive = <T extends unknown>(value: T): T =>
  isObject(value) ? reactive(value) : value
```

判断value是否是对象，如果是对象则将reactive包裹，如果不是则返回原始值。