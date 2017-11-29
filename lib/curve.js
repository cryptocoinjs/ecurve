var assert = require('assert')
var BN = require('bn.js')

var Point = require('./point')
var THREE = new BN(3)

function Curve (p, a, b, Gx, Gy, n, h, red) {
  this.p = p
  this.red = red || BN.red(p)

  // convenience constants
  this._zero = new BN(0).toRed(this.red)
  this._one = new BN(1).toRed(this.red)
  this._three = THREE.toRed(this.red)
  this._pOverFour = p.addn(1).shrn(2)
  this._pLength = Math.floor((this.p.bitLength() + 7) / 8) // size of p in bytes

  // curve constants
  this.a = a.toRed(this.red)
  this.b = b.toRed(this.red)
  this.G = Point.fromAffine(this, Gx, Gy)
  this.n = n
  this.h = h
  this.infinity = new Point(this, null, null, this._zero)
}

Curve.prototype.pointFromX = function (isOdd, x) {
  x = x.toRed(this.red)

  var alpha = x
    .redPow(THREE)
    .redAdd(this.a.redMul(x))
    .redAdd(this.b)

  var beta = alpha.redPow(this._pOverFour) // XXX: not compatible with all curves

  var y = beta
  if (beta.isEven() ^ !isOdd) {
    y = y.redNeg() // -y % p
  }

  return new Point(this, x, y, this._one)
}

Curve.prototype.isInfinity = function (Q) {
  if (Q === this.infinity) return true

  return Q.z.isZero() && !Q.y.isZero()
}

Curve.prototype.isOnCurve = function (Q) {
  if (this.isInfinity(Q)) return true

  var x = Q.x
  var y = Q.y
  var a = this.a
  var b = this.b
  var p = this.p

  // Check that xQ and yQ are integers in the interval [0, p - 1]
  if (x.isNeg() || x.gte(p)) return false
  if (y.isNeg() || y.gte(p)) return false

  // and check that y^2 = x^3 + ax + b (mod p)
  var lhs = y.redSqr()
  var rhs = x
    .redPow(THREE)
    .redAdd(a.redMul(x))
    .redAdd(b)

  return lhs.eq(rhs)
}

/**
 * Validate an elliptic curve point.
 *
 * See SEC 1, section 3.2.2.1: Elliptic Curve Public Key Validation Primitive
 */
Curve.prototype.validate = function (Q) {
  // Check Q != O
  assert(!this.isInfinity(Q), 'Point is at infinity')
  assert(this.isOnCurve(Q), 'Point is not on the curve')

  // Check nQ = O (where Q is a scalar multiple of G)
  var nQ = Q.multiply(this.n)
  assert(this.isInfinity(nQ), 'Point is not a scalar multiple of G')

  return true
}

module.exports = Curve
