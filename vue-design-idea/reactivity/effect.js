

// 全局变量存储被注册的副作用函数        
let activeEffect


const effectStack = []
// 注册副作用的函数
export function effect(fn, options) {
  const effectFn = () => {
    cleanup(effectFn)
    // 当effectFn执行时，将其设置为当前激活的副作用函数
    activeEffect = effectFn

    effectStack.push(effectFn)
    const res = fn()
    effectStack.pop()

    activeEffect = effectStack[effectStack.length - 1]

    return res
  }

  // activeEffect.deps用来存储所有与该副作用函数相关联的依赖集合
  effectFn.deps = []

  effectFn.options = options
  if (!(options && options.lazy)) {
    effectFn()
  }

  return effectFn
}


const bucket = new WeakMap()

export function reactive(data) {
  const obj = new Proxy(data, {
    get(target, key) {
      track(target, key)
      return target[key]
    },
    set(target, key, newVal) {
      target[key] = newVal
      trigger(target, key)
      return true
    }
  })
  return obj
}


function track(target, key) {
  if (!activeEffect) return

  let depsMap = bucket.get(target)

  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()))
  }

  let deps = depsMap.get(key)

  if (!deps) {
    depsMap.set(key, (deps = new Set()))
  }

  deps.add(activeEffect)
  // deps就是一个与当前副作用函数存在联系的依赖集合
  activeEffect.deps.push(deps)
}

function trigger(target, key) {
  const depsMap = bucket.get(target)
  if (!depsMap) return
  const effects = depsMap.get(key)

  const effectsRun = new Set()
  effects && effects.forEach(effectFn => {
    if (effectFn !== activeEffect) {
      effectsRun.add(effectFn)
    }
  })


  effectsRun.forEach(effectFn => {
    if (effectFn.options && effectFn.options.scheduler) {
      effectFn.options.scheduler(effectFn)
    } else {
      effectFn()
    }
  })
}


function cleanup(effectFn) {
  for (let i = 0; i < effectFn.deps.length; i++) {
    // deps是依赖的集合
    const deps = effectFn.deps[i]
    // 将effectFn从依赖集合中移除
    deps.delete(effectFn)
  }

  effectFn.deps.length = 0
}


export function computed(getter) {
  let value
  let dirty = true

  const effectFn = effect(getter, {
    lazy: true,
    scheduler() {
      dirty = true
      trigger(obj, 'value')
    }
  })


  const obj = {
    get value() {
      if (dirty) {
        value = effectFn()
        dirty = false
      }
      track(obj, 'value')
      return value
    }
  }

  return obj
}


export function watch(source, cb) {

  let getter

  if (typeof source === 'function') {
    getter = source
  } else {
    getter = () => traverse(source)
  }
  let oldValue, newValue

  const effectFn = effect(
    () => getter(),
    {
      lazy: true,
      scheduler() {
        newValue = effectFn()
        cb(newValue, oldValue)
        oldValue = newValue
      }
    }
  )


  oldValue = effectFn()
}


function traverse(value, seen = new Set()) {
  // 如果读取的数据是原始值，或者已经被读取过了，那么什么都不做
  if (typeof value !== 'object' || value === null || seen.has(value)) return

  seen.add(value)

  for (const k in value) {
    traverse(value[k], seen)
  }

  return value

}