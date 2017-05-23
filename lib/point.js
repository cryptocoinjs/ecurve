var assert = require('assert')
var Buffer = require('safe-buffer').Buffer
var BN = require('bn.js')
var THREE = new BN(3)

function Point (curve, x, y, z) {
  assert(x === null || x.red, 'X not in a reduction context')
  assert(y === null || y.red, 'Y not in a reduction context')
  assert(z && z.red, 'Z not in a reduction context')

  this.curve = curve
  this.x = x
  this.y = y
  this.z = z
  this._zInv = null

  this.compressed = true
}

Object.defineProperty(Point.prototype, 'zInv', {
  get: function () {
    if (this._zInv === null) {
      this._zInv = this.z.redInvm()
    }

    return this._zInv
  }
})

Object.defineProperty(Point.prototype, 'affineX', {
  get: function () {
    return this.x.redMul(this.zInv).fromRed()
  }
})

Object.defineProperty(Point.prototype, 'affineY', {
  get: function () {
    return this.y.redMul(this.zInv).fromRed()
  }
})

Point.fromAffine = function (curve, x, y) {
  x = x && x.toRed(curve.red)
  y = y && y.toRed(curve.red)
  return new Point(curve, x, y, curve._one)
}

Point.prototype.equals = function (other) {
  if (other === this) return true
  if (this.curve.isInfinity(this)) return this.curve.isInfinity(other)
  if (this.curve.isInfinity(other)) return this.curve.isInfinity(this)

  // u = Y2 * Z1 - Y1 * Z2
  var u = other.y
    .redMul(this.z)
    .redSub(this.y.redMul(other.z))

  if (!u.isZero()) return false

  // v = X2 * Z1 - X1 * Z2
  var v = other.x
    .redMul(this.z)
    .redSub(this.x.redMul(other.z))

  return v.isZero()
}

Point.prototype.negate = function () {
  var y = this.y.redNeg()

  return new Point(this.curve, this.x, y, this.z)
}

Point.prototype.add = function (b) {
  if (this.curve.isInfinity(this)) return b
  if (this.curve.isInfinity(b)) return this

  var x1 = this.x
  var y1 = this.y
  var z1 = this.z
  var x2 = b.x
  var y2 = b.y
  var z2 = b.z

  // u = Y2 * Z1 - Y1 * Z2
  var u = y2
    .redMul(z1)
    .redSub(y1.redMul(z2))

  // v = X2 * Z1 - X1 * Z2
  var v = x2
    .redMul(z1)
    .redSub(x1.redMul(z2))

  if (v.isZero()) {
    if (u.isZero()) return this.twice() // this == b, so double

    return this.curve.infinity // this = -b, so infinity
  }

  var v2 = v.redSqr()
  var v3 = v2.redMul(v)
  var x1v2 = x1.redMul(v2)
  var z1u2 = z1.redMul(u.redSqr())

  // x3 = v * (z2 * (z1 * u^2 - 2 * x1 * v^2) - v^3)
  var x3 = z1u2
    .redSub(x1v2.redShl(1))
    .redMul(z2)
    .redSub(v3)
    .redMul(v)

  // y3 = z2 * (3 * x1 * u * v^2 - y1 * v^3 - z1 * u^3) + u * v^3
  var y3 = x1v2
    .redMul(this.curve._three)
    .redMul(u)
    .redSub(y1.redMul(v3))
    .redSub(z1u2.redMul(u))
    .redMul(z2)
    .redAdd(u.redMul(v3))

  // z3 = v^3 * z1 * z2
  var z3 = v3
    .redMul(z1)
    .redMul(z2)

  return new Point(this.curve, x3, y3, z3)
}

Point.prototype.twice = function () {
  if (this.curve.isInfinity(this)) return this
  if (this.y.isZero()) return this.curve.infinity

  var x1 = this.x
  var y1 = this.y
  var z1 = this.z

  var y1z1 = y1.redMul(z1)
  var y1sqz1 = y1z1.redMul(y1)
  var a = this.curve.a

  // w = 3 * x1^2 + a * z1^2
  var w = x1
    .redSqr()
    .redMul(this.curve._three)

  if (!a.isZero()) {
    w = w.redAdd(z1.redSqr().redMul(a))
  }

  // x3 = 2 * y1 * z1 * (w^2 - 8 * x1 * y1^2 * z1)
  var x3 = w
    .redSqr()
    .redSub(x1.redShl(3).redMul(y1sqz1))
    .redShl(1)
    .redMul(y1z1)

  // y3 = 4 * y1^2 * z1 * (3 * w * x1 - 2 * y1^2 * z1) - w^3
  var y3 = w
    .redMul(this.curve._three)
    .redMul(x1)
    .redSub(y1sqz1.redShl(1))
    .redShl(2)
    .redMul(y1sqz1)
    .redSub(w.redPow(THREE))

  // z3 = 8 * (y1 * z1)^3
  var z3 = y1z1
    .redPow(THREE)
    .redShl(3)

  return new Point(this.curve, x3, y3, z3)
}

// Simple NAF (Non-Adjacent Form) multiplication algorithm
// TODO: modularize the multiplication algorithm
Point.prototype.multiply = function (k) {
  if (this.curve.isInfinity(this)) return this
  if (k.isZero()) return this.curve.infinity

  var e = k
  var h = e.mul(THREE)

  var neg = this.negate()
  var R = this

  for (var i = h.bitLength() - 2; i > 0; --i) {
    var hBit = h.testn(i)
    var eBit = e.testn(i)

    R = R.twice()

    if (hBit !== eBit) {
      R = R.add(hBit ? this : neg)
    }
  }

  return R
}

// Compute this*j + x*k (simultaneous multiplication)
Point.prototype.multiplyTwo = function (j, x, k) {
  var i = Math.max(j.bitLength(), k.bitLength()) - 1
  var R = this.curve.infinity
  var both = this.add(x)

  while (i >= 0) {
    var jBit = j.testn(i)
    var kBit = k.testn(i)

    R = R.twice()

    if (jBit) {
      if (kBit) {
        R = R.add(both)
      } else {
        R = R.add(this)
      }
    } else if (kBit) {
      R = R.add(x)
    }
    --i
  }

  return R
}

function bufferToBn (buffer) {
  return new BN(buffer, 256)
}

function bnToBuffer (x, size) {
  var array = x.toArray('be', size)
  return Buffer.from(array)
}

Point.prototype.getEncoded = function (compressed) {
  if (compressed == null) compressed = this.compressed
  if (this.curve.isInfinity(this)) return Buffer.alloc(1, 0) // Infinity point encoded is simply '00'

  var x = this.affineX
  var y = this.affineY
  var byteLength = this.curve._pLength
  var buffer

  // 0x02/0x03 | X
  if (compressed) {
    buffer = Buffer.allocUnsafe(1 + byteLength)
    buffer.writeUInt8(y.isEven() ? 0x02 : 0x03, 0)

  // 0x04 | X | Y
  } else {
    buffer = Buffer.allocUnsafe(1 + byteLength + byteLength)
    buffer.writeUInt8(0x04, 0)

    bnToBuffer(y, byteLength).copy(buffer, 1 + byteLength)
  }

  bnToBuffer(x, byteLength).copy(buffer, 1)

  return buffer
}

Point.decodeFrom = function (curve, buffer) {
  var type = buffer.readUInt8(0)
  var compressed = (type !== 4)

  var byteLength = Math.floor((curve.p.bitLength() + 7) / 8)
  var x = bufferToBn(buffer.slice(1, 1 + byteLength))

  var Q
  if (compressed) {
    assert.equal(buffer.length, byteLength + 1, 'Invalid sequence length')
    assert(type === 0x02 || type === 0x03, 'Invalid sequence tag')

    var isOdd = (type === 0x03)
    Q = curve.pointFromX(isOdd, x)
  } else {
    assert.equal(buffer.length, 1 + byteLength + byteLength, 'Invalid sequence length')

    var y = bufferToBn(buffer.slice(1 + byteLength))
    Q = Point.fromAffine(curve, x, y)
  }

  Q.compressed = compressed
  return Q
}

Point.prototype.toString = function () {
  if (this.curve.isInfinity(this)) return '(INFINITY)'

  return '(' + this.affineX.toString() + ',' + this.affineY.toString() + ')'
}

module.exports = Point
