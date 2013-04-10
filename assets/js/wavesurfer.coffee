define ['jquery', 'backbone'], ($, Backbone) ->
	WaveSurfer =
		defaultParams:
			skipLength: 2

		init: (params) ->
			my = this
			
			# extract relevant parameters (or defaults)
			Object.keys(@defaultParams).forEach (key) ->
				my[key] = params[key] or my.defaultParams[key]

			if params.audio
				backend = WaveSurfer.Audio
			else
				backend = WaveSurfer.WebAudio
			@backend = Object.create(backend)
			@backend.init params
			@drawer = Object.create(WaveSurfer.Drawer)
			@drawer.init params
			@backend.bindUpdate ->
				my.onAudioProcess()

			@bindClick params.canvas, (percents) ->
				my.playAt percents


		onAudioProcess: ->
			@drawer.progress @backend.getPlayedPercents()  unless @backend.isPaused()

		playAt: (percents) ->
			@backend.play @backend.getDuration() * percents

		pause: ->
			@backend.pause()

		playPause: ->
			if @backend.paused
				@playAt @backend.getPlayedPercents() or 0
			else
				@pause()

		skipBackward: (seconds) ->
			@skip seconds or -@skipLength

		skipForward: (seconds) ->
			@skip seconds or @skipLength

		skip: (offset) ->
			timings = @timings(offset)
			@playAt timings[0] / timings[1]

		marks: 0
		mark: (options) ->
			options = options or {}
			timings = @timings(0)
			marker =
				width: options.width
				color: options.color
				percentage: timings[0] / timings[1]
				position: timings[0]

			id = options.id or "_m" + @marks++
			@drawer.markers[id] = marker
			@drawer.redraw()  if @backend.paused
			marker

		timings: (offset) ->
			position = @backend.getCurrentTime() or 0
			duration = @backend.getDuration() or 1
			position = Math.max(0, Math.min(duration, position + offset))
			[position, duration]

		drawBuffer: ->
			@drawer.drawBuffer @backend.currentBuffer  if @backend.currentBuffer

		
		###
		Loads an audio file via XHR.
		###
		load: (src) ->
			my = this
			xhr = new XMLHttpRequest()
			xhr.responseType = "arraybuffer"
			xhr.addEventListener "progress", ((e) ->
				percentComplete = undefined
				if e.lengthComputable
					percentComplete = e.loaded / e.total
				else
					
					# TODO
					# for now, approximate progress with an asymptotic
					# function, and assume downloads in the 1-3 MB range.
					percentComplete = e.loaded / (e.loaded + 1000000)
				my.drawer.drawLoading percentComplete
			), false
			xhr.addEventListener "load", ((e) ->
				my.drawer.drawLoading 1
				my.backend.loadData e.target.response, my.drawBuffer.bind(my)
			), false
			xhr.open "GET", src, true
			xhr.send()

		
		###
		Click to seek.
		###
		bindClick: (element, callback) ->
			my = this
			element.addEventListener "click", ((e) ->
				relX = e.offsetX
				relX = e.layerX  if null is relX
				callback relX / @clientWidth
			), false

	WaveSurfer.WebAudio =
		Defaults:
			fftSize: 1024
			smoothingTimeConstant: 0.3

		ac: new (window.AudioContext or window.webkitAudioContext)
		
		###
		Initializes the analyser with given params.
		
		@param {Object} params
		@param {String} params.smoothingTimeConstant
		###
		init: (params) ->
			params = params or {}
			@fftSize = params.fftSize or @Defaults.fftSize
			@destination = params.destination or @ac.destination
			@analyser = @ac.createAnalyser()
			@analyser.smoothingTimeConstant = params.smoothingTimeConstant or @Defaults.smoothingTimeConstant
			@analyser.fftSize = @fftSize
			@analyser.connect @destination
			@proc = @ac.createJavaScriptNode(@fftSize / 2, 1, 1)
			@proc.connect @destination
			@dataArray = new Uint8Array(@analyser.fftSize)
			@paused = true

		bindUpdate: (callback) ->
			my = this
			@proc.onaudioprocess = ->
				callback()
				if my.getPlayedPercents() > 1.0
					my.pause()
					my.lastPause = 0

		setSource: (source) ->
			@source and @source.disconnect()
			@source = source
			@source.connect @analyser
			@source.connect @proc

		
		###
		Loads audiobuffer.
		
		@param {AudioBuffer} audioData Audio data.
		###
		loadData: (audioData, cb) ->
			my = this
			@pause()
			@ac.decodeAudioData audioData, ((buffer) ->
				my.currentBuffer = buffer
				my.lastStart = 0
				my.lastPause = 0
				my.startTime = null
				cb buffer
			), Error

		isPaused: ->
			@paused

		getDuration: ->
			@currentBuffer and @currentBuffer.duration

		
		###
		Plays the loaded audio region.
		
		@param {Number} start Start offset in seconds,
		relative to the beginning of the track.
		
		@param {Number} end End offset in seconds,
		relative to the beginning of the track.
		###
		play: (start, end, delay) ->
			return  unless @currentBuffer
			@pause()
			@setSource @ac.createBufferSource()
			@source.buffer = @currentBuffer
			start = @getCurrentTime()  if null is start
			end = @source.buffer.duration  if null is end
			delay = 0  if null is delay
			@lastStart = start
			@startTime = @ac.currentTime
			@source.noteGrainOn delay, start, end - start
			@paused = false

		
		###
		Pauses the loaded audio.
		###
		pause: (delay) ->
			return  if not @currentBuffer or @paused
			@lastPause = @getCurrentTime()
			@source.noteOff delay or 0
			@paused = true

		getPlayedPercents: ->
			@getCurrentTime() / @getDuration()

		getCurrentTime: ->
			if @isPaused()
				@lastPause
			else
				@lastStart + (@ac.currentTime - @startTime)

		
		###
		Returns the real-time waveform data.
		
		@return {Uint8Array} The waveform data.
		Values range from 0 to 255.
		###
		waveform: ->
			@analyser.getByteTimeDomainData @dataArray
			@dataArray

		
		###
		Returns the real-time frequency data.
		
		@return {Uint8Array} The frequency data.
		Values range from 0 to 255.
		###
		frequency: ->
			@analyser.getByteFrequencyData @dataArray
			@dataArray

	WaveSurfer.Drawer =
		defaultParams:
			waveColor: "white"
			progressColor: "white"
			loadingColor: "white"
			cursorColor: "black"
			markerColor: "rgba(0, 0, 0, 0.5)"
			cursorWidth: 1
			loadPercent: true
			loadingBars: 20
			barHeight: 1
			barMargin: 10
			markerWidth: 1
			frameMargin: 0
			fillParent: true
			maxSecPerPx: false
			scale: window.devicePixelRatio

		init: (params) ->
			my = this
			
			# extend params with defaults
			@params = {}
			Object.keys(@defaultParams).forEach (key) ->
				my.params[key] = (if key of params then params[key] else my.defaultParams[key])

			@markers = {}
			@canvas = params.canvas
			@parent = @canvas.parentNode
			@prepareContext()
			@loadImage params.image, @drawImage.bind(this)  if params.image

		prepareContext: ->
			canvas = @canvas
			w = canvas.width = $(@parent).width() - 100
			h = canvas.height = $(@parent).height() - 3
			canvas.style.width = w + "px"
			canvas.style.height = h + "px"
			console.log w, h, @scale
			@width = w * @scale
			@height = h * @scale
			@cc = canvas.getContext("2d")
			console.error "Canvas size is zero."  if not @width or not @height

		getPeaks: (buffer) ->
			frames = buffer.getChannelData(0).length
			
			# Frames per pixel
			k = frames / @width
			maxSecPerPx = @params.maxSecPerPx
			if maxSecPerPx
				secPerPx = k / buffer.sampleRate
				if secPerPx > maxSecPerPx
					targetWidth = Math.ceil(frames / maxSecPerPx / buffer.sampleRate / @scale)
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
						peak = val  if val > peak
						p++
					sum += peak
					c++
				@peaks[i] = sum
				@maxPeak = sum  if sum > @maxPeak
				i++
			@maxPeak *= 1 + @params.frameMargin

		progress: (percents) ->
			@cursorPos = ~~(@width * percents)
			@redraw()

		drawBuffer: (buffer) ->
			@getPeaks buffer
			@progress 0

		
		###
		Redraws the entire canvas on each audio frame.
		###
		redraw: ->
			my = this
			@clear()
			
			# Draw WebAudio buffer peaks.
			if @peaks
				@peaks.forEach (peak, index) ->
					my.drawFrame index, peak, my.maxPeak

			
			# Or draw an image.
			else @drawImage()  if @image

			@drawCursor()

		clear: ->
			@cc.clearRect 0, 0, @width, @height

		drawFrame: (index, value, max) ->
			w = 1
			h = Math.round(value * (@height / max))
			x = index * w
			y = Math.round(@height - h)
			if @cursorPos >= x
				@cc.fillStyle = @params.progressColor
			else
				@cc.fillStyle = @params.waveColor
			@cc.fillRect x, y, w, h

		drawCursor: ->
			@drawMarker @cursorPos, @params.cursorWidth, @params.cursorColor

		drawMarker: (position, width, color) ->
			width = width or @params.markerWidth
			color = color or @params.markerColor
			w = width * @scale
			h = @height
			x = Math.min(position, @width - w)
			y = 0
			@cc.fillStyle = color
			@cc.fillRect x, y, w, h

		
		###
		Loads and caches an image.
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

		
		###
		Draws a pre-drawn waveform image.
		###
		drawImage: ->
			@cc.drawImage @image, 0, 0, @width, @height
			@cc.save()
			@cc.globalCompositeOperation = "source-atop"
			@cc.fillStyle = @params.progressColor
			@cc.fillRect 0, 0, @cursorPos, @height
			@cc.restore()

		drawLoading: (progress) ->
			barHeight = @params.barHeight * @scale
			y = ~~(@height - barHeight)
			@cc.fillStyle = @params.loadingColor
			if @params.loadPercent
				width = Math.round(@width * progress)
				@cc.fillRect 0, y, width, barHeight
				return
			bars = @params.loadingBars
			margin = @params.barMargin * @scale
			barWidth = ~~(@width / bars) - margin
			progressBars = ~~(bars * progress)
			i = 0

			while i < progressBars
				x = i * barWidth + i * margin
				@cc.fillRect x, y, barWidth, barHeight
				i += 1

	return WaveSurfer