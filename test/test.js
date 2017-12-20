"use strict"

const assert = require("assert")
const acorn = require("..")

function test(text, expectedResult, additionalOptions) {
  it(text, function () {
    const result = acorn.parse(text, Object.assign({ ecmaVersion: 9, plugins: { bigInt: true } }, additionalOptions))
    assert.deepEqual(result.body[0], expectedResult)
  })
}
function testFail(text, expectedError, additionalOptions) {
  it(text, function () {
    let failed = false
    try {
      acorn.parse(text, Object.assign({ ecmaVersion: 9, plugins: { bigInt: true } }, additionalOptions))
    } catch (e) {
      assert.equal(e.message, expectedError)
      failed = true
    }
    assert(failed)
  })
}

const maybeBigInt = str => typeof BigInt !== "undefined" && BigInt.parseInt ? BigInt.parseInt(str) : null

describe("acorn-bigint", function () {
  const digits = [
    {d: "0", ast: start => ({
      type: "Literal",
      start: start,
      end: start + 2,
      value: maybeBigInt("0"),
      raw: "0n",
      bigint: "0n"
    })},

    {d: "2", ast: start => ({
      type: "Literal",
      start: start,
      end: start + 2,
      value: maybeBigInt("2"),
      raw: "2n",
      bigint: "2n"
    })},

    {d: "0x2", ast: start => ({
      type: "Literal",
      start: start,
      end: start + 4,
      value: maybeBigInt("2"),
      raw: "0x2n",
      bigint: "0x2n"
    })},

    {d: "0o2", ast: start => ({
      type: "Literal",
      start: start,
      end: start + 4,
      value: maybeBigInt("2"),
      raw: "0o2n",
      bigint: "0o2n"
    })},

    {d: "0b10", ast: start => ({
      type: "Literal",
      start: start,
      end: start + 5,
      value: maybeBigInt("2"),
      raw: "0b10n",
      bigint: "0b10n"
    })},
    {d: "-0xbf2ed51ff75d380fd3be813ec6185780", ast: start => ({
      type: "UnaryExpression",
      start: start,
      end: start + 36,
      operator: "-",
      prefix: true,
      argument: {
        type: "Literal",
        start: start + 1,
        end: start + 36,
        value: maybeBigInt("0xbf2ed51ff75d380fd3be813ec6185780"),
        raw: "0xbf2ed51ff75d380fd3be813ec6185780n",
        bigint: "0xbf2ed51ff75d380fd3be813ec6185780n"
      }
    })},
    {d: "02", error: start => `Identifier directly after number (1:${start + 2})`},
    {d: "2e2", error: start => `Identifier directly after number (1:${start + 3})`},
    {d: "2.4", error: start => `Identifier directly after number (1:${start + 3})`},
    {d: ".4", error: start => `Identifier directly after number (1:${start + 2})`},
  ]
  const statements = [
    {s: "let i = %s", ast: content => ({
      type: "VariableDeclaration",
      start: 0,
      end: content.end,
      kind: "let",
      declarations: [{
        type: "VariableDeclarator",
        start: 4,
        end: content.end,
        id: {
          type: "Identifier",
          start: 4,
          end: 5,
          name: "i"
        },
        init: content
      }]
    })},

    {s: "i = %s", ast: content => ({
      type: "ExpressionStatement",
      start: 0,
      end: content.end,
      expression: {
        type: "AssignmentExpression",
        start: 0,
        end: content.end,
        operator: "=",
        left: {
          type: "Identifier",
          start: 0,
          end: 1,
          name: "i"
        },
        right: content
      }
    })},

    {s: "((i = %s) => {})", ast: content => ({
      type: "ExpressionStatement",
      start: 0,
      end: content.end + 8,
      expression: {
        type: "ArrowFunctionExpression",
        start: 1,
        end: content.end + 7,
        id: null,
        generator: false,
        expression: false,
        async: false,
        params: [
          {
            type: "AssignmentPattern",
            start: 2,
            end: content.end,
            left: {
              type: "Identifier",
              start: 2,
              end: 3,
              name: "i"
            },
            right: content
          }
        ],
        body: {
          type: "BlockStatement",
          start: content.end + 5,
          end: content.end + 7,
          body: []
        }
      }
    })},

    {s: "for (let i = 0n; i < %s;++i) {}", ast: content => ({
      type: "ForStatement",
      start: 0,
      end: content.end + 8,
      init: {
        type: "VariableDeclaration",
        start: 5,
        end: 15,
        declarations: [
          {
            type: "VariableDeclarator",
            start: 9,
            end: 15,
            id: {
              type: "Identifier",
              start: 9,
              end: 10,
              name: "i"
            },
            init: {
              type: "Literal",
              start: 13,
              end: 15,
              value: maybeBigInt("0"),
              raw: "0n",
              bigint: "0n"
            }
          }
        ],
        kind: "let"
      },
      test: {
        type: "BinaryExpression",
        start: 17,
        end: content.end,
        left: {
          type: "Identifier",
          start: 17,
          end: 18,
          name: "i"
        },
        operator: "<",
        right: content
      },
      update: {
        type: "UpdateExpression",
        start: content.end + 1,
        end: content.end + 4,
        operator: "++",
        prefix: true,
        argument: {
          type: "Identifier",
          start: content.end + 3,
          end: content.end + 4,
          name: "i"
        }
      },
      body: {
        type: "BlockStatement",
        start: content.end + 6,
        end: content.end + 8,
        body: []
      }
    })},

    {s: "i + %s", ast: content => ({
      type: "ExpressionStatement",
      start: 0,
      end: content.end,
      expression: {
        type: "BinaryExpression",
        start: 0,
        end: content.end,
        left: {
          type: "Identifier",
          start: 0,
          end: 1,
          name: "i"
        },
        operator: "+",
        right: content
      }
    })}
  ]
  statements.forEach(statement => {
    const start = statement.s.indexOf("%s")
    digits.forEach(d => {
      (d.error ? testFail : test)(
        statement.s.replace("%s", `${d.d}n`),
        d.error ? d.error(start) : statement.ast(d.ast(start))
      )
    })
  })
})
