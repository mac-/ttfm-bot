// the bot starts dj'ing when there are 3 or fewer dj's and stops when there are at least 4

module.exports = function AutoDjAddOn(bot) {

	var removeDjHandler = function(data) {
			var djs = bot.getCurrentDjsInRoom();
			if (Object.keys(djs).length < 4 && !djs[bot.userId]) {
				setTimeout(function() { bot.addDj(); }, Math.random()*5000);
			}
		},
		addDjHandler = function(data) {
			var djs = bot.getCurrentDjsInRoom();
			if (Object.keys(djs).length > 4 && djs[bot.userId]) {
				setTimeout(function() { bot.remDj(); }, Math.random()*5000);
			}
		},
		connectHandler = function() {
			var djs = bot.getCurrentDjsInRoom();
			if (Object.keys(djs).length < 4) {
				setTimeout(function() { bot.addDj(); }, Math.random()*5000);
			}
		};

	this.name = 'auto-dj';

	this.description = 'Tracks the number of current DJ\'s and promotes the bot to DJ if there are fewer than 4.';

	this.enable = function() {
		bot.on('rem_dj', removeDjHandler);
		bot.on('add_dj', addDjHandler);
		if (!bot.isConnected()) {
			bot.once('connect', connectHandler);
		}
		else {
			connectHandler();
		}
	};

	this.disable = function() {
		bot.removeListener('rem_dj', removeDjHandler);
		bot.removeListener('add_dj', addDjHandler);
		bot.remDj();
	};
};