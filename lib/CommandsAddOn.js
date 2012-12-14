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

var isRegexString = function(str) {
	if (!str || !str.length) return false;
	var check = str.match(/^\^.*\$$/);
	if (!check || !check.length) return false;
	return true;
};

/*
	Command names strings supports both regex and non-regex variants:
	
	- Non-regex command name strings will be converted to regex later by escaping metacharacters and appending ^ and $
	- Regex command name strings MUST begin with ^ and end with $, otherwise they will be interpreted as non-regex and have additional regex appended
	- Text matching will be automatically lower cased to keep that in mind when writing command names
	
	DevNotes: I did a regex string instead of straight regex to make it potentially more configurable via json. Straight regex might be a better idea, i dunno.
	
*/
var commands = [
	{
		commandNames: ['/help'],
		help: 'this help menu',
		action: function(bot, msgData) {
			bot.pm(':black_square::black_square::black_square::black_square::black_square::black_square::black_square::black_square:', msgData.userid);
			setTimeout(function() { bot.pm('Available Commands:', msgData.userid) }, 100);
			
			for (var i = 0; i < commands.length; i++) {
				(function(index) {
					setTimeout(function() { bot.pm(commands[index].commandNames + ' - ' + commands[index].help, msgData.userid); }, (i+1) * 200);
				}(i));
			}
		}
	},
	{
		commandNames: ['/hello'],
		help: 'say "hi" to me',
		action: function(bot, msgData) {
			bot.speak('Hey! How are you @' + msgData.name + ' ?');
		}
	},
	{
		commandNames: ['/awesome', '/bop', '^.*dance tes.*$', '^.*hit it tes.*$', '^.*come on tes.*$'],
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
		
		var i, j,
			cmdNameStr,
			cmdRegex,
			hit = false;
		
		for (i = 0; i < commands.length; i++) {
			for (j = 0; j < commands[i].commandNames.length; j++) {
				
				cmdNameStr = commands[i].commandNames[j];
				
				if (isRegexString(cmdNameStr)) {
					cmdRegex = new RegExp(cmdNameStr);
				} else {
					cmdNameStr = cmdNameStr.replace("/", "\/");
					cmdRegex = new RegExp('^' + cmdNameStr + '$');
				};
				
				if (data.text.toLowerCase().match(cmdRegex)) {
					commands[i].action(bot, data);
					hit = true;
					break;
				}
			}
			if (hit) break;
		}
	});
};

