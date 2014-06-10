var Point = require('./point')
var Curve = require('./curve')

var getECParams = require('./names')

//for legacy compatibility, remove in the future
Curve.Point = Point

module.exports = {
  Curve: Curve,
  Point: Point,
  getECParams: getECParams
}

