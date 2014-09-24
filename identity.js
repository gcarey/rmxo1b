'use strict';

var googlePlusUserLoader = (function() {

  var STATE_START=1;
  var STATE_ACQUIRING_AUTHTOKEN=2;
  var STATE_AUTHTOKEN_ACQUIRED=3;

  var state = STATE_START;

  var signin_button, friends_button, friend_list_div;

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

  function xhrForFriends(method, url, callback) {
    requestStart();

    var retry = true;

    function requestStart() {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'http://localhost:3000/api/friends');
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
    xhrForFriends('GET',
                  'http://localhost:3000/api/friends',
                  onFriendsFetched);
  }


  function onFriendsFetched(error, status, response) {
    if (!error && status == 200) {
      changeState(STATE_AUTHTOKEN_ACQUIRED);
      var friend_list = JSON.parse(response);
      friend_list_div.innerHTML = "Win";
    } else {
      friend_list_div.innerHTML = "Fail";
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

    // @corecode_begin getAuthToken
    // @description This is the normal flow for authentication/authorization
    // on Google properties. You need to add the oauth2 client_id and scopes
    // to the app manifest. The interactive param indicates if a new window
    // will be opened when the user is not yet authenticated or not.
    // @see http://developer.chrome.com/apps/app_identity.html
    // @see http://developer.chrome.com/apps/identity.html#method-getAuthToken
    chrome.identity.launchWebAuthFlow(
      { 'url': 'http://localhost:3000/oauth/authorize?\
response_type=token&client_id=70106b1be6ce21cdfd9f36a481a613792f89cf76b087baf48f0be2487fa3603e&redirect_uri=https://chjcklfhnjjooakmhbjaffpfoaddalje.chromiumapp.org/oce', 'interactive': true }, function(token) {
        if (chrome.runtime.lastError) {
          changeState(STATE_START);
        } else {
          changeState(STATE_AUTHTOKEN_ACQUIRED);
        }
    });
    // @corecode_end getAuthToken
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

window.onload = googlePlusUserLoader.onload;