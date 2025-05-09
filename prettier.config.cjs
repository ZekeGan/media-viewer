/** @type {import("prettier").Config} */
module.exports = {
  semi: false, // 使用分號
  singleQuote: true, // 使用單引號
  tabWidth: 2, // 縮排 2 個空格
  trailingComma: 'es5', // 物件/陣列的最後一個元素後面要逗號
  printWidth: 100, // 每行最多 100 字符
  bracketSpacing: true, // `{ foo: bar }` 這樣的格式
  arrowParens: 'avoid', // 只有一個參數時省略括號
  endOfLine: 'lf', // 使用 LF 作為換行符號
  bracketSameLine: false,
}
