var commander = require('commander'),
	version = require('./package.json').version,
	express = require('express');
	
commander.version(version).usage('[options] <file ...>');

/*******************************
	PARSING OPTIONS
*******************************/
var config = {},
	optName,
	description,
	dashRegex = /-\w/gi,
	applicationOptions = [
		{ shortOption: 'a', longOption: 'auth-token', longOptionArgument: 'token', defaultValue: '', description: 'The token for the user to log in as.' },
		{ shortOption: 'u', longOption: 'user-id', longOptionArgument: 'id', defaultValue: '', description: 'The user id of the user to log in as.' },
		{ shortOption: 'r', longOption: 'room-id', longOptionArgument: 'id', defaultValue: '', description: 'The id of the room to join.' },
		{ shortOption: 'o', longOption: 'db-host', longOptionArgument: 'host', defaultValue: 'localhost', description: 'The Mongo DB host to connect to' },
		{ shortOption: 'p', longOption: 'db-port', longOptionArgument: 'number', defaultValue: '27017', description: 'The Mongo DB port' },
		{ shortOption: 'n', longOption: 'db-name', longOptionArgument: 'name', defaultValue: 'ttfm', description: 'The Mongo DB to connect to' },
		{ shortOption: 's', longOption: 'db-user', longOptionArgument: 'user', defaultValue: '', description: 'The Mongo DB user' },
		{ shortOption: 'w', longOption: 'db-password', longOptionArgument: 'password', defaultValue: '', description: 'The Mongo DB password' }
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


/*******************************
	Status route (to keep heroku happy)
*******************************/
var app = express.createServer(express.logger());
app.get('/', function(request, response) {
  response.send('Bot is running!');
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log('Listening on ' + port);
});


/*******************************
	Bot Logic
*******************************/
var ExtendedBot = require('./lib/ExtendedBot.js'),
	commandsAddOn = require('./lib/CommandsAddOn.js'),
	moderatorCommandsAddOn = require('./lib/ModeratorCommandsAddOn.js'),
	twssAddOn = require('./lib/TwssAddOn.js'),
	statsTrackerAddOn = require('./lib/StatsTrackerAddOn.js'),
	autoDjAddOn = require('./lib/AutoDjAddOn.js'),
	afkAddOn = require('./lib/AfkTrackerAddOn.js'),
	afkDjAddOn = require('./lib/AfkDjAddOn.js'),
	songStatsAnnouncerAddOn = require('./lib/SongStatsAnnouncerAddOn.js'),
	bot = new ExtendedBot(config.authToken, config.userId, config.roomId),
	dbConnectionString = 'mongodb://';

if (config.dbUser.length && config.dbPassword.length) {
	dbConnectionString += config.dbUser + ':' + config.dbPassword + '@';
}
dbConnectionString += config.dbHost + ':' + config.dbPort + '/' + config.dbName;



// register commands that users can type into chat
commandsAddOn(bot);

// register moderator commands that mods can type in a pm to the bot
moderatorCommandsAddOn(bot);

// register twss addon
twssAddOn(bot);

// register auto dj addon
autoDjAddOn(bot);

// register afk addom
afkAddOn(bot, 60 * 1000 * 10); // afk threshold of 10 minutes

// register afk dj addon
afkDjAddOn(bot, 60 * 1000); // warn time of 60 seconds

// register stats addon
statsTrackerAddOn(bot, dbConnectionString);

// register song stats announcer addon
songStatsAnnouncerAddOn(bot);
