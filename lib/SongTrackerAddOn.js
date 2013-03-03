var _ = require('underscore'),
	moment = require('moment');

module.exports = function SongTrackerAddOn(bot) {

	var snags = 0,
		self = this,
		SongTracker = require('./domain/SongTracker'),
		announceTopSongs = function(msgData, issuerId, replyFunc) {
			
			songTracker.getSongsWithMostVotes(5, 'up', function(err, songs) {
				if (err || !songs) {
					return replyFunc(['Unable to retrieve the data']);
				}

				var i, icon, messages = [],
					icons = [':one:', ':two:', ':three:', ':four:', ':five:', ':six:', ':seven:', ':eight:', ':nine:', ':keycap_ten:'],
					defaultIcon = ':arrow_forward:';
				if (songs.length > 0) {
					for (i = 0; i < songs.length; i++) {
						icon = icons[i] || defaultIcon;
						messages.push(icon + ' "' + songs[i].song + '" By ' + songs[i].artist + ' (' + songs[i].upVotes + ' up votes)');
					}
				}
				else {
					messages.push('Not enough votes or songs have been tracked. Try again after more data is in the system.');
				}
				replyFunc(messages);
			});
		},
		announceBottomSongs = function(msgData, issuerId, replyFunc) {
			
			songTracker.getSongsWithMostVotes(5, 'down', function(err, songs) {
				if (err || !songs) {
					return replyFunc(['Unable to retrieve the data']);
				}
				var i, icon, messages = [],
					icons = [':one:', ':two:', ':three:', ':four:', ':five:', ':six:', ':seven:', ':eight:', ':nine:', ':keycap_ten:'],
					defaultIcon = ':arrow_forward:';
				if (songs.length > 0) {
					for (i = 0; i < songs.length; i++) {
						icon = icons[i] || defaultIcon;
						messages.push(icon + ' "' + songs[i].song + '" By ' + songs[i].artist + ' (' + songs[i].downVotes + ' down votes)');
					}
				}
				else {
					messages.push('Not enough votes or songs have been tracked. Try again after more data is in the system.');
				}
				replyFunc(messages);
			});
		},
		announceStats = function(msgData, issuerId, replyFunc) {
			var args = msgData.text.split(/\s/);
			args.shift();
			if (args.length < 1) {
				return replyFunc('Please specify a string to search with, for example: /stats my song');
			}
			var title = args.join(' '),
				titleArgs = title.split('#'),
				artist = (titleArgs.length > 1) ? titleArgs.pop() : undefined;

			title = titleArgs.join('#');
			songTracker.getAllSongDataByTitleAndArtist(title, artist, function(err, songData) {
				if (err || !songData) {
					replyFunc('Unable to get stats for this song.');
					return;
				}
				if (songData.length < 1) {
					replyFunc('No songs were found that match "' + title + '"');
					return;
				}
				if (songData.length > 1) {
					var msgArray = [];
					msgArray.push('Found multiple matches:');
					for (var i = 0; i < Math.min(3,songData.length); i++) {
						msgArray.push(':small_orange_diamond: "' + songData[i].song + '" by ' + songData[i].artist);
					}
					if (songData.length > 3) {
						msgArray.push('... More');
					}
					msgArray.push('Please refine your search');
					replyFunc(msgArray);
				}
				else {
					announceSongData(songData[0], false, replyFunc);
				}
			});
		},
		newSongHandler = function(data) {
			if (data.success) {
				var songDetails = bot.getCurrentSong();
				songTracker.updateSongDetails(songDetails);
				snags = 0;
				// wait for 2 seconds after song starts to show the stats
				setTimeout(function() {

					songTracker.getSongData(songDetails, function(err, songData) {
						if (err || !songData) {
							bot.speak('Unable to get stats for this song.');
							return;
						}
						announceSongData(songData, true, function(text, callback) { bot.multiSpeak(text, 300, callback); });
					});
				}, 2000);
			}
		},
		announceSongData = function(songData, isNewSong, replyFunc) {

			var numPlays = songData.startTimes.length,
				lastStart = (!isNewSong) ? songData.startTimes[songData.startTimes.length-1] : (songData.startTimes.length > 1) ? songData.startTimes[songData.startTimes.length-2] : undefined,
				lastPlayTime = (lastStart) ? moment(lastStart).fromNow() : 'Never',
				upVotes = songData.upVotes,
				downVotes = songData.downVotes,
				snags = songData.snagLog.length,
				numPlaysByDj = _.countBy(songData.djIds, function(id) { return id; }),
				djWithMostPlaysNum = 0,
				djWithMostPlays,
				msgArray = [];

			for (var prop in numPlaysByDj) {
				if (numPlaysByDj[prop] > djWithMostPlaysNum) {
					djWithMostPlays = prop;
				}
			}

			bot.getUserInfo(djWithMostPlays, function(userData) {
				djWithMostPlays = userData.name;

				msgArray.push(':heavy_minus_sign::heavy_minus_sign::heavy_minus_sign::heavy_minus_sign::heavy_minus_sign::heavy_minus_sign::heavy_minus_sign::heavy_minus_sign::heavy_minus_sign::heavy_minus_sign:');
				msgArray.push('Song: ' + songData.song);
				msgArray.push('Artist: ' + songData.artist);
				msgArray.push('Total Plays: ' + numPlays);
				msgArray.push('Last Played: ' + lastPlayTime);
				msgArray.push('Totals: ' + upVotes + ' :+1:  ' + downVotes + ' :-1:  ' + snags + ' :heart:');
				msgArray.push('Played The Most By: ' + djWithMostPlays + ' (' + _.max(numPlaysByDj) + ')');

				replyFunc(msgArray);
			});
		},
		snagHandler = function(data) {
			var songDetails = bot.getCurrentSong();
			if (songDetails) {
				songTracker.updateSnags(songDetails, data.userid);
				snags++;
			}
		},
		endSongHandler = function(songData) {
			if (songData.success && songData.room.metadata.current_song) {
				var upVotes = songData.room.metadata.upvotes,
					downVotes = songData.room.metadata.downvotes,
					song = songData.room.metadata.current_song.metadata.song;
				bot.multiSpeak([
					':heavy_minus_sign::heavy_minus_sign::heavy_minus_sign::heavy_minus_sign::heavy_minus_sign::heavy_minus_sign::heavy_minus_sign::heavy_minus_sign::heavy_minus_sign::heavy_minus_sign:',
					'Votes/Snags for "' + song + '": ',
					upVotes + ' :+1:  ' + downVotes + ' :-1:  ' + snags + ' :heart:'
				], 300);
			}
			snags.length = 0;
		},
		voteHandler = function(data) {
			if (data.success) {
				bot.roomInfo(function(roomData) {
					var voteUp = (data.room.metadata.votelog[0][1] === 'up'),
						songDetails = bot.getCurrentSong();
					if (songDetails) {
						songTracker.updateVotes(songDetails, voteUp, data.room.metadata.votelog[0][0]);
					}
				});
			}
		},
		dbConnectionStringChangeHandler = function(oldValue, newValue) {
			songTracker = new SongTracker(self.options.dbConnectionString.value);
		};

	this.name = 'song-tracker';

	this.description = 'Keeps track of songs played and votes/snags for songs. Announces song stats at beginning and end of song plays. Requires a connection to a MongoDB instance.';

	this.commands = [{
			primaryCommand: '/top',
			secondaryCommands: [],
			help: 'list the songs with the most up votes',
			moderatorOnly: false,
			action: announceTopSongs
		},
		{
			primaryCommand: '/bottom',
			secondaryCommands: [],
			help: 'list the songs with the most down votes',
			moderatorOnly: false,
			action: announceBottomSongs
		},
		{
			primaryCommand: '/stats',
			secondaryCommands: [],
			help: 'show stats of a song by song title (and artist, by appending string with "#<artist>")',
			moderatorOnly: false,
			action: announceStats
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
		bot.on('endsong', endSongHandler);
		bot.on('snagged', snagHandler);
		bot.on('update_votes', voteHandler);
	};

	this.disable = function() {
		bot.removeListener('newsong', newSongHandler);
		bot.removeListener('endsong', endSongHandler);
		bot.removeListener('snagged', snagHandler);
		bot.removeListener('update_votes', voteHandler);
	};

	var songTracker = new SongTracker(self.options.dbConnectionString.value);
	songTracker.on('update', function(oldData, newData) {
		bot.emit('songUpdate', oldData, newData);
		//achievementsTracker.check(newData.djIds[newData.djIds.length-1], oldData, newData, bot);
	});

};