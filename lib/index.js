const parser = require('@babel/parser')
function collectModule(path) {
  const moduleMap = {}
  path.traverse({
    ImportDeclaration(path) {
      const moduleName = path.node.source.value
      const list = moduleMap[moduleName] || new Set()
      path.node.specifiers
        .filter((spe) => spe.type === 'ImportSpecifier')
        .forEach((node) => {
          list.add(node.local.name)
        })
      if (list.size) {
        moduleMap[moduleName] = list
      }
    },
  })
  return moduleMap
}
function hasLeadingComments(childNode) {
  return childNode.leadingComments && childNode.leadingComments.length > 0
}
function hasTrailingComments(childNode) {
  return childNode.trailingComments && childNode.trailingComments.length > 0
}
function traverseComments(comments, moduleMap, callback) {
  comments.forEach((comment) => {
    //  @idle-code: vant as Vue.use({{name}})
    const [, moduleName, expr] = comment.value.match(/^\s*@idle-code:\s*([\w@\/\.]+)\s+as\s+([^\s]*)\s*/i) || []
    const cond = moduleName && expr && moduleMap[moduleName]
    if (!cond) return
    const sourceCode = Array.from(moduleMap[moduleName])
      .map((exportName) => {
        return expr.replace(/{{\s*name\s*}}/i, exportName)
      })
      .join('\n')

    callback(sourceCode)
  })
}

module.exports = function (babel) {
  const { types: t } = babel
  return {
    visitor: {
      Program(path) {
        // export单个特性的模块
        const moduleMap = collectModule(path)
        // 过滤重复注释
        let duplicationKey = null

        // 只支持标记在顶层作用域的注释
        path.get('body').forEach((childPath, idx) => {
          const childNode = childPath.node

          // 代码上方的注释
          if (hasLeadingComments(childNode)) {
            // 两条语句之间上下注释会重复，需要过滤
            if (childPath.key === duplicationKey) return

            traverseComments(childNode.leadingComments, moduleMap, (sourceCode) => {
              const newNodes = parser.parse(sourceCode).program.body
              childPath.insertBefore(newNodes)
            })
          }

          duplicationKey = childPath.key

          if (hasTrailingComments(childNode)) {
            traverseComments(childNode.trailingComments, moduleMap, (sourceCode) => {
              const newNodes = parser.parse(sourceCode).program.body
              childPath.insertAfter(newNodes)
              duplicationKey += newNodes.length + 1
            })
          }
        })
      },
    },
  }
}
