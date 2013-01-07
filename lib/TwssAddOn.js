var twss = require('twss');

module.exports = function TwssAddOn(bot, options) {

	options = options || {};
	twss.threshold = options.threshold || 0.9;
	
	var speakHandler = function (data) {
			if (twss.is(data.text) && data.text.split(/\s/).length >= 4 && data.userid !== bot.userId) {
				console.log('twss probability:', Math.round(twss.prob(data.text)*100) + '%');
				console.log('twss msg:', data.text);
				if (Math.random() >= 0.75) {
					bot.speak('That\'s what she said.');
				}
			}
		};

	this.name = 'twss';

	this.description = 'Responds with "That\'s what she said" to users chat messages when appropriate.';

	this.enable = function() {
		bot.on('speak', speakHandler);
	};

	this.disable = function() {
		bot.removeListener('speak', speakHandler);
	};
};