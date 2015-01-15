// Shared variables, functions

var userInfo, accessToken, userID, siteUrl;
var emails = [];

chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function(tabs) {
  siteUrl = tabs[0].url;
});

function isValidEmailAddress(emailAddress) {
  var pattern = new RegExp(/^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i);
  return pattern.test(emailAddress);
};

function addEmailToken(emailAddress) {
  emails.push(emailAddress);
  $('#search').before('<li class="token" id="' + emailAddress + '"><div>' + emailAddress + ' <a class="closer email-closer">&times;</a></div></li>' );
  $('#field').val('');
  filter('#field');
};

function pad (str, max) {
  str = str.toString();
  return str.length < max ? pad("0" + str, max) : str;
}





// Send tip

function sendTip(link, id, recIds, recEmails, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "http://www.tipster.to/api/tips", true);
  xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onload = requestComplete;
  xhr.send('{"link":"'+link+'", "user_id":"'+id+'", "recipient_ids":"'+recIds+'", "emails":"'+recEmails+'"}');

  function requestComplete() {
    if (this.status == 401 && retry) {
      retry = false;
      chrome.identity.removeCachedAuthToken({ token: accessToken },
                                            signIn);
    } else {
      onTipSent(null, this.status, this.response);
    }
  }
}

function onTipSent(error, status, response) {
  if (!error) {
    window.close();
  } else {
    // Error handling
  }
}





// Filtering

function filter(element) {
  var value = $(element).val().toLowerCase();

  $("#friend_list > a").each(function() {
    if (this.className.toLowerCase().search(value) > -1) {
        $(this).show();
    }
    else {
        $(this).hide();
    }
  });
}





// Actions on ready

$(document).ready(function () {
  $("#field").keyup(function (e) {
    filter(this);

    var address = $(this).val().slice(0,-1);
    if((e.keyCode == 32 || e.keyCode == 188) && isValidEmailAddress(address)){
      addEmailToken(address)
    }
  });

  $("#field").blur(function () {
    var address = $(this).val().trim();
    if(isValidEmailAddress(address)){
      addEmailToken(address)
    }
  });

  $( '#taggable' ).click(function() {
    $("#field").focus()
  });

  $("#taggable").on( 'click', '.friend-closer', function() {
    var token = $(this).parent().parent()
    var tokenId = token.attr('id')
    token.remove();
    $("a#"+tokenId).removeClass('selected');
    var index = recipients.indexOf(tokenId);
    if (index > -1) {
        recipients.splice(index, 1);
    };
  });

  $("#taggable").on( 'click', '.email-closer', function() {
    var token = $(this).parent().parent()
    var tokenAddress = token.attr('id')
    token.remove();
    var index = emails.indexOf(tokenAddress);
    if (index > -1) {
        emails.splice(index, 1);
    };
  });

  $("#menubar").on( 'click', '.tip-alert', function() {
    window.open('http://www.tipster.to/visit_link/' + userInfo.tips[0].id);
    if (userInfo.tipsCount > 1) {
      chrome.browserAction.setBadgeText({text: '' + (userInfo.tipsCount - 1)});
    } else {
      chrome.browserAction.setBadgeText({text: ''});
    }
  });
});





// Actions on load: Authenticate, get and display user info, display UI

var userLoader = (function() {
  var spinner;

  function signIn(callback) {
    chrome.identity.launchWebAuthFlow(
      { 'url': 'http://www.tipster.to/oauth/authorize?response_type=token&client_id=0bebcdc1239a035a8cddc2bb0133dca6a1057db3c4ee08948c43c5b7f6f22cdf&redirect_uri=https://'+chrome.runtime.id+'.chromiumapp.org/oce', 'interactive': true }, 
      function(redirect) {
        if (chrome.runtime.lastError) {
          // Error handling?
          console.error(chrome.runtime.lastError);
        } else {
          accessToken = redirect.split('access_token=')[1].split('&token_type')[0];
          var tokenPacket = { token: accessToken, setat: +new Date };
          chrome.storage.local.set({'packet': tokenPacket}, null);
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
                                              signIn);
      } else {
        callback(null, this.status, this.response);
      }
    }
  }



  function getInfo() {
    chrome.storage.local.get('packet', function (result) {
      if (result.packet) {
        accessToken = result.packet.token
        xhrWithAuth('GET',
                    'http://www.tipster.to/api/friends',
                    onInfoFetched);
      } else {
        signIn(getInfo);
      }
    });
  }

  function onInfoFetched(error, status, response) {
    if (!error && status == 200) {
      userInfo = JSON.parse(response);
      userID = userInfo.uID
      showUser();
      listFriends();
      updateCount();
    } else if (status == 500) {
      $('#friend_list').append("We're knocking, no one's home. Did you log out of Tipster?");
    } else {
      $('#friend_list').append("Fail.");
    }

    function showUser() {
      if (userInfo.uAvatar) {
        $('#menubar').append('<img class="avatar" src="http://s3.amazonaws.com/rmxo-tipster/users/avatars/000/000/' + pad (userInfo.uID, 3) + '/thumb/' + userInfo.uAvatar + '" width="27" height="27" alt="' + userInfo.uName + '" title="' + userInfo.uname + '" />' );
      }
      if (userInfo.tips.length > 0) {
        $('#menubar').append('<a class="nav-alert tip-alert">New tip from '+userInfo.tips[0].sender+'!</a>' );
      }
    }




    function listFriends() {
      var recipients = []

      // Removed elements
      spinner.stop();

      // New elements
      $('#friend_list').append('<div class="friend_placeholder place-1"></div><div class="friend_placeholder place-2"></div><div class="friend_placeholder place-3"></div><div class="friend_placeholder place-4"></div><div class="friend_placeholder place-5"></div><div class="friend_placeholder place-6"></div><div class="friend_placeholder place-7"></div><div class="friend_placeholder place-8"></div>' );

      for( var i = 0; i < userInfo.friends.length; i++ ){
            if (userInfo.friends[i].avatar) {
              $('#friend_list').append('<a class="' + userInfo.friends[i].fullName + ' friend_thumb ' + userInfo.friends[i].email + '" id="' + userInfo.friends[i].id + '"><img src="http://s3.amazonaws.com/rmxo-tipster/users/avatars/000/000/' + pad (userInfo.friends[i].id, 3) + '/small/' + userInfo.friends[i].avatar + '" width="85" height="85" alt="' + userInfo.friends[i].fullName + '" title="' + userInfo.friends[i].fullName + '" /></a>' );
            } else {
              $('#friend_list').append('<a class="' + userInfo.friends[i].fullName + ' friend_thumb ' + userInfo.friends[i].email + '" id="' + userInfo.friends[i].id + '"><img src="img/missing.png" width="85" height="85" alt="' + userInfo.friends[i].fullName + '" title="' + userInfo.friends[i].fullName + '" /></a>' );
            }
      };
      $('#taggable,#actions').show();
      $("#field").focus()

      // Click handlers on new elements
      $( '.friend_thumb' ).click(function() {
        var $$ = $(this)
        var recName = $$.attr('class').split(' friend_thumb')[0]

        if( !$$.is('.selected')){
          $$.addClass('selected');
          // Add recipient to hash
          recipients.push(this.id);
          // Add token
          $('#search').before('<li class="token" id="' + this.id + '"><div>' + recName + ' <a class="closer friend-closer">&times;</a></div></li>' );
          $('#field').val('');
          filter('#field');
        } else {
          $$.removeClass('selected');
          // Remove recipient from hash
          var index = recipients.indexOf(this.id);
          if (index > -1) {
              recipients.splice(index, 1);
          }
          // Remove token
          $('li[id="'+this.id+'"]').remove();
        }

        $("#field").focus()
      });

      $( '#send_button' ).click(function() {
        sendTip(siteUrl,
          userID,
          recipients.join(","),
          emails.join(","));
        this.innerHTML = 'Sending<span>...</span>';
      });
    }


    function updateCount() {
      var cba = chrome.browserAction;

      if (userInfo.tipsCount > 0) {
        cba.setBadgeBackgroundColor({color: '#ff6600'});
        cba.setBadgeText({text: '' + userInfo.tipsCount});
      } else {
        cba.setBadgeText({text: ''});
      }
    }
  }


  function loadSpinner() {
    var opts = {
      lines: 11, // The number of lines to draw
      length: 5, // The length of each line
      width: 2, // The line thickness
      radius: 5, // The radius of the inner circle
      corners: 1, // Corner roundness (0..1)
      className: 'spinner', // The CSS class to assign to the spinner
      top: '65%', // Top position relative to parent
      left: '50%' // Left position relative to parent
    };
    var target = document.getElementById('friend_list');
    spinner = new Spinner(opts).spin(target);
  }


  return {
    onload: function () {
      loadSpinner();
      getInfo();
    }
  };

})();

window.onload = userLoader.onload;