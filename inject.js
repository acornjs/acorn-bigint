"use strict"

module.exports = function (acorn) {
  const tt = acorn.tokTypes
  const isIdentifierStart = acorn.isIdentifierStart

  acorn.plugins.bigInt = function (instance) {
    instance.extend("parseLiteral", function (superF) {
      return function(value) {
        const node = superF.call(this, value)
        if (node.raw.charCodeAt(node.raw.length - 1) == 110) node.bigint = node.raw
        return node
      }
    })

    instance.extend("readRadixNumber", function (_superF) {
      return function(radix) {
        let start = this.pos
        this.pos += 2 // 0x
        let val = this.readInt(radix)
        if (val === null) this.raise(this.start + 2, `Expected number in radix ${radix}`)
        if (this.input.charCodeAt(this.pos) == 110) {
          let str = this.input.slice(start, this.pos)
          val = typeof BigInt !== "undefined" && BigInt.parseInt ? BigInt.parseInt(str) : null
          ++this.pos
        } else if (isIdentifierStart(this.fullCharCodeAtPos())) this.raise(this.pos, "Identifier directly after number")
        return this.finishToken(tt.num, val)
      }
    })

    instance.extend("readNumber", function (superF) {
      return function(startsWithDot) {
        let start = this.pos

        // Not an int
        if (startsWithDot) return superF.call(this, startsWithDot)

        // Legacy octal
        if (this.input.charCodeAt(start) === 48 && this.input.charCodeAt(start + 1) !== 110) {
          return superF.call(this, startsWithDot)
        }

        if (this.readInt(10) === null) this.raise(start, "Invalid number")

        // Not a BigInt, reset and parse again
        if (this.input.charCodeAt(this.pos) != 110) {
          this.pos = start
          return superF.call(this, startsWithDot)
        }

        let str = this.input.slice(start, this.pos)
        let val = typeof BigInt !== "undefined" && BigInt.parseInt ? BigInt.parseInt(str) : null
        ++this.pos
        return this.finishToken(tt.num, val)
      }
    })
  }
  return acorn
}
