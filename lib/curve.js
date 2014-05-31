var BigInteger = require('bigi')

var ECFieldElementFp = require('./field-element')
var ECPointFp = require('./point')

module.exports = ECCurveFp

function ECCurveFp(q,a,b) {
  this._q = q;
  this._a = this.fromBigInteger(a);
  this._b = this.fromBigInteger(b);
  this.infinity = new ECPointFp(this, null, null);
};

Object.defineProperty(ECCurveFp.prototype, 'q', {get: function() { return this._q}})
Object.defineProperty(ECCurveFp.prototype, 'a', {get: function() { return this._a}})
Object.defineProperty(ECCurveFp.prototype, 'b', {get: function() { return this._b}})

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

