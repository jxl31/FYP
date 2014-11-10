var sjs = require('scraperjs');
sjs.StaticScraper
	.create('https://news.ycombinator.com')
	.scrape(function($) {
		return $('.title a').map(function() {
			return $(this).text();
		}).get().filter(function(elm) {
			return elm != 'More';
		});
	}, function(news) {
		news.forEach(function(elm) {
			console.log(elm);
		});
	});