# effect

这里可以直接看测试文件

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
    if (!this.active) {
      return this.fn()
    }
		···
  }
	···
}
```

这里很容易就可以看明白，构造函数接受了fn参数，然后定义了run 方法，当执行run方法的时候，则执行this.fn()