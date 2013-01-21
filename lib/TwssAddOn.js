var twss = require('twss');

module.exports = function TwssAddOn(bot) {

	var speakHandler = function (data) {
			if (twss.is(data.text) && data.text.split(/\s/).length >= 4 && data.userid !== bot.userId) {
				console.log('twss probability:', Math.round(twss.prob(data.text)*100) + '%');
				console.log('twss msg:', data.text);
				if (Math.random() >= 0.75) {
					bot.speak('That\'s what she said.');
				}
			}
		},
		thresholdChangeHandler = function(oldValue, newValue) {
			twss.threshold = newValue;
		};

	this.name = 'twss';

	this.description = 'Responds with "That\'s what she said" to users chat messages when appropriate.';

	this.options = {
		threshold: {
			value: 0.9,
			type: Number,
			description: 'The threshold at which the bot will respond. The closer to 1 this is, the better the chance. (0-1).',
			isValid: function(val) {
				return (val >= 0 && val <= 1);
			},
			onChange: thresholdChangeHandler
		}
	};

	this.enable = function() {
		bot.on('speak', speakHandler);
	};

	this.disable = function() {
		bot.removeListener('speak', speakHandler);
	};
};