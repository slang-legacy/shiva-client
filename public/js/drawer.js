(function() {
  define(['jquery'], function($) {
    var Drawer;
    Drawer = (function() {
      function Drawer(options) {
        var defaults;
        if (options == null) {
          options = {};
        }
        defaults = {
          waveColor: "white",
          progressColor: "white",
          loadingColor: "white",
          cursorColor: "black",
          markerColor: "rgba(0, 0, 0, 0.5)",
          cursorWidth: 1,
          loadPercent: true,
          loadingBars: 20,
          barHeight: 6,
          markerWidth: 1,
          frameMargin: 0,
          fillParent: true,
          maxSecPerPx: false,
          scale: window.devicePixelRatio
        };
        $.extend(this, defaults, options);
        this.markers = {};
        this.parent = this.canvas.parentNode;
        this.prepareContext();
        if (this.image) {
          this.loadImage(this.image, this.drawImage.bind(this));
        }
      }

      Drawer.prototype.prepareContext = function() {
        var h, w;
        w = this.canvas.width = $(this.parent).width();
        h = this.canvas.height = $(this.parent).height();
        this.canvas.style.width = w + "px";
        this.canvas.style.height = h + "px";
        console.log("width:" + w + " height:" + h + " scale:" + this.scale);
        this.width = w * this.scale;
        this.height = h * this.scale;
        this.cc = this.canvas.getContext("2d");
        if (!this.width || !this.height) {
          return console.error("Canvas size is zero.");
        }
      };

      Drawer.prototype.getPeaks = function(buffer) {
        var c, chan, frames, i, k, l, p, peak, secPerPx, sum, targetWidth, val, vals;
        frames = buffer.getChannelData(0).length;
        k = frames / this.width;
        if (this.maxSecPerPx) {
          secPerPx = k / buffer.sampleRate;
          if (secPerPx > this.maxSecPerPx) {
            targetWidth = Math.ceil(frames / this.maxSecPerPx / buffer.sampleRate / this.scale);
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
        return this.maxPeak *= 1 + this.frameMargin;
      };

      Drawer.prototype.progress = function(percents) {
        return library.current_track().set({
          progress: ~~(percents * 1000) / 1000
        });
      };

      Drawer.prototype.drawBuffer = function(buffer) {
        this.getPeaks(buffer);
        this.progress(0);
        return this.redraw();
      };

      /**
      		 * Redraws the entire canvas on each audio frame.
      */


      Drawer.prototype.redraw = function() {
        var _this = this;
        this.clear();
        if (this.peaks) {
          this.peaks.forEach(function(peak, index) {
            return _this.drawFrame(index, peak, _this.maxPeak);
          });
        } else if (this.image) {
          this.drawImage();
        }
        return this.drawCursor();
      };

      Drawer.prototype.clear = function() {
        return this.cc.clearRect(0, 0, this.width, this.height);
      };

      Drawer.prototype.drawFrame = function(index, value, max) {
        var h, w, x, y;
        w = 1;
        h = Math.round(value * (this.height / max));
        x = index * w;
        y = Math.round(this.height - h);
        if (this.cursorPos >= x) {
          this.cc.fillStyle = this.progressColor;
        } else {
          this.cc.fillStyle = this.waveColor;
        }
        return this.cc.fillRect(x, y, w, h);
      };

      Drawer.prototype.drawCursor = function() {
        return this.drawMarker(this.cursorPos, this.cursorWidth, this.cursorColor);
      };

      Drawer.prototype.drawMarker = function(position, width, color) {
        var h, w, x, y;
        width = width || this.markerWidth;
        color = color || this.markerColor;
        w = width * this.scale;
        h = this.height;
        x = Math.min(position, this.width - w);
        y = 0;
        this.cc.fillStyle = color;
        return this.cc.fillRect(x, y, w, h);
      };

      /**
      		 * Loads and caches an image.
      */


      Drawer.prototype.loadImage = function(url, callback) {
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
      };

      /**
      		 * Draws a pre-drawn waveform image.
      */


      Drawer.prototype.drawImage = function() {
        this.cc.drawImage(this.image, 0, 0, this.width, this.height);
        this.cc.save();
        this.cc.globalCompositeOperation = "source-atop";
        this.cc.fillStyle = this.progressColor;
        this.cc.fillRect(0, 0, this.cursorPos, this.height);
        return this.cc.restore();
      };

      Drawer.prototype.drawLoading = function(progress) {
        var barHeight, barWidth, bars, i, progressBars, width, x, y, _results;
        barHeight = this.barHeight * this.scale;
        y = ~~(this.height - barHeight);
        this.cc.fillStyle = this.loadingColor;
        if (this.loadPercent) {
          width = Math.round(this.width * progress);
          this.cc.fillRect(0, y, width, barHeight);
          return;
        }
        bars = this.loadingBars;
        barWidth = ~~(this.width / bars);
        progressBars = ~~(bars * progress);
        i = 0;
        _results = [];
        while (i < progressBars) {
          x = i * barWidth;
          this.cc.fillRect(x, y, barWidth, barHeight);
          _results.push(i += 1);
        }
        return _results;
      };

      return Drawer;

    })();
    return Drawer;
  });

}).call(this);
