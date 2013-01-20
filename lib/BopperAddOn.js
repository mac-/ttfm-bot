// tell the bot to bop via chat/pm

module.exports = function BopperAddOn(bot) {

	var responses = [
			'Yeah, <user>! I like this shit too!',
			'This makes me want to shake my tail feathers!',
			'Hey everyone check out my robot booty dance!',
			'Hell yeah, one of my all-time favs.',
			'This one is a goodie!',
			'Yes! Yes! Yes! Oh Lord ^@*& YES!',
			'I\'m boppin with you, <user>!',
			'You nailed it, <user>!',
			'Now this one is my style...'
		],
		getRandomPhrase = function(phrases) {
			var randIdx = Math.round(Math.random() * (phrases.length - 1));
			return phrases[randIdx];
		},
		bop = function(msgData, issuerId, replyFunc) {
			var phrase = getRandomPhrase(responses);

			bot.getUserInfo(issuerId, function(userInfo) {

				phrase = phrase.replace('<user>', userInfo.name);
				replyFunc(phrase);
				bot.bop();
			});
		};

	this.name = 'bopper';

	this.description = 'Provides commands to make the bot bop.';

	this.commands = [
		{
			primaryCommand: '/awesome',
			secondaryCommands: ['/bop', '^.*dance tes.*$', '^.*hit it tes.*$', '^.*shake it tes.*$', '^.*come on tes.*$', '^.*swing it tes.*$', '^.*rock it tes.*$'],
			help: 'make me bop',
			moderatorOnly: false,
			action: bop
		}
	];

	this.enable = function() {
		// nothing to do
	};

	this.disable = function() {
		// nothing to do
	};
};