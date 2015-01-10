'use strict';
var express = require('express'), //framework for node
	request = require('request'), //deals with the web requests
	cheerio = require('cheerio'); //allows the returned html body to be traversed like jQuery does.
var sjs = require('scraperjs');
var mongoose = require('mongoose'); //plugin for nodejs to connect to a mongodb
var j$ = require('jquery');
var fs = require('fs'),
	readline = require('readline');

/*
	Set up Dictionary
*/
var dictionary = {};


var rd = readline.createInterface({
    input: fs.createReadStream('words.txt'),
    output: process.stdout,
    terminal: false
});
rd.on('line', function(line) {
	dictionary[line] = line;
});

/*
	Mongoose Config 
*/
var options = {
	server: { poolSize: 5 },
	replset: { rs_name: 'scraper_v1_replica' }
};
options.server.socketOptions = options.replset.socketOptions = { keepAlive: 1 };
mongoose.connect('mongodb://localhost/scraper_v1',options);
var db = mongoose.connection;

/*Routers*/
var app = express(); //express app
var router = express.Router(); //routers

var dbUpdateInterval = 1000 * 60 * 60 * 12; //12 hours

/*
	Regex
*/
var regex_key = '(context|ancestor_key)[=\\:](\\d+)',
	regex_fname = 'author_fname.{3}%22(.*?)%22',
	regex_lname = 'author_lname.{3}%22(.*?)%22',
	regex_thesis = '[\\[\\(]Thesis[\\]\\)]';
	//regex_num = '\\((\\d+)\\)';

/*
	URL's
*/
var URL_ARROW = 'http://arrow.dit.ie',
	URL_DISCIPLINE = URL_ARROW + '/do/discipline_browser/disciplines',
	URL_AUTHORS = URL_ARROW + '/authors.html';

/*
	Schema Creation
*/
var authorSchema = mongoose.Schema({
	fname: String,
	lname: String,
	link: String,
	key: Number,
	count: Number
},{
	collection: 'Authors'
});

var disciplineSchema = mongoose.Schema({
	_id: String,
	discipline: String,
	parent: String,
	subdisciplineURL: String,
	disciplineAuthorsURL: String,
	authors: [authorSchema],
	subdisciplines: [ {
		_id: {type: String}
	}]
	//mongoose.Schema.Types.ObjectId

},{
	collection: 'Disciplines'
});

var Authors = mongoose.model('Authors', authorSchema);
var Disciplines = mongoose.model('Disciplines', disciplineSchema);

//setTimeout(function(){
	db.on('error', console.error);
	db.once('open', function (callback) {
		console.log('Connected to mongodb!');
		setInterval(cleanLoadAuthors(Authors), dbUpdateInterval);
		setInterval(cleanLoadDiscpline(Disciplines), dbUpdateInterval);

		router.use(function(req, res, next) {
			next(); // make sure we go to the next routes and don't stop here
		});

		router.route('/authors').get(function(req,res){

			Authors.find({},function (err, authors) {
				if (err) return console.error(err);
				return res.send(authors);
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
	
		//ROUTE: Get all disciplines
		router.route('/disciplines').get(function(req,res){
			Disciplines.find({}, function(err, disciplines){
				if(err) return console.error(err);
				return res.send(disciplines); //TODO: parse into sub-documents
			});
		});

		//ROUTE: Get a specific discipline
		router.route('/disciplines/:discipline').get(function(req,res){
			console.log(req.params.discipline);
			Disciplines.find({discipline: req.params.discipline}, function(err,discipline){
				if(err) return console.error(err);
				return res.send(discipline);
			});
		});
	});

//}, 700);

function cleanLoadAuthors(model){
	clean(model);
	console.log('Scraping Authors');
	sjs.StaticScraper
	.create(URL_AUTHORS)
	.scrape(function($) {
		var temp = [];
		var author_regex = '[A]';
		var count = 0;
		// TODO use this as an entry point to be more efficient '//*[@id="main"]/div/p[208]/a'
		$('h2').each(function(i, element){
			var idTemp = $(this).attr('id');
			if(idTemp != null || idTemp != undefined){
				var idProper = $(this).attr('id').match('A');
				if(idProper){
					var el = '#'+idProper[0];
					$(el).nextUntil('div').each(function(y,element){
				 		if($(this).is('p') && !$(this).hasClass('top')){
				 			var sLabel = $(this).text();
				 			var sLink = $(this).children()[0].attribs.href;
				 			var sFirstName = decodeURIComponent(sLink.match(regex_fname)[1]);
							var sLastName = decodeURIComponent(sLink.match(regex_lname)[1]);
							var sKey = sLink.match(regex_key);
				 			if(sLabel.match(regex_thesis)){
				 				//if(array[array.length - 1].fname !== sFirstName && array[array.length - 1].lname !== sLastName){
				 				temp.push({ fname: sFirstName, lname: sLastName, link: sLink, key: sKey[2], thesis: true});
				 				//}
				 			} else{
				 				temp.push({ fname: sFirstName, lname: sLastName, link: sLink, key: sKey[2], thesis: false});
				 			}
				 		}
					})
				}
			}
		}).get();
		return temp;
		}, function(data) { //data is array since returning anything that has a callback function will be the parameter of the callback function
			console.log('/authors: ' + new Date());
			var real = [];
			var curr;
			for(var i = 0; i < data.length; i++){
				curr = data[i];
				if(i === 0) real.push(curr);
				else{
					if(curr.thesis === false) real.push(curr);
					else if(curr.thesis === true){
						if(i === data.length-1){
							real.push(curr);
						} else{
							if(curr.fname === data[i+1].fname && curr.lname === data[i+1].lname && data[i+1].thesis === false){
								data[i+1].lname.replace('')
								real.push(data[i+1]);
								i++;
							} else if(curr.fname === data[i-1].fname && curr.lname === data[i-1].lname){}
						}
					}
				}
			}
			persistData(real,model);
			return;
		});
}

var disciplines = [];

function cleanLoadDiscpline(model){ 
	clean(model);
	var entryURL = URL_DISCIPLINE;
	scrapeDisciplines(entryURL, doDisciplineScraping);
}


function doDisciplineScraping(scrapedDisciplines){
	scrapedDisciplines.forEach(function(disciplineDetails,index,array){
		disciplines.push(disciplineDetails);
		scrapeAuthorsDiscipline(disciplineDetails, function(from, scrapedAuthors){
			disciplines.forEach(function(lookup, index1, array){
				if(lookup.discipline === from){
					disciplines[index1].authors = scrapedAuthors;
					Disciplines.create(disciplines[index1]);
					if('parent' in  disciplines[index1]){
						var thisIndex = index1;
						var parentName = disciplines[thisIndex].parent;
						Disciplines.findOne(parentName,function(err, data){
							if(err) console.log('Cannot find discipline: '+err)
							Disciplines.update({discipline: parentName}, {$push: {'subdisciplines': {_id: disciplines[thisIndex]._id}}}, function(err, numAffected, rawResponse){
								if(err) console.log(err);
							})
						});
					}
				}
			});
			if(disciplineDetails.subdisciplineURL !== undefined){
				scrapeDisciplines(URL_ARROW + disciplineDetails.subdisciplineURL, doDisciplineScraping, {parent: disciplineDetails.discipline});
			}
		});
	});
}

function scrapeDisciplines(url, callback, sub){
	console.log(url);
	sjs.StaticScraper
	.create(url)
	.scrape(function($){
		var temp = [];
		$('.new-discipline').each(function(i,main_discipline){
			var discipline = $(this);
			var disciplineName = discipline.children('dt').text();
			var subDisciplineURL = discipline.children('.sub-discipline').children('a').attr('href');
			var authorsURL = discipline.children('.authors').children('a').attr('href');
			var toBeStored = {};
			if(sub){
				toBeStored = {
					_id: mongoose.Types.ObjectId(),
					parent: sub.parent,
					discipline: disciplineName,
					subdisciplineURL: subDisciplineURL,
					disciplineAuthorsURL: authorsURL,
					authors: []
				}
			} else{
				toBeStored = {
					_id: mongoose.Types.ObjectId(),
					discipline: disciplineName,
					subdisciplineURL: subDisciplineURL,
					disciplineAuthorsURL: authorsURL,
					authors: []
				}
			}

			temp.push(toBeStored);
		}).get();
		return temp;
	}, function(data){
		callback(data);
	});
}

function scrapeAuthorsDiscipline(discipline, callback){
	var authorsURL = URL_ARROW + discipline.disciplineAuthorsURL;
	sjs.StaticScraper
	.create(authorsURL)
	.scrape(function($){
		var temp = [];
		var table = $('tbody');
		table.children().each(function(y,something){
			var tr = $(this); //this is with (document number)
			var fullname = tr.children('td:nth-child(2)').text();
			var words = fullname.split(' ');
			for(var i = 0; i < words.length; i++){
				if(words[i] in dictionary){
					break;
				} else if (i === words.length-1){
					var a = tr.children('td:nth-child(2)').children('a');
					var link = a.attr('href');
					var names = a.text().split(' ');
					var fname = names[0];
					var lname = '';
					if(names[names.length-1].match(regex_thesis) === null){
						lname = names[names.length-1];
					} else {
						lname = names[names.length-2];
					}
					var count = parseInt(tr.children('td:nth-child(3)').text());
					temp.push({
						fname: fname,
						lname: lname,
						count: count
					});
				}
			}
		}).get();
		return temp;
	}, function(data){
		callback(discipline.discipline, data)
	});
}

function incrementCount(author,array){
	for(var i = 0; i < array.length; i++){
		if(array[i].name == author){
			array[i].count++;
			return;
		}
	}
	array.push({name: author, count: 1});
}

function clean(model){
	var remove = model.remove();
	remove.exec();
}

function persistData(data, model){
	model.create(data);
}

app.use('/api',router);

app.listen('8081');
console.log("Magic Happens @ PORT: 8081");
exports = module.exports = app;