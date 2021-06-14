# babel-plugin-idle-code

自动生成一些有规律的模板代码，看着简洁一些，好像也没啥用

----

## Why babel-plugin-import

## Example

#### 安装
```javascript
npm install babel-plugin-idle-code
```

#### 配置 `babel.config.js` 的 `plugins`

```javascript
module.exports = {
  plugins: [
    'idle-code'
  ]
}

```

#### 使用

```javascript
import a, { b, c } from './utils/index'
// @idle-code: ./utils/index as {{name}}(1111)

      ↓ ↓ ↓ ↓ ↓ ↓

import a, { b, c } from './utils/index'
b(1111)
c(1111)
```

#### 使用规则
- 只支持`顶层作用域` `单行注释` `单个特性导出` 的模块

- `{{name}}`是匹配符，`name`就是导出的模块名称

- 语法为
```javascript
// @idle-code: 模块名 as 可以前{{name}}或者后补充成为一个表达式
```