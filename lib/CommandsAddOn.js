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
		commandNames: ['help'],
		help: 'this help menu',
		action: function(bot, msgData) {
			bot.pm('TeslaBot Help', msgData.userid);
			bot.pm('Prefix the following commands with "/" (i.e. "/hello"):', msgData.userid);
			for (var i = 0; i < commands.length; i++) {
				bot.pm(commands.commandNames + ' - ' + commands.help, msgData.userid);
			}
		}
	},
	{
		commandNames: ['hello'],
		help: 'say "hi" to me',
		action: function(bot, msgData) {
			bot.speak('Hey! How are you @' + msgData.name + ' ?');
		}
	},
	{
		commandNames: ['awesome', 'bop'],
		help: 'make me bop',
		action: function(bot, msgData) {
			var randIdx = Math.round(Math.random() * (awesomePhrases.length - 1));
			var phrase = awesomePhrases[randIdx];

			phrase = phrase.replace('<user>', msgData.name);
			bot.speak(phrase);
			bot.bop();
		}
	}
];

module.exports = function CommandsAddOn(bot) {
	bot.on('speak', function(data) {
		var i, j, cmdRegex, hit = false;
		for (i = 0; i < commands.length; i++) {
			for (j = 0; j < commands[i].commandNames.length; j++) {
				cmdRegex = new RegExp('^\/' + commands[i].commandNames[j] + '$');
				if (data.text.match(cmdRegex)) {
					commands[i].action(bot, data);
					hit = true;
					break;
				}
			}
			if (hit) break;
		}
	});
};

