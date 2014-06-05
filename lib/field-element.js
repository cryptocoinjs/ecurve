module.exports = ECFieldElementFp

function ECFieldElementFp(q,x) {
  this.x = x
  this.q = q
}

ECFieldElementFp.prototype.equals = function(other) {
  if (other == this) return true
  return (this.q.equals(other.q) && this.x.equals(other.x))
}

ECFieldElementFp.prototype.toBigInteger = function() {
  return this.x
}

// FIXME: remove
var assert = require('assert')

ECFieldElementFp.prototype.negate = function() {
  assert(false)
}

ECFieldElementFp.prototype.add = function(b) {
  assert(false)
}

ECFieldElementFp.prototype.subtract = function(b) {
  assert(false)
}

ECFieldElementFp.prototype.multiply = function(b) {
  assert(false)
}

ECFieldElementFp.prototype.square = function() {
  assert(false)
}

ECFieldElementFp.prototype.divide = function feFpDivide(b) {
  assert(false)
}

ECFieldElementFp.prototype.getByteLength = function () {
  assert(false)
}
