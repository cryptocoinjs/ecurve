!function(globals) {
'use strict'

var _imports = {}

//*** UMD BEGIN
if (typeof define !== 'undefined' && define.amd) { //require.js / AMD
  define(['cryptocoin-sha256', 'cryptocoin-base58'], function(sha256, base58) {
    _imports.sha256 = sha256
    _imports.base58 = base58
    return Address
  })
} else if (typeof module !== 'undefined' && module.exports) { //CommonJS
  try { //Node.js
    _imports.sha256 = require('cryptocoin-sha256')
    _imports.base58 = require('cryptocoin-base58')
  } catch (e) { //Component
    _imports.sha256 = require('sha256')
    _imports.base58 = require('base58')
  }
  module.exports = Address
} else {
  _imports.sha256 = globals.sha256
  _imports.base58 = globals.base58
  globals.Address = Address
}
//*** UMD END




}(this);