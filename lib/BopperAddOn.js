// tell the bot to bop via chat/pm

module.exports = function BopperAddOn(bot) {

	var self = this,
		currentNumberOfBops = 0,
		responses = [
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
			var phrase = getRandomPhrase(responses),
				currentSong = bot.getCurrentSong(),
				currentDj = currentSong ? currentSong.current_dj : null;
			if (currentDj) {
				if (self.options.canBopYourself.value || issuerId !== currentDj) {
					bot.getUserInfo(issuerId, function(userInfo) {
						if (userInfo) {
							currentNumberOfBops++;
							
							if (currentNumberOfBops < self.options.minAwesomes.value) {
								replyFunc('I just need ' + (self.options.minAwesomes.value - currentNumberOfBops) + ' more votes, and then I\'ll bop');
							}
							else {
								phrase = phrase.replace('<user>', userInfo.name);
								replyFunc(phrase);
								bot.bop();
							}
						}
						else {
							replyFunc('Unable to get your user info');
						}
					});
				}
				else {
					replyFunc('Sorry, you can\'t bop yourself');
				}
			}
			else {
				replyFunc('Sorry, I can\'t bop if there is no song playing');
			}
		},
		newSongHandler = function(data) {
			if (data.success) {
				currentNumberOfBops = 0;
			}
		},
		votesChangeHandler = function(oldValue, newValue) {
			if (currentNumberOfBops >= newValue) {
				bot.bop();
			}
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

	this.options = {
		canBopYourself: {
			value: true,
			type: Boolean,
			description: 'Specifies whether or not a user can tell the bot to upvote their own song.'
		},
		minAwesomes: {
			value: 1,
			type: Number,
			description: 'The minimum number of "awesomes" before the bot will bop (1-100).',
			isValid: function(val) {
				return (val > 0 && val <= 100);
			},
			onChange: votesChangeHandler
		}
	}

	this.enable = function() {
		bot.on('newsong', newSongHandler);
	};

	this.disable = function() {
		bot.removeListener('newsong', newSongHandler);
	};
};