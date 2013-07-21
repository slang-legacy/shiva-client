#fix prefixing
window.AudioContext = window.AudioContext || window.webkitAudioContext;

define ['jquery'], ($) ->
	class WebAudio
		ac: new AudioContext()
		
		###
		Initializes the analyser with given params.
		
		@param {Object} params
		@param {String} params.smoothingTimeConstant
		###
		constructor: (options = {}) ->
			defaults =
				fftSize: 1024
				smoothingTimeConstant: 0.3
				destination: @ac.destination

			$.extend @, defaults, options

			@analyser = @ac.createAnalyser()
			@analyser.smoothingTimeConstant = @smoothingTimeConstant
			@analyser.fftSize = @fftSize
			@analyser.connect @destination
			@proc = @ac.createJavaScriptNode(@fftSize / 2, 1, 1)
			@proc.connect @destination
			@dataArray = new Uint8Array(@analyser.fftSize)
			@paused = true

			#oscillator = @ac.createOscillator()
			#oscillator.connect(@destination)
			#oscillator.noteOn(0)

		bindUpdate: (callback) ->
			@proc.onaudioprocess = =>
				callback()
				if @getPlayedPercents() > 1.0
					@pause()
					@lastPause = 0

		setSource: (source) ->
			@source and @source.disconnect()
			@source = source
			@source.connect @analyser
			@source.connect @destination
		
		###
		Loads audiobuffer.
		@param {AudioBuffer} audioData Audio data.
		###
		loadData: (audioData, cb) ->
			@pause()
			@ac.decodeAudioData audioData, ((buffer) =>
				@currentBuffer = buffer
				@lastStart = 0
				@lastPause = 0
				@startTime = null
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
			return unless @currentBuffer
			@pause()
			@setSource @ac.createBufferSource()
			@source.buffer = @currentBuffer
			start = @getCurrentTime() if not start?
			end = @source.buffer.duration if not end?
			delay = 0 if not delay?
			@lastStart = start
			@startTime = @ac.currentTime
			@source.noteGrainOn delay, start, end - start
			@paused = false

		###
		Pauses the loaded audio.
		###
		pause: (delay) ->
			return if not @currentBuffer or @paused
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

	return WebAudio
