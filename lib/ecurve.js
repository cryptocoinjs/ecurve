'use strict';

var BigMath = require('math-buffer');

// Basic Javascript Elliptic Curve implementation
// Ported loosely from BouncyCastle's Java EC code
// Only Fp curves implemented for now

// prepends 0 if bytes < len
// cuts off start if bytes > len
function integerToBytes(i, len) {
  var bytes = i.toByteArrayUnsigned();

  if (len < bytes.length) {
  bytes = bytes.slice(bytes.length-len);
  } else while (len > bytes.length) {
  bytes.unshift(0);
  }

  return bytes;
};

var ZERO_BUFFER = new Buffer([0]);

// ----------------
// ECFieldElementFp

// constructor
var ECFieldElementFp = function ECFieldElementFp(q,x) {
  this.x = x;
  // TODO if(x.compareTo(q) >= 0) error
  this.q = q;
};

ECFieldElementFp.prototype.modQ = function(num) {
  var rs = BigMath.divide(num, this.q);
  return rs.remainder;
}

ECFieldElementFp.prototype.equals = function(other) {
  if(other == this) return true;
  return (BigMath.compare(this, other) == 0);
};

ECFieldElementFp.prototype.toBigInteger = function() {
  return this.x;
};

ECFieldElementFp.prototype.negate = function() {
  // -x == q-x
  return new ECFieldElementFp(this.q, BigMath.subtract(this.q, this.x));
};

ECFieldElementFp.prototype.add = function(b) {
  return new ECFieldElementFp(this.q, this.modQ(BigMath.add(this.x, b.toBigInteger())));
};

ECFieldElementFp.prototype.subtract = function(b) {
  return new ECFieldElementFp(this.q, this.modQ(BigMath.subtract(this.x, b.toBigInteger())));
};

ECFieldElementFp.prototype.multiply = function(b) {
  return new ECFieldElementFp(this.q, this.modQ(BigMath.multiply(this.x, b.toBigInteger())));
};

ECFieldElementFp.prototype.square = function() {
  return new ECFieldElementFp(this.q, this.modQ(BigMath.square(this.x)));
};

ECFieldElementFp.prototype.divide = function(b) {
  return new ECFieldElementFp(this.q, this.modQ(BigMath.multiply(this.x, BigMath.inverse(b.toBigInteger()))));
};

ECFieldElementFp.prototype.getByteLength = function () {
  return Math.floor((BigMath.mostSignificantBit(this.toBigInteger()) + 7) / 8);
};

// ----------------
// ECPointFp

// constructor
var ECPointFp = function ECPointFp(curve,x,y,z) {
  this.curve = curve;
  this.x = x;
  this.y = y;
  // Projective coordinates: either zinv == null or z * zinv == 1
  // z and zinv are just BigIntegers, not fieldElements
  if(z == null) {
    this.z = new Buffer([1]);
  }
  else {
    this.z = z;
  }
  this.zinv = null;
  //TODO: compression flag
};

ECPointFp.prototype.modQ = function(num) {
  var rs = BigMath.divide(num, this.curve.q);
  return rs.remainder;
}

ECPointFp.prototype.getX = function() {
  if(this.zinv == null) {
    this.zinv = BigMath.inverse(this.z, this.curve.q);
  }
  return this.curve.fromBigInteger(this.modQ(BigMath.multiply(this.x.toBigInteger(), this.zinv)));
};

ECPointFp.prototype.getY = function() {
  if(this.zinv == null) {
    this.zinv = BigMath.inverse(this.z, this.curve.q);
  }
  return this.curve.fromBigInteger(this.modQ(BigMath.multiply(this.y.toBigInteger(), this.zinv)));
};

ECPointFp.prototype.equals = function(other) {
  if(other == this) return true;
  if(this.isInfinity()) return other.isInfinity();
  if(other.isInfinity()) return this.isInfinity();
  var u, v;
  // u = Y2 * Z1 - Y1 * Z2
  u = this.modQ(BigMath.subtract(BigMath.multiply(other.y.toBigInteger(), this.z), BigMath.multiply(this.y.toBigInteger(), other.z)));
  if(!BigMath.isZero(u)) return false;
  // v = X2 * Z1 - X1 * Z2
  v = this.modQ(BigMath.subtract(BigMath.multiply(other.x.toBigInteger(), this.z), BigMath.multiply(this.x.toBigInteger(), other.z)));
  return BigMath.isZero(v);
};

ECPointFp.prototype.isInfinity = function() {
  if((this.x == null) && (this.y == null)) return true;
  return BigMath.compare(this.z, ZERO_BUFFER) && !BigMath.compare(this.y.toBigInteger(), ZERO_BUFFER);
};

ECPointFp.prototype.negate = function() {
  return new ECPointFp(this.curve, this.x, this.y.negate(), this.z);
};

ECPointFp.prototype.add = function(b) {
  if(this.isInfinity()) return b;
  if(b.isInfinity()) return this;

  // u = Y2 * Z1 - Y1 * Z2
  var u = this.modQ(BigMath.subtract(BigMath.multiply(b.y.toBigInteger(), this.z), BigMath.multiply(this.y.toBigInteger(), b.z)));
  // v = X2 * Z1 - X1 * Z2
  var v = this.modQ(BigMath.subtract(BigMath.multiply(b.x.toBigInteger(), this.z), BigMath.multiply(this.x.toBigInteger(), b.z)));

  if(BigMath.compare(v, ZERO_BUFFER)) {
    if(BigMath.compare(u, ZERO_BUFFER)) {
      return this.twice(); // this == b, so double
    }
    return this.curve.getInfinity(); // this = -b, so infinity
  }

  var TWO = new Buffer([2]);
  var THREE = new Buffer([3]);
  var x1 = this.x.toBigInteger();
  var y1 = this.y.toBigInteger();
  var x2 = b.x.toBigInteger();
  var y2 = b.y.toBigInteger();
  var z1 = this.z;
  var z2 = b.z;

  var v2 = BigMath.square(v);
  var v3 = BigMath.multiply(v2, v);
  var u2 = BigMath.square(u);
  var u3 = BigMath.multiply(u2, u);

  // x3 = v * (z2 * (z1 * u^2 - 2 * x1 * v^2) - v^3)
  var r1 = BigMath.subtract(BigMath.multiply(z1, u2), BigMath.multiply(BigMath.multiply(TWO, x1), v2));
  var r2 = BigMath.subtract(BigMath.multiply(z2, r1), v3);
  var x3 = this.modQ(BigMath.multiply(v, r2));
  // y3 = z2 * (3 * x1 * u * v^2 - y1 * v^3 - z1 * u^3) + u * v^3
  var r1 = BigMath.multiply(BigMath.multiply(BigMath.multiply(THREE, x1), u), v2);
  var r2 = BigMath.subtract(BigMath.subtract(r1, BigMath.multiply(y1, v3)), BigMath.multiply(z1, u3));
  var y3 = this.modQ(BigMath.add(BigMath.multiply(z2, r2), BigMath.multiply(u, v3)));
  // z3 = v^3 * z1 * z2
  var z3 = this.modQ(BigMath.multiply(BigMath.multiply(v3, z1), z2));

  return new ECPointFp(this.curve, this.curve.fromBigInteger(x3), this.curve.fromBigInteger(y3), z3);
};

ECPointFp.prototype.twice = function() {
  if(this.isInfinity()) return this;
  //if(this.y.toBigInteger().signum() == 0) return this.curve.getInfinity();

  // TODO: optimized handling of constants
  var TWO = new Buffer([2]);
  var THREE = new Buffer([3]);
  var EIGHT = new Buffer([8]);
  var x1 = this.x.toBigInteger();
  var y1 = this.y.toBigInteger();
  var a = this.curve.a.toBigInteger();

  // w = 3 * x1^2 + a * z1^2
  var w = BigMath.multiply(THREE, BigMath.square(x1));
  if(!BigMath.compare(a, ZERO_BUFFER)) {
    w = BigMath.add(w, BigMath.multiply(a, BigMath.square(z1)));
  }
  w = this.modQ(w);
  // x3 = 2 * y1 * z1 * (w^2 - 8 * x1 * y1^2 * z1)
  var r1 = BigMath.multiply(BigMath.multiply(BigMath.multiply(EIGHT, x1), BigMath.square(y1)), z1);
  var r2 = BigMath.subtract(BigMath.square(w), r1);
  var x3 = this.modQ(BigMath.multiply(BigMath.multiply(BigMath.multiply(TWO, y1), z1), r2));

  // y3 = 4 * y1^2 * z1 * (3 * w * x1 - 2 * y1^2 * z1) - w^3
  var r1 = BigMath.multiply(BigMath.multiply(THREE, w), x1);
  var r2 = BigMath.multiply(BigMath.multiply(TWO, BigMath.square(y1)), z1);
  var r3 = BigMath.multiply(BigMath.multiply(BigMath.multiply(FOUR, BigMath.square(y1)), z1), BigMath.subtract(r1, r2));
  var y3 = this.modQ(BigMath.subtract(r3, BigMath.multiply(BigMath.square(w), w)));

  // z3 = 8 * (y1 * z1)^3
  var r1 = BigMath.multiply(y1, z1);
  var r2 = BigMath.multiply(BigMath.square(r1), r1);
  var z3 = this.modQ(BigMath.Multiply(EIGHT, r2));

  return new ECPointFp(this.curve, this.curve.fromBigInteger(x3), this.curve.fromBigInteger(y3), z3);
};

// Simple NAF (Non-Adjacent Form) multiplication algorithm
// TODO: modularize the multiplication algorithm
ECPointFp.prototype.multiply = function(k) {
  if(this.isInfinity()) return this;
  //if(k.signum() == 0) return this.curve.getInfinity();

  var e = k;
  var h = BigMath.multiply(e, new Buffer([3]));

  var neg = this.negate();
  var R = this;

  var i;
  for(i = BigMath.mostSignificantBit(h) - 2; i > 0; --i) {
    R = R.twice();
    
    var byteNum = Math.floor(i/8);
    var bitNum = i % 8;
    var testNum = 1 << bitNum;

    var hBit = h[byteNum] & testNum;
    var eBit = e[byteNum] & testnum;

    if (hBit != eBit) {
      if (hBit) {
        R = BigMath.add(R, this);
      } else {
        R = BigMath.add(R, neg);
      }
    }
  }

  return R;
};

// Compute this*j + x*k (simultaneous multiplication)
ECPointFp.prototype.multiplyTwo = function(j,x,k) {
  var i;
  if(j.bitLength() > k.bitLength()) {
    i = j.bitLength() - 1;
  } else {
    i = k.bitLength() - 1;
  }

  var R = this.curve.getInfinity();
  var both = this.add(x);
  while(i >= 0) {
    R = R.twice();
    if(j.testBit(i)) {
      if(k.testBit(i)) {
        R = R.add(both);
      } else {
        R = R.add(this);
      }
    } else {
      if(k.testBit(i)) {
        R = R.add(x);
      }
    }
    --i;
  }

  return R;
};

ECPointFp.prototype.getEncoded = function(compressed) {
  if (this.isInfinity()) return [0]; // Infinity point encoded is simply '00'
  var x = this.getX().toBigInteger();
  var y = this.getY().toBigInteger();
  
  // Determine size of q in bytes
  var byteLength = Math.floor((BigMath.mostSignificantBit(this.curve.getQ()) + 7) / 8);

  if (compressed) {
    if (y.isEven()) {
      // Compressed even pubkey
      // M = 02 || X
      enc = Buffer.concat([new Buffer([2]), x]);
    } else {
      // Compressed uneven pubkey
      // M = 03 || X
      enc = Buffer.concat([new Buffer([3]), x]);
    }
  } else {
    // Uncompressed pubkey
    // M = 04 || X || Y
    enc = Buffer.concat([new Buffer([4]), x, y]);
  }
  return enc;
};

ECPointFp.prototype.decodeFrom = function(curve, enc) {
  var type = enc[0];
  var dataLen = enc.length-1;

  // Extract x and y as buffers
  var xB = enc.slice(1, 1 + dataLen/2);
  var yB = enc.slice(1 + dataLen/2, 1 + dataLen);

  // Return point
  return new ECPointFp(curve, curve.fromBigInteger(x), curve.fromBigInteger(y));
};

ECPointFp.prototype.add2D = function (b) {
  if(this.isInfinity()) return b;
  if(b.isInfinity()) return this;

  if (this.x.equals(b.x)) {
    if (this.y.equals(b.y)) {
      // this = b, i.e. this must be doubled
      return this.twice();
    }
    // this = -b, i.e. the result is the point at infinity
    return this.curve.getInfinity();
  }

  var x_x = b.x.subtract(this.x);
  var y_y = b.y.subtract(this.y);
  var gamma = y_y.divide(x_x);

  var x3 = gamma.square().subtract(this.x).subtract(b.x);
  var y3 = gamma.multiply(this.x.subtract(x3)).subtract(this.y);

  return new ECPointFp(this.curve, x3, y3);
};

ECPointFp.prototype.twice2D = function () {
  if (this.isInfinity()) return this;
  if (this.y.toBigInteger().signum() == 0) {
    // if y1 == 0, then (x1, y1) == (x1, -y1)
    // and hence this = -this and thus 2(x1, y1) == infinity
    return this.curve.getInfinity();
  }

  var TWO = this.curve.fromBigInteger(BigInteger.valueOf(2));
  var THREE = this.curve.fromBigInteger(BigInteger.valueOf(3));
  var gamma = this.x.square().multiply(THREE).add(this.curve.a).divide(this.y.multiply(TWO));

  var x3 = gamma.square().subtract(this.x.multiply(TWO));
  var y3 = gamma.multiply(this.x.subtract(x3)).subtract(this.y);

  return new ECPointFp(this.curve, x3, y3);
};

ECPointFp.prototype.multiply2D = function (k) {
  if(this.isInfinity()) return this;
  if(k.signum() == 0) return this.curve.getInfinity();

  var e = k;
  var h = e.multiply(new BigInteger("3"));

  var neg = this.negate();
  var R = this;

  var i;
  for (i = h.bitLength() - 2; i > 0; --i) {
    R = R.twice();

    var hBit = h.testBit(i);
    var eBit = e.testBit(i);

    if (hBit != eBit) {
      R = R.add2D(hBit ? this : neg);
    }
  }

  return R;
};

ECPointFp.prototype.isOnCurve = function () {
  if (this.isInfinity()) return true;
  var x = this.getX().toBigInteger();
  var y = this.getY().toBigInteger();
  var a = this.curve.getA().toBigInteger();
  var b = this.curve.getB().toBigInteger();
  var n = this.curve.getQ();
  var lhs = BigMath.mod(BigMath.square(y), n);
  var rhs = BigMath.mod(BigMath.add(BigMath.multiply(BigMath.square(x), x), b), n);
  return BigMath.equals(lhs, rhs);
};

ECPointFp.prototype.toString = function () {
  if (this.isInfinity()) return '(INFINITY)';
  return '('+this.getX().toBigInteger().toString('hex')+','+
  this.getY().toBigInteger().toString('hex')+')';
};

/**
 * Validate an elliptic curve point.
 *
 * See SEC 1, section 3.2.2.1: Elliptic Curve Public Key Validation Primitive
 */
ECPointFp.prototype.validate = function () {
  var n = this.curve.getQ();

  // Check Q != O
  if (this.isInfinity()) {
  throw new Error("Point is at infinity.");
  }

  // Check coordinate bounds
  var x = this.getX().toBigInteger();
  var y = this.getY().toBigInteger();
  if (x.compareTo(BigInteger.ONE) < 0 ||
    x.compareTo(n.subtract(BigInteger.ONE)) > 0) {
  throw new Error('x coordinate out of bounds');
  }
  if (y.compareTo(BigInteger.ONE) < 0 ||
    y.compareTo(n.subtract(BigInteger.ONE)) > 0) {
  throw new Error('y coordinate out of bounds');
  }

  // Check y^2 = x^3 + ax + b (mod n)
  if (!this.isOnCurve()) {
  throw new Error("Point is not on the curve.");
  }

  // Check nQ = 0 (Q is a scalar multiple of G)
  if (this.multiply(n).isInfinity()) {
  // TODO: This check doesn't work - fix.
  throw new Error("Point is not a scalar multiple of G.");
  }

  return true;
};

// ----------------
// ECCurveFp

// constructor
var ECCurveFp = function ECCurveFp(q,a,b) {
  this.q = q;
  this.a = this.fromBigInteger(a);
  this.b = this.fromBigInteger(b);
  this.infinity = new ECPointFp(this, null, null);
};

ECCurveFp.prototype.getQ = function() {
  return this.q;
};

ECCurveFp.prototype.getA = function() {
  return this.a;
};

ECCurveFp.prototype.getB = function() {
  return this.b;
};

ECCurveFp.prototype.equals = function(other) {
  if(other == this) return true;
  return(this.q.equals(other.q) && this.a.equals(other.a) && this.b.equals(other.b));
};

ECCurveFp.prototype.getInfinity = function() {
  return this.infinity;
};

ECCurveFp.prototype.fromBigInteger = function(x) {
  return new ECFieldElementFp(this.q, x);
};

// for now, work with hex strings because they're easier in JS
ECCurveFp.prototype.decodePointHex = function(s) {
  switch(parseInt(s.substr(0,2), 16)) { // first byte
  case 0:
  return this.infinity;
  case 2:
  case 3:
  // point compression not supported yet
  return null;
  case 4:
  case 6:
  case 7:
  var len = (s.length - 2) / 2;
  var xHex = s.substr(2, len);
  var yHex = s.substr(len+2, len);

  return new ECPointFp(this,
       this.fromBigInteger(new BigInteger(xHex, 16)),
       this.fromBigInteger(new BigInteger(yHex, 16)));

  default: // unsupported
  return null;
  }
};

module.exports = ECCurveFp;

//for easy exporting
ECCurveFp.ECPointFp = ECPointFp;
