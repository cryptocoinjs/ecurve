var assert = require('assert');
var BigInteger = require('bigi');
var ECCurveFp = require('../lib/ecurve');

function fromHex(s) { return new BigInteger(s, 16); };
function arrayToHex(a) { return a.map(function(i) { return ('00'+i.toString(16)).slice(-2); }).join(''); };

describe('Ecurve', function() {
  it('should create curve objects', function() {
    // secp160r1: p = 2^160 - 2^31 - 1
    var q = fromHex('ffffffffffffffffffffffffffffffff7fffffff');
    var a = fromHex("ffffffffffffffffffffffffffffffff7ffffffc");
    var b = fromHex("1c97befc54bd7a8b65acf89f81d4d4adc565fa45");
    var curve = new ECCurveFp(q, a, b);
    assert.ok(curve);
    assert.equal(arrayToHex(curve.getQ().toByteArrayUnsigned()), 'ffffffffffffffffffffffffffffffff7fffffff');
    assert.equal(arrayToHex(curve.getA().toBigInteger().toByteArrayUnsigned()), 'ffffffffffffffffffffffffffffffff7ffffffc');
    assert.equal(arrayToHex(curve.getB().toBigInteger().toByteArrayUnsigned()), '1c97befc54bd7a8b65acf89f81d4d4adc565fa45');
  });
  it('should calculate keys correctly for secp160r1', function() {
    // sect163k1: p = 2^160 - 2^31 - 1
    var q = fromHex('ffffffffffffffffffffffffffffffff7fffffff');
    var a = fromHex("ffffffffffffffffffffffffffffffff7ffffffc");
    var b = fromHex("1c97befc54bd7a8b65acf89f81d4d4adc565fa45");
    var curve = new ECCurveFp(q, a, b);
    var G = curve.decodePointHex("04"
    + "4A96B5688EF573284664698968C38BB913CBFC82"
    + "23A628553168947D59DCC912042351377AC5FB32"); // ECPointFp
    
    var d = new BigInteger('971761939728640320549601132085879836204587084162', 10); // test vector from http://www.secg.org/collateral/gec2.pdf 2.1.2
    var Q = G.multiply(d);
    assert.equal(arrayToHex(Q.getEncoded(true)), '0251b4496fecc406ed0e75a24a3c03206251419dc0');
    assert.ok(Q.getX().toBigInteger().equals(new BigInteger('466448783855397898016055842232266600516272889280', 10)));
    assert.ok(Q.getY().toBigInteger().equals(new BigInteger('1110706324081757720403272427311003102474457754220', 10)));

    var d = new BigInteger('399525573676508631577122671218044116107572676710', 10); // test vector from http://www.secg.org/collateral/gec2.pdf 3.1.2
    var Q = G.multiply(d);
    assert.equal(arrayToHex(Q.getEncoded(true)), '0349b41e0e9c0369c2328739d90f63d56707c6e5bc');
    assert.ok(Q.getX().toBigInteger().equals(new BigInteger('420773078745784176406965940076771545932416607676', 10)));
    assert.ok(Q.getY().toBigInteger().equals(new BigInteger('221937774842090227911893783570676792435918278531', 10)));
  });
});
