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

	// Achievements for: POINTS
	{
		name: 'Johnny Five',
		description: 'acquire 5 points in this room',
		check: function(oldData, newData, userId, bot) {
			if (!newData.points) return false;
			return (newData.points >= 5);
		}
	},
	{
		name: 'Wannabe',
		description: 'acquire 50 points in this room',
		check: function(oldData, newData, userId, bot) {
			if (!newData.points) return false;
			return (newData.points >= 50);
		}
	},
	{
		name: 'DJ Extraodinaire',
		description: 'acquire 500 points in this room',
		check: function(oldData, newData, userId, bot) {
			if (!newData.points) return false;
			return (newData.points >= 500);
		}
	},
	{
		name: 'Spin Master',
		description: 'acquire 5000 points in this room',
		check: function(oldData, newData, userId, bot) {
			if (!newData.points) return false;
			return (newData.points >= 5000);
		}
	},



	// Achievements for: UP VOTES GIVEN
	{
		name: 'Thumbs Upper',
		description: 'vote for 10 songs in this room',
		check: function(oldData, newData, userId, bot) {
			if (!newData.upVotesGiven) return false;
			return (newData.upVotesGiven >= 10);
		}
	},
	{
		name: 'Boppin\' Betty',
		description: 'vote for 50 songs in this room',
		check: function(oldData, newData, userId, bot) {
			if (!newData.upVotesGiven) return false;
			return (newData.upVotesGiven >= 50);
		}
	},
	{
		name: 'It\'s Your Duty',
		description: 'vote for 100 songs in this room',
		check: function(oldData, newData, userId, bot) {
			if (!newData.upVotesGiven) return false;
			return (newData.upVotesGiven >= 100);
		}
	},
	{
		name: 'I\'m Lovin\' It',
		description: 'vote for 200 songs in this room',
		check: function(oldData, newData, userId, bot) {
			if (!newData.upVotesGiven) return false;
			return (newData.upVotesGiven >= 200);
		}
	},
	{
		name: 'Green Thumber',
		description: 'vote for 500 songs in this room',
		check: function(oldData, newData, userId, bot) {
			if (!newData.upVotesGiven) return false;
			return (newData.upVotesGiven >= 500);
		}
	},
	{
		name: 'Me Like You Long Time',
		description: 'vote for 1000 songs in this room',
		check: function(oldData, newData, userId, bot) {
			if (!newData.upVotesGiven) return false;
			return (newData.upVotesGiven >= 1000);
		}
	},



	// Achievements for: UP VOTES RECIEVED
	{
		name: 'Opening Act',
		description: 'get 10 votes for songs you play in this room',
		check: function(oldData, newData, userId, bot) {
			if (!newData.upVotesRecieved) return false;
			return (newData.upVotesRecieved >= 10);
		}
	},
	{
		name: 'Beat Juggler',
		description: 'get 50 votes for songs you play in this room',
		check: function(oldData, newData, userId, bot) {
			if (!newData.upVotesRecieved) return false;
			return (newData.upVotesRecieved >= 50);
		}
	},
	{
		name: 'Spin To Win',
		description: 'get 100 votes for songs you play in this room',
		check: function(oldData, newData, userId, bot) {
			if (!newData.upVotesRecieved) return false;
			return (newData.upVotesRecieved >= 100);
		}
	},
	{
		name: 'The Gift Of Music',
		description: 'get 200 votes for songs you play in this room',
		check: function(oldData, newData, userId, bot) {
			if (!newData.upVotesRecieved) return false;
			return (newData.upVotesRecieved >= 200);
		}
	},
	{
		name: 'Headliner',
		description: 'get 500 votes for songs you play in this room',
		check: function(oldData, newData, userId, bot) {
			if (!newData.upVotesRecieved) return false;
			return (newData.upVotesRecieved >= 500);
		}
	},
	{
		name: 'Millennial',
		description: 'get 1000 votes for songs you play in this room',
		check: function(oldData, newData, userId, bot) {
			if (!newData.upVotesRecieved) return false;
			return (newData.upVotesRecieved >= 1000);
		}
	},




	// Achievements for: DOWN VOTES RECIEVED
	{
		name: 'Throw Me A Bone',
		description: 'get 10 down votes for songs you play in this room',
		check: function(oldData, newData, userId, bot) {
			if (!newData.downVotesRecieved) return false;
			return (newData.downVotesRecieved >= 10);
		}
	},
	{
		name: 'Get Off The Stage',
		description: 'get 50 down votes for songs you play in this room',
		check: function(oldData, newData, userId, bot) {
			if (!newData.downVotesRecieved) return false;
			return (newData.downVotesRecieved >= 50);
		}
	}




	// Achievements for: MISC EVENTS
];