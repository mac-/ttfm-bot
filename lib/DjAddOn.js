// bot can dj and have songs added/removed from playlist

module.exports = function DjAddOn(bot) {

	var playlistName = 'default',
		emptyPlaylistName = 'empty',
		_ = require('underscore'),
		initialize = function() {
			bot.on('connect', function() {
				bot.playlistListAll(function(data) {
					console.log(data);
					if (data.success) {
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
			bot.addDj();
			replyFunc('Ok, hope you are prepared for my playlist!');
		},
		snagSong = function(msgData, issuerId, replyFunc) {
			bot.snag(function() {
				bot.playlistAll(playlistName, function(data) {
					if (data.success) {
						var song = bot.getCurrentSong();
						if (song) {
							bot.playlistAdd(playlistName, song._id, data.list.length);
							replyFunc('Ok, I\'ve added "' + song.song + '" to my playlist.');
						}
						else {
							replyFunc('Sorry, there is no song playing at the moment.');
						}
					}
				});
			});
		},
		dropSong = function(msgData, issuerId, replyFunc) {
			var song = bot.getCurrentSong();
			if (song) {
				bot.playlistAll(playlistName, function(data) {
					if (data.success) {
						for (var i = 0; i < data.list.length; i++) {
							if (data.list[i]._id === song._id) {
								bot.playlistRemove(playlistName, i);
								return replyFunc('Ok, I\'ve removed "' + song.song + '" from my playlist.');
							}
						}
						replyFunc('I couldn\'t find "' + song.song + '" anywhere in my playlist.');
					}
				});
			}
			else {
				replyFunc('Sorry, there is no song playing at the moment.');
			}
		},
		wipeSongs = function(msgData, issuerId, replyFunc) {
			bot.playlistAll(playlistName, function(data) {
				if (data.success) {
					if (data.list.length < 1) {
						replyFunc('My playlist is currently empty.');
					}
					for (var i = 0; i < data.list.length; i++) {
						(function(idx) {
							setTimeout(function() {
								bot.playlistRemove(playlistName, 0);
							}, 500*idx);
						}(i));
					}
					replyFunc('My playlist is in the process of being cleared.');
				}
			});			
		},
		announceTopSongs = function(msgData, issuerId, replyFunc) {
			bot.playlistAll(playlistName, function(data) {
				if (data.success) {
					if (data.list.length < 1) {
						replyFunc('My playlist is currently empty.');
					}
					var messages = [], i;
					for (i = 0; i < data.list.length; i++) {
						if (i < 10) {
							messages.push(':small_blue_diamond: "' + data.list[i].metadata.song + '" by ' + data.list[i].metadata.artist);
						}
					}
					replyFunc(messages);
				}
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
					var to, active = _.find(data.list, function(list) {
						return list.active;
					});
					if (active.name === playlistName) {
						to = emptyPlaylistName;
						bot.playlistSwitch(emptyPlaylistName);
					}
					else if (active.name === emptyPlaylistName) {
						to = playlistName;
						bot.playlistSwitch(playlistName);
					}
					replyFunc('Switched to playlist: ' + to);
				}
			});
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

	this.enable = function() {
		
	};

	this.disable = function() {
	};

	initialize();
};