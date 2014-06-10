var BigInteger = require('bigi')

var Point = require('./point')

module.exports = Curve

function Curve(p, a, b) {
  this._p = p
  this._a = a
  this._b = b
  this.infinity = new Point(this, null, null)
}

Object.defineProperty(Curve.prototype, 'p', {get: function() { return this._p }})
Object.defineProperty(Curve.prototype, 'a', {get: function() { return this._a }})
Object.defineProperty(Curve.prototype, 'b', {get: function() { return this._b }})

Curve.prototype.equals = function(other) {
  if (other == this) return true
  return (this.p.equals(other.p) && this.a.equals(other.a) && this.b.equals(other.b))
}

Curve.prototype.getInfinity = function() {
  return this.infinity
}
