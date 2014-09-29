'use strict';

// Shared functions

var userInfo, accessToken, userID, siteUrl;

// Authenticate and get user info

var userLoader = (function() {
  var spinner;

  function interactiveSignIn(callback) {
    chrome.identity.launchWebAuthFlow(
      { 'url': 'http://localhost:3000/oauth/authorize?response_type=token&client_id=1a5486719de2be85b1e98f4016131b89055616e1f352fff8bd9710f8b67bc031&redirect_uri=https://hngjgjponalciaofpdggekmlholcleok.chromiumapp.org/oce', 'interactive': true }, 
      function(redirect) {
        if (chrome.runtime.lastError) {

        } else {
          var token = redirect.split('access_token=')[1].split('&token_type')[0];
          accessToken = token;
          callback();
        }
      }
    );
  }



  function xhrWithAuth(method, url, callback) {
    var retry = true;
    requestStart();

    function requestStart() {
      var xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
      xhr.onload = requestComplete;
      xhr.send();
    }

    function requestComplete() {
      if (this.status == 401 && retry) {
        retry = false;
        chrome.identity.removeCachedAuthToken({ token: accessToken },
                                              interactiveSignIn);
      } else {
        callback(null, this.status, this.response);
      }
    }
  }



  function getInfo() {
    xhrWithAuth('GET',
                'http://localhost:3000/api/friends',
                onInfoFetched);
  }


  function onInfoFetched(error, status, response) {
    if (!error && status == 200) {
      userInfo = JSON.parse(response);
      userID = userInfo.uID
      // console.dir(response)
      showUser();
      listFriends();
    } else if (status == 500) {
      $('#friend_list').append("We're knocking, no one's home. Did you log out of Tipster?");
    } else {
      $('#friend_list').append("Fail.");
    }

    function showUser() {
      $('#menubar').append('<img class="avatar" src="http://localhost:3000/system/users/avatars/000/000/' + pad (userInfo.uID, 3) + '/thumb/' + userInfo.uAvatar + '" width="27" height="27" alt="' + userInfo.uName + '" title="' + userInfo.uname + '" />' );
    }

    function listFriends() {
      for( var i = 0; i < userInfo.friends.length; i++ ){
        $('#friend_list').append('<img src="http://localhost:3000/system/users/avatars/000/000/' + pad (userInfo.friends[i].id, 3) + '/small/' + userInfo.friends[i].avatar + '" width="85" height="85" alt="' + userInfo.friends[i].fullName + '" title="' + userInfo.friends[i].fullName + '" />' );
      };
      spinner.stop();
    }
  }


  // Event handlers
  return {
    onload: function () {
      runSpinner();
      interactiveSignIn(function() {
        getInfo();
      });
    }
  };



  // Misc useful functions
  function pad (str, max) {
    str = str.toString();
    return str.length < max ? pad("0" + str, max) : str;
  }

  function runSpinner() {
    var opts = {
      lines: 11, // The number of lines to draw
      length: 5, // The length of each line
      width: 2, // The line thickness
      radius: 5, // The radius of the inner circle
      corners: 1, // Corner roundness (0..1)
      rotate: 0, // The rotation offset
      direction: 1, // 1: clockwise, -1: counterclockwise
      color: '#000', // #rgb or #rrggbb or array of colors
      speed: 1, // Rounds per second
      trail: 60, // Afterglow percentage
      shadow: false, // Whether to render a shadow
      hwaccel: false, // Whether to use hardware acceleration
      className: 'spinner', // The CSS class to assign to the spinner
      zIndex: 2e9, // The z-index (defaults to 2000000000)
      top: '70%', // Top position relative to parent
      left: '50%' // Left position relative to parent
    };
    var target = document.getElementById('friend_list');
    spinner = new Spinner(opts).spin(target);
  }
})();

window.onload = userLoader.onload;



// Send tip

chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function(tabs) {
  siteUrl = tabs[0].url;
});

function tipRequest(link, id) {
  console.dir('request start')
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "http://localhost:3000/api/tips", true);
  xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
  xhr.onload = requestComplete;
  // Form data method
  /// var formData = new FormData();
  /// formData.append('user_id', id);
  /// formData.append('link', link);
  /// xhr.send(formData);
  // JSON request
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send('{"link":"'+link+'", "user_id":"'+id+'"}');

  function requestComplete() {
    if (this.status == 401 && retry) {
      retry = false;
      chrome.identity.removeCachedAuthToken({ token: accessToken },
                                            interactiveSignIn);
    } else {
      onTipSent(null, this.status, this.response);
    }
  }
}

function onTipSent(error, status, response) {
  if (!error && status == 200) {
    console.dir(response)
  } else if (status == 500) {
    console.dir(response)
  } else {
    console.dir(response)
  }
}

function sendTip() {
  tipRequest(siteUrl,
             userID);
}



// Run after 5 seconds
$(function() {
      setTimeout(function () {
        sendTip();
    }, 5000);
});


