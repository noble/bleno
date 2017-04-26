# Setup Instructions
1. Start the pizza peripheral per the in the readme
2. Open `index.html` in Chrome with `http-server` or `python3 -m http.server` or `python -m SimpleHTTPServer`

# Notes
This only works in Chrome 48+ with the [enable-web-bluetooth flag](chrome://flags/#enable-web-bluetooth)
enabled. Tested successfully on Chrome for linux and Android so far.

When run on some devices, the browser will 'see' the bleno peripheral but will fail after choosing.  Not sure how to debug this. 
