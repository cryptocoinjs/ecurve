var assert = require('assert')
var getCurveByName = require('../lib/names')

var curves = require('../lib/curves')

/* global describe it */

describe('getCurveByName(curveName)', function () {
  for (var curveName in curves) {
    (function (curveName) {
      var curveData = curves[curveName]

      describe('when given ' + curveName, function () {
        it('should return the curve', function () {
          var curve = getCurveByName(curveName)

          assert.equal(curve.p.toString(16, 2), curveData.p)
          assert.equal(curve.a.toString(16, 2) || '00', curveData.a)
          assert.equal(curve.b.toString(16, 2), curveData.b)
          assert.equal(curve.G.affineX.toString(16, 2), curveData.Gx)
          assert.equal(curve.G.affineY.toString(16, 2), curveData.Gy)
          assert.equal(curve.n.toString(16, 2), curveData.n)
          assert.equal(curve.h.toString(16, 2), curveData.h)
        })
      })
    })(curveName)
  }

  describe('when an unknown curve is requested', function () {
    it('should return null', function () {
      assert.equal(getCurveByName('foobar'), null)
    })
  })
})
