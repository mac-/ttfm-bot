var _ = require('underscore'),
	moment = require('moment');

module.exports = function SongTrackerAddOn(bot, options) {
	options = options || {};

	var snags = 0;
		SongTracker = require('./domain/SongTracker'),
		songTracker = new SongTracker(options.dbConnectionString),
		announceTopSongs = function(msgData) {
			var isPm = msgData.hasOwnProperty('senderid'),
				userId = (isPm) ? msgData.senderid : msgData.userid,
				speakFunc = function(text) {
					if (isPm) {
						return bot.multiPm(text, userId, 300);
					}
					bot.multiSpeak(text, 300);
				};

			songTracker.getSongsWithMostVotes(5, 'up', function(err, songs) {
				if (err || !songs) {
					return speakFunc(['Unable to retrieve the data'], 300);
				}
				var i, icon, messages = [],
					icons = [':one:', ':two:', ':three:', ':four:', ':five:', ':six:', ':seven:', ':eight:', ':nine:', ':keycap_ten:'],
					defaultIcon = ':arrow_forward:';
				for (i = 0; i < songs.length; i++) {
					icon = icons[i] || defaultIcon;
					messages.push(icon + ' "' + songs[i].song + '" By ' + songs[i].artist + ' (' + songs[i].upVotes + ' up votes)');
				}
				speakFunc(messages, 300);
			});
		},
		announceBottomSongs = function(msgData) {
			var isPm = msgData.hasOwnProperty('senderid'),
				userId = (isPm) ? msgData.senderid : msgData.userid,
				speakFunc = function(text) {
					if (isPm) {
						return bot.multiPm(text, userId, 300);
					}
					bot.multiSpeak(text, 300);
				};

			songTracker.getSongsWithMostVotes(5, 'down', function(err, songs) {
				if (err || !songs) {
					return speakFunc(['Unable to retrieve the data'], 300);
				}
				var i, icon, messages = [],
					icons = [':one:', ':two:', ':three:', ':four:', ':five:', ':six:', ':seven:', ':eight:', ':nine:', ':keycap_ten:'],
					defaultIcon = ':arrow_forward:';
				for (i = 0; i < songs.length; i++) {
					icon = icons[i] || defaultIcon;
					messages.push(icon + ' "' + songs[i].song + '" By ' + songs[i].artist + ' (' + songs[i].downVotes + ' down votes)');
				}
				speakFunc(messages, 300);
			});
		},
		newSongHandler = function(data) {
			if (data.success) {
				songTracker.updateSongDetails(data);
				snags = 0;

				// wait for 2 seconds after song starts to show the stats
				setTimeout(function() {
				
					songTracker.getSongData(data.room.metadata.current_song._id, function(err, songData) {
						if (err || !songData) {
							bot.speak('Unable to get stats for this song.');
							return;
						}

						var numPlays = songData.startTimes.length,
							lastPlayTime = (songData.startTimes.length <= 1) ? 'Never' : moment(songData.startTimes[songData.startTimes.length-2]).fromNow(),
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
							msgArray.push('Total Plays: ' + numPlays);
							msgArray.push('Last Played: ' + lastPlayTime);
							msgArray.push('Totals: ' + upVotes + ' :+1:  ' + downVotes + ' :-1:  ' + snags + ' :heart:');
							msgArray.push('Played The Most By: ' + djWithMostPlays + ' (' + _.max(numPlaysByDj) + ')');

							bot.multiSpeak(msgArray, 300);					
						});
					});
				}, 2000);
			}
		},
		snagHandler = function(data) {
			bot.getCurrentSong(function(songDetails) {
				songTracker.updateSnags(songDetails._id, data.userid);
			});
			snags++;
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
					var voteUp = (data.room.metadata.votelog[0][1] === 'up');
					songTracker.updateVotes(roomData.room.metadata.current_song._id, voteUp, data.room.metadata.votelog[0][0]);
				});
			}
		};

	songTracker.on('update', function(oldData, newData) {
		bot.emit('songUpdate', oldData, newData);
		//achievementsTracker.check(newData.djIds[newData.djIds.length-1], oldData, newData, bot);
	});


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
		}];

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

};