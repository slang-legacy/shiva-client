require.config(
	paths:
		underscore: '../components/underscore/underscore'
		backbone: '../components/backbone/backbone'
		jquery: '../components/jquery/jquery.min'
		localstorage: "../components/backbone.localStorage/backbone.localStorage"
	shim:
		underscore:
			exports: '_'
		backbone:
			deps: ['underscore', 'jquery']
			exports: 'Backbone'
		tipsy: ['jquery']
		jgrowl: ['jquery']
)


require ['jquery', 'wavesurfer', 'tipsy', 'jgrowl'], ($, WaveSurfer) -> # 'structure',
	###
	if ("geolocation" in navigator)
		navigator.geolocation.getCurrentPosition((position) ->
			Shiva.geolocation = position.coords
		)
	###

	# friendly little aliases
	p = (text) -> console.log text
	notify = (args...) -> $("#jGrowl-container").jGrowl args...

	#error logger
	window.onerror = (msg, url, line) ->
		notify "errorMsg: #{msg} on line #{line}",
			theme: 'error'
			sticky: true

		#TODO: post error to server to record

		false #let default error handler continue


	wavesurfer = (->
		wavesurfer = Object.create(WaveSurfer)
		wavesurfer.init
			canvas: document.querySelector("#visualization")
			fillParent: true
			markerColor: "rgba(0, 0, 0, 0.5)"
			frameMargin: 0.1
			maxSecPerPx: parseFloat(location.hash.substring(1))
			scrollParent: true
			loadPercent: true
			waveColor: "white"
			progressColor: "white"
			loadingColor: "white"
			cursorColor: "black"

		wavesurfer.load "test-audio/test.mp3"

		document.addEventListener "click", (e) ->
			action = e.target.dataset and e.target.dataset.action
			eventHandlers[action] e  if action and action of eventHandlers

		wavesurfer
	)()
