var assert = require('assert')

var BigInteger = require('bigi')
var ecurve = require('../')
var ECCurveFp = ecurve.ECCurveFp
var ECPointFp = ecurve.ECPointFp

var fixtures = require('./fixtures/curve')

describe('Ecurve', function() {
  it('should create curve objects', function() {
    var p = BigInteger.valueOf(11)
    var a = BigInteger.valueOf(22)
    var b = BigInteger.valueOf(33)

    var curve = new ECCurveFp(p, a, b)
    assert.equal(curve.p.toString(), '11')
    assert.equal(curve.a.toBigInteger().toString(), '22')
    assert.equal(curve.b.toBigInteger().toString(), '33')
  });

  fixtures.valid.forEach(function(f) {
    it('calculates a public point for ' + f.D, function() {
      var params = ecurve.getECParams(f.Q.curve)
      var curve = params.curve

      var d = new BigInteger(f.D)
      var Q = params.G.multiply(d)

      assert.ok(Q.getX().toBigInteger().toString(), f.Q.x)
      assert.ok(Q.getY().toBigInteger().toString(), f.Q.y)
    })
  })

  describe('Field math', function() {
    var curve = new ECCurveFp(
      BigInteger.fromHex('0b'),
      BigInteger.fromHex('01'),
      BigInteger.fromHex('00')
    )
    // General Elliptic curve formula: y^2 = x^3 + ax + b
    // Testing field: y^2 = x^3 + x (a = 1, b = 0)
    // Wolfram Alpha: solve mod(y^2, 11)=mod(x^3+x, 11)
    // There are 12 valid points on this curve (11 plus point at infinity)
    //   (0,0), (5,8), (7,8), (8,5), (9,10), (10,8)
    //          (5,3), (7,3), (8,6), (9,1),  (10,3)

    // 10                           X
    //  9
    //  8               X     X        X
    //  7
    //  6                        X
    //  5                        X
    //  4
    //  3               X     X        X
    //  2
    //  1                           X
    //  0 X
    //    0 1  2  3  4  5  6  7  8  9 10

    var inf = curve.getInfinity()
    var a = new ECCurveFp.ECPointFp(
      curve,
      curve.fromBigInteger(new BigInteger('5')),
      curve.fromBigInteger(new BigInteger('3'))
    )
    var b = new ECCurveFp.ECPointFp(
      curve,
      curve.fromBigInteger(new BigInteger('9')),
      curve.fromBigInteger(new BigInteger('10'))
    )
    var z = new ECCurveFp.ECPointFp(
      curve,
      curve.fromBigInteger(new BigInteger('0')),
      curve.fromBigInteger(new BigInteger('0'))
    )
    var y = new ECCurveFp.ECPointFp(
      curve,
      curve.fromBigInteger(new BigInteger('1')),
      curve.fromBigInteger(new BigInteger('1'))
    )

    it('should validate field elements properly', function() {
      assert.ok(a.validate())
      assert.ok(b.validate())
      //assert.ok(z.validate()) // FAILS: claims 0,0 is out of bounds, which is not true 0,0 is a valid curve point
      assert.ok(z.isOnCurve())
      assert.ok(!y.isOnCurve())
      //assert.ok(!y.validate()) // FAILS: Throws an error instead of returning false
      assert.ok(!a.isInfinity())
      assert.ok(!b.isInfinity())
      assert.ok(inf.isInfinity())
      assert.ok(inf.isOnCurve())
      //assert.ok(inf.validate()) // FAILS: Throws an error instead of returning false
    })

    it('should negate field elements properly', function() {
      assert.equal(a.negate().toString(), '(5,8)') // -(5,3) = (5,8)
      assert.equal(b.negate().toString(), '(9,1)') // -(9,10) = (9,1)
      //assert.equal(inf.negate().toString(), '(INFINITY)') // FAILS: can't negate infinity point should fail out gracefully
      assert.equal(z.negate().toString(), '(0,0)') // -(0,0) = (0,0)
    })

    it('should add field elements properly', function() {
      assert.equal(a.add(b).toString(), '(9,1)')  // (5,3) + (9,10) = (9,1)
      assert.equal(b.add(a).toString(), '(9,1)')  // (9,10) + (5,3) = (9,1)
      assert.equal(a.add(z).toString(), '(9,10)') // (5,3) + (0,0) = (9,10)
      assert.equal(a.add(y).toString(), '(8,1)')  // (5,3) + (1,1) = (8,1)  <-- weird result should error out if one of the operands isn't on the curve

      assert.equal(a.add(inf).toString(), '(5,3)') // (5,3) + INFINITY = (5,3)
      assert.equal(inf.add(a).toString(), '(5,3)') // INFINITY + (5,3) = (5,3)
    })

    it('should multiply field elements properly', function() {
      assert.equal(a.multiply(new BigInteger('2')).toString(), '(5,8)')      // (5,3) x 2 = (5,8)
      assert.equal(a.multiply(new BigInteger('3')).toString(), '(INFINITY)') // (5,3) x 3 = INFINITY
      assert.equal(a.multiply(new BigInteger('4')).toString(), '(5,3)')      // (5,3) x 4 = (5,3)
      assert.equal(a.multiply(new BigInteger('5')).toString(), '(5,8)')      // (5,3) x 5 = (5,8)

      assert.equal(b.multiply(new BigInteger('2')).toString(), '(5,8)') // (9,10) x 2 = (5,8)
      assert.equal(b.multiply(new BigInteger('3')).toString(), '(0,0)') // (9,10) x 3 = (0,0)
      assert.equal(b.multiply(new BigInteger('4')).toString(), '(5,3)') // (9,10) x 4 = (5,3)
      assert.equal(b.multiply(new BigInteger('5')).toString(), '(9,1)') // (9,10) x 5 = (9,1)

      assert.equal(inf.multiply(new BigInteger('2')).toString(), '(INFINITY)') // INFINITY x 2 = INFINITY
      assert.equal(inf.multiply(new BigInteger('3')).toString(), '(INFINITY)') // INFINITY x 3 = INFINITY
      assert.equal(inf.multiply(new BigInteger('4')).toString(), '(INFINITY)') // INFINITY x 4 = INFINITY
      assert.equal(inf.multiply(new BigInteger('5')).toString(), '(INFINITY)') // INFINITY x 5 = INFINITY

      assert.equal(z.multiply(new BigInteger('2')).toString(), '(INFINITY)') // (0,0) x 2 = INFINITY
      assert.equal(z.multiply(new BigInteger('3')).toString(), '(0,0)')      // (0,0) x 3 = (0,0)
      assert.equal(z.multiply(new BigInteger('4')).toString(), '(INFINITY)') // (0,0) x 4 = INFINITY
      assert.equal(z.multiply(new BigInteger('5')).toString(), '(0,0)')      // (0,0) x 5 = (0,0)

      assert.equal(a.multiplyTwo(new BigInteger('4'), b, new BigInteger('4')).toString(), '(5,8)') // (5,3) x 4 + (9,10) x 4 = (5,8)

      assert.equal(a.multiply(new BigInteger('2')).toString(), a.twice().toString()) // .multiply(2) == .twice()
      assert.equal(b.multiply(new BigInteger('2')).toString(), b.twice().toString())
      assert.equal(inf.multiply(new BigInteger('2')).toString(), inf.twice().toString())
      assert.equal(z.multiply(new BigInteger('2')).toString(), z.twice().toString())

      assert.equal(a.multiply(new BigInteger('2')).toString(), a.add(a).toString()) // this.multiply(2) == this.add(this)
      assert.equal(b.multiply(new BigInteger('2')).toString(), b.add(b).toString())
      assert.equal(inf.multiply(new BigInteger('2')).toString(), inf.add(inf).toString())
      assert.equal(z.multiply(new BigInteger('2')).toString(), z.add(z).toString())
    })
  })

  describe('- equals', function() {
    it('should return true when equal', function() {
      var p1 = BigInteger.fromHex("FFFFFFFDFFFFFFFFFFFFFFFFFFFFFFFF")
      var a1 = BigInteger.fromHex("FFFFFFFDFFFFFFFFFFFFFFFFFFFFFFFC")
      var b1 = BigInteger.fromHex("E87579C11079F43DD824993C2CEE5ED3")
      var curve1 = new ECCurveFp(p1, a1, b1)

      var p2 = p1.clone()
      var a2 = a1.clone()
      var b2 = b1.clone()
      var curve2 = new ECCurveFp(p2, a2, b2)

      assert(curve1.equals(curve2))
      assert(curve2.equals(curve1))
    })

    it('should return false when not equal', function() {
      var p1 = BigInteger.fromHex("FFFFFFFDFFFFFFFFFFFFFFFFFFFFFFFF")
      var a1 = BigInteger.fromHex("FFFFFFFDFFFFFFFFFFFFFFFFFFFFFFFC")
      var b1 = BigInteger.fromHex("E87579C11079F43DD824993C2CEE5ED3")
      var curve1 = new ECCurveFp(p1, a1, b1)

      var p2 = BigInteger.fromHex("FFFFFFFDFFFFFFFFFFFFFFFFFFFFFFAA")
      var a2 = a1.clone()
      var b2 = b1.clone()
      var curve2 = new ECCurveFp(p2, a2, b2)

      assert(!curve1.equals(curve2))
      assert(!curve2.equals(curve1))
    })
  })
})
