/*
	*** requires AfkTrackerAddOn ***

	Warns DJ's who are AFK to become active and will escort them off stage if they stay
	AFK for too long.
*/

module.exports = function AfkDjAddOn(bot, options) {
	options = options || {};

	var afkDjs = {},
		warnTime = options.warnTime || 60000, // default to 60 second warn time
		initialWarning = '@<user>, are you AFK? No AFK DJ\'s are allowed when the stage is full. Please chat/bop/snag within ' + warnTime/1000 + ' seconds, or you\'ll be escorted off stage.',
		secondaryWarning = '@<user>, Please chat/bop/snag within ' + warnTime/2000 + ' seconds, or you\'ll be escorted off stage.',
		beginWarnSequence = function(userId) {
			bot.speak(initialWarning.replace('<user>', djs[userId].name));
						
			setTimeout(function() {
				if (afkDjs[userId]) {
					bot.speak(secondaryWarning.replace('<user>', djs[userId].name));
				}
			}, warnTime/2);

			setTimeout(function() {
				if (afkDjs[userId]) {
					bot.remDj(userId);
				}
			}, warnTime);
		},
		addDjHandler = function(data) {
			if (data.success) {
				bot.getCurrentDjsInRoom(function(djs) {
					if (djs.length > 4) {
						for (var userId in afkDjs) {
							beginWarnSequence(userId);
						}
					}
				});
			}
		},
		afkHandler = function(userId) {
			bot.getCurrentDjsInRoom(function(djs) {
				if (djs.hasOwnProperty(userId)) {
					afkDjs[userId] = true;

					if (djs.length > 4) {
						beginWarnSequence(userId);
					}
				}
			});
		},
		activeHandler = function(userId) {
			if (afkDjs[userId]) {
				delete afkDjs[userId];
			}
		};

	

	this.name = 'afk-dj';

	this.description = 'Warns and removes DJ\'s from the stage if they are AFK and the stage is full.';

	this.enable = function() {
		bot.on('afk', afkHandler);
		bot.on('active', activeHandler);
		bot.on('add_dj', addDjHandler);
	};

	this.disable = function() {
		bot.removeListener('afk', afkHandler);
		bot.removeListener('active', activeHandler);
		bot.removeListener('add_dj', addDjHandler);
		afkDjs = {};
	};

};