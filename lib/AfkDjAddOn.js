/*
	*** requires AfkTrackerAddOn ***

	Warns DJ's who are AFK to become active and will escort them off stage if they stay
	AFK for too long.
*/

module.exports = function AfkDjAddOn(bot) {

	var afkDjs = {},
		self = this,
		getInitialWarning = function() {
			return '@<user>, are you AFK? No AFK DJ\'s are allowed when the stage is full. Please chat/bop/snag within ' + self.options.warnTime.value/1000 + ' seconds, or you\'ll be escorted off stage.';
		},
		getSecondaryWarning = function() {
			return '@<user>, Please chat/bop/snag within ' + self.options.warnTime.value/2000 + ' seconds, or you\'ll be escorted off stage.';
		},
		beginWarnSequence = function(userId) {
			var djs = bot.getCurrentDjsInRoom();
			bot.speak(getInitialWarning().replace('<user>', djs[userId].name));
						
			setTimeout(function() {
				if (afkDjs[userId]) {
					bot.speak(getSecondaryWarning().replace('<user>', djs[userId].name));
				}
			}, self.options.warnTime.value/2);

			setTimeout(function() {
				if (afkDjs[userId]) {
					bot.remDj(userId);
				}
			}, self.options.warnTime.value);
		},
		addDjHandler = function(data) {
			if (data.success) {
				var djs = bot.getCurrentDjsInRoom();
				if (djs.length > 4) {
					for (var userId in afkDjs) {
						beginWarnSequence(userId);
					}
				}
			}
		},
		afkHandler = function(userId) {
			var djs = bot.getCurrentDjsInRoom();
			if (djs.hasOwnProperty(userId)) {
				afkDjs[userId] = true;

				if (djs.length > 4) {
					beginWarnSequence(userId);
				}
			}
		},
		activeHandler = function(userId) {
			if (afkDjs[userId]) {
				delete afkDjs[userId];
			}
		};

	

	this.name = 'afk-dj';

	this.description = 'Warns and removes DJ\'s from the stage if they are AFK and the stage is full.';

	this.options = {
		warnTime: {
			value: 60,
			type: Number,
			description: 'The number of seconds a user has to become active in the room before they are removed from the stage for being AFK (1-999).',
			isValid: function(val) {
				return (val > 0 && val < 1000);
			}
		}
	};

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