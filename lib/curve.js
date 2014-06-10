var BigInteger = require('bigi')

var Point = require('./point')

module.exports = Curve

function Curve(p, a, b) {
  this.p = p
  this.a = a
  this.b = b
  this.infinity = new Point(this, null, null)
}


Curve.prototype.getInfinity = function() {
  return this.infinity
}
