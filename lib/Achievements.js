/*
	Achievements require 3 props: name, description, and check.

	the check method should accept 4 parameters:
		the first being the original data before the event happened
		the second being the new data after the event happened
		the third being the id of the user that the achievement is being checked for
		the fourth being the bot object to be able to perform furhter actions
	the check method should return true if the achievement has been satisfied

	As a best practice, the check method should always validate the data parameters,
	and return false if the data doesn't match what is expected since all achievements
	are checked against different types of events and data for those events.
*/
module.exports = [

	// Achievements for: UP VOTES GIVEN
	{
		name: 'Thumbs Upper',
		description: 'vote for 10 songs in this room',
		icon: ':thumbsup:',
		check: function(oldData, newData, userId, bot) {
			if (!newData.upVotesGiven) return false;
			return (newData.upVotesGiven >= 10);
		}
	},
	{
		name: 'Boppin\' Betty',
		description: 'vote for 50 songs in this room',
		icon: ':notes:',
		check: function(oldData, newData, userId, bot) {
			if (!newData.upVotesGiven) return false;
			return (newData.upVotesGiven >= 50);
		}
	},
	{
		name: 'It\'s Your Duty',
		description: 'vote for 100 songs in this room',
		icon: ':put_litter_in_its_place:',
		check: function(oldData, newData, userId, bot) {
			if (!newData.upVotesGiven) return false;
			return (newData.upVotesGiven >= 100);
		}
	},
	{
		name: 'I\'m Lovin\' It',
		description: 'vote for 200 songs in this room',
		icon: ':blue_heart:',
		check: function(oldData, newData, userId, bot) {
			if (!newData.upVotesGiven) return false;
			return (newData.upVotesGiven >= 200);
		}
	},
	{
		name: 'Green Thumber',
		description: 'vote for 500 songs in this room',
		icon: ':seedling:',
		check: function(oldData, newData, userId, bot) {
			if (!newData.upVotesGiven) return false;
			return (newData.upVotesGiven >= 500);
		}
	},
	{
		name: 'Me Like You Long Time',
		description: 'vote for 1000 songs in this room',
		icon: ':clap:',
		check: function(oldData, newData, userId, bot) {
			if (!newData.upVotesGiven) return false;
			return (newData.upVotesGiven >= 1000);
		}
	},



	// Achievements for: UP VOTES RECIEVED
	{
		name: 'Opening Act',
		description: 'get 10 votes for songs you play in this room',
		icon: ':beginner:',
		check: function(oldData, newData, userId, bot) {
			if (!newData.upVotesRecieved) return false;
			return (newData.upVotesRecieved >= 10);
		}
	},
	{
		name: 'Beat Juggler',
		description: 'get 25 votes for songs you play in this room',
		icon: ':eyeglasses:',
		check: function(oldData, newData, userId, bot) {
			if (!newData.upVotesRecieved) return false;
			return (newData.upVotesRecieved >= 25);
		}
	},
	{
		name: 'Spin To Win',
		description: 'get 50 votes for songs you play in this room',
		icon: ':tophat:',
		check: function(oldData, newData, userId, bot) {
			if (!newData.upVotesRecieved) return false;
			return (newData.upVotesRecieved >= 50);
		}
	},
	{
		name: 'The Gift Of Music',
		description: 'get 100 votes for songs you play in this room',
		icon: ':100:',
		check: function(oldData, newData, userId, bot) {
			if (!newData.upVotesRecieved) return false;
			return (newData.upVotesRecieved >= 100);
		}
	},
	{
		name: 'Spin Master',
		description: 'get 200 votes for songs you play in this room',
		icon: ':musical_score:',
		check: function(oldData, newData, userId, bot) {
			if (!newData.upVotesRecieved) return false;
			return (newData.upVotesRecieved >= 200);
		}
	},
	{
		name: 'DJ Extraodinaire',
		description: 'get 300 votes for songs you play in this room',
		icon: ':microphone:',
		check: function(oldData, newData, userId, bot) {
			if (!newData.upVotesRecieved) return false;
			return (newData.upVotesRecieved >= 300);
		}
	},
	{
		name: 'Headliner',
		description: 'get 500 votes for songs you play in this room',
		icon: ':mega:',
		check: function(oldData, newData, userId, bot) {
			if (!newData.upVotesRecieved) return false;
			return (newData.upVotesRecieved >= 500);
		}
	},
	{
		name: 'Millennial',
		description: 'get 1000 votes for songs you play in this room',
		icon: ':space_invader:',
		check: function(oldData, newData, userId, bot) {
			if (!newData.upVotesRecieved) return false;
			return (newData.upVotesRecieved >= 1000);
		}
	},




	// Achievements for: DOWN VOTES RECIEVED
	{
		name: 'Throw Me A Bone',
		description: 'get 10 down votes for songs you play in this room',
		icon: ':poultry_leg:',
		check: function(oldData, newData, userId, bot) {
			if (!newData.downVotesRecieved) return false;
			return (newData.downVotesRecieved >= 10);
		}
	},
	{
		name: 'Ruin The Mood',
		description: 'get 20 down votes for songs you play in this room',
		icon: ':poop:',
		check: function(oldData, newData, userId, bot) {
			if (!newData.downVotesRecieved) return false;
			return (newData.downVotesRecieved >= 20);
		}
	},
	{
		name: 'Get Off The Stage',
		description: 'get 50 down votes for songs you play in this room',
		icon: ':thumbsdown:',
		check: function(oldData, newData, userId, bot) {
			if (!newData.downVotesRecieved) return false;
			return (newData.downVotesRecieved >= 50);
		}
	}/*,




	// Achievements for: MISC EVENTS

	{
		name: 'Asleep At The Wheel',
		description: 'be the first to give a song an up vote',
		icon: ':point_right:',
		check: function(oldData, newData, userId, bot) {
			if (!newData.downVotesRecieved) return false;
			return (newData.downVotesRecieved >= 50);
		}
	},


	// note: need to add votes array to songs
	{
		name: 'On The Cutting Edge',
		description: 'be the first to give a song an up vote',
		icon: ':point_right:',
		check: function(oldData, newData, userId, bot) {
			if (!newData.downVotesRecieved) return false;
			return (newData.downVotesRecieved >= 50);
		}
	},
	{
		name: 'First Follower',
		description: 'be the second to give a song an up vote',
		icon: ':point_right:',
		check: function(oldData, newData, userId, bot) {
			if (!newData.downVotesRecieved) return false;
			return (newData.downVotesRecieved >= 50);
		}
	},
	{
		name: 'Not Afraid Of The Truth',
		description: 'be the first to give a song a down vote',
		icon: ':point_right:',
		check: function(oldData, newData, userId, bot) {
			if (!newData.downVotesRecieved) return false;
			return (newData.downVotesRecieved >= 50);
		}
	},


	{
		name: 'Good Taste',
		description: 'be the first DJ of a song that eventually gets 5 up votes',
		icon: ':point_right:',
		check: function(oldData, newData, userId, bot) {
			if (!newData.downVotesRecieved) return false;
			return (newData.downVotesRecieved >= 50);
		}
	},
	{
		name: 'On The Cutting Edge',
		description: 'be the first DJ of a song that eventually gets 10 up votes',
		icon: ':point_right:',
		check: function(oldData, newData, userId, bot) {
			if (!newData.downVotesRecieved) return false;
			return (newData.downVotesRecieved >= 50);
		}
	},
	{
		name: 'On The Cutting Edge',
		description: 'be the first DJ of a song that eventually gets 25 up votes',
		icon: ':point_right:',
		check: function(oldData, newData, userId, bot) {
			if (!newData.downVotesRecieved) return false;
			return (newData.downVotesRecieved >= 50);
		}
	},
	{
		name: '',
		description: 'be the first DJ of a song that eventually gets 50 up votes',
		icon: ':point_right:',
		check: function(oldData, newData, userId, bot) {
			if (!newData.downVotesRecieved) return false;
			return (newData.downVotesRecieved >= 50);
		}
	}
	*/
];