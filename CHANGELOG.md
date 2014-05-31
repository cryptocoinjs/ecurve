x.y.z / 2014-0x-dd
------------------
* added http://ci.testling.com support
* changed `ECPointFP.decodeFrom()` to accept `Buffer` instead of `Array`. Thanks BitcoinJS devs :)
* changed `ECPointFP.prototype.getEncoded()` to return a `Buffer` instead of an `Array`
* added `compressed` property to instances of `ECPointFp`, set to `true` by default
* `ECCurveFp.prototype.decodePointHex` removed. This change brings additonal clarity and removes untested (unused)
portions of `decodePointHex`.

Old way:

```js
var G = curve.decodePointHex("04"
      + "79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798"
      + "483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8");
```

New way:

```js
var x = BigInteger.fromHex("79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798")
var y = BigInteger.fromHex("483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8")
var G = new ECPointFp(curve, curve.fromBigInteger(x), curve.fromBigInteger(y));
```

* deleted file `util.js` which contained `integerToBytes(bigInt, sizeInBytes)`, new
way: `[].slice.call(bigInt.toBuffer(sizeInBytes))`


0.4.0 / 2014-05-29
------------------
* moved module `ecurve-names` into this module
* moved docs to cryptocoinjs.com
* moved `ECFieldElementFp` to `field-element.js`
* moved `ECPointFp` to `point.js`
* moved `ECCurveFp` to `curve.js`
* upgraded `bigi@0.2.x` to `bigi@^1.1.0`
* added travis-ci and coveralls support 

0.3.2 / 2014-04-14
------------------
* bugfix: `decodeFrom` works with compressed keys, #8

0.3.1 / 2014-03-13
------------------
* bug fix: `ECPointFp.decodeFrom` was incorrectly moved to `ECPointFp.prototype`

0.3.0 / 2014-03-05
------------------
* Fixed point export format to adhere to SEC guidelines (Bug #2)
* Removed AMD/Component support
* added browser test

0.2.0 / 2013-12-08
------------------
* changed dep to `bigi` 

0.1.0 / 2013-11-20
------------------
* changed package name 
* removed AMD support

0.0.1 / 2013-11-06
------------------
* initial release