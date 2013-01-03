/*
	Adds new events to the ttfm bot. Bot will emit 'afk' events when a user becomes inactive
	and 'active' events when a user becomes active again.
*/
module.exports = function AfkTrackerAddOn(bot, afkThreshold) {
	bot.addOns = bot.addOns || {};

	var afkThreshold = afkThreshold || 60 * 1000 * 10, // 10 minutes of inactivity will cause user to be flagged as afk
		usersInRoom = {},
		updateActivity = function(userId, activityType) {
			if (bot.userId !== userId) {
				if (activityType === 'deregistered') {
					clearInterval(usersInRoom[userId].intervalId);
					delete usersInRoom[userId];
					return;
				}
				if (activityType === 'registered') {
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
		};

	bot.addOns.afkTracker = {};

	bot.addOns.afkTracker.isUserAfk = function(userId) {
		var isAfk = (usersInRoom.hasOwnProperty(userId)) ? usersInRoom[userId].isAfk : false;
		return isAfk;
	};

	bot.addOns.afkTracker.getAllInactivityTimes = function() {
		var prop, timesByUserId = {};
		for (prop in usersInRoom) {
			timesByUserId[prop] = {
				timeSinceLastActivity: new Date() - usersInRoom[prop].lastActivity.date,
				isAfk: usersInRoom[prop].isAfk
			}
		}
		return timesByUserId;
	};


	// after the bot is connected, get initial data about users already in the room
	bot.on('connect', function() {
		bot.getCurrentUsersInRoom(function(users) {
			for (var prop in users) {
				updateActivity(prop, 'registered');
			}
		});
	});
	


	bot.on('registered', function(data) {
		if (data.success) {
			updateActivity(data.user[0].userid, 'registered');
		}
	});

	bot.on('deregistered', function(data) {
		if (data.success) {
			updateActivity(data.user[0].userid, 'deregistered');
		}
	});

	bot.on('update_votes', function(data) {
		if (data.success) {
			// if a user down votes, it's not always known who did it,
			// so don't track activity for down votes
			if (data.room.metadata.votelog[0][1] === 'up') {
				updateActivity(data.room.metadata.votelog[0][0], 'update_votes');
			}
		}
	});

	bot.on('update_user', function(data) {
		// update user fires for a user when someone becomes a fan of them,
		// so let's not update activity in this case
		if (!data.hasOwnProperty('fans')) {
			updateActivity(data.userid, 'update_user');
		}
	});

	bot.on('add_dj', function(data) {
		if (data.success) {
			updateActivity(data.user[0].userid, 'add_dj');
		}
	});

	bot.on('rem_dj', function(data) {
		if (data.success) {
			updateActivity(data.user[0].userid, 'rem_dj');
		}
	});

	bot.on('snagged', function(data) {
		//if (data.success) {
			updateActivity(data.userid, 'snagged');
		//}
	});

	bot.on('pmmed', function(data) {
		//if (data.success) {
			updateActivity(data.senderid, 'pmmed');
		//}
	});

	bot.on('speak', function(data) {
		//if (data.success) {
			updateActivity(data.userid, 'speak');
		//}
	});


};