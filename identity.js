'use strict';

var userLoader = (function() {

  var STATE_START=1;
  var STATE_ACQUIRING_AUTHTOKEN=2;
  var STATE_AUTHTOKEN_ACQUIRED=3;

  var state = STATE_START;

  var signin_button, friends_button, friend_list_div, access_token;

 function disableButton(button) {
    button.setAttribute('disabled', 'disabled');
  }

  function enableButton(button) {
    button.removeAttribute('disabled');
  }

  function changeState(newState) {
    state = newState;
    switch (state) {
      case STATE_START:
        enableButton(signin_button);
        disableButton(friends_button);
        break;
      case STATE_ACQUIRING_AUTHTOKEN:
        disableButton(signin_button);
        disableButton(friends_button);
        break;
      case STATE_AUTHTOKEN_ACQUIRED:
        disableButton(signin_button);
        enableButton(friends_button);
        break;
    }
  }

  // @corecode_begin getProtectedData

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
      changeState(STATE_AUTHTOKEN_ACQUIRED);
      var friend_list = JSON.parse(response);
      listFriends()
      console.dir(friend_list);
    } else {
      friend_list_div.innerHTML = "Fail";
    }

    function listFriends() {
      for( var i = 0; i < friend_list.friends.length; i++ ){
        var element = document.createElement("div");
        element.appendChild(document.createTextNode(friend_list.friends[i].firstName));
        document.getElementById('friend_list').appendChild(element);
      };
    }
  }

  // @corecode_end getProtectedData

  // OnClick event handlers for the buttons.

  /**
    Retrieves a valid token. Since this is initiated by the user
    clicking in the Sign In button, we want it to be interactive -
    ie, when no token is found, the auth window is presented to the user.

    Observe that the token does not need to be cached by the app.
    Chrome caches tokens and takes care of renewing when it is expired.
    In that sense, getAuthToken only goes to the server if there is
    no cached token or if it is expired. If you want to force a new
    token (for example when user changes the password on the service)
    you need to call removeCachedAuthToken()
  **/
  function interactiveSignIn() {
    changeState(STATE_ACQUIRING_AUTHTOKEN);

    chrome.identity.launchWebAuthFlow(
      { 'url': 'http://localhost:3000/oauth/authorize?response_type=token&client_id=70106b1be6ce21cdfd9f36a481a613792f89cf76b087baf48f0be2487fa3603e&redirect_uri=https://chjcklfhnjjooakmhbjaffpfoaddalje.chromiumapp.org/oce', 'interactive': true }, 
      function(redirect) {
        if (chrome.runtime.lastError) {
          changeState(STATE_START);
        } else {
          changeState(STATE_AUTHTOKEN_ACQUIRED);
        }

        var token = redirect.split('access_token=')[1].split('&token_type')[0];
        access_token = token;
      }
    );
  }


  return {
    onload: function () {
      signin_button = document.querySelector('#signin');
      signin_button.addEventListener('click', interactiveSignIn);

      friends_button = document.querySelector('#friends');
      friends_button.addEventListener('click', getFriends.bind(friends_button, true));

      friend_list_div = document.querySelector('#friend_list');

      interactiveSignIn(true);
    }
  };

})();

window.onload = userLoader.onload;