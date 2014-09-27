'use strict';
var user_info

var userLoader = (function() {
  var access_token, spinner;

  function interactiveSignIn(callback) {
    chrome.identity.launchWebAuthFlow(
      { 'url': 'http://localhost:3000/oauth/authorize?response_type=token&client_id=1a5486719de2be85b1e98f4016131b89055616e1f352fff8bd9710f8b67bc031&redirect_uri=https://hngjgjponalciaofpdggekmlholcleok.chromiumapp.org/oce', 'interactive': true }, 
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



  function getInfo() {
    xhrWithAuth('GET',
                  'http://localhost:3000/api/friends',
                  onInfoFetched);
  }


  function onInfoFetched(error, status, response) {
    if (!error && status == 200) {
      user_info = JSON.parse(response);
      // console.dir(response)
      showUser();
      listFriends();
    } else if (status == 500) {
      $('#friend_list').append("We're knocking, no one's home. Did you log out of Tipster?");
    } else {
      $('#friend_list').append("Fail.");
    }

    function showUser() {
      $('#menubar').append('<img class="avatar" src="http://localhost:3000/system/users/avatars/000/000/' + pad (user_info.uId, 3) + '/thumb/' + user_info.uAvatar + '" width="27" height="27" alt="' + user_info.uName + '" title="' + user_info.uname + '" />' );
    }

    function listFriends() {
      for( var i = 0; i < user_info.friends.length; i++ ){
        $('#friend_list').append('<img src="http://localhost:3000/system/users/avatars/000/000/' + pad (user_info.friends[i].id, 3) + '/small/' + user_info.friends[i].avatar + '" width="85" height="85" alt="' + user_info.friends[i].fullName + '" title="' + user_info.friends[i].fullName + '" />' );
      };
      spinner.stop();
    }
  }



  // OnClick event handlers for the buttons.
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
      top: '50%', // Top position relative to parent
      left: '50%' // Left position relative to parent
    };
    var target = document.getElementById('friend_list');
    spinner = new Spinner(opts).spin(target);
  }

})();

window.onload = userLoader.onload;