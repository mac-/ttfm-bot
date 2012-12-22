/*
	Example msgData:
	{
		"command": "speak",
		"userid": "4dea70c94fe7d0517b1a3519",
		"name": "@richhemsley",
		"text": "lol"
	}
*/

// TODO: Combine phrases into one class?
var awesomePhrases = require('./AwesomePhrases.js'),
	helloPhrases = require('./HelloPhrases.js'),
	_ = require('underscore'),
	moment = require('moment'),
	djsToEscort = [];

var isRegexString = function(str) {
	if (!str || !str.length) return false;
	var check = str.match(/^\^.*\$$/);
	if (!check || !check.length) return false;
	return true;
};

// @phrases - must be an array of strings
var getRandomPhrase = function(phrases) {
	var randIdx = Math.round(Math.random() * (phrases.length - 1));
	return phrases[randIdx];
};

/*
	Command names strings supports both regex and non-regex variants:
	
	- Non-regex command name strings will be converted to regex later by escaping metacharacters and appending ^ and $
	- Regex command name strings MUST begin with ^ and end with $, otherwise they will be interpreted as non-regex and have additional regex appended
	- Text matching will be automatically lower cased to keep that in mind when writing command names
	
	DevNotes: I did a regex string instead of straight regex to make it potentially more configurable via json. Straight regex might be a better idea, i dunno.
	
	TODO:
	Add the following props/functionality to each command
	- modRestrict (restrict the command to moderators, default false)
	- allowPrivate (allows the command to be privately messaged directly to the bot, default false)
	
*/
var commands = [
	{
		primaryCommand: '/help',
		secondaryCommands: ['^.*help (me)? tes.*$'],
		help: 'this help menu',
		action: function(bot, msgData) {
			bot.pm(':black_square::black_square::black_square::black_square::black_square::black_square::black_square::black_square:', msgData.userid);
			setTimeout(function() { bot.pm('Available Commands:', msgData.userid) }, 200);
			
			for (var i = 0; i < commands.length; i++) {
				(function(index) {
					setTimeout(function() { bot.pm(':point_right: ' + commands[index].primaryCommand + ' - ' + commands[index].help, msgData.userid); }, (i+1) * 300);
				}(i));
			}
		}
	},
	{
		primaryCommand: '/hello',
		secondaryCommands: ['^.*hi tes.*$', '^.*hey tes.*$', '^.*hello tes.*$', '^.*whats? ?up tes.*$'],
		help: 'say "hi" to me',
		action: function(bot, msgData) {
			var phrase = getRandomPhrase(helloPhrases);
			phrase = phrase.replace('<user>', msgData.name);
			bot.speak(phrase);
		}
	},
	{
		primaryCommand: '/awesome',
		secondaryCommands: ['/bop', '^.*dance tes.*$', '^.*hit it tes.*$', '^.*shake it tes.*$', '^.*come on tes.*$', '^.*swing it tes.*$', '^.*rock it tes.*$'],
		help: 'make me bop',
		action: function(bot, msgData) {
			var phrase = getRandomPhrase(awesomePhrases);
			phrase = phrase.replace('<user>', msgData.name);
			bot.speak(phrase);
			bot.bop();
		}
	},
	{
		primaryCommand: '/mine',
		secondaryCommands: [],
		help: 'list your achievements',
		action: function(bot, msgData) {
			if (bot.addOns && bot.addOns.statsTracker && bot.addOns.statsTracker.getAchievementsByUserId) {
				bot.speak('This feature is experimental. Current achievements may be lost during this time.');
				bot.addOns.statsTracker.getAchievementsByUserId(msgData.userid, function(err, achievements) {
					if (err) {
						bot.speak('There was an error trying to get your achievements');
						return;
					}
					if (achievements.length > 0) {
						bot.speak('Achievements for @' + msgData.name + ' (' + achievements.length + '): ' + achievements.join(', '));
					}
					else {
						bot.speak('It looks like you don\'t have any achievements, @' + msgData.name);
					}
				});
			}
			
		}
	},
	{
		primaryCommand: '/achievements',
		secondaryCommands: [],
		help: 'list all available achievements',
		action: function(bot, msgData) {
			if (bot.addOns && bot.addOns.statsTracker && bot.addOns.statsTracker.allAchievements) {
				var achievements = bot.addOns.statsTracker.allAchievements;
				bot.pm(':black_square::black_square::black_square::black_square::black_square::black_square::black_square::black_square:', msgData.userid);
				setTimeout(function() { bot.pm('This feature is experimental. Achievements may change at any time.', msgData.userid); }, 200);
				for (var i = 0; i < achievements.length; i++) {
					(function(index) {
						setTimeout(function() {
							bot.pm(':point_right: ' + achievements[index].name + ' - ' + achievements[index].description, msgData.userid);
							return;
						}, (i+1)*300);
					}(i));
				}
			}
			
		}
	},
	{
		primaryCommand: '/play',
		secondaryCommands: [],
		help: 'start tracking your activity in this room for the sake of awarding achievements',
		action: function(bot, msgData) {
			bot.emit('play_command', msgData.userid);
			bot.speak('Ok @' + msgData.name + ', I will start tracking your activity if I\'m not already.');
		}
	},
	{
		primaryCommand: '/escortme',
		secondaryCommands: [],
		help: 'get escorted off stage after your song ends',
		action: function(bot, msgData) {
			bot.stalk(msgData.userid, true, function(data) {
				bot.removeFan(msgData.userid);
				if (msgData.userid === data.user.userid) {
					bot.speak('Ok, I will escort @' + msgData.name + ' off the stage after your song.');

					if (bot.listeners('endsong').length < 1) {
						bot.on('endsong', function(songData) {
							var djIndex = djsToEscort.indexOf(songData.room.metadata.current_song.djid);
							if (djIndex > -1) {
								bot.remDj(songData.room.metadata.current_song.djid);
								djsToEscort.splice(djIndex, 1);
								if (djsToEscort.length < 1) {
									bot.removeAllListeners('endsong');
								}
							}
						});
					}
					djsToEscort.push(msgData.userid);
				}
			});
			
		}
	},
	{
		primaryCommand: '/stats',
		secondaryCommands: [],
		help: 'shows stats on current song',
		action: function(bot, msgData) {
			bot.roomInfo(true, function(roomData) {
				if (roomData.room && roomData.room.metadata && roomData.room.metadata.current_song) {
					bot.emit('get_song_stats_command', roomData.room.metadata.current_song._id);
				}
				else {
					bot.speak('There are no songs being played at the moment.');
				}
			});
			bot.once('song_stats', function(data) {
				if (!data) {
					bot.speak('Unable to get stats for this song.');
					return;
				}

				var numPlays = data.startTimes.length,
					lastPlayTime = (data.startTimes.length <= 1) ? 'Never' : moment(data.startTimes[data.startTimes.length-2]).fromNow(),
					upVotes = data.upVotes,
					downVotes = data.downVotes,
					numPlaysByDj = _.countBy(data.djIds, function(id) { return id; }),
					djWithMostPlaysNum = 0,
					djWithMostPlays,
					msgArray = [];

				for (var prop in numPlaysByDj) {
					if (numPlaysByDj[prop] > djWithMostPlaysNum) {
						djWithMostPlays = prop;
					}
				}

				bot.stalk(djWithMostPlays, true, function(userData) {
					bot.removeFan(djWithMostPlays);
					djWithMostPlays = userData.user.name;

					msgArray.push('Total Plays: ' + numPlays);
					msgArray.push('Last Played: ' + lastPlayTime);
					msgArray.push('Total Up Votes: ' + upVotes);
					msgArray.push('Total Down Votes: ' + downVotes);
					msgArray.push('Played The Most By: ' + djWithMostPlays + ' (' + _.max(numPlaysByDj) + ')');

					for (var i = 0; i < msgArray.length; i++) {
						(function(index) {
							setTimeout(function() {
								bot.speak(msgArray[index]);
							}, 600);
						}(i));
					}
					
				});
			});
			
		}
	},
	{
		primaryCommand: '/top',
		secondaryCommands: [],
		help: 'list the songs with the most up votes',
		action: function(bot, msgData) {
			bot.emit('get_top_songs_command', 5);
			bot.once('top_songs', function(data) {
				console.log(data);

				for (var i = 0; i < data.length; i++) {
					(function(index) {
						setTimeout(function() {
							bot.speak('"' + data[index].song + '" By ' + data[index].artist + ' (' + data[index].upVotes + ' votes)');
						}, 600);
					}(i));
				}

			});
		}
	}
];


module.exports = function CommandsAddOn(bot) {
	bot.addOns = bot.addOns || {};

	bot.on('speak', function(data) {
		
		var i, j,
			cmdNameStr,
			cmdRegex,
			hit = false;
		
		for (i = 0; i < commands.length; i++) {
			// check primary command first
			cmdRegex = new RegExp('^' + commands[i].primaryCommand + '$');
			if (data.text.toLowerCase().match(cmdRegex)) {
				commands[i].action(bot, data);
				break;
			}

			// then check secondary commands
			for (j = 0; j < commands[i].secondaryCommands.length; j++) {
				
				cmdNameStr = commands[i].secondaryCommands[j];
				
				if (isRegexString(cmdNameStr)) {
					cmdRegex = new RegExp(cmdNameStr);
				} else {
					cmdNameStr = cmdNameStr.replace("/", "\/");
					cmdRegex = new RegExp('^' + cmdNameStr + '$');
				};
				
				if (data.text.toLowerCase().match(cmdRegex)) {
					commands[i].action(bot, data);
					hit = true;
					break;
				}
			}
			if (hit) break;
		}
	});
};

