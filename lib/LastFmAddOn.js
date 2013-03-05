// get additional music info from last fm

module.exports = function LastFmAddOn(bot) {

	var _ = require('underscore'),
		lastFmApiKey = process.env.lastFmApiKey || '',
		lastFmSecret = process.env.lastFmSecret || '',
		LastFmNode = require('lastfm').LastFmNode,
		lastfm = new LastFmNode({
			api_key: lastFmApiKey,
			secret: lastFmSecret
		}),
		cleanUpAndLimitText = function(text, size) {
			return text.replace(/<.*?>/gi, '').replace('\n', '').replace(/\s+/g, ' ').substr(0, size) + '...';
		},
		getArtistInfo = function(msgData, issuerId, replyFunc) {
			var currentSong = bot.getCurrentSong();
			if (currentSong) {
				lastfm.request('artist.getInfo', {
					artist: currentSong.artist,
					handlers: {
						success: function(data) {
							replyFunc(cleanUpAndLimitText(data.artist.bio.summary, 200));
						},
						error: function(error) {
							console.log(error);
							replyFunc('Unable to retrieve data for ' + currentSong.artist);
						}
					}
				});
			}
			else {
				replyFunc('There is no song playing at the moment.');
			}
		},
		getSimilarArtist = function(msgData, issuerId, replyFunc) {
			var currentSong = bot.getCurrentSong();
			if (currentSong) {
				lastfm.request('artist.getInfo', {
					artist: currentSong.artist,
					handlers: {
						success: function(data) {
							replyFunc(_.map(data.artist.similar.artist, function(artist) {
								return ':small_red_triangle: ' + artist.name;
							}));
						},
						error: function(error) {
							console.log(error);
							replyFunc('Unable to retrieve data for ' + currentSong.artist);
						}
					}
				});
			}
			else {
				replyFunc('There is no song playing at the moment.');
			}
		},
		getSimilarSong = function(msgData, issuerId, replyFunc) {
			var currentSong = bot.getCurrentSong();
			if (currentSong) {
				lastfm.request('track.getSimilar', {
					artist: currentSong.artist,
					track: currentSong.song.replace(/\(.*?\)/gi, ''),
					handlers: {
						success: function(data) {
							var messages = _.map(_.first(_.shuffle(_.first(data.similartracks.track, 20)), 3), function(track) {
								return ':small_red_triangle: "' + track.name + '" by ' + track.artist.name;
							});
							replyFunc(messages);
						},
						error: function(error) {
							console.log(error);
							replyFunc('Unable to retrieve data for ' + currentSong.song);
						}
					}
				});
			}
			else {
				replyFunc('There is no song playing at the moment.');
			}
		};

	this.name = 'lasfm';

	this.description = 'Adds functionality to get additional information about artists and song.';

	this.commands = [
		{
			primaryCommand: '/artist',
			secondaryCommands: ['^who is this.*$'],
			help: 'get additional info about the current artist',
			moderatorOnly: false,
			action: getArtistInfo
		},
		{
			primaryCommand: '/simartist',
			secondaryCommands: [],
			help: 'get a few similar artists to the current one',
			moderatorOnly: false,
			action: getSimilarArtist
		},
		{
			primaryCommand: '/simsong',
			secondaryCommands: [],
			help: 'get a few similar songs to the current one',
			moderatorOnly: false,
			action: getSimilarSong
		}
	];

	this.enable = function() {
		//bot.on('registered', registeredHandler);
	};

	this.disable = function() {
		//bot.removeListener('registered', registeredHandler);
	};
};