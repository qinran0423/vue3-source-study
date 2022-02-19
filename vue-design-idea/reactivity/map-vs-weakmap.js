const map = new Map();
const weakmap = new WeakMap();

(function () {
  const foo = { foo: 1 }
  const bar = { bar: 1 }

  map.set(foo, 1)
  weakmap.set(bar, 2)
})()


console.log('mapkey', map.keys);
console.log('weakmapkey', weakmap.keys);