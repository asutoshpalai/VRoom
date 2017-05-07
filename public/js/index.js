var latency = 0

window.addEventListener("deviceorientation", handleMotion, true);
function handleMotion(event) {
	latency++;
	if(!event.alpha) {
		return;
	}
	var alpha = event.alpha;
	var gamma = event.gamma;
	if(event.gamma >0) {
		alpha += 180;
		gamma*=-1;
		gamma+=90;
	} else if (event.gamma < 0 ) {
		gamma*=-1;
		gamma-=90;
	}
	var rot = gamma + " " + alpha + " " + 0;
	document.getElementById(socket.id).setAttribute("rotation", rot );
	if(latency%100==0) {
		document.getElementById("Text").setAttribute("text-geometry", "value:  ->  " + parseInt(alpha) + " " + parseInt(event.beta) + " " + parseInt(event.gamma));
	}
	if(latency%4==0) {
		socket.emit("data", {"rotation" : rot, "id" :ID} );
	}
	latency %= 100;
}
