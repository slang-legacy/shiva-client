format_sec = (secs) ->
	pad = (n) ->
		if n < 10 then "0#{n}" else n

	h = Math.floor(secs / 3600)
	m = Math.floor((secs / 3600) % 1 * 60)
	s = Math.floor((secs / 60) % 1 * 60)

	if h is 0
		if m is 0
			return "#{s}s"
		else
			"#{m}:#{pad(s)}"
	else
		"h:#{pad(m)}:#{pad(s)}"

# deals with the music collection as a whole. yep: it loads your entire music
# collection into your browser
define(['jquery', 'deepmodel', 'localstorage', 'test_data'], ($, Backbone) ->
	class Track extends Backbone.DeepModel
		defaults:
			playing: false
			elapsed: 0

		update_playing: ->
			if @get 'playing'
				wavesurfer.load "#{@get('files.audio/mp3')}"
			#wavesurfer.playAt 0
		
		update_elapsed: ->
			@set elapsed: ~~(@get('progress') * @get('1length'))

		sync: ->
			false # changes to Tracks don't get stored anywhere yet

		initialize: ->
			_.bindAll @

			#fix the artist
			if artist_id = @get 'artist.id'
				@set 'artist', artists.where(id: artist_id)[0]

			#fix the album
			if album_id = @get 'album.id'
				@set 'album', albums.where(id: album_id)[0]

			@on('change:progress', @update_elapsed)
			@on('change:playing', @update_playing)


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

		play: ->
			library.change_track @model.get('id')

		events:
			'click': 'play'

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
			current_track = @collection.current_track()
			p current_track

			if current_track.get('artist')?
				artist = " by #{current_track.get('artist').get 'name'}"
			else
				artist = ''

			if current_track.get('album')?
				album = "<br/>from #{current_track.get('album').get 'name'}"
				$('#album_art').attr src: current_track.get('album').get('cover')
			else
				album = ''
				$('#album_art').attr(
					src: 'http://wortraub.com/wp-content/uploads/2012/07/Vinyl_Close_Up.jpg'
				)

			$('#current_song').html("""
				#{current_track.get 'title'}#{artist}#{album}
			""")


			#@update_progress()

		###*
		 * for moving the progress bar
		 * @return {[type]} [description]
		###
		update_progress: ->
			current_track = @collection.current_track()
			$('#progress').html("""
				<p>#{format_sec current_track.get('elapsed')} of
				#{format_sec current_track.get('1length')} </p>
			""")

			$('#progress').css(width:"#{current_track.get('progress') * 100}%")

		initialize: ->
			_.bindAll @
			@collection.on('change:playing', @render)
			@collection.on('change:progress', @update_progress)


	class Artist extends Backbone.DeepModel
		sync: ->
			false # changes to Artists don't get stored anywhere yet

	class ArtistCollection extends Backbone.Collection
		model: Artist

	class Album extends Backbone.DeepModel
		sync: ->
			false # changes to Artists don't get stored anywhere yet

	class AlbumCollection extends Backbone.Collection
		model: Album

	window.albums = new AlbumCollection(window.sample_albums)
	window.artists = new ArtistCollection(window.sample_artists)

	window.library = new TrackCollection()
	window.tracks = new TrackCollectionView(collection: library)
	window.statusBar = new StatusBar(collection: library)

	library.add sample_tracks
	return tracks

)
