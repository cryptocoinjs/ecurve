var Benchmark = require('benchmark')
var local = require('../')
var npm = require('ecurve')

var BN = require('bn.js')
var Bigi = require('bigi')

run()
function run () {
  var suite = new Benchmark.Suite()

  // add tests
  suite
  .add('local', function () {
    var curve = local.getCurveByName('secp256k1')
    var Q = local.Point.decodeFrom(curve, Buffer.from('024289801366bcee6172b771cf5a7f13aaecd237a0b9a1ff9d769cabc2e6b70a34', 'hex'))
    var x = new BN(1024)

    curve.isOnCurve(Q.add(Q).multiply(x))
  })
  .add('npm', function () {
    var curve = npm.getCurveByName('secp256k1')
    var Q = npm.Point.decodeFrom(curve, Buffer.from('024289801366bcee6172b771cf5a7f13aaecd237a0b9a1ff9d769cabc2e6b70a34', 'hex'))
    var x = new Bigi('1024')

    curve.isOnCurve(Q.add(Q).multiply(x))
  })
  // add listeners
  .on('cycle', function (event) {
    console.log(String(event.target))
  })
  .on('complete', function () {
    console.log('Fastest is ' + this.filter('fastest').map('name'))
    console.log('')
  }).run()
}
