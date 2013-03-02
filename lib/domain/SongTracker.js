var mongoose = require('mongoose'),
	util = require('util'),
	EventEmitter = require('events').EventEmitter,
	_ = require('underscore'),
	songSchema = mongoose.Schema({
		song: String,
		album: String,
		artist: String,
		length: Number,
		startTimes: Array,
		djIds: Array,
		upVotes: Number,
		downVotes: Number,
		upVoteLog: Array,
		snagLog: Array,
		_id: String
	}),
	cloneSongDoc = function(doc) {
		var newDoc;
		try {
			newDoc = JSON.parse(JSON.stringify(doc));
		}
		catch(ex) {
			newDoc = {};
		}
		return newDoc;
	},
	getUniqueKey = function(songData) {
		var key = songData.song + '|#|' + songData.artist;
		return key.replace(/\s/gi, "_");
	}

var SongTracker = function(dbConnectionString) {

	var connected = false;
	var db = mongoose.createConnection(dbConnectionString),
		Song = db.model('Song', songSchema);
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function callback () {
		// yay!
		console.log('SongTracker is connected to the DB');
		connected = true;
	});

	var self = this;

	this.getSongData = function(songData, callback) {
		var songId = getUniqueKey(songData);
		Song.findById(songId, function(err, doc) {
			if (doc) {
				callback(err, doc);
			}
			else {
				err = err || new Error('unable to get song details');
				callback(err, null);
			}
		});
	};

	this.getAllSongDataByTitleAndArtist = function(songTitle, artist, callback) {
		var titleRegex, artistRegex, selector = {};
		try {
			titleRegex = new RegExp(songTitle, 'gi');
		}
		catch (ex) {
			return callback(new Error('Unable to parse song title regex'), null);
		}
		selector.song = titleRegex;
		if (artist) {
			try {
				artistRegex = new RegExp(artist, 'gi');
			}
			catch (ex) {
				return callback(new Error('Unable to parse artist regex'), null);
			}
			selector.artist = artistRegex;
		}
		var query = Song.find(selector);
		query.limit(4).exec(function(err, doc) {
			if (doc) {
				callback(err, doc);
			}
			else {
				err = err || new Error('unable to get song details');
				callback(err, null);
			}
		});
	};

	this.getSongsWithMostVotes = function(limit, upOrDown, callback) {
		upOrDown = (upOrDown === 'down') ? '-downVotes' : '-upVotes';
		limit = (limit > 15) ? 15 : Math.max(1, limit);
		var query = Song.find({upVotes: {$gte: 2}});

		query.limit(limit).sort(upOrDown).select('song artist upVotes downVotes').exec(function(err, doc) {
			if (doc) {
				callback(err, doc);
			}
			else {
				err = err || new Error('unable to get song details');
				callback(err, null);
			}
		});
	};



	this.updateVotes = function(songData, isUpVote, voterId) {
		if (connected) {
			var songId = getUniqueKey(songData);
			Song.findById(songId, function(err, doc) {
				var oldData = cloneSongDoc(doc);
				if (!doc) {
					console.error('SongTracker could not update votes. Song was not found:', songId);
				}
				else {
					if (isUpVote) {
						doc.upVotes++;
						doc.upVoteLog = doc.upVoteLog || [];
						doc.upVoteLog.push({
							userId: voterId,
							timeStamp: new Date()
						});
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

	this.updateSnags = function(songData, snagerId) {
		if (connected) {
			var songId = getUniqueKey(songData);
			Song.findById(songId, function(err, doc) {
				var oldData = cloneSongDoc(doc);
				if (!doc) {
					console.error('SongTracker could not update snags. Song was not found:', songId);
				}
				else {
					doc.snagLog.push({
						userId: snagerId,
						timeStamp: new Date()
					});
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
		modifiedData._id = getUniqueKey(songData);
		modifiedData.song = songData.song;
		modifiedData.album = songData.album;
		modifiedData.artist = songData.artist;
		modifiedData.length = songData.length;
		modifiedData.startTimes = [new Date(songData.starttime * 1000)];
		modifiedData.djIds = [songData.current_dj];
		modifiedData.upVotes = 0;
		modifiedData.downVotes = 0;

		if (connected) {
			var song = new Song(modifiedData);
			Song.findById(song._id, function(err, doc) {
				var oldData = cloneSongDoc(doc);
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
						console.log(err);
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