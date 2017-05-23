var ec = require('elliptic').ec('secp256k1')
var ecurve = require('../').getCurveByName('secp256k1')
var BN = require('bn.js')
var a = Buffer.allocUnsafe(32).toString('hex')
var b = Buffer.allocUnsafe(32).toString('hex')

a = new BN(a, 16)
b = new BN(b, 16)
var ecA = ec.keyPair({ priv: a })
var ecB = ec.keyPair({ priv: b })

var ecdhBitcoin
console.time('ecurve')
var Q = ecurve.G.multiply(b)
for (var i = 0; i < 100; i++) {
  ecdhBitcoin = Q.multiply(a)
}
console.timeEnd('ecurve')

var ecdhElliptic
console.time('elliptic')
for (i = 0; i < 100; i++) {
  ecdhElliptic = ecA.derive(ecB.getPublic())
}
console.timeEnd('elliptic')

console.log(ecdhBitcoin.getEncoded(true).toString('hex').slice(2))
console.log(ecdhElliptic.toString('hex'))
