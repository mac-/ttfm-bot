
module.exports = function StatsTrackerAddOn(bot, dbConnString) {
	bot.addOns = bot.addOns || {};

	var AchievementsTracker = require('./AchievementsTracker'),
		achievementsTracker = new AchievementsTracker(dbConnString),
		UserTracker = require('./UserTracker'),
		userTracker = new UserTracker(dbConnString),
		SongTracker = require('./SongTracker'),
		songTracker = new SongTracker(dbConnString);

	achievementsTracker.on('new', function(userId, ach) {
		bot.stalk(userId, true, function(stalkerData) {
			//bot.speak('Congrats @' + stalkerData.user.name + '! You got some new achievements: ' + ach.join(', '));
			bot.removeFan(bot.userId);
		});
	});

	userTracker.on('update', function(userId, oldData, newData) {
		achievementsTracker.check(userId, oldData, newData);
	});

	songTracker.on('update', function(oldData, newData) {
		//achievementsTracker.check(userId, oldData, newData);
	});

	bot.addOns.statsTracker = {};
	bot.addOns.statsTracker.getAchievementsByUserId = achievementsTracker.getByUser;
	bot.addOns.statsTracker.allAchievements = achievementsTracker.achievements;


	bot.on('registered', function(data) {
		if (data.success) {
			if (bot.userId !== data.user[0].userid) {
				bot.getProfile(data.user[0].userid, function(profileData) {
					userTracker.updateUser(profileData);
				});
			}
		}
	});


	bot.on('newsong', function(data) {
		if (data.success) {
			songTracker.updateSongDetails(data);
		}
	});

	bot.on('update_votes', function(data) {
		if (data.success) {
			bot.roomInfo(function(roomData) {
				var voteUp = (data.room.metadata.votelog[0][1] === 'up');
				songTracker.updateVotes(voteUp, roomData.room.metadata.current_song._id);

				userTracker.updateUserVotes(roomData.room.metadata.current_song.djid, voteUp, 'recieved');
				// only track up votes given, since down votes given are essentially hidden
				if (voteUp) {
					userTracker.updateUserVotes(data.room.metadata.votelog[0][0], voteUp, 'given');
				}
			});


		}
	});

};