var assert = require('assert')
var BigInteger = require('bigi')

var THREE = BigInteger.valueOf(3)

function ECPointFp(curve,x,y,z) {
  z = z || BigInteger.ONE

  this.curve = curve
  this.x = x
  this.y = y

  // Projective coordinates: either zinv == null or z * zinv == 1
  // z and zinv are just BigIntegers, not fieldElements
  this.z = z
  this.zinv = null

  this.compressed = true
}

ECPointFp.prototype.getX = function() {
  if (this.zinv === null) {
    this.zinv = this.z.modInverse(this.curve.p)
  }

  return this.x.multiply(this.zinv).mod(this.curve.p)
}

ECPointFp.prototype.getY = function() {
  if (this.zinv === null) {
    this.zinv = this.z.modInverse(this.curve.p)
  }

  return this.y.multiply(this.zinv).mod(this.curve.p)
}

ECPointFp.prototype.equals = function(other) {
  if (other == this) return true
  if (this.isInfinity()) return other.isInfinity()
  if (other.isInfinity()) return this.isInfinity()

  // u = Y2 * Z1 - Y1 * Z2
  var u = other.y.multiply(this.z).subtract(this.y.multiply(other.z)).mod(this.curve.p)

  if (u.signum() !== 0) return false

  // v = X2 * Z1 - X1 * Z2
  var v = other.x.multiply(this.z).subtract(this.x.multiply(other.z)).mod(this.curve.p)

  return v.signum() === 0
}

ECPointFp.prototype.isInfinity = function() {
  if ((this.x === null) && (this.y === null)) return true
  return this.z.signum() === 0 && this.y.signum() !== 0
}

ECPointFp.prototype.negate = function() {
  var y = this.y.negate().mod(this.curve.p)

  return new ECPointFp(this.curve, this.x, y, this.z)
}

ECPointFp.prototype.add = function(b) {
  if (this.isInfinity()) return b
  if (b.isInfinity()) return this

  var x1 = this.x
  var y1 = this.y
  var x2 = b.x
  var y2 = b.y

  // u = Y2 * Z1 - Y1 * Z2
  var u = y2.multiply(this.z).subtract(y1.multiply(b.z)).mod(this.curve.p)
  // v = X2 * Z1 - X1 * Z2
  var v = x2.multiply(this.z).subtract(x1.multiply(b.z)).mod(this.curve.p)

  if (v.signum() === 0) {
      if (u.signum() === 0) {
          return this.twice() // this == b, so double
      }

      return this.curve.getInfinity() // this = -b, so infinity
  }

  var v2 = v.square()
  var v3 = v2.multiply(v)
  var x1v2 = x1.multiply(v2)
  var zu2 = u.square().multiply(this.z)

  // x3 = v * (z2 * (z1 * u^2 - 2 * x1 * v^2) - v^3)
  var x3 = zu2.subtract(x1v2.shiftLeft(1)).multiply(b.z).subtract(v3).multiply(v).mod(this.curve.p)
  // y3 = z2 * (3 * x1 * u * v^2 - y1 * v^3 - z1 * u^3) + u * v^3
  var y3 = x1v2.multiply(THREE).multiply(u).subtract(y1.multiply(v3)).subtract(zu2.multiply(u)).multiply(b.z).add(u.multiply(v3)).mod(this.curve.p)
  // z3 = v^3 * z1 * z2
  var z3 = v3.multiply(this.z).multiply(b.z).mod(this.curve.p)

  return new ECPointFp(this.curve, x3, y3, z3)
}

ECPointFp.prototype.twice = function() {
  if (this.isInfinity()) return this
  if (this.y.signum() === 0) return this.curve.getInfinity()

  var x1 = this.x
  var y1 = this.y

  var y1z1 = y1.multiply(this.z)
  var y1sqz1 = y1z1.multiply(y1).mod(this.curve.p)
  var a = this.curve.a

  // w = 3 * x1^2 + a * z1^2
  var w = x1.square().multiply(THREE)

  if (a.signum() !== 0) {
    w = w.add(this.z.square().multiply(a))
  }

  w = w.mod(this.curve.p)
  // x3 = 2 * y1 * z1 * (w^2 - 8 * x1 * y1^2 * z1)
  var x3 = w.square().subtract(x1.shiftLeft(3).multiply(y1sqz1)).shiftLeft(1).multiply(y1z1).mod(this.curve.p)
  // y3 = 4 * y1^2 * z1 * (3 * w * x1 - 2 * y1^2 * z1) - w^3
  var y3 = w.multiply(THREE).multiply(x1).subtract(y1sqz1.shiftLeft(1)).shiftLeft(2).multiply(y1sqz1).subtract(w.pow(3)).mod(this.curve.p)
  // z3 = 8 * (y1 * z1)^3
  var z3 = y1z1.pow(3).shiftLeft(3).mod(this.curve.p)

  return new ECPointFp(this.curve, x3, y3, z3)
}

// Simple NAF (Non-Adjacent Form) multiplication algorithm
// TODO: modularize the multiplication algorithm
ECPointFp.prototype.multiply = function(k) {
  if (this.isInfinity()) return this
  if (k.signum() === 0) return this.curve.getInfinity()

  var e = k
  var h = e.multiply(THREE)

  var neg = this.negate()
  var R = this

  for (var i = h.bitLength() - 2; i > 0; --i) {
    R = R.twice()

    var hBit = h.testBit(i)
    var eBit = e.testBit(i)

    if (hBit != eBit) {
        R = R.add(hBit ? this : neg)
    }
  }

  return R
}

// Compute this*j + x*k (simultaneous multiplication)
ECPointFp.prototype.multiplyTwo = function(j,x,k) {
  var i

  if (j.bitLength() > k.bitLength())
    i = j.bitLength() - 1
  else
    i = k.bitLength() - 1

  var R = this.curve.getInfinity()
  var both = this.add(x)
  while (i >= 0) {
    R = R.twice()
    if (j.testBit(i)) {
      if (k.testBit(i)) {
        R = R.add(both)
      }
      else {
        R = R.add(this)
      }
    }
    else {
      if (k.testBit(i)) {
        R = R.add(x)
      }
    }
    --i
  }

  return R
}

ECPointFp.prototype.getEncoded = function(compressed) {
  if (compressed == undefined) compressed = this.compressed
  if (this.isInfinity()) return new Buffer('00', 'hex') // Infinity point encoded is simply '00'

  var x = this.getX()
  var y = this.getY()
  var buffer

  // Determine size of q in bytes
  var byteLength = Math.floor((this.curve.p.bitLength() + 7) / 8)

  // 0x02/0x03 | X
  if (compressed) {
    buffer = new Buffer(1 + byteLength)
    buffer.writeUInt8(y.isEven() ? 0x02 : 0x03, 0)

  // 0x04 | X | Y
  } else {
    buffer = new Buffer(1 + byteLength + byteLength)
    buffer.writeUInt8(0x04, 0)

    y.toBuffer(byteLength).copy(buffer, 1 + byteLength)
  }

  x.toBuffer(byteLength).copy(buffer, 1)

  return buffer
}

ECPointFp.decodeFrom = function(curve, buffer) {
  var type = buffer.readUInt8(0);
  var compressed = (type !== 4)
  var x = BigInteger.fromBuffer(buffer.slice(1, 33))
  var y

  var byteLength = Math.floor((curve.p.bitLength() + 7) / 8)

  if (compressed) {
    assert.equal(buffer.length, byteLength + 1, 'Invalid sequence length')
    assert(type === 0x02 || type === 0x03, 'Invalid sequence tag')

    var isYEven = (type === 0x02)
    var a = curve.a
    var b = curve.b
    var p = curve.p

    // We precalculate (p + 1) / 4 where p is the field order
    if (!curve.P_OVER_FOUR) {
      curve.P_OVER_FOUR = p.add(BigInteger.ONE).shiftRight(2)
    }

    // Convert x to point
    var alpha = x.pow(3).add(a.multiply(x)).add(b).mod(p)
    var beta = alpha.modPow(curve.P_OVER_FOUR, p)

    // If beta is even, but y isn't, or vice versa, then convert it,
    // otherwise we're done and y == beta.
    y = (beta.isEven() ^ isYEven) ? p.subtract(beta) : beta

  } else {
    assert.equal(buffer.length, 1 + byteLength + byteLength, 'Invalid sequence length')

    y = BigInteger.fromBuffer(buffer.slice(1 + byteLength))
  }

  var pt = new ECPointFp(curve, x, y)
  pt.compressed = compressed
  return pt
}

ECPointFp.prototype.isOnCurve = function() {
  if (this.isInfinity()) return true

  var x = this.getX()
  var y = this.getY()
  var a = this.curve.a
  var b = this.curve.b
  var p = this.curve.p

  var lhs = y.square().mod(p)
  var rhs = x.pow(3).add(a.multiply(x)).add(b).mod(p)
  return lhs.equals(rhs)
}

ECPointFp.prototype.toString = function () {
  if (this.isInfinity()) return '(INFINITY)'

  return '(' + this.getX().toString() + ',' + this.getY().toString() + ')'
}

/**
 * Validate an elliptic curve point.
 *
 * See SEC 1, section 3.2.2.1: Elliptic Curve Public Key Validation Primitive
 */
ECPointFp.prototype.validate = function () {
  var n = this.curve.p

  // Check Q != O
  if (this.isInfinity()) {
    throw new Error("Point is at infinity.")
  }

  // Check coordinate bounds
  var x = this.getX()
  var y = this.getY()
  if (x.compareTo(BigInteger.ONE) < 0 ||
      x.compareTo(n.subtract(BigInteger.ONE)) > 0) {
    throw new Error('x coordinate out of bounds')
  }
  if (y.compareTo(BigInteger.ONE) < 0 ||
      y.compareTo(n.subtract(BigInteger.ONE)) > 0) {
    throw new Error('y coordinate out of bounds')
  }

  // Check y^2 = x^3 + ax + b (mod n)
  if (!this.isOnCurve()) {
    throw new Error("Point is not on the curve.")
  }

  // Check nQ = 0 (Q is a scalar multiple of G)
  if (this.multiply(n).isInfinity()) {
    // TODO: This check doesn't work - fix.
    throw new Error("Point is not a scalar multiple of G.")
  }

  return true
}

module.exports = ECPointFp
