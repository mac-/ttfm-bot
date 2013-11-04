// bot can dj and have songs added/removed from playlist

module.exports = function DjAddOn(bot) {

	var self = this,
		playlistName = 'default',
		emptyPlaylistName = 'empty',
		voteInProgress = false,
		activePlaylist,
		votePlayed = true,
		_ = require('underscore'),
		initialize = function() {
			bot.on('connect', function() {
				bot.playlistListAll(function(data) {
					if (data.success) {
						activePlaylist = _.find(data.list, function(list) { return list.active; }).name;
						if (!_.some(data.list, function(list) { return list.name === emptyPlaylistName; })) {
							bot.playlistCreate(emptyPlaylistName);
						}
						if (!_.some(data.list, function(list) { return list.name === playlistName; })) {
							bot.playlistCreate(playlistName);
						}
						_.each(data.list, function(list) {
							if (list.name !== playlistName && list.name !== emptyPlaylistName) {
								bot.playlistDelete(list.name);
							}
						});
					}
				});
			});
		},
		dj = function(msgData, issuerId, replyFunc) {
			bot.addDj(function(data) {
				if (!data.success) {
					return replyFunc(data.err);
				}
				replyFunc('Ok, hope you are prepared for my playlist!');
			});
		},
		getPlaylistInfoNoSwitch = function(playlistName, callback) {
			bot.playlistListAll(function(data) {
				if (data.success) {
					var active = _.find(data.list, function(list) { return list.active; });
					bot.playlistAll(playlistName, function(playlistData) {
						if (playlistData.success) {
							bot.playlistSwitch(active.name, function() {
								callback(null, playlistData);
							});
						}
						else {
							callback(new Error('Unable to retrieve playlist data'), null);
						}
					});
				}
				else {
					callback(new Error('Unable to retrieve playlist data'), null);
				}
			});
		},
		addToPlaylistEndNoSwitch = function(playlistName, songId, callback) {
			bot.playlistListAll(function(data) {
				if (data.success) {
					var active = _.find(data.list, function(list) { return list.active; });
					bot.snag(function() {
						bot.playlistAll(playlistName, function(playlistData) {
							if (playlistData.success) {
								bot.playlistAdd(playlistName, songId, playlistData.list.length, function() {
									bot.playlistSwitch(active.name, function() {
										callback(null, playlistData);
									});
								});
							}
							else {
								callback(new Error('Unable to retrieve playlist data'), null);
							}
						});
					});
				}
				else {
					callback(new Error('Unable to retrieve playlist data'), null);
				}
			});
		},
		removeFromPlaylistNoSwitch = function(playlistName, songId, callback) {
			bot.playlistListAll(function(data) {
				if (data.success) {
					var active = _.find(data.list, function(list) { return list.active; });
					bot.playlistAll(playlistName, function(playlistData) {
						if (playlistData.success) {
							var songPos = -1;
							for (var i = 0; i < playlistData.list.length; i++) {
								if (playlistData.list[i]._id === songId) {
									songPos = i;
									break;
								}
							}
							if (songPos >= 0) {
								bot.playlistRemove(playlistName, songPos, function() {
									bot.playlistSwitch(active.name, function() {
										callback(null, playlistData);
									});
								});
							}
							else {
								callback(new Error('Not Found'), null);
							}
						}
						else {
							callback(new Error('Unable to retrieve playlist data'), null);
						}
					});
				}
				else {
					callback(new Error('Unable to retrieve playlist data'), null);
				}
			});
		},
		snagSong = function(msgData, issuerId, replyFunc) {
			if (!voteInProgress || !self.options.voteForNextSongEnabled.value) {
				var song = bot.getCurrentSong();
				if (song) {
					addToPlaylistEndNoSwitch(playlistName, song._id, function(err, data) {
						if (err) {
							return replyFunc('Sorry, there was a problem adding the song to my playlist.');
						}
						replyFunc('Ok, I\'ve added "' + song.song + '" to my playlist.');
					});
				}
				else {
					replyFunc('Sorry, there is no song playing at the moment.');
				}
			}
			else {
				replyFunc('Please wait until the voting is over to snag this song.');
			}
		},
		dropSong = function(msgData, issuerId, replyFunc) {
			if (!voteInProgress || !self.options.voteForNextSongEnabled.value) {
				var song = bot.getCurrentSong();
				if (song) {
					removeFromPlaylistNoSwitch(playlistName, song._id, function(err, data) {
						if (err) {
							if (err.message === 'Not Found') {
								return replyFunc('Sorry, I could not find this song in my playlist.');
							}
							return replyFunc('Sorry, there was a problem removing the song from my playlist.');
						}
						replyFunc('Ok, I\'ve removed "' + song.song + '" from my playlist.');
					});
				}
				else {
					replyFunc('Sorry, there is no song playing at the moment.');
				}
			}
			else {
				replyFunc('Please wait until the voting is over to drop this song from my playlist.');
			}
		},
		wipeSongs = function(msgData, issuerId, replyFunc) {
			if (!voteInProgress || !self.options.voteForNextSongEnabled.value) {
				bot.playlistListAll(function(data) {
					if (data.success) {
						bot.playlistAll(playlistName, function(playlistData) {
							if (playlistData.success) {
								if (playlistData.list.length < 1) {
									replyFunc('My playlist is currently empty.');
								}
								var active = _.find(data.list, function(list) {
										return list.active;
									});
								for (var i = 0; i < playlistData.list.length; i++) {
									(function(idx, isLast) {
										setTimeout(function() {
											if (isLast) {
												bot.playlistRemove(playlistName, 0, function() {
													bot.playlistSwitch(active.name);
												});
											}
											else {
												bot.playlistRemove(playlistName, 0);
											}
										}, 500*idx);
									}(i, (i===playlistData.list.length-1)));
								}
								replyFunc('My playlist is in the process of being cleared.');
							}
							else {
								replyFunc('Sorry, there was a problem removing all songs from my playlist.');
							}
						});
					}
					else {
						replyFunc('Sorry, there was a problem removing all songs from my playlist.');
					}
				});
			}
			else {
				replyFunc('Please wait until the voting is over to wipe my playlist.');
			}
		},
		announceTopSongs = function(msgData, issuerId, replyFunc) {
			getPlaylistInfoNoSwitch(playlistName, function(err, data) {
				if (err) {
					return replyFunc('Sorry, there was a problem retrieving the songs in my playlist.');
				}
				if (data.list.length < 1) {
					return replyFunc('My playlist is currently empty.');
				}
				var messages = [], i;
				for (i = 0; i < data.list.length; i++) {
					if (i < 10) {
						messages.push(':small_blue_diamond: "' + data.list[i].metadata.song + '" by ' + data.list[i].metadata.artist);
					}
				}
				replyFunc(messages);
			});
		},
		skipSong = function(msgData, issuerId, replyFunc) {
			var currentSong = bot.getCurrentSong(),
				currentDj = (currentSong) ? currentSong.current_dj : null;
			if (bot.userId === currentDj) {
				replyFunc('Ok, I\'ll skip my song');
				bot.skip();
			}
			else {
				replyFunc('I\'m not currently playing a song');
			}
		},
		togglePlaylist = function(msgData, issuerId, replyFunc) {
			bot.playlistListAll(function(data) {
				if (data.success) {
					var to, active = _.find(data.list, function(list) { return list.active;	});
					if (active.name === playlistName) {
						to = emptyPlaylistName;
						bot.playlistSwitch(emptyPlaylistName);
						activePlaylist = emptyPlaylistName;
					}
					else if (active.name === emptyPlaylistName) {
						to = playlistName;
						bot.playlistSwitch(playlistName);
						activePlaylist = playlistName;
					}
					replyFunc('Switched to playlist: ' + to);
				}
			});
		},
		newSongHandler = function(data) {
			if (data.success && self.options.voteForNextSongEnabled.value) {
				if (data.room.metadata.current_dj === bot.userId) {
					votePlayed = true;
				}
				if (!voteInProgress && activePlaylist === playlistName && votePlayed) {
					var djs = data.room.metadata.djs,
						currentDjPos = djs.indexOf(data.room.metadata.current_dj),
						botPos = djs.indexOf(bot.userId),
						isUpNext;
					if (botPos > -1) {
						isUpNext = (botPos === (currentDjPos + 1) || (botPos === 0 && currentDjPos === (djs.length-1)));
						if (isUpNext) {
							voteInProgress = new Date().getTime() + '-dj';
							votePlayed = false;
							getPlaylistInfoNoSwitch(playlistName, function(err, data) {
								if (data.list.length < 1) {
									return;
								}
								var choices = _.first(_.shuffle(_.first(data.list, data.list.length-2)), 3),
									choiceIndeces = _.map(choices, function(c) { return _.indexOf(data.list, c)}),
									choiceNames = _.map(choices, function(c) { return '"' + c.metadata.song + '" by ' + c.metadata.artist; }),
									endVoteHandler = function(voteId, winner) {
										if (voteId === voteInProgress) {
											bot.removeListener('endVote', endVoteHandler);
											bot.removeListener('voteIgnored', ignoredVoteHandler);
											var playlistIndex = choiceIndeces[choiceNames.indexOf(winner.name)];
											bot.playlistReorder(playlistName, playlistIndex, 0);
											voteInProgress = false;
										}
									},
									ignoredVoteHandler = function(voteId) {
										if (voteId === voteInProgress) {
											bot.speak('Since there is currently a vote in progress, I will not begin a vote for my next song.');
											bot.removeListener('endVote', endVoteHandler);
											bot.removeListener('voteIgnored', ignoredVoteHandler);
											voteInProgress = false;
										}
									};
								
								setTimeout(function() {
									bot.on('endVote', endVoteHandler);
									bot.on('voteIgnored', ignoredVoteHandler);
									bot.emit('beginVote', voteInProgress, 'Which song should I play next?', choiceNames);
								}, 5000);
								

							});
						}
					}
				}
					
			}
		};

	this.name = 'dj';

	this.description = 'Allows the bot to DJ and keep a playlist and snag songs.';

	this.commands = [
		{
			primaryCommand: '/dj',
			secondaryCommands: [],
			help: 'make me start dj\'ing',
			moderatorOnly: true,
			action: dj
		},
		{
			primaryCommand: '/snag',
			secondaryCommands: [],
			help: 'adds the current song to the bot\'s playlist',
			moderatorOnly: false,
			action: snagSong
		},
		{
			primaryCommand: '/drop',
			secondaryCommands: [],
			help: 'removes the current song to the bot\'s playlist',
			moderatorOnly: false,
			action: dropSong
		},
		{
			primaryCommand: '/wipe',
			secondaryCommands: [],
			help: 'removes all songs from the bot\'s playlist',
			moderatorOnly: true,
			action: wipeSongs
		},
		{
			primaryCommand: '/skip',
			secondaryCommands: [],
			help: 'skips the current song that the bot is playing',
			moderatorOnly: true,
			action: skipSong
		},
		{
			primaryCommand: '/pl',
			secondaryCommands: [],
			help: 'lists next 10 songs queued up in the bot\'s playlist',
			moderatorOnly: false,
			action: announceTopSongs
		},
		{
			primaryCommand: '/togglepl',
			secondaryCommands: [],
			help: 'toggles between the bot\'s playlist and an empty one',
			moderatorOnly: true,
			action: togglePlaylist
		}
	];

	this.options = {
		voteForNextSongEnabled: {
			value: true,
			type: Boolean,
			description: 'A flag used to control whether or not users can vote on the next song that I play.'
		}
	};

	this.enable = function() {
		bot.on('newsong', newSongHandler);
	};

	this.disable = function() {
		bot.removeListener('newsong', newSongHandler);
	};

	initialize();
};