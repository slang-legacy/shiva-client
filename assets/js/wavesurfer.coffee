define ['jquery', 'drawer'], ($, Drawer) ->
	class WaveSurfer
		constructor: (options = {}) ->
			defaults =
				skipLength: 2
				backend: undefined
				canvas: undefined

			$.extend @, defaults, options

			@drawer = new Drawer(canvas: @canvas)

			@backend.bindUpdate =>
				@onAudioProcess()

			@bindClick @canvas, (percents) =>
				@playAt percents

		onAudioProcess: ->
			@drawer.progress @backend.getPlayedPercents() unless @backend.isPaused()

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
			@drawer.redraw() if @backend.paused
			marker

		timings: (offset) ->
			position = @backend.getCurrentTime() or 0
			duration = @backend.getDuration() or 1
			position = Math.max(0, Math.min(duration, position + offset))
			[position, duration]

		drawBuffer: ->
			if @backend.currentBuffer
				@drawer.drawBuffer @backend.currentBuffer
			else
				console.log 'error: currentBuffer isn\'t defined'

		###*
		 * Loads an audio file via XHR.
		 * @param {[type]} src [description]
		 * @return {[type]} [description]
		###
		load: (src) ->
			xhr = new XMLHttpRequest()
			xhr.responseType = "arraybuffer"
			xhr.addEventListener "progress", ((e) =>
				# TODO: for now, approximate progress with an asymptotic
				# function, and assume downloads in the 1-3 MB range.
				percentComplete = e.loaded / if e.lengthComputable then e.total else (e.loaded + 1000000)

				@drawer.drawLoading percentComplete
			), false
			xhr.addEventListener "load", ((e) =>
				@drawer.drawLoading 1
				@backend.loadData e.target.response, @drawBuffer.bind(@)
			), false
			xhr.open "GET", src, true
			xhr.send()
		
		###
		Click to seek.
		###
		bindClick: (element, callback) ->
			element.addEventListener "click", ((e) ->
				relX = e.offsetX
				relX = e.layerX if null is relX
				callback relX / @clientWidth
			), false

	return WaveSurfer
