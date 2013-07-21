define ['jquery'], ($) ->
	class Drawer
		constructor: (options = {}) ->
			defaults =
				waveColor: "white"
				progressColor: "white"
				loadingColor: "white"
				cursorColor: "black"
				markerColor: "rgba(0, 0, 0, 0.5)"
				cursorWidth: 1
				loadPercent: true
				loadingBars: 20
				barHeight: 6
				markerWidth: 1
				frameMargin: 0
				fillParent: true
				maxSecPerPx: false
				scale: window.devicePixelRatio

			$.extend @, defaults, options

			@markers = {}
			@parent = @canvas.parentNode
			@prepareContext()
			@loadImage @image, @drawImage.bind(@) if @image

		prepareContext: ->
			console.log 'preparing context'
			w = @canvas.width = $(@parent).width() - 100
			h = @canvas.height = $(@parent).height() - 3
			@canvas.style.width = w + "px"
			@canvas.style.height = h + "px"
			console.log "width:#{w} height:#{h} scale:#{@scale}"
			@width = w * @scale
			@height = h * @scale
			@cc = @canvas.getContext("2d")
			console.error "Canvas size is zero." if not @width or not @height

		getPeaks: (buffer) ->
			frames = buffer.getChannelData(0).length
			
			k = frames / @width # Frames per pixel
			if @maxSecPerPx
				secPerPx = k / buffer.sampleRate
				if secPerPx > @maxSecPerPx
					targetWidth = Math.ceil(frames / @maxSecPerPx / buffer.sampleRate / @scale)
					@canvas.style.width = targetWidth + "px"
					@prepareContext()
					k = frames / @width
			@peaks = []
			@maxPeak = -Infinity
			i = 0

			while i < @width
				sum = 0
				c = 0

				while c < buffer.numberOfChannels
					chan = buffer.getChannelData(c)
					vals = chan.subarray(i * k, (i + 1) * k)
					peak = -Infinity
					p = 0
					l = vals.length

					while p < l
						val = Math.abs(vals[p])
						peak = val if val > peak
						p++
					sum += peak
					c++
				@peaks[i] = sum
				if sum > @maxPeak then @maxPeak = sum
				i++
			@maxPeak *= 1 + @frameMargin

		progress: (percents) ->
			@cursorPos = ~~(@width * percents)
			@redraw()

		drawBuffer: (buffer) ->
			@getPeaks buffer
			@progress 0

		
		###*
		 * Redraws the entire canvas on each audio frame.
		###
		redraw: ->
			@clear()
			
			if @peaks
				# Draw WebAudio buffer peaks.
				@peaks.forEach (peak, index) =>
					@drawFrame index, peak, @maxPeak

			else if @image
				# Or draw an image.
				@drawImage()

			@drawCursor()

		clear: ->
			@cc.clearRect 0, 0, @width, @height

		drawFrame: (index, value, max) ->
			w = 1
			h = Math.round(value * (@height / max))
			x = index * w
			y = Math.round(@height - h)
			if @cursorPos >= x
				@cc.fillStyle = @progressColor
			else
				@cc.fillStyle = @waveColor
			@cc.fillRect x, y, w, h

		drawCursor: ->
			@drawMarker @cursorPos, @cursorWidth, @cursorColor

		drawMarker: (position, width, color) ->
			width = width or @markerWidth
			color = color or @markerColor
			w = width * @scale
			h = @height
			x = Math.min(position, @width - w)
			y = 0
			@cc.fillStyle = color
			@cc.fillRect x, y, w, h
		
		###*
		 * Loads and caches an image.
		###
		loadImage: (url, callback) ->
			my = this
			img = document.createElement("img")
			onLoad = ->
				img.removeEventListener "load", onLoad
				my.image = img
				callback img

			img.addEventListener "load", onLoad, false
			img.src = url

		###*
		 * Draws a pre-drawn waveform image.
		###
		drawImage: ->
			@cc.drawImage @image, 0, 0, @width, @height
			@cc.save()
			@cc.globalCompositeOperation = "source-atop"
			@cc.fillStyle = @progressColor
			@cc.fillRect 0, 0, @cursorPos, @height
			@cc.restore()

		drawLoading: (progress) ->
			barHeight = @barHeight * @scale
			y = ~~(@height - barHeight)
			@cc.fillStyle = @loadingColor
			if @loadPercent
				width = Math.round(@width * progress)
				@cc.fillRect 0, y, width, barHeight
				return
			bars = @loadingBars
			barWidth = ~~(@width / bars)
			progressBars = ~~(bars * progress)
			i = 0

			while i < progressBars
				x = i * barWidth
				@cc.fillRect x, y, barWidth, barHeight
				i += 1

	return Drawer
