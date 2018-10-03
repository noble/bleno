var os = require('os');

module.exports = function() {
  var platform = os.platform();

  if (platform === 'darwin') {
    return require('./mac/bindings');
  } else if (platform === 'linux' || platform === 'freebsd' || platform === 'win32' || platform === 'android') {
    return require('./hci-socket/bindings');
  } else {
    throw new Error('Unsupported platform');
  }
};