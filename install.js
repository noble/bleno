var os = require('os');
var spawn = require('child_process').spawn;

var platform = os.platform();

console.log('bleno install: platform is "' + platform + "'");

var npmInstall = function(package, callback) {

};

if (platform === 'darwin') {
  console.log('bleno install: installing xpc-connection ...');

  var npmInstall = spawn('npm', ['install', 'xpc-connection@~0.1.0'], {
    stdio: 'inherit'
  });

  npmInstall.on('close', function(code) {
    console.log('bleno install: done');

    process.exit(code);
  });
} else if (platform === 'linux') {
  console.log('bleno install: running node-gyp ...');

  var nodeGypConfigureBuild = spawn('node-gyp', ['configure', 'build'], {
    stdio: 'inherit'
  });

  nodeGypConfigureBuild.on('close', function(code) {
    console.log('bleno install: ' + ((code === 0) ? 'done' : 'error'));

    if (code !== 0) {
      console.error('Have you installed "libbluetooth-dev"?');
      console.error();
      console.error('Please see README https://github.com/sandeepmistry/bleno#prerequisites');
    }

    process.exit(code);
  });
} else {
  console.error('bleno install: Your platform is not supported!');
  process.exit(-1);
}
