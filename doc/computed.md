# computed

```js
it('should return updated value', () => {
    const value = reactive<{ foo?: number }>({})
    const cValue = computed(() => value.foo)
    expect(cValue.value).toBe(undefined)
    value.foo = 1
    expect(cValue.value).toBe(1)
  })
```

computed返回一个依赖响应式数据的值，访问这个值需要通过`.value`

```js
/packages/reactivity/src/computed.ts
export function computed<T>(
  getterOrOptions: ComputedGetter<T> | WritableComputedOptions<T>,
  debugOptions?: DebuggerOptions
) {
  let getter: ComputedGetter<T>
 	···
  const cRef = new ComputedRefImpl(getter, setter, onlyGetter || !setter)
 	···
  return cRef as any
}

```

computed返回一个由`new ComputedRefImpl`创建的实例, getter就是computed的第一个参数。

```js
class ComputedRefImpl<T> {
  public dep?: Dep = undefined

  private _value!: T
  private _dirty = true
  public readonly effect: ReactiveEffect<T>

  public readonly __v_isRef = true
  public readonly [ReactiveFlags.IS_READONLY]: boolean

  constructor(
    getter: ComputedGetter<T>,
    private readonly _setter: ComputedSetter<T>,
    isReadonly: boolean
  ) {
    this.effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true
        triggerRefValue(this)
      }
    })
    this[ReactiveFlags.IS_READONLY] = isReadonly
  }

  get value() {
    // the computed ref may get wrapped by other proxies e.g. readonly() #3376
    const self = toRaw(this)
    trackRefValue(self)
    if (self._dirty) {
      self._dirty = false
      self._value = self.effect.run()!
    }
    return self._value
  }

  set value(newValue: T) {
    this._setter(newValue)
  }
}
```

`new ComputedRefImpl`构造函数会`new ReactiveEffect`创建一个副作用。

当访问由`ComputedRefImpl`类创建的实例的value的时候(所以访问计算属性的值得时候需要.value)，会触发get，然后会触发trackRefValue去收集依赖。

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
```

这里的依赖收集和ref的基本上没什么差别，ComputedRefImpl类中默认定义了属性dep就是为了收集依赖用的，这里收集的依赖就是我们`new ComputedRefImpl`构造函数会`new ReactiveEffect`创建一个副作用。

注意：reactive创建的响应式对象也会去收集依赖，同样也是把这个依赖收集起来。

```js
if (self._dirty) {
  self._dirty = false
  self._value = self.effect.run()!
}
```

这一步操作，我认为是computed的精髓。_dirty默认是true

首先会判断_dirty是否为true,第一次的时候肯定是true,接着就把这个值设置为fasle,然后把`self.effect.run()`返回结果赋值给` self._value`.（这里忘了的话可以看[effect](https://github.com/qinran0423/vue3-source-study/blob/main/doc/effect.md)）。然后返回` self._value`

```js
it('should compute lazily', () => {
    const value = reactive<{ foo?: number }>({})
    const getter = jest.fn(() => value.foo)
    const cValue = computed(getter)

    // lazy
    expect(getter).not.toHaveBeenCalled()

    expect(cValue.value).toBe(undefined)
    expect(getter).toHaveBeenCalledTimes(1)

    // should not compute again
    cValue.value
    expect(getter).toHaveBeenCalledTimes(1)

    // should not compute until needed
    value.foo = 1
    expect(getter).toHaveBeenCalledTimes(1)

    // now it should compute
    expect(cValue.value).toBe(1)
    expect(getter).toHaveBeenCalledTimes(2)

    // should not compute again
    cValue.value
    expect(getter).toHaveBeenCalledTimes(2)
  })
```

这个测试说明，当第一次访问`cValue.value`的时候，触发了get，首次触发的时候,_dirty由true变成了false。当`value.foo `发生了变化的时候，则会去触发依赖的更新。

这里的触发依赖了reactive创建的响应式数据foo的依赖。

由于`new ReactiveEffect`有第二个参数`scheduler`,所以依赖更新的时候会执行`scheduler`,

```js
() => {
  if (!this._dirty) {
    this._dirty = true
    triggerRefValue(this)
  }
})
```

这里如果_dirty为false的时候， 则将设置成true.然后通过triggerRefValue触发依赖的更新。

当再次的访问computed的时候，会触发get,由于_dirty此时变成了true 所以会再次执行`self._value = self.effect.run()!`重新赋值。



如果连续访问computed的value的时候，而computed依赖的响应式数据没有发生变化，_dirty只有第一次访问的时候为true,后面再访问就是false,拿到的也就是第一次访问的值，这就建立了缓存



疑惑: 为什么要在get的时候通过trackRefValue收集依赖，在scheduler触发依赖？