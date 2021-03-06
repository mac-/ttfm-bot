var mongoose = require('mongoose'),
	util = require('util'),
	EventEmitter = require('events').EventEmitter,
	achievementSchema = mongoose.Schema({
		userid: String,
		achievements: Array,
		_id: String
	});

achievementSchema.path('userid').set(function(val) {
	this._id = val;
	return val;
});

var AchievementsTracker = function(dbConnectionString) {

	var connected = false;
	var db = mongoose.createConnection(dbConnectionString),
		Achievement = db.model('Achievement', achievementSchema);
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function callback () {
		// yay!
		console.log('AchievementsTracker is connected to the DB');
		connected = true;
	});

	var hasAchievement = function(list, achName) {
		var has = false;
		for (var i = 0; i < list.length; i++) {
			if (list[i].name === achName) {
				has = true;
				break;
			}
		}
		return has;
	};

	var self = this;

	this.achievements = require('./Achievements');

	this.getByUser = function(userId, callback) {
		Achievement.findById(userId, function(err, doc) {
			if (err) {
				return callback(err, null);
			}
			else if (!doc) {
				var data = {
						userid: userId,
						achievements: []
					},
					achievement = new Achievement(data);
				achievement.save(function(err, data) {
					if (err) {
						console.error('AchievementsTracker could not create achievements for user:', userId);
						return callback(err);
					}
					return callback(null, []);
				});
			}
			var names = [];
			doc.achievements = doc.achievements || [];
			doc.achievements.forEach(function(ach) {
				names.push(ach.name);
			});
			callback(err, names);
		});
	};

	this.check = function(userId, oldData, newData, bot) {
		var newAchievements = [];
		if (connected) {
			Achievement.findById(userId, function(err, doc) {
				if (doc) {
					self.achievements.forEach(function(ach) {
						if (!hasAchievement(doc.achievements, ach.name)) {

							if (ach.check(oldData, newData, userId, bot)) {
								doc.achievements.push({
									name: ach.name,
									description: ach.description,
									date: new Date()
								});
								newAchievements.push(ach.name);
							}
						}
					});
					doc.save(function(err, data) {
						if (err) {
							console.error('AchievementsTracker could not update achievements for user:', userId);
							return;
						}
						if (newAchievements.length > 0) {
							self.emit('new', userId, newAchievements);
						}
					});
				}
				else {
					var data = {
							userid: userId,
							achievements: []
						},
						achievement = new Achievement(data);
					achievement.save(function(err, data) {
						if (err) {
							console.error('AchievementsTracker could not create achievements for user:', userId);
							return;
						}
					});
				}
				
			});
		}
		else {
			console.error('AchievementsTracker is not connected to the DB.');
		}
	};
};

util.inherits(AchievementsTracker, EventEmitter);

module.exports = AchievementsTracker;