var accessToken, tokenSet, incomingTips;

chrome.storage.local.get('packet', function (result) {
	accessToken = result.packet.token;
	tokenSet = new Date(parseInt(result.packet.setat));
	checkTips();
});


function checkTips() {
  var currentTime = new Date();
  var diffHours = (currentTime - tokenSet) / (1000*60*60);

  if (diffHours < 23.99) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET','http://localhost:3000/api/tips');
    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
    xhr.onload = requestComplete;
    xhr.send();

    function requestComplete() {
      if (this.status == 200) {
      	incomingTips = JSON.parse(this.response);
      	console.dir('successful request')
      	console.dir(incomingTips)
      } else {
      	console.dir('failed request, status: ' + this.status)
      }
    }

  } else {
		// Get new token and run checktips again
		console.dir('no token, need new. token set at ' + tokenSet)
  };
};


var opt = {
  type: "basic",
  title: "New tip from someone!",
  message: "Someone has sent you a new tip. Click here to check it out!",
  iconUrl: "img/icon48.png",
  isClickable: true
};

chrome.notifications.create("", opt, function(id) {
	if (chrome.runtime.lastError) {
   console.error(chrome.runtime.lastError);
	}

	chrome.notifications.onClicked.addListener(function() {
		window.open("http://google.com");
	});
});
