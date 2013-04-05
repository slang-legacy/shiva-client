require.config(
	paths:
		underscore: 'components/underscore/underscore'
		backbone: 'components/backbone/backbone'
		jquery: 'components/jquery/jquery.min'
		localstorage: "components/backbone.localStorage/backbone.localStorage"
	shim:
		underscore:
			exports: '_'
		backbone:
			deps: ['underscore', 'jquery']
			exports: 'Backbone'
		tipsy: ['jquery']
		jgrowl: ['jquery']
)


require ['jquery', 'structure', 'tipsy', 'jgrowl'], ($, App) ->
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