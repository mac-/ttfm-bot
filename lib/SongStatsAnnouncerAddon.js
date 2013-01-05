/*
	*** requires StatsTrackerAddOn ***

	Announces previous song stats at the start of a song, and the current votes/snags at the end.
*/

var moment = require('moment'),
	_ = require('underscore');

module.exports = function SongStatsAnnouncerAddOn(bot) {

	var snags = [];

	bot.on('snagged', function(data) {
		bot.getUserInfo(data.userid, function(userData) {
			snags.push(userData.name);
		});
	});

	bot.on('endsong', function(songData) {
		if (songData.room.metadata.current_song) {
			var upVotes = songData.room.metadata.upvotes,
				downVotes = songData.room.metadata.downvotes,
				song = songData.room.metadata.current_song.metadata.song;
			bot.multiSpeak([
				':heavy_minus_sign::heavy_minus_sign::heavy_minus_sign::heavy_minus_sign::heavy_minus_sign::heavy_minus_sign::heavy_minus_sign::heavy_minus_sign::heavy_minus_sign::heavy_minus_sign:',
				'Votes/Snags for "' + song + '": ',
				upVotes + ' :+1:  ' + downVotes + ' :-1:  ' + snags.length + ' :heart:'
			], 300);	
		}
		snags.length = 0;
	});

	bot.on('newsong', function(songData) {

		// wait for 2 seconds after song starts to show the stats
		setTimeout(function() {
			bot.emit('request_song_stats', songData.room.metadata.current_song._id);
		}, 2000);
		
		bot.once('song_stats', function(data) {
			if (!data) {
				bot.speak('Unable to get stats for this song.');
				return;
			}

			var numPlays = data.startTimes.length,
				lastPlayTime = (data.startTimes.length <= 1) ? 'Never' : moment(data.startTimes[data.startTimes.length-2]).fromNow(),
				upVotes = data.upVotes,
				downVotes = data.downVotes,
				snags = data.snagLog.length,
				numPlaysByDj = _.countBy(data.djIds, function(id) { return id; }),
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
				msgArray.push('Song: ' + data.song);
				msgArray.push('Total Plays: ' + numPlays);
				msgArray.push('Last Played: ' + lastPlayTime);
				msgArray.push('Totals: ' + upVotes + ' :+1:  ' + downVotes + ' :-1:  ' + snags + ' :heart:');
				msgArray.push('Played The Most By: ' + djWithMostPlays + ' (' + _.max(numPlaysByDj) + ')');

				bot.multiSpeak(msgArray, 300);					
			});
		});
	});

};