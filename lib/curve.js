var BigInteger = require('bigi')

var ECFieldElementFp = require('./field-element')
var ECPointFp = require('./point')

module.exports = ECCurveFp

function ECCurveFp(q,a,b) {
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

