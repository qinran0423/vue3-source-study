/*
Run Rollup in watch mode for development.

To specific the package to watch, simply pass its name and the desired build
formats to watch (defaults to "global"):

```
# name supports fuzzy match. will watch all packages with name containing "dom"
nr dev dom

# specify the format to output
nr dev core --formats cjs

# Can also drop all __DEV__ blocks with:
__DEV__=false nr dev
```
*/

// 执行命令行脚本
const execa = require('execa')
const { fuzzyMatchTarget } = require('./utils')
// 获取传入的参数
const args = require('minimist')(process.argv.slice(2))
// 设置打包目标，默认什么都也不传会打包vue
const target = args._.length ? fuzzyMatchTarget(args._)[0] : 'vue'
// 设置打包格式
const formats = args.formats || args.f

const sourceMap = args.sourcemap || args.s
const commit = execa.sync('git', ['rev-parse', 'HEAD']).stdout.slice(0, 7)

// 执行rollup
execa(
  'rollup',
  [
    '-wc',
    '--environment',
    [
      `COMMIT:${commit}`,
      `TARGET:${target}`,
      `FORMATS:${formats || 'global'}`,
      sourceMap ? `SOURCE_MAP:true` : ``
    ]
      .filter(Boolean)
      .join(',')
  ],
  {
    stdio: 'inherit'
  }
)
