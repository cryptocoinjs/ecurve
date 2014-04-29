
module.exports = ECFieldElementFp

function ECFieldElementFp(q,x) {
  this.x = x;
  // TODO if(x.compareTo(q) >= 0) error
  this.q = q;
};

ECFieldElementFp.prototype.equals = function(other) {
  if(other == this) return true;
  return (this.q.equals(other.q) && this.x.equals(other.x));
};

ECFieldElementFp.prototype.toBigInteger = function() {
  return this.x;
};

ECFieldElementFp.prototype.negate = function() {
  return new ECFieldElementFp(this.q, this.x.negate().mod(this.q));
};

ECFieldElementFp.prototype.add = function(b) {
  return new ECFieldElementFp(this.q, this.x.add(b.toBigInteger()).mod(this.q));
};

ECFieldElementFp.prototype.subtract = function(b) {
  return new ECFieldElementFp(this.q, this.x.subtract(b.toBigInteger()).mod(this.q));
};

ECFieldElementFp.prototype.multiply = function(b) {
  return new ECFieldElementFp(this.q, this.x.multiply(b.toBigInteger()).mod(this.q));
};

ECFieldElementFp.prototype.square = function() {
  return new ECFieldElementFp(this.q, this.x.square().mod(this.q));
};

ECFieldElementFp.prototype.divide = function feFpDivide(b) {
  return new ECFieldElementFp(this.q, this.x.multiply(b.toBigInteger().modInverse(this.q)).mod(this.q));
};

ECFieldElementFp.prototype.getByteLength = function () {
  return Math.floor((this.toBigInteger().bitLength() + 7) / 8);
};