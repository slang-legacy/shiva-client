SHIVA_URL = 'http://localhost:9002'
require.config(
	paths:
		underscore: '../components/underscore/underscore'
		backbone: '../components/backbone/backbone'
		jquery: '../components/jquery/jquery.min'
		localstorage: "../components/backbone.localStorage/backbone.localStorage"
		deepmodel: "../components/backbone-deep-model/distribution/deep-model.min"
		moment: "../components/moment/min/moment.min"
	shim:
		underscore:
			exports: '_'
		backbone:
			deps: ['underscore', 'jquery']
			exports: 'Backbone'
		deepmodel:
			deps: ['underscore']
		tipsy: ['jquery']
		jgrowl: ['jquery']
)


require [
	'jquery',
	'wavesurfer',
	'tipsy',
	'jgrowl'
], ($, WaveSurfer) ->
	###
	if ("geolocation" in navigator)
		navigator.geolocation.getCurrentPosition((position) ->
			Shiva.geolocation = position.coords
		)
	###

	# friendly little aliases
	window.p = (text) -> console.log text
	window.notify = (args...) -> $("#jGrowl-container").jGrowl args...

	#error logger
	#window.onerror = (msg, url, line) ->
	#	notify "errorMsg: #{msg} on line #{line}",
	#		theme: 'error'
	#		sticky: true

		#TODO: post error to server to record

	#	false #let default error handler continue

require [
	'wavesurfer',
	'webaudio',
	'collection',
	'autocomplete'
], (WaveSurfer, WebAudio, Tracks) ->
	
	#$.ajax(
	#	url: "#{SHIVA_URL}/tracks"
	#).done( (data) ->
	#	p data
	#)

	window.wavesurfer = new WaveSurfer(
		backend: new WebAudio()
	)

	document.addEventListener "click", (e) ->
		action = e.target.dataset and e.target.dataset.action
		eventHandlers[action] e if action and action of eventHandlers

	library.change_track(1269)

	search = new AutoComplete('search_bar', ['Apple', 'Banana', 'Orange'])
