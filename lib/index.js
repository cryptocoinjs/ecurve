'use strict';

var BigInteger = require('bigi');

var ECFieldElementFp = require('./field-element')
var ECPointFp = require('./point')
var ECCurveFp = require('./curve')
var getCurve = require('./names')



module.exports = ECCurveFp;

//for easy exporting
ECCurveFp.ECPointFp = ECPointFp;
ECCurveFp.getCurve = getCurve

