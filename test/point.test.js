var assert = require('assert')

var ECCurveFp = require('../')
var ECPointFp = ECCurveFp.ECPointFp
var getCurve = ECCurveFp.getCurve
var BigInteger = require('bigi')

var fixtures = require('./fixtures')
console.dir(fixtures)
process.exit()

describe('ECPointFp', function() {
  describe('+ decodeFrom', function() {
    it('should be an static (class) method', function() {
      assert.equal(typeof ECPointFp.decodeFrom, 'function');
    });

    // secp256k1: p = 2^256 - 2^32 - 2^9 - 2^8 - 2^7 - 2^6 - 2^4 - 1
    var p = BigInteger.fromHex('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F');
    var a = BigInteger.ZERO;
    var b = BigInteger.fromHex('07');
    var curve = new ECCurveFp(p, a, b);
    
    var pubHex = '04d6d48c4a66a303856d9584a6ad49ce0965e9f0a5e4dcae878a3d017bd58ad7af3d0b920af7bd54626103848150f8b083edcba99d0a18f1035b6036da1500c6c0';
    var pubKey = [].slice.call(new Buffer(pubHex, 'hex'));
    var pubHexCompressed = '02d6d48c4a66a303856d9584a6ad49ce0965e9f0a5e4dcae878a3d017bd58ad7af';

    it('should work with uncompressed keys', function(){
      var pubPoint = ECPointFp.decodeFrom(curve, pubKey);
      assert.equal(pubHex, new Buffer(pubPoint.getEncoded(false)).toString('hex'))
    });

    it('should work with compressed keys', function() {
      var pubPoint = ECPointFp.decodeFrom(curve, pubKey);
      var pubKeyCompressed = pubPoint.getEncoded(true);
      var pubPointCompressed = ECPointFp.decodeFrom(curve, pubKeyCompressed);
      assert.equal(pubHex, new Buffer(pubPointCompressed.getEncoded(false)).toString('hex'));
      assert.equal(new Buffer(pubKeyCompressed).toString('hex'), new Buffer(pubPointCompressed.getEncoded(true)).toString('hex'));
      assert.equal(pubHexCompressed, new Buffer(pubKeyCompressed).toString('hex'));

    })
  })

  describe('- getEncoded()', function() {
    it('should properly get the encoded version', function() {
      fixtures.valid.forEach(function(f) {
        var curve = getCurve('secp256k1').getCurve()
        var Q = new ECPointFp(curve, curve.fromBigInteger(new BigInteger(f.x)), curve.fromBigInteger(new BigInteger(f.y)))

        var encoded = Q.getEncoded(f.compressed)
        assert.equal(encoded.toString('hex'), f.hex)
      })
    })
  })
})