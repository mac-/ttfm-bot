// bot can dj and have songs added/removed from playlist

module.exports = function DjAddOn(bot) {

	var dj = function(msgData, issuerId, replyFunc) {
			bot.addDj();
			replyFunc('Ok, hope you are prepared for my playlist!');
		},
		snagSong = function(msgData, issuerId, replyFunc) {
			bot.snag(function() {
				bot.playlistAll(function(data) {
					if (data.success) {
						var song = bot.getCurrentSong();
						if (song) {
							bot.playlistAdd(song._id, data.list.length);
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
				bot.playlistAll(function(data) {
					if (data.success) {
						for (var i = 0; i < data.list.length; i++) {
							if (data.list[i]._id === song._id) {
								bot.playlistRemove(i);
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
			bot.playlistAll(function(data) {
				if (data.success) {
					if (data.list.length < 1) {
						replyFunc('My playlist is currently empty.');
					}
					for (var i = 0; i < data.list.length; i++) {
						(function(idx) {
							setTimeout(function() {
								bot.playlistRemove(idx);
							}, 300);
						}(i));
					}
					replyFunc('My playlist is in the process of being cleared.');
				}
			});			
		},
		announceTopSongs = function(msgData, issuerId, replyFunc) {
			bot.playlistAll(function(data) {
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
			primaryCommand: '/pl',
			secondaryCommands: [],
			help: 'lists next 10 songs queued up in the bot\'s playlist',
			moderatorOnly: false,
			action: announceTopSongs
		}
	];

	this.enable = function() {
	};

	this.disable = function() {
	};
};