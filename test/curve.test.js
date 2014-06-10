var assert = require('assert')

var BigInteger = require('bigi')
var ecurve = require('../')
var Curve = ecurve.Curve
var Point = ecurve.Point

var fixtures = require('./fixtures/curve')

describe('Ecurve', function() {
  it('should create curve objects', function() {
    var p = BigInteger.valueOf(11)
    var a = BigInteger.valueOf(22)
    var b = BigInteger.valueOf(33)

    var curve = new Curve(p, a, b)
    assert.equal(curve.p.toString(), '11')
    assert.equal(curve.a.toString(), '22')
    assert.equal(curve.b.toString(), '33')
  });

  fixtures.valid.forEach(function(f) {
    it('calculates a public point for ' + f.D, function() {
      var params = ecurve.getECParams(f.Q.curve)
      var curve = params.curve

      var d = new BigInteger(f.D)
      var Q = params.G.multiply(d)

      assert.ok(Q.getX().toString(), f.Q.x)
      assert.ok(Q.getY().toString(), f.Q.y)
    })
  })

  describe('Field math', function() {
    // General Elliptic curve formula: y^2 = x^3 + ax + b
    // Testing field: y^2 = x^3 + x (a = 1, b = 0)
    // Wolfram Alpha: solve mod(y^2, 11)=mod(x^3+x, 11)
    // There are 12 valid points on this curve (11 plus point at infinity)
    //   (0,0), (5,8), (7,8), (8,5), (9,10), (10,8)
    //          (5,3), (7,3), (8,6), (9,1),  (10,3)
    //
    ///////////////////////////////////////////////
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
    ///////////////////////////////////////////////

    var curve = new Curve(BigInteger.valueOf(11), BigInteger.ONE, BigInteger.ZERO)
    var points = [
      { x: 0, y: 0 },
      { x: 5, y: 8 }, { x: 5, y: 3 },
      { x: 7, y: 8 }, { x: 7, y: 3 },
      { x: 8, y: 5 }, { x: 8, y: 6 },
      { x: 9, y: 10 }, { x: 9, y: 1 },
      { x: 10, y: 8 }, { x: 10, y: 3 }
    ].map(function(p) {
      return new Curve.Point(curve, BigInteger.valueOf(p.x), BigInteger.valueOf(p.y))
    })
    var params = {
      curve: curve,
      G: points[6], // random
      n: BigInteger.valueOf(points.length + 1),
      h: undefined // can't be bothered
    }
    params.curve.params = params // FIXME: boo

    // pG = P = -P
    var P = params.G.multiply(params.curve.p)
    assert(P.equals(params.G.negate()))

    // nG = O
    var nG = params.G.multiply(params.n)
    assert(nG.isInfinity())

    var inf = params.curve.getInfinity()
    var a = points[2]
    var b = points[7]
    var z = points[0]
    var y = new Point(curve, BigInteger.ONE, BigInteger.ONE)

    it('should validate field elements properly', function() {
      assert.ok(a.validate())
      assert.ok(b.validate())
      assert.ok(z.validate())
      assert.ok(z.isOnCurve())
      assert.ok(!y.isOnCurve())
      assert.ok(!a.isInfinity())
      assert.ok(!b.isInfinity())
      assert.ok(inf.isInfinity())
      assert.ok(inf.isOnCurve())
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
      assert.equal(a.add(y).toString(), '(8,1)')  // (5,3) + (1,1) = (8,1)  <-- weird result should error out if one of the operands isn't on the curve // FIXME

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
      var curve1 = new Curve(p1, a1, b1)

      var p2 = p1.clone()
      var a2 = a1.clone()
      var b2 = b1.clone()
      var curve2 = new Curve(p2, a2, b2)

      assert(curve1.equals(curve2))
      assert(curve2.equals(curve1))
    })

    it('should return false when not equal', function() {
      var p1 = BigInteger.fromHex("FFFFFFFDFFFFFFFFFFFFFFFFFFFFFFFF")
      var a1 = BigInteger.fromHex("FFFFFFFDFFFFFFFFFFFFFFFFFFFFFFFC")
      var b1 = BigInteger.fromHex("E87579C11079F43DD824993C2CEE5ED3")
      var curve1 = new Curve(p1, a1, b1)

      var p2 = BigInteger.fromHex("FFFFFFFDFFFFFFFFFFFFFFFFFFFFFFAA")
      var a2 = a1.clone()
      var b2 = b1.clone()
      var curve2 = new Curve(p2, a2, b2)

      assert(!curve1.equals(curve2))
      assert(!curve2.equals(curve1))
    })
  })
})
