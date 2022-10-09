职责：transform 模块对代码进行优化，比如识别 Vue 中的语法，静态标记

四步： 创建transform上下文，遍历AST节点，静态提升，创建根代码生成节点

- createTransformsContext： 创建transform上下文 维护了transform过程的一些配置
	- helpers 辅助函数
	- transform过程的一些状态数据，比如当前处理的ast节点

遍历AST节点
- 执行traverseNode
- 转换函数会设计一个退出函数 onExit() 在处理完子节点后执行

traverseNode
- 递归遍历AST节点，针对每个节点执行一系列的转换函数，有些 转换函数还会设计退出函数，当执行完转换函数之后,会返回一个活多个退出函数，然后在处理完子节点后再执行这些退出函数