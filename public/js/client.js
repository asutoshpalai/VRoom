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

function addBiology() {
  document.getElementById("responsive").innerHTML = ("<a-entity position=\"-7 6 -10\" rotation = \"0 180 0\"   scale = \".007 .007 .007\" obj-model=\"obj: #dna-obj; mtl: #dna-mtl\"><a-animation attribute=\"rotation\" dur=\"5000\" fill=\"forwards\" to=\"360 360 0\" repeat=\"indefinite\"></a-animation></a-entity>");
  setTimeout(function(){ 
       document.getElementById("responsive").innerHTML = "";
  sky.removeAttribute("src");}, 14000);
}

function solarSystem() {
    document.getElementById("sky").setAttribute("src", "img.jpg")
    sky.removeAttribute("color");
    setTimeout(function(){ 
      document.getElementById("sky").setAttribute("color", "#000")
      sky.removeAttribute("src");}, 9000);
}


function handleSubs(recognition, translation) {
  TTS(translation, $('#audio-lang').html());
  document.getElementById("subs").setAttribute("text", "color: #2980b9; align: center; value: "+recognition);
  
  if(recognition.toLowerCase().indexOf("biology") >-1 ) {
    addBiology();
  }
  
  if(recognition.toLowerCase().indexOf("chemistry") >-1 ) {
    alert("chemistry");
  }
  
  if(recognition.toLowerCase().indexOf("solar") >-1 ) {
    solarSystem()
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
      xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key","3795edfb1e97461f8a90405f48d33c2d");
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
    document.getElementById("tags").setAttribute("text", "color: #2980b9; align: center; value: "+getInLine(key_phrases));


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
      xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key","a4f7d0c99cd0415893eca30359565eb8");
    },
    // Request body
    data: data
  })
  .done(function(data) {
    console.log("search:");
    console.log(key_lookup);
    key_lookup[string] = data.webPages.value[0].snippet;
    document.getElementById("scrapedData").setAttribute("text", "color: #2980b9; align: center; value: "+data.webPages.value[0].snippet);

  })
  .fail(function() {
    alert("error");

  });

}

})();

function TTS(text, lang) {

  var video = document.getElementById('penguin-sledding');
  video.muted = true;
  var ttslangs = {"ar-EG, Hoda (Female)": {"id": "ar-EG", "name": "Microsoft Server Speech Text to Speech Voice (ar-EG, Hoda)", "gender": "Female"},"ar-SA, Naayf (Male)": {"id": "ar-SA", "name": "Microsoft Server Speech Text to Speech Voice (ar-SA, Naayf)", "gender": "Male"},"ca-ES, HerenaRUS (Female)": {"id": "ca-ES", "name": "Microsoft Server Speech Text to Speech Voice (ca-ES, HerenaRUS)", "gender": "Female"},"cs-CZ, Vit (Male)": {"id": "cs-CZ", "name": "Microsoft Server Speech Text to Speech Voice (cs-CZ, Vit)", "gender": "Male"},"da-DK, HelleRUS (Female)": {"id": "da-DK", "name": "Microsoft Server Speech Text to Speech Voice (da-DK, HelleRUS)", "gender": "Female"},"de-AT, Michael (Male)": {"id": "de-AT", "name": "Microsoft Server Speech Text to Speech Voice (de-AT, Michael)", "gender": "Male"},"de-CH, Karsten (Male)": {"id": "de-CH", "name": "Microsoft Server Speech Text to Speech Voice (de-CH, Karsten)", "gender": "Male"},"de-DE, Hedda (Female)": {"id": "de-DE", "name": "Microsoft Server Speech Text to Speech Voice (de-DE, Hedda) ", "gender": "Female"},"de-DE, HeddaRUS (Female)": {"id": "de-DE", "name": "Microsoft Server Speech Text to Speech Voice (de-DE, HeddaRUS)", "gender": "Female"},"de-DE, Stefan, Apollo (Male)": {"id": "de-DE", "name": "Microsoft Server Speech Text to Speech Voice (de-DE, Stefan, Apollo) ", "gender": "Male"},"el-GR, Stefanos (Male)": {"id": "el-GR", "name": "Microsoft Server Speech Text to Speech Voice (el-GR, Stefanos)", "gender": "Male"},"en-AU, Catherine (Female)": {"id": "en-AU", "name": "Microsoft Server Speech Text to Speech Voice (en-AU, Catherine) ", "gender": "Female"},"en-AU, HayleyRUS (Female)": {"id": "en-AU", "name": "Microsoft Server Speech Text to Speech Voice (en-AU, HayleyRUS)", "gender": "Female"},"en-CA, Linda (Female)": {"id": "en-CA", "name": "Microsoft Server Speech Text to Speech Voice (en-CA, Linda)", "gender": "Female"},"en-CA, HeatherRUS (Female)": {"id": "en-CA", "name": "Microsoft Server Speech Text to Speech Voice (en-CA, HeatherRUS)", "gender": "Female"},"en-GB, Susan, Apollo (Female)": {"id": "en-GB", "name": "Microsoft Server Speech Text to Speech Voice (en-GB, Susan, Apollo)", "gender": "Female"},"en-GB, HazelRUS (Female)": {"id": "en-GB", "name": "Microsoft Server Speech Text to Speech Voice (en-GB, HazelRUS)", "gender": "Female"},"en-GB, George, Apollo (Male)": {"id": "en-GB", "name": "Microsoft Server Speech Text to Speech Voice (en-GB, George, Apollo)", "gender": "Male"},"en-IE, Shaun (Male)": {"id": "en-IE", "name": "Microsoft Server Speech Text to Speech Voice (en-IE, Shaun)", "gender": "Male"},"en-IN, Heera, Apollo (Female)": {"id": "en-IN", "name": "Microsoft Server Speech Text to Speech Voice (en-IN, Heera, Apollo)", "gender": "Female"},"en-IN, PriyaRUS (Female)": {"id": "en-IN", "name": "Microsoft Server Speech Text to Speech Voice (en-IN, PriyaRUS)", "gender": "Female"},"en-IN, Ravi, Apollo (Male)": {"id": "en-IN", "name": "Microsoft Server Speech Text to Speech Voice (en-IN, Ravi, Apollo) ", "gender": "Male"},"en-US, ZiraRUS (Female)": {"id": "en-US", "name": "Microsoft Server Speech Text to Speech Voice (en-US, ZiraRUS)", "gender": "Female"},"en-US, JessaRUS (Female)": {"id": "en-US", "name": "Microsoft Server Speech Text to Speech Voice (en-US, JessaRUS)", "gender": "Female"},"en-US, BenjaminRUS (Male)": {"id": "en-US", "name": "Microsoft Server Speech Text to Speech Voice (en-US, BenjaminRUS)", "gender": "Male"},"es-ES, Laura, Apollo (Female)": {"id": "es-ES", "name": "Microsoft Server Speech Text to Speech Voice (es-ES, Laura, Apollo)", "gender": "Female"},"es-ES, HelenaRUS (Female)": {"id": "es-ES", "name": "Microsoft Server Speech Text to Speech Voice (es-ES, HelenaRUS)", "gender": "Female"},"es-ES, Pablo, Apollo (Male)": {"id": "es-ES", "name": "Microsoft Server Speech Text to Speech Voice (es-ES, Pablo, Apollo)", "gender": "Male"},"es-MX, HildaRUS (Female)": {"id": "es-MX", "name": "Microsoft Server Speech Text to Speech Voice (es-MX, HildaRUS)", "gender": "Female"},"es-MX, Raul, Apollo (Male)": {"id": "es-MX", "name": "Microsoft Server Speech Text to Speech Voice (es-MX, Raul, Apollo)", "gender": "Male"},"fi-FI, HeidiRUS (Female)": {"id": "fi-FI", "name": "Microsoft Server Speech Text to Speech Voice (fi-FI, HeidiRUS)", "gender": "Female"},"fr-CA, Caroline (Female)": {"id": "fr-CA", "name": "Microsoft Server Speech Text to Speech Voice (fr-CA, Caroline)", "gender": "Female"},"fr-CA, HarmonieRUS (Female)": {"id": "fr-CA", "name": "Microsoft Server Speech Text to Speech Voice (fr-CA, HarmonieRUS)", "gender": "Female"},"fr-CH, Guillaume (Male)": {"id": "fr-CH", "name": "Microsoft Server Speech Text to Speech Voice (fr-CH, Guillaume)", "gender": "Male"},"fr-FR, Julie, Apollo (Female)": {"id": "fr-FR", "name": "Microsoft Server Speech Text to Speech Voice (fr-FR, Julie, Apollo)", "gender": "Female"},"fr-FR, HortenseRUS (Female)": {"id": "fr-FR", "name": "Microsoft Server Speech Text to Speech Voice (fr-FR, HortenseRUS)", "gender": "Female"},"fr-FR, Paul, Apollo (Male)": {"id": "fr-FR", "name": "Microsoft Server Speech Text to Speech Voice (fr-FR, Paul, Apollo)", "gender": "Male"},"he-IL, Asaf (Male)": {"id": "he-IL", "name": "Microsoft Server Speech Text to Speech Voice (he-IL, Asaf)", "gender": "Male"},"hi-IN, Kalpana, Apollo (Female)": {"id": "hi-IN", "name": "Microsoft Server Speech Text to Speech Voice (hi-IN, Kalpana, Apollo)", "gender": "Female"},"hi-IN, Kalpana (Female)": {"id": "hi-IN", "name": "Microsoft Server Speech Text to Speech Voice (hi-IN, Kalpana)", "gender": "Female"},"hi-IN, Hemant (Male)": {"id": "hi-IN", "name": "Microsoft Server Speech Text to Speech Voice (hi-IN, Hemant)", "gender": "Male"},"hu-HU, Szabolcs (Male)": {"id": "hu-HU", "name": "Microsoft Server Speech Text to Speech Voice (hu-HU, Szabolcs)", "gender": "Male"},"id-ID, Andika (Male)": {"id": "id-ID", "name": "Microsoft Server Speech Text to Speech Voice (id-ID, Andika)", "gender": "Male"},"it-IT, Cosimo, Apollo (Male)": {"id": "it-IT", "name": "Microsoft Server Speech Text to Speech Voice (it-IT, Cosimo, Apollo)", "gender": "Male"},"ja-JP, Ayumi, Apollo (Female)": {"id": "ja-JP", "name": "Microsoft Server Speech Text to Speech Voice (ja-JP, Ayumi, Apollo)", "gender": "Female"},"ja-JP, Ichiro, Apollo (Male)": {"id": "ja-JP", "name": "Microsoft Server Speech Text to Speech Voice (ja-JP, Ichiro, Apollo)", "gender": "Male"},"ko-KR, HeamiRUS (Female)": {"id": "ko-KR", "name": "Microsoft Server Speech Text to Speech Voice (ko-KR, HeamiRUS)", "gender": "Female"},"nb-NO, HuldaRUS (Female)": {"id": "nb-NO", "name": "Microsoft Server Speech Text to Speech Voice (nb-NO, HuldaRUS)", "gender": "Female"},"nl-NL, HannaRUS (Female)": {"id": "nl-NL", "name": "Microsoft Server Speech Text to Speech Voice (nl-NL, HannaRUS)", "gender": "Female"},"pl-PL, PaulinaRUS (Female)": {"id": "pl-PL", "name": "Microsoft Server Speech Text to Speech Voice (pl-PL, PaulinaRUS)", "gender": "Female"},"pt-BR, HeloisaRUS (Female)": {"id": "pt-BR", "name": "Microsoft Server Speech Text to Speech Voice (pt-BR, HeloisaRUS)", "gender": "Female"},"pt-BR, Daniel, Apollo (Male)": {"id": "pt-BR", "name": "Microsoft Server Speech Text to Speech Voice (pt-BR, Daniel, Apollo)", "gender": "Male"},"pt-PT, HeliaRUS (Female)": {"id": "pt-PT", "name": "Microsoft Server Speech Text to Speech Voice (pt-PT, HeliaRUS)", "gender": "Female"},"ro-RO, Andrei (Male)": {"id": "ro-RO", "name": "Microsoft Server Speech Text to Speech Voice (ro-RO, Andrei)", "gender": "Male"},"ru-RU, Irina, Apollo (Female)": {"id": "ru-RU", "name": "Microsoft Server Speech Text to Speech Voice (ru-RU, Irina, Apollo)", "gender": "Female"},"ru-RU, Pavel, Apollo (Male)": {"id": "ru-RU", "name": "Microsoft Server Speech Text to Speech Voice (ru-RU, Pavel, Apollo)", "gender": "Male"},"sk-SK, Filip (Male)": {"id": "sk-SK", "name": "Microsoft Server Speech Text to Speech Voice (sk-SK, Filip)", "gender": "Male"},"sv-SE, HedvigRUS (Female)": {"id": "sv-SE", "name": "Microsoft Server Speech Text to Speech Voice (sv-SE, HedvigRUS)", "gender": "Female"},"th-TH, Pattara (Male)": {"id": "th-TH", "name": "Microsoft Server Speech Text to Speech Voice (th-TH, Pattara)", "gender": "Male"},"tr-TR, SedaRUS (Female)": {"id": "tr-TR", "name": "Microsoft Server Speech Text to Speech Voice (tr-TR, SedaRUS)", "gender": "Female"},"zh-CN, HuihuiRUS (Female)": {"id": "zh-CN", "name": "Microsoft Server Speech Text to Speech Voice (zh-CN, HuihuiRUS)", "gender": "Female"},"zh-CN, Yaoyao, Apollo (Female)": {"id": "zh-CN", "name": "Microsoft Server Speech Text to Speech Voice (zh-CN, Yaoyao, Apollo)", "gender": "Female"},"zh-CN, Kangkang, Apollo (Male)": {"id": "zh-CN", "name": "Microsoft Server Speech Text to Speech Voice (zh-CN, Kangkang, Apollo)", "gender": "Male"},"zh-HK, Tracy, Apollo (Female)": {"id": "zh-HK", "name": "Microsoft Server Speech Text to Speech Voice (zh-HK, Tracy, Apollo)", "gender": "Female"},"zh-HK, TracyRUS (Female)": {"id": "zh-HK", "name": "Microsoft Server Speech Text to Speech Voice (zh-HK, TracyRUS)", "gender": "Female"},"zh-HK, Danny, Apollo (Male)": {"id": "zh-HK", "name": "Microsoft Server Speech Text to Speech Voice (zh-HK, Danny, Apollo)", "gender": "Male"},"zh-TW, Yating, Apollo (Female)": {"id": "zh-TW", "name": "Microsoft Server Speech Text to Speech Voice (zh-TW, Yating, Apollo)", "gender": "Female"},"zh-TW, HanHanRUS (Female)": {"id": "zh-TW", "name": "Microsoft Server Speech Text to Speech Voice (zh-TW, HanHanRUS)", "gender": "Female"},"zh-TW, Zhiwei, Apollo (Male)": {"id": "zh-TW", "name": "Microsoft Server Speech Text to Speech Voice (zh-TW, Zhiwei, Apollo)", "gender": "Male"}};

  var payload = "<speak version=\"1.0\" xml:lang=\"en-US\"><voice xml:lang=\"" + ttslangs[lang]['id'] + "\" xml:gender=\"" + ttslangs[lang]['gender'] + "\" name=\"" + ttslangs[lang]['name'] + "\">" + text + "</voice></speak>";
  var headers = {
    'Content-Type' : 'application/ssml+xml',
    'X-Microsoft-OutputFormat' : 'audio-16khz-32kbitrate-mono-mp3',
    'Authorization': 'Bearer ' + $('#TTS-access-token').html(),
    'X-Search-AppId': '07D3234E49CE426DAA29772419F436CA',
    'X-Search-ClientID': '1ECFAE91408841A480F00935DC390960',
    // 'User-Agent': 'VRoom'
  };
  var url = 'https://speech.platform.bing.com/synthesize';

  var header;
  var oReq = new XMLHttpRequest();
  oReq.open("POST", url);
  for(header in headers)
    oReq.setRequestHeader(header, headers[header]);


  oReq.responseType = "arraybuffer";

  oReq.onloadend = function() {
    var arrayBuffer = oReq.response;

    var blob = new Blob([arrayBuffer], {type: this.getResponseHeader("Content-type")});
    var url = URL.createObjectURL(blob);

    var audio = new Audio(url);
    audio.onended = function () { URL.revokeObjectURL(url); };
    audio.play()
  };

  oReq.send(payload);
}

function getInLine(key) {
  var output = "TAGS\n";
  for (var i = 0; i<key.length; i++) {
    output+=key[i];
    output+="\n";
  }
  return output;
}

function addPerson() {
}
var TOTAL = -1;


var canvas = document.getElementById("helloWorldCanvas");
  var ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.rect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  ctx.fill();


