## isReactive

```js
test('Object', () => {
  const original = { foo: 1 }
  const observed = reactive(original)

  expect(isReactive(observed)).toBe(true)
  expect(isReactive(original)).toBe(false)

})

```

可以检查对象是否是由 reactive创建的响应式代理。

找到isReactive定义的位置

```js
/packages/reactivity/src/reactive.ts

export const enum ReactiveFlags {
  SKIP = '__v_skip',
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly',
  RAW = '__v_raw'
}

export function isReactive(value: unknown): boolean {
  return !!(value && (value as Target)[ReactiveFlags.IS_REACTIVE])
}
```

其实就是访问value的`ReactiveFlags.IS_REACTIVE`这个属性,然后就会触发代理对象中的get

```js
function createGetter(isReadonly = false, shallow = false) {
  return function get(target: Target, key: string | symbol, receiver: object) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly
    } else if (
      key === ReactiveFlags.RAW &&
      receiver ===
        (isReadonly
          ? shallow
            ? shallowReadonlyMap
            : readonlyMap
          : shallow
          ? shallowReactiveMap
          : reactiveMap
        ).get(target)
    ) {
      return target
    }
  }
}
```

可以看到如果key是`ReactiveFlags.IS_REACTIVE`则返回`!isReadonly`

看下刚刚的例子，因为observed是调用reactive创建的对象，所以会在baseHandlers.ts文件中会走

```js
const get = /*#__PURE__*/ createGetter()
```

因为isReadonly没有传参所以默认为false所以此时访问的`ReactiveFlags.IS_REACTIVE`返回的`!isReadonly`为true

而isReactive(original) 由于`original[ReactiveFlags.IS_REACTIVE]`是undefined ,所以返回false

## isReadonly

```js
it('should make nested values readonly', () => {
  const original = { foo: 1, bar: { baz: 2 } }
  const wrapped = readonly(original)
  expect(isReactive(wrapped)).toBe(false)
  expect(isReadonly(wrapped)).toBe(true)
  expect(isReactive(original)).toBe(false)
  expect(isReadonly(original)).toBe(false)
  expect(isReactive(wrapped.bar)).toBe(false)
  expect(isReadonly(wrapped.bar)).toBe(true)
  expect(isReactive(original.bar)).toBe(false)
  expect(isReadonly(original.bar)).toBe(false)
})
```

检查对象是否是由readonly创建的只读代理

isReadonly处理的方式和isReactive类似,isReadonly访问的是`ReactiveFlags.IS_READONLY`

```js
export function isReadonly(value: unknown): boolean {
  return !!(value && (value as Target)[ReactiveFlags.IS_READONLY])
}
```

此时应该调用代理对象中的

```js
const readonlyGet = /*#__PURE__*/ createGetter(true)
```

回忆一下createGetter，此时isReadonly是true,所以当key为`ReactiveFlags.IS_READONLY`直接返回isReadonly 则会true

嵌套的对象是当在访问的时候判断是否是对象递归处理

```js
if (isObject(res)) {
  // Convert returned value into a proxy as well. we do the isObject check
  // here to avoid invalid value warning. Also need to lazy access readonly
  // and reactive here to avoid circular dependency.
  return isReadonly ? readonly(res) : reactive(res)
}
```

