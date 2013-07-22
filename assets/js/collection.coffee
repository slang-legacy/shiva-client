# deals with the music collection as a whole. yep: it loads your entire music
# collection into your browser
define(['jquery', 'deepmodel', 'localstorage', ''], ($, Backbone) ->
	class Track extends Backbone.DeepModel
		defaults:
			playing: false

		play: ->
			@set 'playing': true
			wavesurfer.load "#{@get('files.audio/mp3')}"
			#wavesurfer.playAt 0

		sync: ->
			false # changes to Tracks don't get stored anywhere yet

		initialize: ->
			_.bindAll @

			#fix the artist
			if artist_id = @get 'artist.id'
				@set 'artist', artists.where(id: artist_id)[0]

			#fix the artist
			if album_id = @get 'album.id'
				@set 'album', albums.where(id: album_id)[0]


	class TrackView extends Backbone.View
		render: ->
			@$el.html """
				#{@model.get('title')}
			"""
			@update_playing()

		update_playing: ->
			if @model.get 'playing'
				@$el.addClass 'playing'
			else
				@$el.removeClass 'playing'

		initialize: ->
			_.bindAll @
			@model.view = @

			@model.on('change:playing', @update_playing)
			@render()

	class TrackCollection extends Backbone.Collection
		model: Track

		current_track: ->
			return @where(playing: true)[0]

		change_track: (track_id) ->
			track = @where(id: track_id)[0]

			try
				# stop the current page (if it's set)
				@current_track().set(playing: false)

			if track?
				track.set(playing: true)
			else
				# make jgrowl error
				p "#{track_id} doesn't exist",

		initialize: ->
			_.bindAll @

	class TrackCollectionView extends Backbone.View
		el: $('#songs')

		added_track: (track_model) ->
			#used to create the view for a track after it has been added
			track = new TrackView({model: track_model})
			@$el.append track.el
			p track

		initialize: ->
			_.bindAll @
			@collection.on 'add', @added_track

	class StatusBar extends Backbone.View
		el: $('#status_bar')

		###*
		 * for when the track changes
		 * @return {[type]} [description]
		###
		render: ->
			@current_track = @collection.current_track()
			p @current_track
			$('#current_song').html("""
				#{@current_track.get 'title'} by #{@current_track.get('artist').get 'name'}
				<br/>
				from #{@current_track.get('album').get 'name'}
			""")

			$('#album_art').attr src: @current_track.get('album').get('cover')

		###*
		 * for moving the progress bar
		 * @return {[type]} [description]
		###
		update_progress:->

		initialize: ->
			_.bindAll @
			@collection.on('change:playing', @render)


	class Artist extends Backbone.DeepModel
		sync: ->
			false # changes to Artists don't get stored anywhere yet

	class ArtistCollection extends Backbone.Collection
		model: Artist

		initialize: ->
			_.bindAll @

	class Album extends Backbone.DeepModel
		sync: ->
			false # changes to Artists don't get stored anywhere yet

	class AlbumCollection extends Backbone.Collection
		model: Album

		initialize: ->
			_.bindAll @

	window.albums = new AlbumCollection(window.sample_albums)
	window.artists = new ArtistCollection(window.sample_artists)

	window.library = new TrackCollection()
	window.Tracks = new TrackCollectionView(collection: library)
	window.statusBar = new StatusBar(collection: library)
	return Tracks

)
