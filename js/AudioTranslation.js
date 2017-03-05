//Set default settings
var sourceLang = "en";
var sourceLangName = "English";
var targetLang = "hi";
var targetLangName = "Italian";
var partialFrequency = 2;
var profanityFilter = "on";
var textSize = "small";

var activeTabId = "";

var _errFunction = console.error;

//State variables
var INITIAL_VALUE = -1;
var ongoingsubtitling = false;
var partialFlag = false;

//Connection variables
var mediaRecorder = null;
var stream = null;
var ws = null;
var resultsCB = null;

// feature detection 
if (!navigator.getUserMedia)
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia || navigator.msGetUserMedia;


//Open websocket with URL, set appropriate event listeners and feed in data stream
function ConnectWithTranslatorServer(lang1, lang2, accToken) {
  console.debug("Connecting with service...");

  try {

    //Setup connections
    mediaRecorder = new MediaStreamRecorder(stream);
    mediaRecorder.mimeType = 'audio/wav';
    mediaRecorder.audioChannels = 2;
    console.debug("Created media recorder");

    //Turn profanity on / off based on user selection
    var profanity = "";
    if (profanityFilter == "on") {
      profanity = "Marked";
    } else {
      profanity = "NoAction";
    }

    var ws_url = "wss://dev.microsofttranslator.com/speech/translate?api-version=1.0&from=" + lang1 + "&to=" + lang2 + "&profanityaction=" + profanity + "&access_token=" + encodeURIComponent(accToken);
    // Add this to get partial results: &features=partial 

    ws = new WebSocket(ws_url);
    console.debug("Created websocket");

    ws.onopen = function () {
      mediaRecorder.start(200);
    }

    ws.onclose = function (event) {
      console.error('web socket closed' + JSON.stringify(event));
    }

    ws.onerror = function (event) {
      console.log(event)
      alert('exDescription: Code: ' + event.code + ' Reason: ' + event.reason);
      displayError(5);
    }
    console.debug("Setup websocket callbacks");


  } catch (error) {
    console.error("Error when opening session: " + error);
    CloseSession();
  }
}

//Clean up session in terms of UI, state and connections
function StopSession() {
  TerminateConnections(true);
}

function TerminateConnections(closeStream) {

  if (closeStream) {
    if (stream) {
      stream = null;
    }
    else
      console.error("Stream not set");
  }

  mediaRecorder ? mediaRecorder.stop() : console.error("No mediaRecorder");

  ws ? ws.close() : console.error("No websocket");
  ws = null;

  console.debug("Terminated connections");
}



function StartAudioTransSession(strm, rCB) {
  resultsCB = rCB;
  stream = strm;
  if (stream)
    {
      console.debug("Starting session...");
      //Update state
      ongoingsubtitling = true;
      GenerateToken(SetupWebConnection.bind(this, rCB));

    } else {
      console.error("stream is null");
      displayError(8);
    }

}

function GenerateToken(callbackIfSuccessfulToken) {
  var accToken = "";

  var xhttp = new XMLHttpRequest();
  // *** USE YOUR OWN SERVER TO RETURN A VALID ADM TOKEN ***
  // We suggest using a session cookie for a minimal validation that request for token is coming from your own client app
  // For commercial apps, you may want to protect the call to get a token behind your own user authentication.
  xhttp.open("GET", "/token", true);

  xhttp.onreadystatechange = function () {
    if (xhttp.readyState == 4 && xhttp.status == 200) {
      accToken = xhttp.responseText;

      console.debug("Token: " + accToken);
      if (typeof callbackIfSuccessfulToken === 'function')
        callbackIfSuccessfulToken(accToken);
      else
        console.error("callbackIfSuccessfulToken is not a function");
    }
  }

  xhttp.send();

}

function SetupWebConnection(resultsCB, accToken) {
  console.debug("Setting up connection for valid ADM token...");
  ConnectWithTranslatorServer(sourceLang, targetLang, accToken);
  var firstTranslation = true;

  //Handle messages
  ws.onmessage = function (event) {
    console.debug('received event from socket.');
    var response = JSON.parse(event.data);
    console.debug(response);

    if (firstTranslation) {
      firstTranslation = false;
    }

    //Separating out the Partials frequency 
    if (partialFrequency == "0") {
      if (response.type == "final") {
        resultsCB(response.recognition, response.translation);
      }

    }
    else if (partialFrequency == "1") {
      if (response.type == "final" || partialFlag == true) {

        resultsCB(response.recognition, response.translation);

        if (response.type == "partial") partialFlag = false;
      }
      else if (partialFlag == false) {
        partialFlag = true;
      }
    }
    else {
      resultsCB(response.recognition, response.translation);
    }
  }

  mediaRecorder.ondataavailable = function (blob) {
    if (stream && ws && ws.readyState === ws.CLOSED) {
      ws = null;
      SetupWebConnection(resultsCB, accToken);
      return;
    }

    if (ws && ws.readyState === ws.OPEN) {
      ws.send(blob);
    }
  };
}



function convertToArray(langArray) {
  var arr = Object.keys(langArray).map(function (k) { let obj = langArray[k]; obj.key = k; return obj; });
  return arr;
}

function findMatch(userLang, langArray) {
  for (var i = 0; i < langArray.length; i++) {
    if (userLang == langArray[i].key.substring(0, 2)) {
      return langArray[i];
    }
  }
  return false;
}

//This function is called on page load
//The purpose of this function is to enumerate all speech recognition and translation languages
function getLang() {
  var langURL = "https://dev.microsofttranslator.com/languages?scope=speech,text&api-version=1.0";

  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
      var results = JSON.parse(xmlhttp.responseText);
      var sourceLangArray = convertToArray(results.speech);
      var targetLangArray = convertToArray(results.text);
      var userLang = (navigator.language).substring(0, 2);
      var match1 = findMatch(userLang, sourceLangArray);
      if (match1) {
        sourceLang = match1.key;
        sourceLangName = match1.name;
      }
      var match2 = findMatch(userLang, targetLangArray);
      if (match2) {
        targetLang = match2.key;
        targetLangName = match2.name;
      }

      //save the languages
      chrome.storage.local.set({ 'sourceLanguage': sourceLang, 'targetLanguage': targetLang, 'sourceLanguageName': sourceLangName, 'targetLanguageName': targetLangName }, function () {
        if (chrome.runtime.lastError) {
          Logger.error("Failed to save the selected options at runtime", chrome.runtime.lastError);
        }
      });
      console.log({ 'sourceLanguage': sourceLang, 'targetLanguage': targetLang, 'sourceLanguageName': sourceLangName, 'targetLanguageName': targetLangName });
    }
  }
  xmlhttp.open("GET", langURL, true);
  xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xmlhttp.send();
}


//The purpose of this function is to display an error to the user based on the scenario
function displayError(errorCode) {

  var messageText = "";
  var messageString = "";
  var debuggingString = "";
  var icon = "";

  switch (errorCode) {
    case 1: {
      messageText = "Listening";
      messageString = "Streaming audio and waiting for subtitles.";
      icon = "listen";
      break;
    }
  case 5: {
    messageText = "Oops";
    messageString = "The subtitling service is temporarily unavailable. Please try again later.";
    icon = "error";
    break;
  }

case 9: {
  messageText = "Oops";
  messageString = "Looks like the service is overloaded. Please try again later.";
  icon = "error";
  break;
}
        case 10: {
          messageText = "Oops";
          messageString = "The subtitling service is temporarily unavailable. Please try again later.";
          debuggingString = "Azure service didn't give us a token";
          icon = "error";
          break;
        }

      default: {
        messageText = "Oops...";
        messageString = "Something went wrong. Please try later.";
        icon = "error";
        break;
      }

  }

  console.error(debuggingString, messageText, messageString);

}

