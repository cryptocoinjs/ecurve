var assert = require('assert')
var ecurve = require('../')
var getCurveByName = ecurve.getCurveByName

var BigInteger = require('bigi')

var fixtures = require('./fixtures/nist')

describe('NIST Vectors', function() {
  for (var curveParams in fixtures) {(function(curveParams) {
    describe(curveParams, function() {
      var curveName = 'sec' + curveParams.slice(0, 4) + 'r1'
      var curve = getCurveByName(curveName)
      if (!curve) return it('missing ' + curveName)

      var vector = fixtures[curveParams]

      vector.forEach(function(v) {
        it('derives Q for ' + v.d + ' correctly', function() {
          var d = new BigInteger(v.d, 16)
          var Q = curve.G.multiply(d)

          assert.equal(Q.affineX.toHex(), v.Qx)
          assert.equal(Q.affineY.toHex(), v.Qy)
        })
      })
    })
  })(curveParams)}
})
