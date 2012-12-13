// the bot starts dj'ing when there are 2 or fewer dj's and stops when there are at least 3

module.exports = function AutoDjAddOn(bot) {
	bot.on('rem_dj', function(data) {
		bot.roomInfo(true, function(roomData) {
			if (roomData.djids.length < 3 && roomData.djids.indexOf(config.userId) < 0) {
				bot.addDj();
			}
		});
	});

	bot.on('add_dj', function(data) {
		bot.roomInfo(true, function(roomData) {
			if (roomData.djids.length > 3 && roomData.djids.indexOf(config.userId) > -1) {
				bot.remDj();
			}
		});
	});

	bot.on('registered', function(data) {
		if (data.success) {
			if (bot.userId === data.user[0].userid) {
				bot.roomInfo(true, function(roomData) {
					if (roomData.djids.length < 3) {
						bot.addDj();
					}
				});
			}
		}
	});
};