// the bot starts dj'ing when there are 3 or fewer dj's and stops when there are at least 4

module.exports = function AutoDjAddOn(bot) {
	bot.addOns = bot.addOns || {};
	
	bot.on('rem_dj', function(data) {
		bot.getCurrentDjsInRoom(function(djs) {
			if (Object.keys(djs).length < 4 && !djs[bot.userId]) {
				setTimeout(function() { bot.addDj(); }, Math.random()*5000);
			}
		});
	});

	bot.on('add_dj', function(data) {
		bot.getCurrentDjsInRoom(function(djs) {
			if (Object.keys(djs).length > 4 && djs[bot.userId]) {
				setTimeout(function() { bot.remDj(); }, Math.random()*5000);
			}
		});
	});

	bot.on('registered', function(data) {
		if (data.success) {
			if (bot.userId === data.user[0].userid) {
				bot.getCurrentDjsInRoom(function(djs) {
					if (Object.keys(djs).length < 4) {
						setTimeout(function() { bot.addDj(); }, Math.random()*5000);
					}
				});
			}
		}
	});
	bot.emit('registered', {success:false});
};