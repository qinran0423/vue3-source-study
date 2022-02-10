## isRef

```js
test('isRef', () => {
  expect(isRef(ref(1))).toBe(true)
  expect(isRef(computed(() => 1))).toBe(true)

  expect(isRef(0)).toBe(false)
  expect(isRef(1)).toBe(false)
  // an object that looks like a ref isn't necessarily a ref
  expect(isRef({ value: 0 })).toBe(false)
})
```

检查值是否为一个 ref 对象

```js
export function isRef(r: any): r is Ref {
  return Boolean(r && r.__v_isRef === true)
}
```

其实这个和isReactive的实现方式差不多，isRef接受一个对象，判断这个对象的`__v_isRef`是否存在

回忆一下

```js
class RefImpl<T> {
  private _value: T
  private _rawValue: T

  public dep?: Dep = undefined
  public readonly __v_isRef = true

  constructor(value: T, public readonly _shallow: boolean) {
    ···
  }

  get value() {
    ···
  }

  set value(newVal) {
    ···
  }
}
```

ref其实就是一个工厂函数返回的对象实例，这个对象实例是通过`new RefTmpl`创建的。

这个类中有一个不可更改的属性` __v_isRef = true`

所以只要是ref创建的值，都会有这个属性。

## unRef

```js
test('unref', () => {
  expect(unref(1)).toBe(1)
  expect(unref(ref(1))).toBe(1)
})
```

如果参数是一个 ref,则返回内部值，否则返回参数本身

```js
export function unref<T>(ref: T | Ref<T>): T {
  return isRef(ref) ? (ref.value as any) : ref
}
```

结果一目了解，不需要解释