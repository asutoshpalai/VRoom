var HTTPS_PORT = 8443;

var fs = require('fs');
var https = require('https');
var querystring = require('querystring');
var WebSocketServer = require('ws').Server;

// Yes, SSL is required
var serverConfig = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
};

var accToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzY29wZSI6Imh0dHBzOi8vZGV2Lm1pY3Jvc29mdHRyYW5zbGF0b3IuY29tLyIsInN1YnNjcmlwdGlvbi1pZCI6IjY2MDg2YmU2Y2UyYTQ2Y2U5MjllNDZmN2I3YWI3ZWIyIiwicHJvZHVjdC1pZCI6IlNwZWVjaFRyYW5zbGF0b3IuUzEiLCJjb2duaXRpdmUtc2VydmljZXMtZW5kcG9pbnQiOiJodHRwczovL2FwaS5jb2duaXRpdmUubWljcm9zb2Z0LmNvbS9pbnRlcm5hbC92MS4wLyIsImF6dXJlLXJlc291cmNlLWlkIjoiL3N1YnNjcmlwdGlvbnMvOGEzMGYxZjEtNWYyNC00ZGViLWFiYTgtMWVmMmM2ZTYwMzIxL3Jlc291cmNlR3JvdXBzL3Jlc291cmNlLWdyb3VwL3Byb3ZpZGVycy9NaWNyb3NvZnQuQ29nbml0aXZlU2VydmljZXMvYWNjb3VudHMvc2lsZW50LWFzc2Fzc2lucyIsImlzcyI6InVybjptcy5jb2duaXRpdmVzZXJ2aWNlcyIsImF1ZCI6InVybjptcy5taWNyb3NvZnR0cmFuc2xhdG9yIiwiZXhwIjoxNDg4NjUzMzMyfQ.haTbLLENib4pTKF7tDfXLzRF-YFrWudUZtOSbwsTwWw';

// ----------------------------------------------------------------------------------------

// Create a server for the client html page
var handleRequest = function(request, response) {
  // Render the single client html file for any request the HTTP server receives
  console.log('request received: ' + request.url);

  if(request.url == '/') {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.end(fs.readFileSync('index.html'));
  } else if(request.url == '/test') {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.end(fs.readFileSync('test.html'));
  } else if(request.url == '/token') {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.end(accToken);
  } else if(request.url == '/server') {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.end(fs.readFileSync('server.html'));
  } else if(fs.existsSync(request.url.substr(1))) {
    response.end(fs.readFileSync(request.url.substr(1)));
  }
};

var httpsServer = https.createServer(serverConfig, handleRequest);
httpsServer.listen(HTTPS_PORT, '0.0.0.0');
getAdmToken();
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
    path: '/sts/v1.0/issueToken?Subscription-Key=96d9a06df6fd467392d5ff575fb831c6',
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

console.log('Server running. Visit https://localhost:' + HTTPS_PORT + ' in Firefox/Chrome (note the HTTPS; there is no HTTP -> HTTPS redirect!)');
