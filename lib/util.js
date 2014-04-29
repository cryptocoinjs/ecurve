
var me = module.exports

// prepends 0 if bytes < len
// cuts off start if bytes > len
me.integerToBytes = function integerToBytes(i, len) {
  var bytes = i.toByteArrayUnsigned();

  if (len < bytes.length) {
  bytes = bytes.slice(bytes.length-len);
  } else while (len > bytes.length) {
  bytes.unshift(0);
  }

  return bytes;
};