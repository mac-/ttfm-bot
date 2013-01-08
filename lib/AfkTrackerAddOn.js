/*
	Adds new events to the ttfm bot. Bot will emit 'afk' events when a user becomes inactive
	and 'active' events when a user becomes active again.
*/
module.exports = function AfkTrackerAddOn(bot, options) {
	options = options || {};

	var afkThreshold = options.afkThreshold || 60 * 1000 * 10, // 10 minutes of inactivity will cause user to be flagged as afk
		usersInRoom = {},
		updateActivity = function(userId, activityType) {
			if (bot.userId !== userId) {
				if (activityType === 'deregistered') {
					clearInterval(usersInRoom[userId].intervalId);
					delete usersInRoom[userId];
					return;
				}
				if (!usersInRoom.hasOwnProperty(userId)) {
					usersInRoom[userId] = { lastActivity: {}, isAfk: false, intervalId: null };
					// check for inactivity every 10 seconds
					usersInRoom[userId].intervalId = setInterval(function() {
						if (!usersInRoom[userId].isAfk && (new Date() - usersInRoom[userId].lastActivity.date) >= afkThreshold) {
							bot.emit('afk', userId);
							usersInRoom[userId].isAfk = true;
						}
					}, 10000);
				}
				usersInRoom[userId].lastActivity = {
					type: activityType,
					date: new Date()
				};
				if (usersInRoom[userId].isAfk) {
					bot.emit('active', userId);
					usersInRoom[userId].isAfk = false;
				}
			}
		},
		speakAfkTimes = function(msgData) {
			var prop,
				isPm = msgData.hasOwnProperty('senderid'),
				userId = (isPm) ? msgData.senderid : msgData.userid,
				speakFunc = function(text) {
					if (isPm) {
						return bot.pm(text, userId);
					}
					bot.speak(text);
				};
			for (prop in usersInRoom) {
				(function(userId, timeSinceLastActivity, isAfk) {
					bot.getUserInfo(userId, function(userInfo) {
						if (userInfo) {
							if (isAfk) {
								var hours = 0,
									minutes = 0,
									seconds = 0,
									totalSeconds = Math.floor(timeSinceLastActivity / 1000),
									totalMinutes = Math.floor(totalSeconds / 60),
									totalHours = Math.floor(totalMinutes / 60),
									totalDays = Math.floor(totalHours / 24),
									timeStr = '';

								if (Math.floor(totalDays) > 0) {
									timeStr += totalDays + ' days, ';
								}
								if (Math.floor(totalHours) > 0) {
									hours = totalHours % 24;
									timeStr += hours + ' hours, ';
								}
								if (Math.floor(totalMinutes) > 0) {
									minutes = totalMinutes % 60;
									timeStr += minutes + ' minutes, ';
								}
								if (Math.floor(totalSeconds) > 0) {
									seconds = totalSeconds % 60;
									timeStr += seconds + ' seconds';
								}

								speakFunc(':zzz: ' + userInfo.name + ' has been inactive for ' + timeStr);
							}
							else {
								speakFunc(':zap: ' + userInfo.name + ' is active');
							}
						}
						else {
							console.log('There was a problem getting user information about user:', userId);
						}
					});
				}(prop, new Date() - usersInRoom[prop].lastActivity.date, usersInRoom[prop].isAfk));
			}
		},
		connectHandler = function() {
			bot.getCurrentUsersInRoom(function(users) {
				for (var prop in users) {
					updateActivity(prop, 'registered');
				}
			});
		},
		registeredHandler = function(data) {
			if (data.success) {
				updateActivity(data.user[0].userid, 'registered');
			}
		},
		deregisteredHandler = function(data) {
			if (data.success) {
				updateActivity(data.user[0].userid, 'deregistered');
			}
		},
		updateVotesHandler = function(data) {
			if (data.success) {
				// if a user down votes, it's not always known who did it,
				// so don't track activity for down votes
				if (data.room.metadata.votelog[0][1] === 'up') {
					updateActivity(data.room.metadata.votelog[0][0], 'update_votes');
				}
			}
		},
		updateUserHandler = function(data) {
			// update user fires for a user when someone becomes a fan of them,
			// so let's not update activity in this case
			if (!data.hasOwnProperty('fans')) {
				updateActivity(data.userid, 'update_user');
			}
		},
		addDjHandler = function(data) {
			if (data.success) {
				updateActivity(data.user[0].userid, 'add_dj');
			}
		},
		removeDjHandler = function(data) {
			if (data.success) {
				updateActivity(data.user[0].userid, 'rem_dj');
			}
		},
		snaggedHandler = function(data) {
			//if (data.success) {
				updateActivity(data.userid, 'snagged');
			//}
		},
		pmmedHandler = function(data) {
			//if (data.success) {
				updateActivity(data.senderid, 'pmmed');
			//}
		},
		speakHandler = function(data) {
			//if (data.success) {
				updateActivity(data.userid, 'speak');
			//}
		};

	this.name = 'afk-tracker';

	this.description = 'Keeps track of activity of all users in the room and determines when users become AFK.';

	this.commands = [{
		primaryCommand: '/afk',
		secondaryCommands: [],
		help: 'list each user\'s time of inactivity',
		moderatorOnly: false,
		action: speakAfkTimes
	}];

	this.enable = function() {
		// after the bot is connected, get initial data about users already in the room
		bot.on('connect', connectHandler);
		bot.on('registered', registeredHandler);
		bot.on('deregistered', deregisteredHandler);
		bot.on('update_votes', updateVotesHandler);
		bot.on('update_user', updateUserHandler);
		bot.on('add_dj', addDjHandler);
		bot.on('rem_dj', removeDjHandler);
		bot.on('snagged', snaggedHandler);
		bot.on('pmmed', pmmedHandler);
		bot.on('speak', speakHandler);
	};

	this.disable = function() {
		// after the bot is connected, get initial data about users already in the room
		bot.removeListener('connect', connectHandler);
		bot.removeListener('registered', registeredHandler);
		bot.removeListener('deregistered', deregisteredHandler);
		bot.removeListener('update_votes', updateVotesHandler);
		bot.removeListener('update_user', updateUserHandler);
		bot.removeListener('add_dj', addDjHandler);
		bot.removeListener('rem_dj', removeDjHandler);
		bot.removeListener('snagged', snaggedHandler);
		bot.removeListener('pmmed', pmmedHandler);
		bot.removeListener('speak', speakHandler);
		for (var prop in usersInRoom) {
			clearInterval(usersInRoom[prop].intervalId);
		}
		usersInRoom = {};
	};


};