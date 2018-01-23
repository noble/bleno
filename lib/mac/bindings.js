var os = require('os');
var osRelease = parseFloat(os.release());

if (osRelease < 17 ) {
  module.exports = require('./yosemite');
} else {
  module.exports = require('./highsierra');
}
