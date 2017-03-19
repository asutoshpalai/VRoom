var fs = require('fs');
var express = require('express');
var https = require('https');
var querystring = require('querystring');
var WebSocketServer = require('ws').Server;
var sassMiddleware = require('node-sass-middleware')
require('dotenv').config()

function config(name) {
  return process.env[name];
}

var HTTPS_PORT = config('PORT');

// Yes, SSL is required
var serverConfig = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
};

var accToken = null;

// ----------------------------------------------------------------------------------------

// console.log(sass);

var app = express();
app.use(
  sassMiddleware({
    src: __dirname + '/scss',
    dest: __dirname + '/public/css',
    debug: true,
    prefix:  '/css'
  })
);

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get("/", function(req, response) {
  response.render('index.ejs');
});

app.get("/client", function(req, response) {
  response.render('client.ejs');
});

app.get("/test", function(req, response) {
  response.render('test.ejs');
});

app.get("/token", function(req, response) {
  response.end(accToken);
  getAdmToken();
});

app.get("/server", function(req, response) {
  response.render('server.ejs');
});

var httpsServer = https.createServer(serverConfig, app);
httpsServer.listen(HTTPS_PORT, '0.0.0.0');
// ----------------------------------------------------------------------------------------

// Create a server for handling websocket calls
var wss = new WebSocketServer({server: httpsServer});

wss.on('connection', function(ws) {
  ws.on('message', function(message) {
    // Broadcast any received message to all clients
    console.log('received: %s', message);
    wss.broadcast(message);
  });
});

wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocketServer.OPEN) {
      client.send(data);

    }
  });
};

function getAdmToken() {
  var post_data = querystring.stringify({
    'client_id': '', //your client id,
    'scope': 'http://api.microsofttranslator.com',
    'grant_type': 'client_credentials',
    'client_secret': '' // your client secret
  });

  // https://api.cognitive.microsoft.com/sts/v1.0/issueToken?Subscription-Key=96d9a06df6fd467392d5ff575fb831c6
  var post_options = {
    host: 'api.cognitive.microsoft.com',
    path: '/sts/v1.0/issueToken?Subscription-Key=0d12ee2cb2824ec09626b927fe001e20',
    method: 'POST',
    //headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(post_data) }
  };

  var post_req = https.request(post_options, function (res) {
    res.setEncoding('utf8');
    if (res.statusCode == 200) {
      res.on('data', function (chunk) {
        //accToken = JSON.parse(chunk).access_token;
        accToken = chunk;
        console.log('[generateAdmToken] Success');
      });
    }
    else {
      accToken = ERR_REQ_FAIL;
      console.glog('[generateAdmToken] Failed with status code ' + res.statusCode, "error");
    }
  });

  //post_req.write(post_data);
  post_req.end();
}

getAdmToken();
console.log('Server running. Visit https://localhost:' + HTTPS_PORT + ' in Firefox/Chrome (note the HTTPS; there is no HTTP -> HTTPS redirect!)');
