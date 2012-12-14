var mongoose = require('mongoose'),
	util = require('util'),
	EventEmitter = require('events').EventEmitter,
	userSchema = mongoose.Schema({
		name: String,
		userid: String,
		laptop: String,
		fans: Number,
		points: Number,
		avatarid: Number,
		topartists: String,
		_id: String
	});

userSchema.path('userid').set(function(val) {
	this._id = val;
	return val;
});

var UserTracker = function(dbConnectionString) {

	var connected = false;
	//var db = mongoose.createConnection('mongodb://teslabot:Nikola73514@ds045507.mongolab.com:45507/ttfm');
	var db = mongoose.createConnection(dbConnectionString),
		User = db.model('User', userSchema);
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function callback () {
		// yay!
		console.log('UserTracker is connected to the DB');
		connected = true;
	});

	var self = this;

	this.updateUser = function(userData) {
		if (connected) {
			var user = new User(userData);
			User.findById(user._id, function(err, doc) {
				var oldData = doc;
				if (!doc) {
					user.save(function(err, data) {
						if (err) {
							console.error('UserTracker could not create user:', user);
							return;
						}
						self.emit('update', user.userid, oldData, user);
					});
				}
				else {
					doc.set(userData);
					doc.save(function(err, data) {
						if (err) {
							console.error('UserTracker could not update user:', user);
							return;
						}
						self.emit('update', user.userid, oldData, user);
					});
				}
				
			});
		}
		else {
			console.error('UserTracker is not connected to the DB.');
		}
	};
};

util.inherits(UserTracker, EventEmitter);

module.exports = UserTracker;