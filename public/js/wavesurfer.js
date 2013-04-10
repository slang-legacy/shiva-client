(function() {
  define(['jquery', 'backbone'], function($, Backbone) {
    var WaveSurfer;

    WaveSurfer = {
      defaultParams: {
        skipLength: 2
      },
      init: function(params) {
        var backend, my;

        my = this;
        Object.keys(this.defaultParams).forEach(function(key) {
          return my[key] = params[key] || my.defaultParams[key];
        });
        if (params.audio) {
          backend = WaveSurfer.Audio;
        } else {
          backend = WaveSurfer.WebAudio;
        }
        this.backend = Object.create(backend);
        this.backend.init(params);
        this.drawer = Object.create(WaveSurfer.Drawer);
        this.drawer.init(params);
        this.backend.bindUpdate(function() {
          return my.onAudioProcess();
        });
        return this.bindClick(params.canvas, function(percents) {
          return my.playAt(percents);
        });
      },
      onAudioProcess: function() {
        if (!this.backend.isPaused()) {
          return this.drawer.progress(this.backend.getPlayedPercents());
        }
      },
      playAt: function(percents) {
        return this.backend.play(this.backend.getDuration() * percents);
      },
      pause: function() {
        return this.backend.pause();
      },
      playPause: function() {
        if (this.backend.paused) {
          return this.playAt(this.backend.getPlayedPercents() || 0);
        } else {
          return this.pause();
        }
      },
      skipBackward: function(seconds) {
        return this.skip(seconds || -this.skipLength);
      },
      skipForward: function(seconds) {
        return this.skip(seconds || this.skipLength);
      },
      skip: function(offset) {
        var timings;

        timings = this.timings(offset);
        return this.playAt(timings[0] / timings[1]);
      },
      marks: 0,
      mark: function(options) {
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
      },
      timings: function(offset) {
        var duration, position;

        position = this.backend.getCurrentTime() || 0;
        duration = this.backend.getDuration() || 1;
        position = Math.max(0, Math.min(duration, position + offset));
        return [position, duration];
      },
      drawBuffer: function() {
        if (this.backend.currentBuffer) {
          return this.drawer.drawBuffer(this.backend.currentBuffer);
        }
      },
      /*
      		Loads an audio file via XHR.
      */

      load: function(src) {
        var my, xhr;

        my = this;
        xhr = new XMLHttpRequest();
        xhr.responseType = "arraybuffer";
        xhr.addEventListener("progress", (function(e) {
          var percentComplete;

          percentComplete = void 0;
          if (e.lengthComputable) {
            percentComplete = e.loaded / e.total;
          } else {
            percentComplete = e.loaded / (e.loaded + 1000000);
          }
          return my.drawer.drawLoading(percentComplete);
        }), false);
        xhr.addEventListener("load", (function(e) {
          my.drawer.drawLoading(1);
          return my.backend.loadData(e.target.response, my.drawBuffer.bind(my));
        }), false);
        xhr.open("GET", src, true);
        return xhr.send();
      },
      /*
      		Click to seek.
      */

      bindClick: function(element, callback) {
        var my;

        my = this;
        return element.addEventListener("click", (function(e) {
          var relX;

          relX = e.offsetX;
          if (null === relX) {
            relX = e.layerX;
          }
          return callback(relX / this.clientWidth);
        }), false);
      }
    };
    WaveSurfer.WebAudio = {
      Defaults: {
        fftSize: 1024,
        smoothingTimeConstant: 0.3
      },
      ac: new (window.AudioContext || window.webkitAudioContext),
      /*
      		Initializes the analyser with given params.
      		
      		@param {Object} params
      		@param {String} params.smoothingTimeConstant
      */

      init: function(params) {
        params = params || {};
        this.fftSize = params.fftSize || this.Defaults.fftSize;
        this.destination = params.destination || this.ac.destination;
        this.analyser = this.ac.createAnalyser();
        this.analyser.smoothingTimeConstant = params.smoothingTimeConstant || this.Defaults.smoothingTimeConstant;
        this.analyser.fftSize = this.fftSize;
        this.analyser.connect(this.destination);
        this.proc = this.ac.createJavaScriptNode(this.fftSize / 2, 1, 1);
        this.proc.connect(this.destination);
        this.dataArray = new Uint8Array(this.analyser.fftSize);
        return this.paused = true;
      },
      bindUpdate: function(callback) {
        var my;

        my = this;
        return this.proc.onaudioprocess = function() {
          callback();
          if (my.getPlayedPercents() > 1.0) {
            my.pause();
            return my.lastPause = 0;
          }
        };
      },
      setSource: function(source) {
        this.source && this.source.disconnect();
        this.source = source;
        this.source.connect(this.analyser);
        return this.source.connect(this.proc);
      },
      /*
      		Loads audiobuffer.
      		
      		@param {AudioBuffer} audioData Audio data.
      */

      loadData: function(audioData, cb) {
        var my;

        my = this;
        this.pause();
        return this.ac.decodeAudioData(audioData, (function(buffer) {
          my.currentBuffer = buffer;
          my.lastStart = 0;
          my.lastPause = 0;
          my.startTime = null;
          return cb(buffer);
        }), Error);
      },
      isPaused: function() {
        return this.paused;
      },
      getDuration: function() {
        return this.currentBuffer && this.currentBuffer.duration;
      },
      /*
      		Plays the loaded audio region.
      		
      		@param {Number} start Start offset in seconds,
      		relative to the beginning of the track.
      		
      		@param {Number} end End offset in seconds,
      		relative to the beginning of the track.
      */

      play: function(start, end, delay) {
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
      },
      /*
      		Pauses the loaded audio.
      */

      pause: function(delay) {
        if (!this.currentBuffer || this.paused) {
          return;
        }
        this.lastPause = this.getCurrentTime();
        this.source.noteOff(delay || 0);
        return this.paused = true;
      },
      getPlayedPercents: function() {
        return this.getCurrentTime() / this.getDuration();
      },
      getCurrentTime: function() {
        if (this.isPaused()) {
          return this.lastPause;
        } else {
          return this.lastStart + (this.ac.currentTime - this.startTime);
        }
      },
      /*
      		Returns the real-time waveform data.
      		
      		@return {Uint8Array} The waveform data.
      		Values range from 0 to 255.
      */

      waveform: function() {
        this.analyser.getByteTimeDomainData(this.dataArray);
        return this.dataArray;
      },
      /*
      		Returns the real-time frequency data.
      		
      		@return {Uint8Array} The frequency data.
      		Values range from 0 to 255.
      */

      frequency: function() {
        this.analyser.getByteFrequencyData(this.dataArray);
        return this.dataArray;
      }
    };
    WaveSurfer.Drawer = {
      defaultParams: {
        waveColor: "white",
        progressColor: "white",
        loadingColor: "white",
        cursorColor: "black",
        markerColor: "rgba(0, 0, 0, 0.5)",
        cursorWidth: 1,
        loadPercent: true,
        loadingBars: 20,
        barHeight: 1,
        barMargin: 10,
        markerWidth: 1,
        frameMargin: 0,
        fillParent: true,
        maxSecPerPx: false,
        scale: window.devicePixelRatio
      },
      init: function(params) {
        var my;

        my = this;
        this.params = {};
        Object.keys(this.defaultParams).forEach(function(key) {
          return my.params[key] = (key in params ? params[key] : my.defaultParams[key]);
        });
        this.markers = {};
        this.canvas = params.canvas;
        this.parent = this.canvas.parentNode;
        this.prepareContext();
        if (params.image) {
          return this.loadImage(params.image, this.drawImage.bind(this));
        }
      },
      prepareContext: function() {
        var canvas, h, w;

        canvas = this.canvas;
        w = canvas.width = $(this.parent).width() - 100;
        h = canvas.height = $(this.parent).height() - 3;
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        console.log(w, h, this.scale);
        this.width = w * this.scale;
        this.height = h * this.scale;
        this.cc = canvas.getContext("2d");
        if (!this.width || !this.height) {
          return console.error("Canvas size is zero.");
        }
      },
      getPeaks: function(buffer) {
        var c, chan, frames, i, k, l, maxSecPerPx, p, peak, secPerPx, sum, targetWidth, val, vals;

        frames = buffer.getChannelData(0).length;
        k = frames / this.width;
        maxSecPerPx = this.params.maxSecPerPx;
        if (maxSecPerPx) {
          secPerPx = k / buffer.sampleRate;
          if (secPerPx > maxSecPerPx) {
            targetWidth = Math.ceil(frames / maxSecPerPx / buffer.sampleRate / this.scale);
            this.canvas.style.width = targetWidth + "px";
            this.prepareContext();
            k = frames / this.width;
          }
        }
        this.peaks = [];
        this.maxPeak = -Infinity;
        i = 0;
        while (i < this.width) {
          sum = 0;
          c = 0;
          while (c < buffer.numberOfChannels) {
            chan = buffer.getChannelData(c);
            vals = chan.subarray(i * k, (i + 1) * k);
            peak = -Infinity;
            p = 0;
            l = vals.length;
            while (p < l) {
              val = Math.abs(vals[p]);
              if (val > peak) {
                peak = val;
              }
              p++;
            }
            sum += peak;
            c++;
          }
          this.peaks[i] = sum;
          if (sum > this.maxPeak) {
            this.maxPeak = sum;
          }
          i++;
        }
        return this.maxPeak *= 1 + this.params.frameMargin;
      },
      progress: function(percents) {
        this.cursorPos = ~~(this.width * percents);
        return this.redraw();
      },
      drawBuffer: function(buffer) {
        this.getPeaks(buffer);
        return this.progress(0);
      },
      /*
      		Redraws the entire canvas on each audio frame.
      */

      redraw: function() {
        var my;

        my = this;
        this.clear();
        if (this.peaks) {
          this.peaks.forEach(function(peak, index) {
            return my.drawFrame(index, peak, my.maxPeak);
          });
        } else {
          if (this.image) {
            this.drawImage();
          }
        }
        return this.drawCursor();
      },
      clear: function() {
        return this.cc.clearRect(0, 0, this.width, this.height);
      },
      drawFrame: function(index, value, max) {
        var h, w, x, y;

        w = 1;
        h = Math.round(value * (this.height / max));
        x = index * w;
        y = Math.round(this.height - h);
        if (this.cursorPos >= x) {
          this.cc.fillStyle = this.params.progressColor;
        } else {
          this.cc.fillStyle = this.params.waveColor;
        }
        return this.cc.fillRect(x, y, w, h);
      },
      drawCursor: function() {
        return this.drawMarker(this.cursorPos, this.params.cursorWidth, this.params.cursorColor);
      },
      drawMarker: function(position, width, color) {
        var h, w, x, y;

        width = width || this.params.markerWidth;
        color = color || this.params.markerColor;
        w = width * this.scale;
        h = this.height;
        x = Math.min(position, this.width - w);
        y = 0;
        this.cc.fillStyle = color;
        return this.cc.fillRect(x, y, w, h);
      },
      /*
      		Loads and caches an image.
      */

      loadImage: function(url, callback) {
        var img, my, onLoad;

        my = this;
        img = document.createElement("img");
        onLoad = function() {
          img.removeEventListener("load", onLoad);
          my.image = img;
          return callback(img);
        };
        img.addEventListener("load", onLoad, false);
        return img.src = url;
      },
      /*
      		Draws a pre-drawn waveform image.
      */

      drawImage: function() {
        this.cc.drawImage(this.image, 0, 0, this.width, this.height);
        this.cc.save();
        this.cc.globalCompositeOperation = "source-atop";
        this.cc.fillStyle = this.params.progressColor;
        this.cc.fillRect(0, 0, this.cursorPos, this.height);
        return this.cc.restore();
      },
      drawLoading: function(progress) {
        var barHeight, barWidth, bars, i, margin, progressBars, width, x, y, _results;

        barHeight = this.params.barHeight * this.scale;
        y = ~~(this.height - barHeight);
        this.cc.fillStyle = this.params.loadingColor;
        if (this.params.loadPercent) {
          width = Math.round(this.width * progress);
          this.cc.fillRect(0, y, width, barHeight);
          return;
        }
        bars = this.params.loadingBars;
        margin = this.params.barMargin * this.scale;
        barWidth = ~~(this.width / bars) - margin;
        progressBars = ~~(bars * progress);
        i = 0;
        _results = [];
        while (i < progressBars) {
          x = i * barWidth + i * margin;
          this.cc.fillRect(x, y, barWidth, barHeight);
          _results.push(i += 1);
        }
        return _results;
      }
    };
    return WaveSurfer;
  });

}).call(this);
