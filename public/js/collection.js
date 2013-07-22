(function() {
  var format_sec,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  format_sec = function(secs) {
    var h, m, pad, s;
    pad = function(n) {
      if (n < 10) {
        return "0" + n;
      } else {
        return n;
      }
    };
    h = Math.floor(secs / 3600);
    m = Math.floor((secs / 3600) % 1 * 60);
    s = Math.floor((secs / 60) % 1 * 60);
    if (h === 0) {
      if (m === 0) {
        return "" + s + "s";
      } else {
        return "" + m + ":" + (pad(s));
      }
    } else {
      return "h:" + (pad(m)) + ":" + (pad(s));
    }
  };

  define(['jquery', 'deepmodel', 'localstorage', 'test_data'], function($, Backbone) {
    var Album, AlbumCollection, Artist, ArtistCollection, StatusBar, Track, TrackCollection, TrackCollectionView, TrackView, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8;
    Track = (function(_super) {
      __extends(Track, _super);

      function Track() {
        _ref = Track.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      Track.prototype.defaults = {
        playing: false,
        elapsed: 0
      };

      Track.prototype.update_playing = function() {
        if (this.get('playing')) {
          return wavesurfer.load("" + (this.get('files.audio/mp3')));
        }
      };

      Track.prototype.update_elapsed = function() {
        return this.set({
          elapsed: ~~(this.get('progress') * this.get('1length'))
        });
      };

      Track.prototype.sync = function() {
        return false;
      };

      Track.prototype.initialize = function() {
        var album_id, artist_id;
        _.bindAll(this);
        if (artist_id = this.get('artist.id')) {
          this.set('artist', artists.where({
            id: artist_id
          })[0]);
        }
        if (album_id = this.get('album.id')) {
          this.set('album', albums.where({
            id: album_id
          })[0]);
        }
        this.on('change:progress', this.update_elapsed);
        return this.on('change:playing', this.update_playing);
      };

      return Track;

    })(Backbone.DeepModel);
    TrackView = (function(_super) {
      __extends(TrackView, _super);

      function TrackView() {
        _ref1 = TrackView.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      TrackView.prototype.render = function() {
        this.$el.html("" + (this.model.get('title')));
        return this.update_playing();
      };

      TrackView.prototype.update_playing = function() {
        if (this.model.get('playing')) {
          return this.$el.addClass('playing');
        } else {
          return this.$el.removeClass('playing');
        }
      };

      TrackView.prototype.play = function() {
        return library.change_track(this.model.get('id'));
      };

      TrackView.prototype.events = {
        'click': 'play'
      };

      TrackView.prototype.initialize = function() {
        _.bindAll(this);
        this.model.view = this;
        this.model.on('change:playing', this.update_playing);
        return this.render();
      };

      return TrackView;

    })(Backbone.View);
    TrackCollection = (function(_super) {
      __extends(TrackCollection, _super);

      function TrackCollection() {
        _ref2 = TrackCollection.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      TrackCollection.prototype.model = Track;

      TrackCollection.prototype.current_track = function() {
        return this.where({
          playing: true
        })[0];
      };

      TrackCollection.prototype.change_track = function(track_id) {
        var track;
        track = this.where({
          id: track_id
        })[0];
        try {
          this.current_track().set({
            playing: false
          });
        } catch (_error) {}
        if (track != null) {
          return track.set({
            playing: true
          });
        } else {
          return p("" + track_id + " doesn't exist");
        }
      };

      return TrackCollection;

    })(Backbone.Collection);
    TrackCollectionView = (function(_super) {
      __extends(TrackCollectionView, _super);

      function TrackCollectionView() {
        _ref3 = TrackCollectionView.__super__.constructor.apply(this, arguments);
        return _ref3;
      }

      TrackCollectionView.prototype.el = $('#songs');

      TrackCollectionView.prototype.added_track = function(track_model) {
        var track;
        track = new TrackView({
          model: track_model
        });
        this.$el.append(track.el);
        return p(track);
      };

      TrackCollectionView.prototype.initialize = function() {
        _.bindAll(this);
        return this.collection.on('add', this.added_track);
      };

      return TrackCollectionView;

    })(Backbone.View);
    StatusBar = (function(_super) {
      __extends(StatusBar, _super);

      function StatusBar() {
        _ref4 = StatusBar.__super__.constructor.apply(this, arguments);
        return _ref4;
      }

      StatusBar.prototype.el = $('#status_bar');

      /**
      		 * for when the track changes
      		 * @return {[type]} [description]
      */


      StatusBar.prototype.render = function() {
        var album, artist, current_track;
        current_track = this.collection.current_track();
        p(current_track);
        if (current_track.get('artist') != null) {
          artist = " by " + (current_track.get('artist').get('name'));
        } else {
          artist = '';
        }
        if (current_track.get('album') != null) {
          album = "<br/>from " + (current_track.get('album').get('name'));
          $('#album_art').attr({
            src: current_track.get('album').get('cover')
          });
        } else {
          album = '';
          $('#album_art').attr({
            src: 'http://wortraub.com/wp-content/uploads/2012/07/Vinyl_Close_Up.jpg'
          });
        }
        return $('#current_song').html("" + (current_track.get('title')) + artist + album);
      };

      /**
      		 * for moving the progress bar
      		 * @return {[type]} [description]
      */


      StatusBar.prototype.update_progress = function() {
        var current_track;
        current_track = this.collection.current_track();
        $('#progress').html("<p>" + (format_sec(current_track.get('elapsed'))) + " of\n" + (format_sec(current_track.get('1length'))) + " </p>");
        return $('#progress').css({
          width: "" + (current_track.get('progress') * 100) + "%"
        });
      };

      StatusBar.prototype.initialize = function() {
        _.bindAll(this);
        this.collection.on('change:playing', this.render);
        return this.collection.on('change:progress', this.update_progress);
      };

      return StatusBar;

    })(Backbone.View);
    Artist = (function(_super) {
      __extends(Artist, _super);

      function Artist() {
        _ref5 = Artist.__super__.constructor.apply(this, arguments);
        return _ref5;
      }

      Artist.prototype.sync = function() {
        return false;
      };

      return Artist;

    })(Backbone.DeepModel);
    ArtistCollection = (function(_super) {
      __extends(ArtistCollection, _super);

      function ArtistCollection() {
        _ref6 = ArtistCollection.__super__.constructor.apply(this, arguments);
        return _ref6;
      }

      ArtistCollection.prototype.model = Artist;

      return ArtistCollection;

    })(Backbone.Collection);
    Album = (function(_super) {
      __extends(Album, _super);

      function Album() {
        _ref7 = Album.__super__.constructor.apply(this, arguments);
        return _ref7;
      }

      Album.prototype.sync = function() {
        return false;
      };

      return Album;

    })(Backbone.DeepModel);
    AlbumCollection = (function(_super) {
      __extends(AlbumCollection, _super);

      function AlbumCollection() {
        _ref8 = AlbumCollection.__super__.constructor.apply(this, arguments);
        return _ref8;
      }

      AlbumCollection.prototype.model = Album;

      return AlbumCollection;

    })(Backbone.Collection);
    window.albums = new AlbumCollection(window.sample_albums);
    window.artists = new ArtistCollection(window.sample_artists);
    window.library = new TrackCollection();
    window.tracks = new TrackCollectionView({
      collection: library
    });
    window.statusBar = new StatusBar({
      collection: library
    });
    library.add(sample_tracks);
    return tracks;
  });

}).call(this);
