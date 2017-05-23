var assert = require('assert')
var ecurve = require('../')
var getCurveByName = ecurve.getCurveByName

var Buffer = require('safe-buffer').Buffer
var BN = require('bn.js')
var Point = ecurve.Point

var fixtures = require('./fixtures/point')

/* global describe it */

describe('Point', function () {
  describe('multiply', function () {
    fixtures.valid.forEach(function (f) {
      it('gives (' + f.x + ', ' + f.y + ') for ' + f.d + ' on ' + f.curve, function () {
        var curve = getCurveByName(f.curve)

        var d = new BN(f.d)
        var Q = curve.G.multiply(d)

        assert.equal(Q.affineX.toString(), f.x)
        assert.equal(Q.affineY.toString(), f.y)
      })
    })
  })

  describe('decodeFrom', function () {
    fixtures.valid.forEach(function (f) {
      it('decodes ' + f.hex + ' for ' + f.curve, function () {
        var curve = getCurveByName(f.curve)
        var buffer = Buffer.from(f.hex, 'hex')

        var decoded = Point.decodeFrom(curve, buffer)
        assert.equal(decoded.x.toString(), f.x)
        assert.equal(decoded.y.toString(), f.y)
        assert.equal(decoded.compressed, f.compressed)
      })
    })

    fixtures.invalid.forEach(function (f) {
      it('throws on ' + f.description, function () {
        var curve = getCurveByName('secp256k1')
        var buffer = Buffer.from(f.hex, 'hex')

        assert.throws(function () {
          Point.decodeFrom(curve, buffer)
        }, new RegExp(f.exception))
      })
    })
  })

  describe('getEncoded', function () {
    it('compression defaults to Point field flag', function () {
      var curve = getCurveByName('secp128r1')

      var d = new BN(1)
      var Q = curve.G.multiply(d)

      assert.equal(Q.getEncoded().toString('hex'), '03161ff7528b899b2d0c28607ca52c5b86')
      Q.compressed = false
      assert.equal(Q.getEncoded().toString('hex'), '04161ff7528b899b2d0c28607ca52c5b86cf5ac8395bafeb13c02da292dded7a83')
    })

    fixtures.valid.forEach(function (f) {
      it('encodes ' + f.hex + ' on ' + f.curve, function () {
        var curve = getCurveByName(f.curve)
        var Q = Point.fromAffine(curve, new BN(f.x), new BN(f.y))

        var encoded = Q.getEncoded(f.compressed)
        assert.equal(encoded.toString('hex'), f.hex)
      })
    })
  })

  describe('equals', function () {
    describe('secp256k1', function () {
      var curve = getCurveByName('secp256k1')

      var d1 = new BN(5)
      var d2 = new BN(6)

      var Q1 = curve.G.multiply(d1)
      var Q2 = curve.G.multiply(d2)

      it('should return true when points are equal', function () {
        var Q1b = Q2.add(curve.G.negate()) // d +1
        var Q2b = Q1.add(curve.G) // d -1

        assert(Q1.equals(Q1b))
        assert(Q2.equals(Q2b))
      })

      it('should return false when points are not equal', function () {
        assert(!Q1.equals(Q2))
        assert(!Q2.equals(Q1))
      })
    })
  })
})
