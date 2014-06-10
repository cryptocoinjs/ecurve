var Point = require('./point')
var Curve = require('./curve')

var getCurveByName = require('./names')

//for legacy compatibility, remove in the future
Curve.Point = Point

module.exports = {
  Curve: Curve,
  Point: Point,
  getCurveByName: getCurveByName
}

