var os = require('os');
var osRelease = parseFloat(os.release());

if (osRelease < 17 || osRelease > 18 ) {
  module.exports = require('./yosemite');
} else {
  module.exports = require('./highsierra');
}
