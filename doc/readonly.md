# readonly

首先看下测试

```js
it('should make nested values readonly', () => {
  const original = { foo: 1, bar: { baz: 2 } }
  const wrapped = readonly(original)
  expect(wrapped).not.toBe(original)
  expect(isReadonly(wrapped)).toBe(true)
  expect(isReadonly(original)).toBe(false)
  expect(isReadonly(wrapped.bar)).toBe(true)
  expect(isReadonly(original.bar)).toBe(false)
  // get
  expect(wrapped.foo).toBe(1)
  // has
  expect('foo' in wrapped).toBe(true)
  // ownKeys
  expect(Object.keys(wrapped)).toEqual(['foo', 'bar'])
})

it('should not allow mutation', () => {
  const qux = Symbol('qux')
  const original = {
    foo: 1,
    bar: {
      baz: 2
    },
    [qux]: 3
  }
  const wrapped: Writable<typeof original> = readonly(original)

  wrapped.foo = 2
  expect(wrapped.foo).toBe(1)
  expect(
    `Set operation on key "foo" failed: target is readonly.`
  ).toHaveBeenWarnedLast()

  wrapped.bar.baz = 3
  expect(wrapped.bar.baz).toBe(2)
  expect(
    `Set operation on key "baz" failed: target is readonly.`
  ).toHaveBeenWarnedLast()
})
```

Readonly的意思是我们只可以访问值，却不可以修改值

```js
export function readonly<T extends object>(
  target: T
): DeepReadonly<UnwrapNestedRefs<T>> {
  return createReactiveObject(
    target,
    true,
    readonlyHandlers,
    readonlyCollectionHandlers,
    readonlyMap
  )
}

function createReactiveObject(
  target: Target,
  isReadonly: boolean,
  baseHandlers: ProxyHandler<any>,
  collectionHandlers: ProxyHandler<any>,
  proxyMap: WeakMap<Target, any>
) {
  if (!isObject(target)) {
    if (__DEV__) {
      console.warn(`value cannot be made reactive: ${String(target)}`)
    }
    return target
  }
  // target is already a Proxy, return it.
  // exception: calling readonly() on a reactive object
  // 如果已经是响应式对象，则直接返回，避免重复创建
  if (
    target[ReactiveFlags.RAW] &&
    !(isReadonly && target[ReactiveFlags.IS_REACTIVE])
  ) {
    return target
  }
  // target already has corresponding Proxy
  const existingProxy = proxyMap.get(target)
  if (existingProxy) {
    return existingProxy
  }
  // only a whitelist of value types can be observed.
  const targetType = getTargetType(target)
  if (targetType === TargetType.INVALID) {
    return target
  }
  // 响应式处理: 利用Proxy做代理
  // vue2
  // Object.defineProperty
  // COLLECTION： Map Set
  const proxy = new Proxy(
    target,
    targetType === TargetType.COLLECTION ? collectionHandlers : baseHandlers
  )
  proxyMap.set(target, proxy)
  return proxy
}
```

其实差不多和reactive的处理方式是一样的，只不过第二个参数isReadonly是true

baseHandlers传的是readonlyHandlers，所以当访问用readonly包裹的对象的时候，proxy里面的拦截是用readonlyHandlers拦截的

```js
export const readonlyHandlers: ProxyHandler<object> = {
  get: readonlyGet,
  set(target, key) {
    if (__DEV__) {
      console.warn(
        `Set operation on key "${String(key)}" failed: target is readonly.`,
        target
      )
    }
    return true
  },
  deleteProperty(target, key) {
    if (__DEV__) {
      console.warn(
        `Delete operation on key "${String(key)}" failed: target is readonly.`,
        target
      )
    }
    return true
  }
}
```

可以看到，当访问到对象的时候，会触发readonlyGet,而当修改对象，对着删除对象中的属性的时候，都会发出警告，所以由此可以断定，readonly只能访问不能修改和删除。

```js
const readonlyGet = /*#__PURE__*/ createGetter(true)
function createGetter(isReadonly = false, shallow = false) {
  return function get(target: Target, key: string | symbol, receiver: object) {
   
    const targetIsArray = isArray(target)

    const res = Reflect.get(target, key, receiver)

    if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
      return res
    }

    if (!isReadonly) {
      track(target, TrackOpTypes.GET, key)
    }

    if (shallow) {
      return res
    }

    if (isRef(res)) {
      // ref unwrapping - does not apply for Array + integer key.
      const shouldUnwrap = !targetIsArray || !isIntegerKey(key)
      return shouldUnwrap ? res.value : res
    }

    if (isObject(res)) {
      // Convert returned value into a proxy as well. we do the isObject check
      // here to avoid invalid value warning. Also need to lazy access readonly
      // and reactive here to avoid circular dependency.
      return isReadonly ? readonly(res) : reactive(res)
    }

    return res
  }
}
```

这里首先返回res,然后判断是否是isReadonly,因为readonly是不允许修改的，所以就没有必要去触发依赖更新，那也就没有必要去收集依赖了。下面判断res是否是对象，来处理嵌套对象的，所以当readonly包裹的对象是一个嵌套的，那对象的每一层都是readonly的状态