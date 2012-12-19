/*
	Example msgData:
	{
		"command": "speak",
		"userid": "4dea70c94fe7d0517b1a3519",
		"name": "@richhemsley",
		"text": "lol"
	}
*/

var _ = require('underscore'),
	findUserIdInRoomByName = function(name, bot, callback) {
		bot.roomInfo(function(roomData) {
			var userId = null,
				cmdRegex = new RegExp(name, 'i');
			roomData.users.forEach(function(user) {
				// check name
				if (user.name.match(cmdRegex)) {
					userId = user.userid;
				}
			});
			callback(userId);
		});
	};


var commands = [
	{
		command: '/help',
		help: 'this help menu',
		action: function(bot, msgData) {
			bot.pm(':black_square::black_square::black_square::black_square::black_square::black_square::black_square::black_square:', msgData.senderid);
			setTimeout(function() { bot.pm('Available Admin Commands:', msgData.senderid) }, 200);
			
			for (var i = 0; i < commands.length; i++) {
				(function(index) {
					var args = (commands[index].arguments) ? ' <' + commands[index].arguments.join('> <') + '> ' : '';
					setTimeout(function() { bot.pm(':point_right: ' + commands[index].command + args + ' - ' + commands[index].help, msgData.senderid); }, (i+1) * 300);
				}(i));
			}
		}
	},
	{
		command: '/escort',
		arguments: ['user'],
		help: 'escort a dj off the stage by name',
		action: function(bot, msgData) {
			var args = msgData.text.split(/\s/);
			args.shift();
			var name = args.join(' ');
			findUserIdInRoomByName(name, bot, function(userId) {
				if (userId) {
					bot.remDj(userId);
				}
				else {
					bot.pm('Unable to find a user that matches "' + name + '"', msgData.senderid);
				}
			});
			
		}
	},
	{
		command: '/kick',
		arguments: ['user'],
		help: 'kick a user out of the room',
		action: function(bot, msgData) {
			var args = msgData.text.split(/\s/);
			args.shift();
			var name = args.join(' ');
			findUserIdInRoomByName(name, bot, function(userId) {
				if (userId) {
					// random reasons array?
					bot.boot(userId, 'GTFO');
				}
				else {
					bot.pm('Unable to find a user that matches "' + name + '"', msgData.senderid);
				}
			});
			
		}
	},
	{
		command: '/ban',
		arguments: ['user'],
		help: 'bans a user from the room',
		action: function(bot, msgData) {
			var args = msgData.text.split(/\s/);
			args.shift();
			var name = args.join(' ');
			findUserIdInRoomByName(name, bot, function(userId) {
				if (userId) {
					// random reasons array?
					bot.emit('ban_command', userId);
				}
				else {
					bot.pm('Unable to find a user that matches "' + name + '"', msgData.senderid);
				}
			});
		}
	},
	{
		command: '/unban',
		arguments: ['user'],
		help: 'unbans a user from the room',
		action: function(bot, msgData) {
			var args = msgData.text.split(/\s/);
			args.shift();
			var name = args.join(' ');
			bot.emit('unban_command', name);
		}
	}
];


module.exports = function ModeratorCommandsAddOn(bot) {
	bot.addOns = bot.addOns || {};

	bot.on('pmmed', function(pmData) {
		if (bot.userId !== pmData.senderid) {
			bot.roomInfo(function(roomData) {
				if (roomData.room.metadata.moderator_id.indexOf(pmData.senderid) >= 0) {
					var i,
						cmdRegex;
					
					for (i = 0; i < commands.length; i++) {
						cmdRegex = new RegExp('^' + commands[i].command + '.*$');
						if (pmData.text.toLowerCase().match(cmdRegex)) {
							console.log(pmData.text);
							commands[i].action(bot, pmData);
							break;
						}
					}
				}
			});
		}
		
	});
};

