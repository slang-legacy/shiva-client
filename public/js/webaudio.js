(function() {
  define(['jquery'], function($) {
    var WebAudio;
    WebAudio = (function() {
      WebAudio.prototype.ac = new (window.AudioContext || window.webkitAudioContext);

      /*
      		Initializes the analyser with given params.
      		
      		@param {Object} params
      		@param {String} params.smoothingTimeConstant
      */


      function WebAudio(options) {
        var defaults;
        if (options == null) {
          options = {};
        }
        defaults = {
          fftSize: 1024,
          smoothingTimeConstant: 0.3,
          destination: this.ac.destination
        };
        $.extend(this, defaults, options);
        this.analyser = this.ac.createAnalyser();
        this.analyser.smoothingTimeConstant = this.smoothingTimeConstant;
        this.analyser.fftSize = this.fftSize;
        this.analyser.connect(this.destination);
        this.proc = this.ac.createJavaScriptNode(this.fftSize / 2, 1, 1);
        this.proc.connect(this.destination);
        this.dataArray = new Uint8Array(this.analyser.fftSize);
        this.paused = true;
      }

      WebAudio.prototype.bindUpdate = function(callback) {
        var _this = this;
        return this.proc.onaudioprocess = function() {
          callback();
          if (_this.getPlayedPercents() > 1.0) {
            _this.pause();
            return _this.lastPause = 0;
          }
        };
      };

      WebAudio.prototype.setSource = function(source) {
        this.source && this.source.disconnect();
        this.source = source;
        this.source.connect(this.analyser);
        return this.source.connect(this.proc);
      };

      /*
      		Loads audiobuffer.
      		@param {AudioBuffer} audioData Audio data.
      */


      WebAudio.prototype.loadData = function(audioData, cb) {
        this.pause();
        return this.ac.decodeAudioData(audioData, (function(buffer) {
          this.currentBuffer = buffer;
          this.lastStart = 0;
          this.lastPause = 0;
          this.startTime = null;
          return cb(buffer);
        }), Error);
      };

      WebAudio.prototype.isPaused = function() {
        return this.paused;
      };

      WebAudio.prototype.getDuration = function() {
        return this.currentBuffer && this.currentBuffer.duration;
      };

      /*
      		Plays the loaded audio region.
      		
      		@param {Number} start Start offset in seconds,
      		relative to the beginning of the track.
      		
      		@param {Number} end End offset in seconds,
      		relative to the beginning of the track.
      */


      WebAudio.prototype.play = function(start, end, delay) {
        if (!this.currentBuffer) {
          return;
        }
        this.pause();
        this.setSource(this.ac.createBufferSource());
        this.source.buffer = this.currentBuffer;
        if (null === start) {
          start = this.getCurrentTime();
        }
        if (null === end) {
          end = this.source.buffer.duration;
        }
        if (null === delay) {
          delay = 0;
        }
        this.lastStart = start;
        this.startTime = this.ac.currentTime;
        this.source.noteGrainOn(delay, start, end - start);
        return this.paused = false;
      };

      /*
      		Pauses the loaded audio.
      */


      WebAudio.prototype.pause = function(delay) {
        if (!this.currentBuffer || this.paused) {
          return;
        }
        this.lastPause = this.getCurrentTime();
        this.source.noteOff(delay || 0);
        return this.paused = true;
      };

      WebAudio.prototype.getPlayedPercents = function() {
        return this.getCurrentTime() / this.getDuration();
      };

      WebAudio.prototype.getCurrentTime = function() {
        if (this.isPaused()) {
          return this.lastPause;
        } else {
          return this.lastStart + (this.ac.currentTime - this.startTime);
        }
      };

      /*
      		Returns the real-time waveform data.
      		
      		@return {Uint8Array} The waveform data.
      		Values range from 0 to 255.
      */


      WebAudio.prototype.waveform = function() {
        this.analyser.getByteTimeDomainData(this.dataArray);
        return this.dataArray;
      };

      /*
      		Returns the real-time frequency data.
      		
      		@return {Uint8Array} The frequency data.
      		Values range from 0 to 255.
      */


      WebAudio.prototype.frequency = function() {
        this.analyser.getByteFrequencyData(this.dataArray);
        return this.dataArray;
      };

      return WebAudio;

    })();
    return WebAudio;
  });

}).call(this);
