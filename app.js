var commander = require('commander'),
	version = require('./package.json').version;
commander
	.version(version)
	.usage('[options] <file ...>');

var config = {},
	optName,
	description,
	dashRegex = /-\w/gi,
	applicationOptions = [
		{ shortOption: 'a', longOption: 'auth-token', longOptionArgument: 'token', defaultValue: '', description: 'The token for the user to log in as.' },
		{ shortOption: 'u', longOption: 'user-id', longOptionArgument: 'id', defaultValue: '', description: 'The user id of the user to log in as.' },
		{ shortOption: 'r', longOption: 'room-id', longOptionArgument: 'id', defaultValue: '', description: 'The id of the room to join.' }
	];

// apply options to command line
applicationOptions.forEach(function(option) {
	description = option.description
	if (option.hasOwnProperty('defaultValue') && option.defaultValue !== null) {
		description += ' Defaults to: ';
		description += (typeof(option.defaultValue) === 'string') ? '"' + option.defaultValue + '"' : option.defaultValue;
	}
	var longOptionStr = (option.longOptionArgument) ? option.longOption + ' <' + option.longOptionArgument + '>' : option.longOption;
	commander.option('-' + option.shortOption + ', --' + longOptionStr, description);
});

// parse options form arguments
commander.parse(process.argv);

// save options to config obj (from env vars first, command line second, and defaults last)
applicationOptions.forEach(function(option) {
	optName = option.longOption;
	option.longOption.match(dashRegex).forEach(function(match) {
		optName = optName.replace(match, match[1].toUpperCase());
	});
	config[optName] = process.env[optName] || commander[optName] || option.defaultValue;
});





var Bot = require('ttapi');
var bot = new Bot(config.authToken, config.userId, config.roomId);


var FileStore = require("file-store"),
    userStore = FileStore("userLogins.txt"),
    achievementsStore = FileStore("achievements.txt");


bot.on('registered', function(data) {
	if (data.success) {
		userStore.push(data.user[0].userid, new Date(), function(err) {
			if (err) {
				console.log('Error logging user registration.')
			}
		});
	}
});


