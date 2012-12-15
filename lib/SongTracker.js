var mongoose = require('mongoose'),
	util = require('util'),
	EventEmitter = require('events').EventEmitter,
	songSchema = mongoose.Schema({
		song: String,
		album: String,
		artist: String,
		length: Number,
		startTimes: Array,
		djIds: Array,
		upVotes: Number,
		downVotes: Number,
		_id: String
	});


var SongTracker = function(dbConnectionString) {

	var connected = false;
	//var db = mongoose.createConnection('mongodb://teslabot:Nikola73514@ds045507.mongolab.com:45507/ttfm');
	var db = mongoose.createConnection(dbConnectionString),
		Song = db.model('Song', songSchema);
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function callback () {
		// yay!
		console.log('SongTracker is connected to the DB');
		connected = true;
	});

	var self = this;

	this.updateVotes = function(upVote, songId) {
		if (connected) {
			Song.findById(songId, function(err, doc) {
				var oldData = doc;
				if (!doc) {
					console.error('SongTracker could not update votes. Song was not found:', songId);
				}
				else {
					if (upVote) {
						doc.upVotes++;
					}
					else{
						doc.downVotes++;
					}
					doc.save(function(err, data) {
						if (err) {
							console.error('SongTracker could not update song:', doc);
							return;
						}
						self.emit('update', oldData, doc);
					});
				}
				
			});
		}
		else {
			console.error('SongTracker is not connected to the DB.');
		}
	};

	this.updateSongDetails = function(songData) {
		var modifiedData = {};
		modifiedData._id = songData.room.metadata.current_song._id;
		modifiedData.song = songData.room.metadata.current_song.metadata.song;
		modifiedData.album = songData.room.metadata.current_song.metadata.album;
		modifiedData.artist = songData.room.metadata.current_song.metadata.artist;
		modifiedData.length = songData.room.metadata.current_song.metadata.length;
		modifiedData.startTimes = [new Date(songData.room.metadata.current_song.starttime * 1000)];
		modifiedData.djIds = [songData.room.metadata.current_dj];
		modifiedData.upVotes = 0;
		modifiedData.downVotes = 0;

		if (connected) {
			var song = new Song(modifiedData);
			Song.findById(song._id, function(err, doc) {
				var oldData = doc;
				if (!doc) {
					song.save(function(err, data) {
						if (err) {
							console.error('SongTracker could not create song:', song);
							return;
						}
						self.emit('update', oldData, song);
					});
				}
				else {
					doc.startTimes.push(modifiedData.startTimes[0]);
					doc.djIds.push(modifiedData.djIds[0]);
					doc.save(function(err, data) {
						if (err) {
							console.error('SongTracker could not update song:', doc);
							return;
						}
						self.emit('update', oldData, doc);
					});
				}
				
			});
		}
		else {
			console.error('SongTracker is not connected to the DB.');
		}
	};
};

util.inherits(SongTracker, EventEmitter);

module.exports = SongTracker;