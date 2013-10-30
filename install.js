var os = require('os');
var exec = require('child_process').exec;

var platform = os.platform();

console.log('bleno install: platform is "' + platform + "'");

if (platform === 'darwin') {
  console.log('bleno install: installing xpc-connection ...');

  exec('npm install xpc-connection@~0.0.3', function(error, stdout, stderr) {
    console.log('bleno install: done');
    process.exit(error ? -1 : 0);
  });
} else if (platform === 'linux') {
  console.log('bleno install: running node-gyp ...');

  exec('node-gyp configure build', function(error, stdout, stderr) {
    console.log('bleno install: done');
    process.exit(error ? -1 : 0);
  });
} else {
  console.error('bleno install: Your platform is not supported!');
  process.exit(-1);
}
