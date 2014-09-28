'use strict';

var siteUrl

chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function(tabs) {
  siteUrl = tabs[0].url;
  console.dir(siteUrl)
});

$(function() {
});