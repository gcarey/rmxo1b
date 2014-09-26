'use strict';

var userLoader = (function() {
  var access_token;

  function interactiveSignIn(callback) {
    chrome.identity.launchWebAuthFlow(
      { 'url': 'http://localhost:3000/oauth/authorize?response_type=token&client_id=1a5486719de2be85b1e98f4016131b89055616e1f352fff8bd9710f8b67bc031&redirect_uri=https://chjcklfhnjjooakmhbjaffpfoaddalje.chromiumapp.org/oce', 'interactive': true }, 
      function(redirect) {
        if (chrome.runtime.lastError) {

        } else {
          var token = redirect.split('access_token=')[1].split('&token_type')[0];
          access_token = token;
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
      xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
      xhr.onload = requestComplete;
      xhr.send();
    }

    function requestComplete() {
      if (this.status == 401 && retry) {
        retry = false;
        chrome.identity.removeCachedAuthToken({ token: access_token },
                                              getToken);
      } else {
        callback(null, this.status, this.response);
      }
    }
  }



  function getFriends() {
    xhrWithAuth('GET',
                  'http://localhost:3000/api/friends',
                  onFriendsFetched);
  }


  function onFriendsFetched(error, status, response) {
    if (!error && status == 200) {
      var friend_list = JSON.parse(response);
      console.dir(response);
      listFriends();
    } else if (status == 500) {
      $('#friend_list').append("We're knocking, no one's home. Did you log out of Tipster?");
    } else {
      $('#friend_list').append("Fail.");
    }

    function listFriends() {
      for( var i = 0; i < friend_list.friends.length; i++ ){
        $('#friend_list').append('<img src="http://localhost:3000/system/users/avatars/000/000/' + pad (friend_list.friends[i].id, 3) + '/small/' + friend_list.friends[i].avatar + '" width="85" height="85" alt="' + friend_list.friends[i].fullName + '" title="' + friend_list.friends[i].fullName + '" />' );
      };
    }
  }



  // OnClick event handlers for the buttons.
  return {
    onload: function () {
      interactiveSignIn(function() {
        getFriends();
      });
    }
  };



  // Misc useful functions
  function pad (str, max) {
    str = str.toString();
    return str.length < max ? pad("0" + str, max) : str;
  }

})();

window.onload = userLoader.onload;