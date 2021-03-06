var mongoose = require('mongoose'),
	util = require('util'),
	_ = require('underscore'),
	EventEmitter = require('events').EventEmitter,
	userSchema = mongoose.Schema({
		name: String,
		userid: String,
		laptop: String,
		fans: Number,
		points: Number,
		snags: Number,
		songsPlayed: Number,
		avatarid: Number,
		artistsPlayed: mongoose.Schema.Types.Mixed,
		upVotesGiven: Number,
		upVotesRecieved: Number,
		downVotesRecieved: Number,
		isBanned: Boolean,
		_id: String
	});

userSchema.path('userid').set(function(val) {
	this._id = val;
	return val;
});

var UserTracker = function(dbConnectionString) {

	var connected = false;
	var db = mongoose.createConnection(dbConnectionString),
		User = db.model('User', userSchema);
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function callback () {
		// yay!
		console.log('UserTracker is connected to the DB');
		connected = true;
	});

	var self = this;

	this.checkUser = function(userId, callback) {
		if (!userId || !callback) {
			throw Error('missing params');
		}
		if (connected) {
			User.findById(userId, function(err, doc) {
				callback(err, doc);
			});
		}
		else {
			console.error('UserTracker is not connected to the DB.');
			callback(new Error('UserTracker is not connected to the DB.'));
		}
	};

	this.checkUserByName = function(userName, callback) {
		if (!userName || !callback) {
			throw Error('missing params');
		}
		if (connected) {
			var nameRegex = new RegExp(userName, 'i');
			User.find({name: nameRegex}, function(err, doc) {
				callback(err, doc);
			});
		}
		else {
			console.error('UserTracker is not connected to the DB.');
			callback(new Error('UserTracker is not connected to the DB.'));
		}
	};

	this.findUser = function(userId, callback) {
		if (connected) {
			User.findById(userId, function(err, doc) {
				if (err || !doc) {
					console.error('UserTracker could not find user (doesn\'t exist):', userId);
					return callback(new Error('UserTracker could not find user (doesn\'t exist): ' + userId));
				}
				callback(null, doc);
			});
		}
		else {
			console.error('UserTracker is not connected to the DB.');
			callback(new Error('UserTracker is not connected to the DB.'));
		}
	};

	this.findAllBannedUsers = function(callback) {
		if (connected) {
			User.find({isBanned: true}, function(err, docs) {
				if (err || !docs) {
					return callback(new Error('UserTracker could not find any banned users'));
				}
				callback(null, docs);
			});
		}
		else {
			console.error('UserTracker is not connected to the DB.');
			callback(new Error('UserTracker is not connected to the DB.'));
		}
	};

	this.createUser = function(userData, callback) {
		if (connected) {
			userData.upVotesGiven = 0;
			userData.upVotesRecieved = 0;
			userData.downVotesRecieved = 0;
			userData.snags = 0;
			userData.artistsPlayed = {};
			var user = new User(userData);
			user.points = 0;
			user.save(function(err, data) {
				if (err) {
					console.error('UserTracker could not create user:', user);
					return;
				}
				self.emit('update', user.userid, null, user);
			});
		}
		else {
			console.error('UserTracker is not connected to the DB.');
			if (callback) callback(new Error('UserTracker is not connected to the DB.'));
		}
	};

	this.updateUser = function(userData, callback) {
		if (connected) {
			var user = new User(userData);
			User.findById(user._id, function(err, doc) {
				var oldData = _.clone(doc);
				if (!doc) {
					console.error('UserTracker could not update user (doesn\'t exist):', user);
				}
				else {
					userData.upVotesGiven = doc.upVotesGiven;
					userData.upVotesRecieved = doc.upVotesRecieved;
					userData.downVotesRecieved = doc.downVotesRecieved;
					userData.points = doc.points;
					userData.snags = doc.snags || 0;
					doc.set(userData);
					doc.save(function(err, data) {
						if (err) {
							console.error('UserTracker could not update user:', doc);
							return;
						}
						self.emit('update', doc.userid, oldData, doc);
					});
				}
				
			});
		}
		else {
			console.error('UserTracker is not connected to the DB.');
			if (callback) callback(new Error('UserTracker is not connected to the DB.'));
		}
	};

	this.updateUserVotes = function(userId, isUpVote, type, callback) {
		if (connected) {
			User.findById(userId, function(err, doc) {
				var oldData = _.clone(doc);
				if (!doc) {
					console.error('UserTracker could not update votes for user:', userId);
				}
				else {
					if (isUpVote) {
						if (type === 'given') {
							doc.upVotesGiven++;
						}
						else {
							doc.upVotesRecieved++;
							doc.points++;
						}
					}
					else {
						if (type !== 'given') {
							doc.downVotesRecieved++;
							doc.points--;
						}
					}
					doc.save(function(err, data) {
						if (err) {
							console.error('UserTracker could not update votes for user:', doc, err);
							return;
						}
						self.emit('update', userId, oldData, doc);
					});
				}
				
			});
		}
		else {
			console.error('UserTracker is not connected to the DB.');
			if (callback) callback(new Error('UserTracker is not connected to the DB.'));
		}
	};

	this.incrementUserArtists = function(userId, artistPlayed, callback) {
		if (connected) {
			User.findById(userId, function(err, doc) {
				var oldData = _.clone(doc);
				if (!doc) {
					console.error('UserTracker could not update artists for user:', userId);
				}
				else {
					doc.artistsPlayed = doc.artistsPlayed || {};
					if (doc.artistsPlayed.hasOwnProperty(artistPlayed)) {
						doc.artistsPlayed[artistPlayed]++;
					}
					else {
						doc.artistsPlayed[artistPlayed] = 1;
					}
					doc.markModified('artistsPlayed');
					doc.save(function(err, data) {
						if (err) {
							console.error('UserTracker could not update votes for user:', doc, err);
							return;
						}
						self.emit('update', userId, oldData, doc);
					});
				}
				
			});
		}
		else {
			console.error('UserTracker is not connected to the DB.');
			if (callback) callback(new Error('UserTracker is not connected to the DB.'));
		}
	};

	this.incrementUserProperty = function(userId, prop, callback) {
		if (connected) {
			User.findById(userId, function(err, doc) {
				var oldData = _.clone(doc);
				if (!doc) {
					console.error('UserTracker could not update ' + prop + ' for user:', userId);
				}
				else {
					if (!doc[prop]) {
						doc[prop] = 0;
					}
					doc[prop]++;
					doc.save(function(err, data) {
						if (err) {
							console.error('UserTracker could not update ' + prop + ' for user:', doc, err);
							return;
						}
						self.emit('update', userId, oldData, doc);
					});
				}
				
			});
		}
		else {
			console.error('UserTracker is not connected to the DB.');
			if (callback) callback(new Error('UserTracker is not connected to the DB.'));
		}
	};
};

util.inherits(UserTracker, EventEmitter);

module.exports = UserTracker;