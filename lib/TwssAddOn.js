var twss = require('twss');
twss.threshold = 0.9;

module.exports = function TwssAddOn(bot) {
	bot.addOns = bot.addOns || {};
	
	bot.on('speak', function (data) {
		if (twss.is(data.text) && data.text.split(/\s/).length >= 4 && data.userid !== bot.userId) {
			console.log('twss probability:', Math.round(twss.prob(data.text)*100) + '%');
			console.log('twss msg:', data.text);
			if (Math.random() >= 0.75) {
				bot.speak('That\'s what she said.');
			}
		}
	});
};