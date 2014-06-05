var ECFieldElementFp = require('./field-element')
var ECPointFp = require('./point')
var ECCurveFp = require('./curve')

var getECParams = require('./names')

//for legacy compatibility, remove in the future
ECCurveFp.ECPointFp = ECPointFp

module.exports = {
  ECCurveFp: ECCurveFp,
  ECFieldElementFp: ECFieldElementFp,
  ECPointFp: ECPointFp,
  getECParams: getECParams
}

