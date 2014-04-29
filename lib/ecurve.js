'use strict';

var BigInteger = require('bigi');

var ECFieldElementFp = require('./field-element')
var ECPointFp = require('./point')






// ----------------
// ECCurveFp

// constructor
var ECCurveFp = function ECCurveFp(q,a,b) {
  this.q = q;
  this.a = this.fromBigInteger(a);
  this.b = this.fromBigInteger(b);
  this.infinity = new ECPointFp(this, null, null);
};

ECCurveFp.prototype.getQ = function() {
  return this.q;
};

ECCurveFp.prototype.getA = function() {
  return this.a;
};

ECCurveFp.prototype.getB = function() {
  return this.b;
};

ECCurveFp.prototype.equals = function(other) {
  if(other == this) return true;
  return(this.q.equals(other.q) && this.a.equals(other.a) && this.b.equals(other.b));
};

ECCurveFp.prototype.getInfinity = function() {
  return this.infinity;
};

ECCurveFp.prototype.fromBigInteger = function(x) {
  return new ECFieldElementFp(this.q, x);
};

// for now, work with hex strings because they're easier in JS
ECCurveFp.prototype.decodePointHex = function(s) {
  switch(parseInt(s.substr(0,2), 16)) { // first byte
  case 0:
  return this.infinity;
  case 2:
  case 3:
  // point compression not supported yet
  return null;
  case 4:
  case 6:
  case 7:
  var len = (s.length - 2) / 2;
  var xHex = s.substr(2, len);
  var yHex = s.substr(len+2, len);

  return new ECPointFp(this,
       this.fromBigInteger(new BigInteger(xHex, 16)),
       this.fromBigInteger(new BigInteger(yHex, 16)));

  default: // unsupported
  return null;
  }
};

module.exports = ECCurveFp;

//for easy exporting
ECCurveFp.ECPointFp = ECPointFp;
