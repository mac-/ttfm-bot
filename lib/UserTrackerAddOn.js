var _ = require('underscore');

module.exports = function UserTrackerAddOn(bot) {

	var self = this,
		banReasons = [
			'You just don\'t belong here...',
			'Your actions in this room remind me of a two year old',
			'I think it\'s time you take your antics to another room',
			'I suggest you read the rules of the room before rentering',
			'Intelligent life forms only!'
		],
		UserTracker = require('./domain/UserTracker'),
		announceMyStats = function(msgData, issuerId, replyFunc) {

			userTracker.findUser(issuerId, function(err, user) {
				if (err || !user) {
					return replyFunc(['Unable to retrieve the data']);
				}
				var i, icon, messages = [], artists = [], artist;
				if (user.artistsPlayed) {
					for (artist in user.artistsPlayed) {
						if (user.artistsPlayed.hasOwnProperty(artist)) {
							artists.push( {name: artist, count: user.artistsPlayed[artist] });
						}
					}
					artists = (artists.length > 0) ? _.pluck(_.last(_.sortBy(artists, 'count'), 3), 'name').join(', ') : 'Unknown';
				}
				else {
					artists = 'Unknown';
				}
				messages.push('Stats for ' + user.name);
				messages.push('Songs Played: ' + user.songsPlayed);
				messages.push('Points: ' + user.points);
				messages.push('Snags: ' + user.snags);
				messages.push('Up Votes Given: ' + user.upVotesGiven);
				messages.push('Up Votes Recieved: ' + user.upVotesRecieved);
				messages.push('Favorite Artists: ' + artists);
				replyFunc(messages);
			});
		},
		banUser = function(msgData, issuerId, replyFunc) {
			var args = msgData.text.split(/\s/);
			
			args.shift();
			var name = args.join(' ');
			bot.findUserIdInRoomByName(name, function(userId) {
				if (userId) {
					// random reasons array?
					userTracker.checkUser(userId, function(err, user) {
						var reason = banReasons[Math.round(Math.random() * (banReasons.length - 1))];
						if (user) {
							bot.getProfile(userId, function(profileData) {
								profileData.isBanned = true;
								userTracker.updateUser(profileData);
								bot.boot(userId, reason);
							});
						}
						else {
							bot.getProfile(userId, function(profileData) {
								profileData.isBanned = true;
								userTracker.createUser(profileData);
								bot.boot(userId, reason);
							});
						}
					});
				}
				else {
					replyFunc('Unable to find a user that matches "' + name + '"');
				}
			});
		},
		unbanUser = function(msgData, issuerId, replyFunc) {
			var args = msgData.text.split(/\s/);
			
			args.shift();
			var name = args.join(' ');

			userTracker.checkUserByName(name, function(err, user) {
				if (user[0]) {
					bot.getProfile(user[0].userid, function(profileData) {
						profileData.isBanned = false;
						userTracker.updateUser(profileData);
						replyFunc(name + ' has been unbanned');
					});
				}
				else {
					replyFunc('Unable to find banned user: ' + name);
				}
			});
		},
		listBannedUsers = function(msgData, issuerId, replyFunc) {
			userTracker.findAllBannedUsers(function(err, users) {
				if (err || !users || users.length < 1) {
					return replyFunc('There are no banned users');
				}
				var bannedUsers = _.pluck(users, 'name');
				replyFunc('The following users are banned: ' + bannedUsers.join(', '));
			});
		},
		registeredHandler = function(data) {
			if (data.success) {
				userTracker.checkUser(data.user[0].userid, function(err, user) {
					if (err || !user) {
						bot.getProfile(data.user[0].userid, function(profileData) {
							profileData.isBanned = false;
							userTracker.createUser(profileData);
						});
					}
					else if (user && user.isBanned) {
						bot.boot(user.userId, 'You have been banned');
					}
					else if (user && user.name !== data.user[0].name) {
						bot.getProfile(data.user[0].userid, function(profileData) {
							userTracker.updateUser(profileData);
						});
					}
				});
			}
		},
		connectHandler = function() {
			bot.getCurrentUsersInRoom(function(users) {
				if (!users) return;
				for (var prop in users) {
					userTracker.checkUser(prop, function(err, user) {
						if (user && user.isBanned) {
							bot.boot(user.userId, 'You have been banned');
						}
					});
				}
			});
		},
		newSongHandler = function(data) {
			if (data.success) {
				userTracker.incrementUserProperty(data.room.metadata.current_dj, 'songsPlayed');
				userTracker.incrementUserArtists(data.room.metadata.current_dj, data.room.metadata.current_song.metadata.artist);
			}
		},
		snagHandler = function(data) {
			userTracker.incrementUserProperty(data.userid, 'snags');
		},
		voteHandler = function(data) {
			if (data.success) {
				bot.roomInfo(function(roomData) {
					var voteUp = (data.room.metadata.votelog[0][1] === 'up');

					userTracker.updateUserVotes(roomData.room.metadata.current_song.djid, voteUp, 'recieved');
					// only track up votes given, since down votes given are essentially hidden
					if (voteUp && data.room.metadata.votelog[0][0] !== bot.userId) {
						userTracker.updateUserVotes(data.room.metadata.votelog[0][0], voteUp, 'given');
					}
				});
			}
		},
		dbConnectionStringChangeHandler = function(oldValue, newValue) {
			userTracker = new UserTracker(self.options.dbConnectionString.value);
		};

	this.name = 'user-tracker';

	this.description = 'Keeps track of users\' activity in this room. Adds banning functionality as well. Requires a connection to a MongoDB instance.';

	this.commands = [{
			primaryCommand: '/me',
			secondaryCommands: [],
			help: 'list your stats in this room',
			moderatorOnly: false,
			action: announceMyStats
		},
		{
			primaryCommand: '/ban',
			secondaryCommands: ['/gtfo'],
			arguments:['user'],
			help: 'bans a user from the room',
			moderatorOnly: true,
			action: banUser
		},
		{
			primaryCommand: '/unban',
			secondaryCommands: [],
			arguments:['user'],
			help: 'unbans a user from the room',
			moderatorOnly: true,
			action: unbanUser
		},
		{
			primaryCommand: '/lb',
			secondaryCommands: [],
			help: 'list banned users',
			moderatorOnly: true,
			action: listBannedUsers
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
		bot.on('newsong', newSongHandler);
		bot.on('snagged', snagHandler);
		bot.on('update_votes', voteHandler);
		bot.on('registered', registeredHandler);
		bot.on('connect', connectHandler);
	};

	this.disable = function() {
		bot.removeListener('newsong', newSongHandler);
		bot.removeListener('snagged', snagHandler);
		bot.removeListener('update_votes', voteHandler);
		bot.removeListener('registered', registeredHandler);
		bot.removeListener('connect', connectHandler);
	};


	var userTracker = new UserTracker(self.options.dbConnectionString.value);
	userTracker.on('update', function(userId, oldData, newData) {
		bot.emit('userUpdate', userId, oldData, newData);
		//achievementsTracker.check(newData.djIds[newData.djIds.length-1], oldData, newData, bot);
	});

	// override the getUserInfo method to also search the DB for the user
	// since bot.stalk only knows about users currently in the room
	var originalGetUserInfo = bot.getUserInfo;
	bot.getUserInfo = function(userId, callback) {
		originalGetUserInfo.call(bot, userId, function(user) {
			if (user === null) {
				userTracker.findUser(userId, function(err, doc) {
					if (err || !doc) {
						return callback(null);
					}
					callback(doc);
				});
			}
			else {
				callback(user);
			}
		});
		
	};

};