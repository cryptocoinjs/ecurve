var BigInteger = require('bigi');
var getECParams = require('../').getECParams

require('terst')

var curves = ['secp128r1', 'secp160k1', 'secp160r1', 'secp192k1', 'secp192r1', 'secp224r1', 'secp256k1', 'secp256r1']

describe('+ getECParams(curveName)', function() {
  describe('> when the secp256k1 curve is passed', function() {
    it('should return the proper curve', function() {
      var ecparams = getECParams('secp256k1');
      T (ecparams);
      EQ (ecparams.curve.q.toBuffer().toString('hex'), 'fffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f');
      T (ecparams.curve.a.toBigInteger().equals(BigInteger.ZERO));
      EQ (ecparams.curve.b.toBigInteger().toBuffer().toString('hex'), '07');
      EQ (new Buffer(ecparams.g.getEncoded(false)).toString('hex'), '0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8');
      EQ (ecparams.n.toBuffer().toString('hex'), 'fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141');
      EQ (ecparams.h.toBuffer().toString('hex'), '01');
    });
  });

  curves.forEach(function(c) {
    describe('> when ' + c, function() {
      it('should return the curve', function() {
        var ecparams = getECParams(c)
        T (ecparams)
      })
    })
  })

  describe('> when null is passed', function() {
    it('should return null for unknown curves', function() {
      EQ (getECParams('foobar'), null);
    })
  })
})




