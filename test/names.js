var assert = require('assert')
var ecurve = require('../')
var getCurveByName = require('../lib/names')

var curves = require('../lib/curves')

describe('getCurveByName(curveName)', function() {
  for (var curveName in curves) {(function(curveName) {
    var curveData = curves[curveName]

    describe('when given ' + curveName, function() {
      it('should return the curve', function() {
        var curve = getCurveByName(curveName)

        assert.equal(curve.p.toHex(), curveData.p)
        assert.equal(curve.a.toHex() || "00", curveData.a)
        assert.equal(curve.b.toHex(), curveData.b)
        assert.equal(curve.G.affineX.toHex(), curveData.Gx)
        assert.equal(curve.G.affineY.toHex(), curveData.Gy)
        assert.equal(curve.n.toHex(), curveData.n)
        assert.equal(curve.h.toHex(), curveData.h)
      })
    })
  })(curveName)}

  describe('when an unknown curve is requested', function() {
    it('should return null', function() {
      assert.equal(getCurveByName('foobar'), null)
    })
  })
})
