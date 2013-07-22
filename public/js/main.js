(function() {
  var SHIVA_URL,
    __slice = [].slice;

  SHIVA_URL = 'http://localhost:9002';

  require.config({
    paths: {
      underscore: '../components/underscore/underscore',
      backbone: '../components/backbone/backbone',
      jquery: '../components/jquery/jquery.min',
      localstorage: "../components/backbone.localStorage/backbone.localStorage",
      deepmodel: "../components/backbone-deep-model/distribution/deep-model.min",
      moment: "../components/moment/min/moment.min"
    },
    shim: {
      underscore: {
        exports: '_'
      },
      backbone: {
        deps: ['underscore', 'jquery'],
        exports: 'Backbone'
      },
      deepmodel: {
        deps: ['underscore']
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

    window.p = function(text) {
      return console.log(text);
    };
    return window.notify = function() {
      var args, _ref;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (_ref = $("#jGrowl-container")).jGrowl.apply(_ref, args);
    };
  });

  require(['wavesurfer', 'webaudio', 'collection'], function(WaveSurfer, WebAudio, Tracks) {
    window.wavesurfer = new WaveSurfer({
      canvas: document.querySelector('#visualization'),
      backend: new WebAudio()
    });
    document.addEventListener("click", function(e) {
      var action;
      action = e.target.dataset && e.target.dataset.action;
      if (action && action in eventHandlers) {
        return eventHandlers[action](e);
      }
    });
    return library.change_track(1269);
  });

}).call(this);
