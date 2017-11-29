var BN = require('bn.js')

var curves = require('./curves.json')
var Curve = require('./curve')

function getCurveByName (name) {
  var curve = curves[name]
  if (!curve) return null

  var p = new BN(curve.p, 16)
  var a = new BN(curve.a, 16)
  var b = new BN(curve.b, 16)
  var n = new BN(curve.n, 16)
  var h = new BN(curve.h, 16)
  var Gx = new BN(curve.Gx, 16)
  var Gy = new BN(curve.Gy, 16)

  var red
  if (name === 'secp256k1') red = BN.red('k256')

  return new Curve(p, a, b, Gx, Gy, n, h, red)
}

module.exports = getCurveByName
