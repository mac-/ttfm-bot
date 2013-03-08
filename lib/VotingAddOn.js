// adds voting functionality

module.exports = function VotingAddOn(bot) {

	var _ = require('underscore'),
		self = this,
		voteInProgress = false,
		voteChoices = {},
		votesPossible = 0,
		currentVotes = 0,
		voters = {},
		voteRegexString = '^[1-{max}](\\s|$)',
		voteTimeout,
		beginVoteHandler = function(voteId, title, choices) {
			if (voteInProgress || !voteId || !title || !choices) {
				return bot.emit('voteIgnored', voteId);
			}

			voteChoices = {};
			votesPossible = 0;
			currentVotes = 0;
			voters = {};
			voteInProgress = true;

			var messages,
				voteChoiceHandler = function(msgData) {
					var regex = new RegExp(voteRegexString.replace('{max}', choices.length));
					if (regex.test(msgData.text)) {
						var choiceNum = msgData.text[0];
						if (voters[msgData.userid]) {
							if (!self.options.allowChange.value) {
								return bot.speak('Your vote has already been counted, @' + msgData.name);
							}
							voteChoices[voters[msgData.userid]].totalVotes--;
							currentVotes--;
						}
						voters[msgData.userid] = choiceNum;
						
						voteChoices[choiceNum].totalVotes++;
						currentVotes++;
						
						bot.speak(':ballot_box_with_check: ' + msgData.name + ' voted for: ' + voteChoices[choiceNum].name);

						if (currentVotes === votesPossible - 1) {
							setTimeout(endVote, 500);
						}
					}
				},
				endVote = function() {
					var winningChoice = _.last(_.sortBy(voteChoices, 'totalVotes')),
						winningPercentage,
						ties = _.filter(voteChoices, function(choice) {
							return choice.totalVotes === winningChoice.totalVotes;
						}),
						winningChoiceWithBotInput = (ties.length > 1) ? ties[Math.round(Math.random() * (ties.length - 1))] : winningChoice;

					messages = ['The vote has ended!'];

					if (ties.length > 1) {
						currentVotes++;
						winningChoiceWithBotInput.totalVotes++;
						messages.push('There was a tie! So I voted and broke the tie.');
					}
					
					winningPercentage = Math.round((winningChoiceWithBotInput.totalVotes / currentVotes) * 100);
					messages.push('Winning choice (' + winningPercentage + '%): ' + winningChoice.name);

					voteInProgress = false;
					bot.removeListener('speak', voteChoiceHandler);

					bot.emit('endVote', voteId, winningChoice);

					bot.multiSpeak(messages, 300);
				};

			bot.getCurrentUsersInRoom(function(users) {
				votesPossible = users.length;
				messages = [':heavy_minus_sign::heavy_minus_sign::heavy_minus_sign::heavy_minus_sign::heavy_minus_sign::heavy_minus_sign::heavy_minus_sign::heavy_minus_sign::heavy_minus_sign::heavy_minus_sign:', ':mega: Time to vote!', title];

				_.each(choices, function(choice, index) {
					voteChoices[index+1] = {
						name: choice,
						index: index,
						totalVotes: 0
					};
					messages.push(index+1 + ') ' + choice);
				});
				messages.push('Vote now by responding with the number you want to vote for!')
				bot.on('speak', voteChoiceHandler);


				bot.multiSpeak(messages, 300);

				voteTimeout = setTimeout(function() {
					if (voteInProgress) {
						endVote();
					}
				}, self.options.duration.value * 1000);
			});
		},
		registerHandler = function(data) {
			votesPossible++;
		},
		deregisterHandler = function(data) {
			votesPossible--;
			if (voters[data.user[0].userid]) {
				voteChoices[voters[data.user[0].userid]].totalVotes--;
				delete voters[data.user[0].userid];
				currentVotes--;
			}
		};

	this.name = 'voting';

	this.description = 'Adds voting functionality that other add ons can utilize.';

	this.commands = [];

	this.options = {
		allowChange: {
			value: false,
			type: Boolean,
			description: 'A flag used to control whether or not a user can change their vote.'
		},
		duration: {
			value: 30,
			type: Number,
			description: 'The number of seconds that all votes will last (1-60).',
			isValid: function(val) {
				return (val > 0 && val <= 60);
			}
		}
	};

	this.enable = function() {
		bot.on('beginVote', beginVoteHandler);
		bot.on('registered', registerHandler);
		bot.on('deregistered', deregisterHandler);
	};

	this.disable = function() {
		bot.removeListener('beginVote', beginVoteHandler);
		bot.removeListener('registered', registerHandler);
		bot.removeListener('deregistered', deregisterHandler);
	};
};