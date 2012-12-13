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

var achievements = require('./Achievements');

var AchievementsTracker = function(dbConnectionString) {

	var connected = false;
	//var db = mongoose.createConnection('mongodb://teslabot:Nikola73514@ds045507.mongolab.com:45507/ttfm');
	var db = mongoose.createConnection(dbConnectionString),
		Achievement = db.model('Achievement', achievementSchema);
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function callback () {
		// yay!
		console.log('mongo!');
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

	this.check = function(userId, oldData, newData) {
		var newAchievements = [];
		if (connected) {
			Achievement.findById(userId, function(err, doc) {
				if (!doc) {
					var newAch = new Achievement({ userid: userId, achievements: [] });

					achievements.forEach(function(ach) {
						if (ach.check(oldData, newData)) {
							newAch.achievements.push({
								name: ach.name,
								description: ach.description,
								date: new Date()
							});
							newAchievements.push(ach.name);
						}
					});

					newAch.save(function(err, data) {
						if (err) {
							console.error('AchievementsTracker could not create achievements for user:', userId);
							return;
						}
						if (newAchievements.length > 0) {
							self.emit('new', newAchievements);
						}
					});
				}
				else {
					achievements.forEach(function(ach) {
						if (!hasAchievement(doc.achievements, ach.name)) {

							if (ach.check(oldData, newData)) {
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
							self.emit('new', newAchievements);
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