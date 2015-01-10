var accessToken, incoming, sentryOn;

chrome.storage.local.get('packet', function (result) {
	accessToken = result.packet.token;
  sentryOn = setInterval(checkTips, 30000)
});


function checkTips() {

  if (accessToken.length > 0) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET','http://www.tipster.to/api/tips');
    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
    xhr.onload = requestComplete;
    xhr.send();

    function requestComplete() {
      incoming = JSON.parse(this.response);
      var cba = chrome.browserAction;

      if (incoming.count > 0) {
        cba.setBadgeBackgroundColor({color: '#ff6600'});
        cba.setBadgeText({text: '' + incoming.count});
      } else {
        cba.setBadgeText({text: ''});
      }

      if (this.status == 200 && incoming.tips[0]) {
        var opt = {
          type: "basic",
          title: "New tip from " + incoming.tips[0].sender + "!",
          message: incoming.tips[0].sender + " has sent you a new tip. Click here to check it out!",
          iconUrl: "img/icon48.png",
          isClickable: true
        };

        chrome.notifications.create("", opt, function(id) {
          var xhr = new XMLHttpRequest();
          xhr.open('PUT','http://www.tipster.to/api/shares/' + incoming.tips[0].shareId + '/serve');
          xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
          xhr.send();

          chrome.notifications.onClicked.addListener(function() {
            window.open('http://www.tipster.to/visit_link/' + incoming.tips[0].id);
            if (incoming.count > 1) {
              cba.setBadgeText({text: '' + (incoming.count - 1)});
            } else {
              cba.setBadgeText({text: ''});
            }
          });
        });
      }
    }
  } else {
		// Get new token and run checktips again
    chrome.identity.launchWebAuthFlow(
      { 'url': 'http://www.tipster.to/oauth/authorize?response_type=token&client_id=0bebcdc1239a035a8cddc2bb0133dca6a1057db3c4ee08948c43c5b7f6f22cdf&redirect_uri=https://'+chrome.runtime.id+'.chromiumapp.org/oce', 'interactive': false }, 
      function(redirect) {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          clearInterval(sentryOn);
        } else {
          accessToken = redirect.split('access_token=')[1].split('&token_type')[0];
          var tokenPacket = { token: accessToken, setat: +new Date };
          chrome.storage.local.set({'packet': tokenPacket}, null);
          checkTips();
        }
      }
    );
  };
};
