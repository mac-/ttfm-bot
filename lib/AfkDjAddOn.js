/*
	*** requires AfkTrackerAddOn ***

	Warns DJ's who are AFK to become active and will escort them off stage if they stay
	AFK for too long.
*/

module.exports = function AfkDjAddOn(bot, options) {
	options = options || {};

	var afkDjs = {},
		warnTime = options.warnTime || 60000, // default to 60 second warn time
		initialWarning = '@<user>, are you AFK? Please chat/bop/snag within ' + warnTime/1000 + ' seconds, or you\'ll be escorted off stage.',
		secondaryWarning = '@<user>, Please chat/bop/snag within ' + warnTime/2000 + ' seconds, or you\'ll be escorted off stage.',
		afkHandler = function(userId) {
			bot.getCurrentDjsInRoom(function(djs) {
				if (djs.hasOwnProperty(userId)) {
					afkDjs[userId] = true;

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
				}
			});
		},
		activeHandler = function(userId) {
			if (afkDjs[userId]) {
				delete afkDjs[userId];
			}
		};

	

	this.name = 'afk-dj';

	this.description = 'Warns and removes DJ\'s from the stage if they are AFK.';

	this.enable = function() {
		bot.on('afk', afkHandler);
		bot.on('active', activeHandler);
	};

	this.disable = function() {
		bot.removeListener('afk', afkHandler);
		bot.removeListener('active', activeHandler);
		afkDjs = {};
	};

};