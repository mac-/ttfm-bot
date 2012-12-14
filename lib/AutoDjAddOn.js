// the bot starts dj'ing when there are 2 or fewer dj's and stops when there are at least 3

module.exports = function AutoDjAddOn(bot) {
	bot.on('rem_dj', function(data) {
		bot.roomInfo(true, function(roomData) {
			if (roomData.djids.length < 3 && roomData.djids.indexOf(bot.userId) < 0) {
				setTimeout(function() { bot.addDj(); }, Math.random()*5000);
			}
		});
	});

	bot.on('add_dj', function(data) {
		bot.roomInfo(true, function(roomData) {
			if (roomData.djids.length > 3 && roomData.djids.indexOf(bot.userId) > -1) {
				setTimeout(function() { bot.remDj(); }, Math.random()*5000);
			}
		});
	});

	bot.on('registered', function(data) {
		if (data.success) {
			if (bot.userId === data.user[0].userid) {
				bot.roomInfo(true, function(roomData) {
					if (roomData.djids.length < 3) {
						setTimeout(function() { bot.addDj(); }, Math.random()*5000);
					}
				});
			}
		}
	});
};