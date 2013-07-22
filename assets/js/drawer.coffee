define ['jquery'], ($) ->
	class Drawer
		constructor: (options = {}) ->
			defaults =
				waveColor: "white"
				progressColor: "white"
				loadingColor: "white"
				barHeight: 6
				scale: window.devicePixelRatio

			$.extend @, defaults, options

			@markers = {}
			@parent = @canvas.parentNode
			@prepareContext()

		prepareContext: ->
			w = @canvas.width = $(@parent).width()
			h = @canvas.height = $(@parent).height()
			console.log "width:#{w} height:#{h} scale:#{@scale}"
			@width = w * @scale
			@height = h * @scale
			@cc = @canvas.getContext("2d")
			console.error "Canvas size is zero." if not @width or not @height

		getPeaks: (buffer) ->
			frames = buffer.getChannelData(0).length
			
			k = frames / @width # Frames per pixel
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

		progress: (percents) ->
			library.current_track().set(progress: ~~(percents * 1000) / 1000)

		drawBuffer: (buffer) ->
			@getPeaks buffer
			@clear()

			# Draw WebAudio buffer peaks.
			@peaks.forEach (peak, index) =>
				w = 1
				h = Math.round(peak * (@height / @maxPeak))
				x = index * w
				y = Math.round(@height - h)
				if @cursorPos >= x
					@cc.fillStyle = @progressColor
				else
					@cc.fillStyle = @waveColor
				@cc.fillRect x, y, w, h

		clear: ->
			@cc.clearRect 0, 0, @width, @height

		drawLoading: (progress) ->
			barHeight = @barHeight * @scale
			y = ~~(@height - barHeight)
			@cc.fillStyle = @loadingColor

			width = Math.round(@width * progress)
			@cc.fillRect 0, y, width, barHeight

	return Drawer
