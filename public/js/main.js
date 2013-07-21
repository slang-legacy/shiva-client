(function() {
  var __slice = [].slice;

  require.config({
    paths: {
      underscore: '../components/underscore/underscore',
      backbone: '../components/backbone/backbone',
      jquery: '../components/jquery/jquery.min',
      localstorage: "../components/backbone.localStorage/backbone.localStorage"
    },
    shim: {
      underscore: {
        exports: '_'
      },
      backbone: {
        deps: ['underscore', 'jquery'],
        exports: 'Backbone'
      },
      tipsy: ['jquery'],
      jgrowl: ['jquery']
    }
  });

  require(['jquery', 'wavesurfer', 'tipsy', 'jgrowl'], function($, WaveSurfer) {
    /*
    	if ("geolocation" in navigator)
    		navigator.geolocation.getCurrentPosition((position) ->
    			Shiva.geolocation = position.coords
    		)
    */

    var notify, p;
    p = function(text) {
      return console.log(text);
    };
    notify = function() {
      var args, _ref;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (_ref = $("#jGrowl-container")).jGrowl.apply(_ref, args);
    };
    return window.onerror = function(msg, url, line) {
      notify("errorMsg: " + msg + " on line " + line, {
        theme: 'error',
        sticky: true
      });
      return false;
    };
  });

  require(['wavesurfer', 'webaudio'], function(WaveSurfer, WebAudio) {
    window.wavesurfer = new WaveSurfer({
      canvas: document.querySelector('#visualization'),
      backend: new WebAudio()
    });
    wavesurfer.load('test-audio/test.mp3');
    wavesurfer.playAt(0);
    return document.addEventListener("click", function(e) {
      var action;
      action = e.target.dataset && e.target.dataset.action;
      if (action && action in eventHandlers) {
        return eventHandlers[action](e);
      }
    });
  });

}).call(this);
