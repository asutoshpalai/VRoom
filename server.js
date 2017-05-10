var fs = require('fs');
var express = require('express');
var https = require('https');
var querystring = require('querystring');
var sassMiddleware = require('node-sass-middleware');
var bodyParser = require('body-parser');

require('dotenv').config()

function config(name) {
  return process.env[name];
}

var HTTPS_PORT = 8443;

// Yes, SSL is required
var serverConfig = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
};

var STT_access_token = null;
var TTS_access_token = null;

var rooms_languages = {};

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

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get("/", function(req, response) {
  response.render('index.ejs');
});

app.post("/join", function(req, response) {
  if (!rooms_languages.hasOwnProperty(req.body.room)) {
    response.status("404");
    response.end("Room doesn't exist");
  }

  response.render('client.ejs', {
    nick: req.body.nick,
    room: req.body.room,
    TTS_access_token: TTS_access_token,
    teacher_lang: rooms_languages[req.body.room],
    audio_lang: req.body['audio-lang'],
    sub_lang: req.body['sub-lang']
  });

  generateTTSToken();
});

app.get("/test", function(req, response) {
  response.render('test.ejs');
});

app.get("/token", function(req, response) {
  response.end(STT_access_token);
  generateSTTToken();
});

app.post("/lecture", function(req, response) {
  rooms_languages[req.body.room] = req.body.lang;
  response.render('server.ejs', {
    room: req.body.room
  });
});

app.get("/languages", getLanguages);

app.get("/privacy-policy", function(req, response) {
  response.render('privacy_policy.ejs');
})

var httpsServer = https.createServer(serverConfig, app);

/////////////////////////////////////////////////////////////////////////////////////////////////
var io = require('socket.io')(httpsServer);

var people = {};
var positions = 0;
io.on('connection', function(socket) {
	socket.emit("id", socket.id);
  console.log(socket.handshake.headers.referer.split('/'));
  if (socket.handshake.headers.referer.split('/')[socket.handshake.headers.referer.split('/').length - 1] == "lecture") {    console.log("socket from server.html");
    
  socket.on("biology", function() {
    socket.broadcast.emit('biology');
  })

  socket.on("solar", function() {
    socket.broadcast.emit('solar');
  })
  
    return;
  }
	console.log(socket.id);
	for (var person in people) {
		socket.emit("add", people[person]);
	}
	socket.emit("position", (positions));

  socket.on("disconnect", function() {
    delete people[socket.id];
    console.log("disconnected");
  })

  socket.on('nick', function(nick) {
    // people[socket.id]['name'] = data;
  	people[socket.id] = {id : socket.id, position: (positions), 'nick': nick};
  	socket.broadcast.emit('add', people[socket.id]);
  	positions+=2;
  	socket.on("data", function(delta) {
  		socket.broadcast.emit('data', delta);
  	});
  });
});


///////////////////////////////////////////////////////////////////////////////////////
httpsServer.listen(HTTPS_PORT, '0.0.0.0');
// ----------------------------------------------------------------------------------------

// Create a server for handling websocket calls

function getLanguages(req, response) {
  var langURL = "https://dev.microsofttranslator.com/languages?scope=speech,text&api-version=1.0";

  var post_options = {
    host: 'dev.microsofttranslator.com',
    path: '/languages?scope=speech,text&api-version=1.0',
    method: 'GET',
  }

  var post_req = https.get(post_options, function(res) {
    res.setEncoding('utf-8');
    if (res.statusCode == 200) {
      text = '';
      res.on('data', function(chunk) {
        text += chunk;
      }).on('end', function() {
        response.send(text);
      });
    }
    else {
      console.log("error" + res.status);
      response.send("error");
    }
  });
}

function generateAdmToken(subscription_key, cb) {
  var post_data = querystring.stringify({
    'client_id': '', //your client id,
    'scope': 'http://api.microsofttranslator.com',
    'grant_type': 'client_credentials',
    'client_secret': '' // your client secret
  });

  // https://api.cognitive.microsoft.com/sts/v1.0/issueToken?Subscription-Key=96d9a06df6fd467392d5ff575fb831c6
  var post_options = {
    host: 'api.cognitive.microsoft.com',
    path: '/sts/v1.0/issueToken?Subscription-Key=' + subscription_key,
    method: 'POST',
    //headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(post_data) }
  };

  var post_req = https.request(post_options, function (res) {
    access_token = '';
    res.setEncoding('utf8');
    if (res.statusCode == 200) {
      res.on('data', function (chunk) {
        //access_token = JSON.parse(chunk).access_token;
        access_token += chunk;
        console.log('[generateAdmToken] Success for ' + subscription_key);
      });
      res.on('end', function() {
        cb(access_token);
      });
    }
    else {
      console.log('[generateAdmToken] Failed with status code ' + res.statusCode + ' for ' + subscription_key, "error");
    }
  });

  //post_req.write(post_data);
  post_req.end();
}

function generateSTTToken() {
  generateAdmToken("878b7a3314024ea1949dbe53f97df863", function(access_token) {
    STT_access_token = access_token;
  })
}

function generateTTSToken() {
  generateAdmToken("4aba210a818d4f57846710ae5b1e8120", function(access_token) {
    TTS_access_token = access_token;
  })
}

generateSTTToken();
generateTTSToken();
console.log('Server running. Visit https://localhost:' + HTTPS_PORT + ' in Firefox/Chrome (note the HTTPS; there is no HTTP -> HTTPS redirect!)');
