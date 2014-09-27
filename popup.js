'use strict';

var siteUrl

chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function(tabs) {
  console.dir(tabs)
  siteUrl = tabs[0].url;
  console.dir(tabs[0].url)
});

$(function() {
});