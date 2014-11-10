'use strict';
var express = require("express"); //framework for node
var request = require("request"); //deals with the web requests
var cheerio = require("cheerio"); //allows the returned html body to be traversed like jQuery does.
var bodyParser = require("body-parser");
var sjs = require("scraperjs");
var app = express();

var router = express.Router();

router.use(function(req, res, next) {
	next(); // make sure we go to the next routes and don't stop here
});

router.get('/', function(req,res){
	res.json({ message : "Try is a good!"})
});

router.route('/authors').get(function(req,res){
	sjs.StaticScraper
		.create('http://arrow.dit.ie/authors.html')
		.scrape(function($) {
			var array = [];
			var author_regex = '[A]';
			var keyRegex = '(context|ancestor_key)[=\\:](\\d+)';
			var count = 0;
			$('h2').each(function(i, element){
				var idTemp = $(this).attr('id');
				if(idTemp != null || idTemp != undefined){
					var idProper = $(this).attr('id').match('A');
					if(idProper){
						var el = '#'+idProper[0];
						$(el).nextUntil('div').each(function(i,element){
							///TO DO: Some authors only published one document which is of type Thesis and the string (Thesis) is included
					 		/// 	  in the name. Replace (Thesis) with nothing and check array if it contains the name already if not
					 		///       then push into array. Otherwise ignore.
					 		/// 	  if($(this).hasClass("top") || $(this).text().indexOf('(Thesis)') > -1 ){}
							if($(this).is('p') && !$(this).hasClass('top') && !($(this).text().indexOf('(Thesis)') > -1)){
								var sLink = $(this).children()[0].attribs.href; //link to the author
								var sKey = sLink.match(keyRegex);
								//var sAuthorDocCount = parseInt($(this).children()[0].next.data.match(/\d+/),10); //number of doc
								var sAuthorName = $(this).children()[0].children[0].data; //name of author and type of document
								array.push({ name: sAuthorName,link: sLink, key: sKey[2]});
							}
						})
					}
				}
			}).get();
			return array;
			}, function(data) { //data is array since returning anything that has a callback function will be the parameter of the callback function
				res.json(data);
		});
});

router.route('/author/:fname/:lname/:key').get(function(req,res){
	var sGeneralURL = 'http://arrow.dit.ie/do/search/results/json?start=0&facet=&facet=&facet=&facet=&facet=&facet=&q=author_lname%3A"lastname"%20AND%20author_fname%3A"firstname"&op_1=AND&field_1=text%3A&value_1=&start_date=&end_date=&context=authorKey&sort=date_desc&format=json&search=Search'
	var sAuthorURI = sGeneralURL.replace('firstname', req.params.fname).replace('lastname', req.params.lname).replace('authorKey', req.params.key);
	var selectedAuthor = req.params.fname + ' ' + req.params.lname;
	console.log(encodeURI(sAuthorURI));
	request({
			uri: sAuthorURI,
			method: 'GET',
			type: 'application/json',
		}, function(error, response, body){
			//TODO put this into another function passing the body and returning new formatted body
			var raw = JSON.parse(body);
			var coauthorCount = [];
			var docs = raw.docs;
			docs.forEach(function(doc){
				var authors = doc.author_display;
				authors.forEach(function(author){
					if(author.indexOf(selectedAuthor)){
						if(coauthorCount.length == 0){
							coauthorCount.push({name: author, count: 1})
						} else{
							incrementCount(author,coauthorCount);
						}
					}
				})
			})
			raw.coauthors = coauthorCount;
			raw.authorName = selectedAuthor;

			res.json(raw);
		});
});

function incrementCount(author,array){
	for(var i = 0; i < array.length; i++){
		if(array[i].name == author){
			array[i].count++;
			return;
		}
	}
	array.push({name: author, count: 1});
}

app.use('/api',router);

app.listen('8081');
console.log("Try PORT: 8081");

exports = module.exports = app;