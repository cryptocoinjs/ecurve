var assert = require('assert')
var BigInteger = require('bigi')

var getCurveByName = require('../lib/names')

var curves = ['secp128r1', 'secp160k1', 'secp160r1', 'secp192k1', 'secp192r1', 'secp224r1', 'secp256k1', 'secp256r1']

describe('+ getCurveByName(curveName)', function() {
  describe('> when the secp256k1 curve is passed', function() {
    it('should return the proper curve', function() {
      var curve = getCurveByName('secp256k1')
      assert(curve)
      assert.equal(curve.p.toBuffer().toString('hex'), 'fffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f')
      assert.equal(curve.a.toBuffer().toString('hex'), '') // 0 becomes ''
      assert.equal(curve.b.toBuffer().toString('hex'), '07')
      assert.equal(curve.params.G.getEncoded(false).toString('hex'), '0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8')
      assert.equal(curve.params.n.toBuffer().toString('hex'), 'fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141')
      assert.equal(curve.params.h.toBuffer().toString('hex'), '01')
    })
  })

  curves.forEach(function(c) {
    describe('> when ' + c, function() {
      it('should return the curve', function() {
        var ecparams = getCurveByName(c)
        assert(ecparams)
      })
    })
  })

  describe('> when null is passed', function() {
    it('should return null for unknown curves', function() {
      assert.equal(getCurveByName('foobar'), null)
    })
  })
})
