
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
			bot.speak('Congrats @' + stalkerData.user.name + '! You got some new achievements: ' + ach.join(', '));
			bot.removeFan(bot.userId);
		});
	});

	userTracker.on('update', function(userId, oldData, newData) {
		achievementsTracker.check(userId, oldData, newData, bot);
	});

	songTracker.on('update', function(oldData, newData) {
		achievementsTracker.check(newData.djIds[newData.djIds.length-1], oldData, newData, bot);
	});

	bot.addOns.statsTracker = {};
	bot.addOns.statsTracker.getAchievementsByUserId = achievementsTracker.getByUser;
	bot.addOns.statsTracker.allAchievements = achievementsTracker.achievements;


	bot.on('registered', function(data) {
		if (data.success) {
			if (bot.userId !== data.user[0].userid) {

				userTracker.checkUser(data.user[0].userid, function(user) {
					if (!user) {
						var greeting = 'Welcome ' + data.user[0].name + '! I am the moderator of this room and you can opt into the achievements that I am tracking. ' +
									'If you wish to play, type "/play" in the chat window. Enjoy your time here.';
						setTimeout(function() {
							bot.pm(greeting, data.user[0].userid);
						}, 10000);
					}
					else if (user.isBanned) {
						bot.boot(user.userId, 'You have been banned');
					}
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
				if (voteUp && data.room.metadata.votelog[0][0] !== bot.userId) {
					userTracker.updateUserVotes(data.room.metadata.votelog[0][0], voteUp, 'given');
				}
			});


		}
	});


	// EXTENDED EVENTS

	bot.on('play_command', function(userId) {
		bot.getProfile(userId, function(profileData) {
			profileData.isBanned = false;
			userTracker.createUser(profileData);
		});
	});

	bot.on('ban_command', function(userId) {
		userTracker.checkUser(userId, function(user) {
			console.log(user);
			if (user) {
				bot.getProfile(userId, function(profileData) {
					profileData.isBanned = true;
					userTracker.updateUser(profileData);
				});
			}
			else {
				bot.getProfile(userId, function(profileData) {
					profileData.isBanned = true;
					userTracker.createUser(profileData);
				});
			}
			bot.boot(userId, 'You have been banned');
			
		});
	});

	bot.on('unban_command', function(userName) {
		userTracker.checkUserByName(userName, function(user) {
			if (user[0]) {
				bot.getProfile(user[0].userid, function(profileData) {
					profileData.isBanned = false;
					userTracker.updateUser(profileData);
				});
			}
			
		});
	});

	bot.on('get_song_stats_command', function(songId) {
		songTracker.getSongsWithMostUpVotes(10, function(){});
		songTracker.getSongData(songId, function(err, songDetails) {
			bot.emit('song_stats', songDetails);
		});
	});

	bot.on('get_top_songs_command', function(limit) {
		songTracker.getSongsWithMostVotes(limit, 'up', function(err, songs) {
			bot.emit('top_songs', songs);
		});
	});

	bot.on('get_bottom_songs_command', function(limit) {
		songTracker.getSongsWithMostVotes(limit, 'down', function(err, songs) {
			bot.emit('bottom_songs', songs);
		});
	});

};