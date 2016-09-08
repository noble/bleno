# Setup Instructions
1. Get dependencies by running `npm install` in both the root of this repository and this folder.
2. Start the web server and bleno with `npm start` or `node app.js` from this folder.

# Notes
This only works in Chrome 48+ with the [enable-web-bluetooth flag](chrome://flags/#enable-web-bluetooth)
enabled. Tested successfully on Chrome for linux and Android so far.

When run on some devices, the browser will 'see' the bleno peripheral but will fail after choosing.  Not sure how to debug this. 
