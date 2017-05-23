var assert = require('assert')
var ecurve = require('../')
var getCurveByName = ecurve.getCurveByName

var BN = require('bn.js')

var fixtures = require('./fixtures/nist')

/* global describe it */

describe('NIST Vectors', function () {
  for (var curveParams in fixtures) {
    (function (curveParams) {
      describe(curveParams, function () {
        var curveName = 'sec' + curveParams.slice(0, 4) + 'r1'
        var curve = getCurveByName(curveName)
        if (!curve) return it('missing ' + curveName)

        var vector = fixtures[curveParams]

        vector.forEach(function (v) {
          it('derives Q for ' + v.d, function () {
            var d = new BN(v.d, 16)
            var Q = curve.G.multiply(d)

            assert.equal(Q.affineX.toString(16, 2), v.Qx)
            assert.equal(Q.affineY.toString(16, 2), v.Qy)
          })
        })
      })
    })(curveParams)
  }
})
