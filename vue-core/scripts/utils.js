const fs = require("fs")
const chalk = require("chalk")

//遍历packages目录下的子包 读取每个包中的package.json 文件
const targets = (exports.targets = fs.readdirSync("packages").filter((f) => {
  if (!fs.statSync(`packages/${f}`).isDirectory()) {
    return false
  }
  // 读取每个包中的package.json 文件
  const pkg = require(`../packages/${f}/package.json`)
  // 判断private 和buildOptions字段 如果private 不为true并且配置了buildOptions 就编译
  if (pkg.private && !pkg.buildOptions) {
    return false
  }
  return true
}))

exports.fuzzyMatchTarget = (partialTargets, includeAllMatching) => {
  const matched = []
  partialTargets.forEach((partialTarget) => {
    for (const target of targets) {
      if (target.match(partialTarget)) {
        matched.push(target)
        if (!includeAllMatching) {
          break
        }
      }
    }
  })
  if (matched.length) {
    return matched
  } else {
    console.log()
    console.error(
      `  ${chalk.bgRed.white(" ERROR ")} ${chalk.red(
        `Target ${chalk.underline(partialTargets)} not found!`
      )}`
    )
    console.log()

    process.exit(1)
  }
}
