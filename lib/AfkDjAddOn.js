/*
	*** requires AfkTrackerAddOn ***

	Warns DJ's who are AFK to become active and will escort them off stage if they stay
	AFK for too long.
*/

module.exports = function AfkDjAddOn(bot, warnTime) {

	var afkDjs = {},
		warnTime = warnTime || 60000, // default to 30 second warn time
		initialWarning = '@<user>, are you AFK? Please chat/bop/snag within ' + warnTime/1000 + ' seconds, or you\'ll be escorted off stage.',
		secondaryWarning = '@<user>, Please chat/bop/snag within ' + warnTime/2000 + ' seconds, or you\'ll be escorted off stage.';

	bot.on('afk', function(userId) {
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
	});

	bot.on('active', function(userId) {
		if (afkDjs[userId]) {
			delete afkDjs[userId];
		}
	});

};