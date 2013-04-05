(function() {
  var __slice = [].slice;

  require.config({
    paths: {
      underscore: 'components/underscore/underscore',
      backbone: 'components/backbone/backbone',
      jquery: 'components/jquery/jquery.min',
      localstorage: "components/backbone.localStorage/backbone.localStorage"
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

  require(['jquery', 'structure', 'tipsy', 'jgrowl'], function($, App) {
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

}).call(this);
