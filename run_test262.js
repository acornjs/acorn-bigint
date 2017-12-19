"use strict"

const path = require("path")
const run = require("test262-parser-runner")
const parse = require(".").parse

const unsupportedFeatures = ["object-rest", "object-spread", "regexp-named-groups",
  "async-iteration", "class-fields", "class-fields-public",
  "computed-property-names", // Only used for class fields
  "regexp-unicode-property-escapes",
  "regexp-lookbehind", "regexp-dotall", "optional-catch-binding"]

run(
  (content, options) => parse(content, {sourceType: options.sourceType, ecmaVersion: 9, plugins: { bigInt: true }}),
  {
    testsDirectory: path.dirname(require.resolve("test262/package.json")),
    skip: test => (!test.attrs.features || !test.attrs.features.includes("BigInt") || unsupportedFeatures.some(f => test.attrs.features.includes(f))),
  }
)
