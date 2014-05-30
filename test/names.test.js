var getSECCurveByName = require('../lib/names')
var BigInteger = require('bigi');

require('terst')

describe('+ getSECCurveByName(curveName)', function() {
  describe('> when the bitcoin curve is passed', function() {
    it('should return the proper curve', function() {
      var curve = getSECCurveByName('secp256k1');
      T (curve);
      EQ (curve.getCurve().getQ().toBuffer().toString('hex'), 'fffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f');
      T (curve.getCurve().getA().toBigInteger().equals(BigInteger.ZERO));
      EQ (arrayToHex(curve.getCurve().getB().toBigInteger().toByteArrayUnsigned()), '07');
      EQ (new Buffer(curve.getG().getEncoded(false)).toString('hex'), '0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8');
      EQ (curve.getN().toBuffer().toString('hex'), 'fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141');
      EQ (curve.getH().toBuffer().toString('hex'), '01');
    });
    
    it('should return null for unknown curves', function() {
      EQ (getSECCurveByName('foobar'), null);
    });
  });
});




