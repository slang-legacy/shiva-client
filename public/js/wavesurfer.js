(function() {
  define(['jquery', 'drawer'], function($, Drawer) {
    var WaveSurfer;
    WaveSurfer = (function() {
      function WaveSurfer(options) {
        var defaults,
          _this = this;
        if (options == null) {
          options = {};
        }
        defaults = {
          skipLength: 2,
          backend: void 0,
          canvas: void 0
        };
        $.extend(this, defaults, options);
        this.drawer = new Drawer({
          canvas: this.canvas
        });
        this.backend.bindUpdate(function() {
          return _this.onAudioProcess();
        });
        this.bindClick(this.canvas, function(percents) {
          return _this.playAt(percents);
        });
      }

      WaveSurfer.prototype.onAudioProcess = function() {
        if (!this.backend.isPaused()) {
          return this.drawer.progress(this.backend.getPlayedPercents());
        }
      };

      WaveSurfer.prototype.playAt = function(percents) {
        return this.backend.play(this.backend.getDuration() * percents);
      };

      WaveSurfer.prototype.pause = function() {
        return this.backend.pause();
      };

      WaveSurfer.prototype.playPause = function() {
        if (this.backend.paused) {
          return this.playAt(this.backend.getPlayedPercents() || 0);
        } else {
          return this.pause();
        }
      };

      WaveSurfer.prototype.skipBackward = function(seconds) {
        return this.skip(seconds || -this.skipLength);
      };

      WaveSurfer.prototype.skipForward = function(seconds) {
        return this.skip(seconds || this.skipLength);
      };

      WaveSurfer.prototype.skip = function(offset) {
        var timings;
        timings = this.timings(offset);
        return this.playAt(timings[0] / timings[1]);
      };

      WaveSurfer.prototype.marks = 0;

      WaveSurfer.prototype.mark = function(options) {
        var id, marker, timings;
        options = options || {};
        timings = this.timings(0);
        marker = {
          width: options.width,
          color: options.color,
          percentage: timings[0] / timings[1],
          position: timings[0]
        };
        id = options.id || "_m" + this.marks++;
        this.drawer.markers[id] = marker;
        if (this.backend.paused) {
          this.drawer.redraw();
        }
        return marker;
      };

      WaveSurfer.prototype.timings = function(offset) {
        var duration, position;
        position = this.backend.getCurrentTime() || 0;
        duration = this.backend.getDuration() || 1;
        position = Math.max(0, Math.min(duration, position + offset));
        return [position, duration];
      };

      WaveSurfer.prototype.drawBuffer = function() {
        if (this.backend.currentBuffer) {
          return this.drawer.drawBuffer(this.backend.currentBuffer);
        } else {
          return console.log('error: currentBuffer isn\'t defined');
        }
      };

      /**
      		 * Loads an audio file via XHR.
      		 * @param {[type]} src [description]
      		 * @return {[type]} [description]
      */


      WaveSurfer.prototype.load = function(src) {
        var xhr,
          _this = this;
        xhr = new XMLHttpRequest();
        xhr.responseType = "arraybuffer";
        xhr.addEventListener("progress", (function(e) {
          var percentComplete;
          percentComplete = e.loaded / (e.lengthComputable ? e.total : e.loaded + 1000000);
          return _this.drawer.drawLoading(percentComplete);
        }), false);
        xhr.addEventListener("load", (function(e) {
          _this.drawer.drawLoading(1);
          return _this.backend.loadData(e.target.response, _this.drawBuffer.bind(_this));
        }), false);
        xhr.open("GET", src, true);
        return xhr.send();
      };

      /*
      		Click to seek.
      */


      WaveSurfer.prototype.bindClick = function(element, callback) {
        return element.addEventListener("click", (function(e) {
          var relX;
          relX = e.offsetX;
          if (null === relX) {
            relX = e.layerX;
          }
          return callback(relX / this.clientWidth);
        }), false);
      };

      return WaveSurfer;

    })();
    return WaveSurfer;
  });

}).call(this);
