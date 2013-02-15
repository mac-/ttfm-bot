/*

*/
module.exports = function AchievementsTrackerAddOn(bot, options) {

	var self = this,
		AchievementsTracker = require('./domain/AchievementsTracker'),
		getMyAchievements = function(msgData, issuerId, replyFunc) {
			
			replyFunc('This feature is experimental. Current achievements may be lost during this time.');
			achievementsTracker.getByUser(issuerId, function(err, achievements) {
				if (err) {
					console.log(err);
					replyFunc('There was an error trying to get your achievements');
					return;
				}
				bot.getUserInfo(issuerId, function(userData) {
					if (!userData) {
						replyFunc('Unable to find user');
					}
					else if (achievements.length > 0) {
						replyFunc('Achievements for @' + userData.name + ' (' + achievements.length + '): ' + achievements.join(', '));
					}
					else {
						replyFunc('It looks like you don\'t have any achievements, @' + userData.name);
					}
				});

			});
		},
		listAllAchievements = function(msgData, issuerId, replyFunc) {
			
			var achievements = achievementsTracker.achievements,
				messages = [];
			messages.push(':heavy_minus_sign::heavy_minus_sign::heavy_minus_sign::heavy_minus_sign::heavy_minus_sign::heavy_minus_sign::heavy_minus_sign::heavy_minus_sign:');
			messages.push('This feature is experimental. Achievements may change at any time.');

			achievements.forEach(function(achievement) {
				messages.push(achievement.icon + ' ' + achievement.name + ' - ' + achievement.description);
			});

			replyFunc(messages);

		},
		userUpdateHandler = function(userId, oldData, newData) {
			achievementsTracker.check(userId, oldData, newData, bot);
		},
		songUpdateHandler = function(oldData, newData) {
			achievementsTracker.check(newData.djIds[newData.djIds.length-1], oldData, newData, bot);
			if (newData.upVoteLog && newData.upVoteLog.length > 0) {
				achievementsTracker.check(newData.upVoteLog[newData.upVoteLog.length-1].userId, oldData, newData, bot);
			}
			if (newData.snagLog && newData.snagLog.length > 0) {
				achievementsTracker.check(newData.snagLog[newData.snagLog.length-1].userId, oldData, newData, bot);
			}
		},
		dbConnectionStringChangeHandler = function(oldValue, newValue) {
			achievementsTracker = new AchievementsTracker(self.options.dbConnectionString.value);
		};

	this.name = 'achievements-tracker';

	this.description = 'Keeps track of achievements that users can attain in the room.';

	this.commands = [{
			primaryCommand: '/mine',
			secondaryCommands: [],
			help: 'list the achievements you\'ve earned in this room',
			moderatorOnly: false,
			action: getMyAchievements
		},
		{
			primaryCommand: '/achievements',
			secondaryCommands: [],
			help: 'list all available achievements',
			moderatorOnly: false,
			action: listAllAchievements
		}];

	this.options = {
		dbConnectionString: {
			value: 'mongodb://localhost:27017/ttfm',
			type: String,
			description: 'The string used to connect to a MongoDB instance.',
			isValid: function(val) {
				return (val.indexOf('mongodb://') === 0);
			},
			onChange: dbConnectionStringChangeHandler
		}
	};

	this.enable = function() {
		bot.on('userUpdate', userUpdateHandler);
		bot.on('songUpdate', songUpdateHandler);
	};

	this.disable = function() {
		bot.removeListener('userUpdate', userUpdateHandler);
		bot.removeListener('songUpdate', songUpdateHandler);
	};


	var achievementsTracker = new AchievementsTracker(self.options.dbConnectionString.value);
	achievementsTracker.on('new', function(userId, ach) {
		bot.getUserInfo(userId, function(userData) {
			if (userData) {
				bot.speak(':eight_spoked_asterisk: Congrats @' + userData.name + '! You got some new achievements: ' + ach.join(', '));
			}
			else {
				console.log('Unable to get user info for tracking achievements');
			}
		});
	});

};