
module.exports = function StatsTrackerAddOn(bot, dbConnString) {

	var AchievementsTracker = require('./AchievementsTracker'),
		achievementsTracker = new AchievementsTracker(dbConnString);

	achievementsTracker.on('new', function(ach) {
		console.log('new achievements!', ach);
	});


	var UserTracker = require('./UserTracker'),
		userTracker = new UserTracker(dbConnString);


	userTracker.on('update', function(userId, oldData, newData) {
		
		achievementsTracker.check(userId, oldData, newData);
	});



	bot.on('registered', function(data) {
		if (data.success) {
			if (bot.userId !== data.user[0].userid) {
				bot.getProfile(data.user[0].userid, function(profileData) {
					userTracker.updateUser(profileData);
				});
			}
		}
	});

};