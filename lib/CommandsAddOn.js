/*
	Example msgData:
	{
		"command": "speak",
		"userid": "4dea70c94fe7d0517b1a3519",
		"name": "@richhemsley",
		"text": "lol"
	}
*/

var awesomePhrases = require('./AwesomePhrases.js');

var commands = [
	{
		command: 'hello',
		action: function(bot, msgData) {
			bot.speak('Hey! How are you @' + msgData.name + ' ?');
		}
	},
	{
		command: 'awesome',
		action: function(bot, msgData) {
			var randIdx = Math.round(Math.random() * (awesomePhrases.length - 1));
			var phrase = awesomePhrases[randIdx];

			phrase = phrase.replace('<user>', data.name);
			bot.speak(phrase);
			bot.bop();
		}
	}
];

module.exports = function CommandsAddOn(bot) {
	bot.on('speak', function(data) {
		var i, cmdRegex;
		for (i = 0; i < commands.length; i++) {
			cmdRegex = new RegExp('^\/' + commands[i].command + '$');
			if (data.text.match(cmdRegex)) {
				commands[i].action(bot, data);
				break;
			}
		}
	});
};

