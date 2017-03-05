(function() {

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
// we have to wait until it's ready
webrtc.on('readyToCall', function () {
    // you can name it anything
    webrtc.joinRoom('arpitsing');

});

webrtc.on('videoAdded', function(videoEl, peer) {
  var video = document.getElementById('penguin-sledding');
  video.src = window.URL.createObjectURL(peer.stream);
  video.play();
  StartAudioTransSession(peer.stream, handleSubs);
  videoEl.display = null;
});


webrtc.on('createdPeer', function(peer){
  var pnick = peer.parent.config.nick;
  if(pnick === 'streamer') {
    // Broadcaster
    return;
  }
  console.log(pnick + " joined the class");
});

function handleSubs(recognition, translation) {
  document.getElementById("subs").setAttribute("text", "color: white; align: center; value: "+recognition);
  document.getElementById("subsInHindi").setAttribute("text", "color: white; align: center; value: "+(decodeURIComponent(translation)));

  console.log(arguments);
}
})();
