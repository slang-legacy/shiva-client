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
          barHeight: 6,
          scale: window.devicePixelRatio
        };
        $.extend(this, defaults, options);
        this.markers = {};
        this.parent = this.canvas.parentNode;
        this.prepareContext();
      }

      Drawer.prototype.prepareContext = function() {
        var h, w;
        w = this.canvas.width = $(this.parent).width();
        h = this.canvas.height = $(this.parent).height();
        console.log("width:" + w + " height:" + h + " scale:" + this.scale);
        this.width = w * this.scale;
        this.height = h * this.scale;
        this.cc = this.canvas.getContext("2d");
        if (!this.width || !this.height) {
          return console.error("Canvas size is zero.");
        }
      };

      Drawer.prototype.getPeaks = function(buffer) {
        var c, chan, frames, i, k, l, p, peak, sum, val, vals, _results;
        frames = buffer.getChannelData(0).length;
        k = frames / this.width;
        this.peaks = [];
        this.maxPeak = -Infinity;
        i = 0;
        _results = [];
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
          _results.push(i++);
        }
        return _results;
      };

      Drawer.prototype.progress = function(percents) {
        return library.current_track().set({
          progress: ~~(percents * 1000) / 1000
        });
      };

      Drawer.prototype.drawBuffer = function(buffer) {
        var _this = this;
        this.getPeaks(buffer);
        this.clear();
        return this.peaks.forEach(function(peak, index) {
          var h, w, x, y;
          w = 1;
          h = Math.round(peak * (_this.height / _this.maxPeak));
          x = index * w;
          y = Math.round(_this.height - h);
          if (_this.cursorPos >= x) {
            _this.cc.fillStyle = _this.progressColor;
          } else {
            _this.cc.fillStyle = _this.waveColor;
          }
          return _this.cc.fillRect(x, y, w, h);
        });
      };

      Drawer.prototype.clear = function() {
        return this.cc.clearRect(0, 0, this.width, this.height);
      };

      Drawer.prototype.drawLoading = function(progress) {
        var barHeight, width, y;
        barHeight = this.barHeight * this.scale;
        y = ~~(this.height - barHeight);
        this.cc.fillStyle = this.loadingColor;
        width = Math.round(this.width * progress);
        return this.cc.fillRect(0, y, width, barHeight);
      };

      return Drawer;

    })();
    return Drawer;
  });

}).call(this);
