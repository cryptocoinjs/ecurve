var BigInteger = require('bigi')

var ECFieldElementFp = require('./field-element')
var ECPointFp = require('./point')

module.exports = ECCurveFp

function ECCurveFp(p, a, b) {
  this._p = p
  this._a = this.fromBigInteger(a)
  this._b = this.fromBigInteger(b)
  this.infinity = new ECPointFp(this, null, null)
}

Object.defineProperty(ECCurveFp.prototype, 'p', {get: function() { return this._p}})
Object.defineProperty(ECCurveFp.prototype, 'a', {get: function() { return this._a}})
Object.defineProperty(ECCurveFp.prototype, 'b', {get: function() { return this._b}})

ECCurveFp.prototype.equals = function(other) {
  if (other == this) return true
  return(this.p.equals(other.p) && this.a.equals(other.a) && this.b.equals(other.b))
}

ECCurveFp.prototype.getInfinity = function() {
  return this.infinity
}

ECCurveFp.prototype.fromBigInteger = function(x) {
  return new ECFieldElementFp(this.p, x)
}
