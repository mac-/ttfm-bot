// tell the bot to bop via chat/pm

module.exports = function GreeterAddOn(bot) {

	var responses = [
			'Hey! How are you @<user>?',
			'I\'m just chillin\' @<user>, what about you?',
			'I really need a hug @<user>!!',
			'Life is good @<user>, I\'m evolving every day!',
			'Go to hell @<user>... psyche!!!'
		],
		getRandomPhrase = function(phrases) {
			var randIdx = Math.round(Math.random() * (phrases.length - 1));
			return phrases[randIdx];
		},
		respond = function(msgData, issuerId, replyFunc) {
			var phrase = getRandomPhrase(responses);

			bot.getUserInfo(issuerId, function(userInfo) {
				if (userInfo) {
					phrase = phrase.replace('<user>', userInfo.name);
					replyFunc(phrase);
				}
				else {
					replyFunc('Sorry, I don\'t know who you are');
				}
			});
		},
		registeredHandler = function(data) {
			if (data.success) {
				if (bot.userId !== data.user[0].userid) {
					setTimeout(function() {
						bot.speak('Welcome @' + data.user[0].name + '! Type /help to see what I can do.');
					}, 3000);
					
				}
			}
		};

	this.name = 'greeter';

	this.description = 'Greets users as they enter the room and if they say hi to the bot.';

	this.commands = [
		{
			primaryCommand: '/hello',
			secondaryCommands: ['^.*hi tes.*$', '^.*hey tes.*$', '^.*hello tes.*$', '^.*whats? ?up tes.*$'],
			help: 'say "hi" to me',
			moderatorOnly: false,
			action: respond
		}
	];

	this.enable = function() {
		bot.on('registered', registeredHandler);
	};

	this.disable = function() {
		bot.removeListener('registered', registeredHandler);
	};
};