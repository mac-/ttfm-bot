/*
	Example msgData:
	{
		"command": "speak",
		"userid": "4dea70c94fe7d0517b1a3519",
		"name": "@richhemsley",
		"text": "lol"
	}
*/

var _ = require('underscore');


var commands = [
	{
		command: '/help',
		help: 'this help menu',
		action: function(bot, msgData) {
			var args, messages = [];
			messages.push(':black_square::black_square::black_square::black_square::black_square::black_square::black_square::black_square:');
			messages.push('Available Admin Commands:');
			
			commands.forEach(function(command) {
				args = (command.arguments) ? ' <' + command.arguments.join('> <') + '> ' : '';
				messages.push(':point_right: ' + command.command + args + ' - ' + command.help);
			});

			bot.multiPm(messages, msgData.senderid, 300);
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
			bot.findUserIdInRoomByName(name, function(userId) {
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
			bot.findUserIdInRoomByName(name, function(userId) {
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
			bot.findUserIdInRoomByName(name, function(userId) {
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
	},
	{
		command: '/say',
		arguments: ['text'],
		help: 'make me say something in chat',
		action: function(bot, msgData) {
			var args = msgData.text.split(/\s/);
			args.shift();
			var text = args.join(' ');
			bot.speak(text);
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
							commands[i].action(bot, pmData);
							break;
						}
					}
				}
			});
		}
		
	});
};

