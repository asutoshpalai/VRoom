(function() {

var roomName = $('#roomName').html();

var nicks = ["Bonnie Rowsey", "Sima Landwehr", "Agnes Stringfellow", "Silva Reta", "Josette Dyal", "Adan Thweatt", "Edwardo Vivanco", "Wava Hinds", "Cyndi Divine", "Jadwiga Saur", "Renato Whidbee", "Kathi Pitt", "Mabelle Sutcliffe", "Vernell Domingue", "Refugia Latham", "Larisa Depaz", "Myrtle Reinhold", "Miki Griffiths", "Hayley Keebler", "Lakeisha Huffines"];
nick = nicks[Math.floor(Math.random()*nicks.length)];

webrtc = new SimpleWebRTC({
  // the id/element dom element that will hold "our" video
  localVideoEl: 'localVideo',
  // the id/element dom element that will hold remote videos
  //remoteVideosEl: 'remotesVideos',
  // immediately ask for camera access
  autoRequestMedia: true,
  localVideo: false,
  nick: nick,
  media: { video: false, audio: false  }
  //,
  //url: 'https://192.168.0.138:8888'

});

webrtc.on('readyToCall', function () {
    webrtc.joinRoom(roomName);
});

webrtc.on('videoAdded', function(videoEl, peer) {
  var video = document.getElementById('penguin-sledding');
  video.src = window.URL.createObjectURL(peer.stream);
  video.play();

  var langs = {
    source: $('#teacher-lang').html(),
    target: $('#sub-lang').html()
  };
  
  StartAudioTransSession(peer.stream, handleSubs, langs);
  videoEl.display = null;
});


webrtc.on('createdPeer', function(peer){
  var pnick = peer.parent.config.nick;
  if(pnick === 'streamer') {
    // Broadcaster
    return;
  }
  addPerson();
  console.log(pnick + " joined the class");
});

var full_speech = [];
var key_phrases = [];
var key_lookup = {}; 

function handleSubs(recognition, translation) {
  document.getElementById("subs").setAttribute("text", "color: white; align: center; value: "+recognition);
  
  if(recognition.toLowerCase().indexOf("biology") >-1 ) {
     document.getElementById("responsive").innerHTML = ("<a-entity position=\"-7 6 -10\" rotation = \"0 180 0\"   scale = \".007 .007 .007\" obj-model=\"obj: #dna-obj; mtl: #dna-mtl\"><a-animation attribute=\"rotation\" dur=\"5000\" fill=\"forwards\" to=\"360 360 0\" repeat=\"indefinite\"></a-animation></a-entity>");
     setTimeout(function(){ 
           document.getElementById("responsive").innerHTML = "";
      sky.removeAttribute("src");}, 14000);
  }
  
  if(recognition.toLowerCase().indexOf("chemistry") >-1 ) {
    alert("chemistry");
  }
  
  if(recognition.toLowerCase().indexOf("solar") >-1 ) {
    document.getElementById("sky").setAttribute("src", "img.jpg")
    sky.removeAttribute("color");
    setTimeout(function(){ 
      document.getElementById("sky").setAttribute("color", "#000")
      sky.removeAttribute("src");}, 9000);
  }


  var canvas = document.getElementById("helloWorldCanvas");
  var ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.rect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  ctx.fill(); 
  ctx.font = "30px Arial";
  ctx.fillStyle = 'white';
  ctx.fillText(translation,10,50);
  console.log(arguments);
  full_speech.push(recognition);
  extractKeyPhrases(recognition);
}

function extractKeyPhrases(string) {

  var body = {
    documents: [
      {
        id: "1",
        text: full_speech.join(' ')
      }
    ]
  };
  var data = JSON.stringify(body);

  $.ajax({
    url: "https://westus.api.cognitive.microsoft.com/text/analytics/v2.0/keyPhrases",
    beforeSend: function(xhrObj){
      // Request headers
      xhrObj.setRequestHeader("Content-Type","application/json");
      xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key","14a8f033e94c4819b1d79e67b4a448d7");
    },
    type: "POST",
    // Request body
   data: data
  }).done(function(data) {
    console.log("TAgs:");
    console.log(data.documents[0].keyPhrases);
    var new_phrases = data.documents[0].keyPhrases.filter(function (x) {
      return key_phrases.indexOf(x) === -1;
    });

    var i;
    for(i in new_phrases) {
      search_result(new_phrases[i]);
    }

    key_phrases = key_phrases.concat(new_phrases);
    document.getElementById("tags").setAttribute("text", "color: white; align: center; value: "+getInLine(key_phrases));


    console.log(key_phrases);
  }).fail(function() {
    console.log("error fetching key_phrases");

  });

};

function search_result(string) {

  if(!string) return;

  var data = {
    q: string,
    mkt: 'en-in'
  }

  $.ajax({
    url: "https://api.cognitive.microsoft.com/bing/v5.0/search",
    beforeSend: function(xhrObj){
      // Request headers
      xhrObj.setRequestHeader("Content-Type","application/json");
      xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key","2971168a19bc4218ad68110566bae1cb");
    },
    // Request body
   data: data
  })
  .done(function(data) {
    console.log("search:");
    console.log(key_lookup);
    key_lookup[string] = data.webPages.value[0].snippet;
  document.getElementById("scrapedData").setAttribute("text", "color: white; align: center; value: "+data.webPages.value[0].snippet);

  })
  .fail(function() {
    alert("error");

  });

}

})();

function getInLine(key) {
  var output = "TAGS\n";
  for (var i = 0; i<key.length; i++) {
    output+=key[i];
    output+="\n";
  }
  return output;
}
function addPerson() {
  if(TOTAL==0) {
    $("#topbar").append("<a-entity position=\"-2 0 -3\" rotation = \"0 180 0\"  scale = \".05 .05 .05\" obj-model=\"obj: #chair-test-obj; mtl: #chair-test-mtl\"> </a-entity>");
    $("#topbar").append("<a-entity position=\"-2 1.4 -4\" rotation = \"0 90 20\"  scale = \".05 .05 .05\" obj-model=\"obj: #man-obj; mtl: #man-mtl\"></a-entity>");
    $("#topbar").append(" <a-entity position=\"-2 2.5 -3\" text=\"width: 3; color: white; value: John\"></a-entity>");
  }
  if(TOTAL==1) {
    $("#topbar").append("<a-entity position=\"2 0 -3\" rotation = \"0 180 0\"  scale = \".05 .05 .05\" obj-model=\"obj: #chair-test-obj; mtl: #chair-test-mtl\"> </a-entity>");
    $("#topbar").append("<a-entity position=\"2 1.4 -4\" rotation = \"0 90 20\"  scale = \".05 .05 .05\" obj-model=\"obj: #man-obj; mtl: #man-mtl\"></a-entity>");
    $("#topbar").append(" <a-entity position=\"3 2.5 -3\" text=\"width: 3; color: white; value: John\"></a-entity>");    
  }
  TOTAL++;
}
var TOTAL = -1;


var canvas = document.getElementById("helloWorldCanvas");
  var ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.rect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  ctx.fill();


