'use strict';
var express = require('express'), //framework for node
	request = require('request'), //deals with the web requests
	cheerio = require('cheerio'); //allows the returned html body to be traversed like jQuery does.
var sjs = require('scraperjs');
var mongoose = require('mongoose'); //plugin for nodejs to connect to a mongodb
var j$ = require('jquery');
var fs = require('fs'),
	readline = require('readline');
var AlchemyAPI = require('alchemyapi');

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
var alchemyAPI = new AlchemyAPI();

var dbUpdateInterval = 1000 * 60 * 60 * 12; //12 hours

/*
	Regex
*/
var regex_key = '(context|ancestor_key)[=\\:](\\d+)',
	regex_fname = 'author_fname.{3}%22(.*?)%22',
	regex_lname = 'author_lname.{3}%22(.*?)%22',
	regex_thesis = '[\\[\\(]Thesis[\\]\\)]',
	regex_start = 'start=(\\d)',
	regex_doc_count = 'Docs:\\s(\\d+)';
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

var authorDetailSchema = mongoose.Schema({
	_id: String
},{
	strict: false,
	collection: 'AuthorDetails'
});


var authorSchema = mongoose.Schema({
	_id: String,
	fname: String,
	lname: String,
	link: String,
	key: Number,
	count: Number,
	detail_id: String
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
/*
	Models
*/
var Authors = mongoose.model('Authors', authorSchema),
	Disciplines = mongoose.model('Disciplines', disciplineSchema),
	AuthorDetails = mongoose.model('AuthorDetails', authorDetailSchema);

db.on('error', console.error);
db.once('open', function (callback) {
	console.log('Connected to mongodb!');
	setInterval(cleanLoadAuthors(Authors), dbUpdateInterval);
	//setInterval(cleanLoadDiscpline(Disciplines), dbUpdateInterval);

	router.use(function(req, res, next) {
		next(); // make sure we go to the next routes and don't stop here
	});

	//ROUTE: Get all available authors in DIT
	router.route('/authors').get(function(req,res){
		Authors.find({},function (err, authors) {
			if (err) return console.error(err);
			return res.json(authors);
		});
	});

	//ROUTE: Get Author Details
	router.route('/author/:fname/:lname/:key').get(function(req,res){
		Authors.findOne({fname:req.params.fname, lname: req.params.lname}, function(err,primary){
			if(err) res.json(err);
			if(primary === null){
				console.log('New Author');
				persistAndSendAuthorDetails(res, req.params.fname, req.params.lname, req.params.key);
			}
			else if(primary.detail_id !== undefined){
				console.log('Not a new Author');
				AuthorDetails.findOne({_id: primary.detail_id}, function(err,data){
					if(err) res.json(err);
					//data is stored in the _doc key and values are what is returned from the query
					//just need to return the details because id is in the details as well.
					else res.json(data._doc.details);
				});
			} else if(!primary){
				res.json('Not in author list');	
			} else {
				console.log('New Author');
				persistAndSendAuthorDetails(res, req.params.fname, req.params.lname, req.params.key);
			}
		});
		//TODO: Get Keywords for every document that the author has.
	});

	router.route('/author/:details_id/:keywords').put(function(req,res){
		var d_id =  req.params.details_id;
		var p_keywords = req.params.keywords;
		AuthorDetails.update({_id: d_id},{processedKeywords: p_keywords}, function(err,data){
			if(err) res.json(err);
			else{
				console.log(data);
			}
		})
	})

	//ROUTE: Get all disciplines
	router.route('/disciplines').get(function(req,res){
		Disciplines.find({}, function(err, disciplines){
			if(err) return console.error(err);
			return res.json(disciplines); //TODO: parse into sub-documents
		});
	});

	//ROUTE: Get a specific discipline
	router.route('/disciplines/:discipline').get(function(req,res){
		Disciplines.find({discipline: req.params.discipline}, function(err,discipline){
			if(err) return console.error(err);
			return res.send(discipline);
		});
	});
});

/**************************
	START: Author
**************************/
function persistAndSendAuthorDetails(res,fname,lname, key){
	var resJSON;
	var start = 0;
	var skip = 25;
	var sGeneralURL = 'http://arrow.dit.ie/do/search/results/json?start=0&facet=&facet=&facet=&facet=&facet=&facet=&q=author_lname%3A"lastname"%20AND%20author_fname%3A"firstname"&op_1=AND&field_1=text%3A&value_1=&start_date=&end_date=&context=authorKey&sort=date_desc&format=json&search=Search'
	var sAuthorURI = sGeneralURL.replace('firstname', fname).replace('lastname', lname).replace('authorKey', key);
	var selectedAuthor = fname + ' ' + lname;
	getAuthorData(sAuthorURI, start, skip, selectedAuthor, getAuthorData, resJSON , function(data){
		console.log('Got here');
		data['fname'] = fname;
		data['lname'] = lname;
		var new_id = mongoose.Types.ObjectId();
		data['details_id'] = new_id;
		var details = {
			_id: new_id,
			details: data
		};
		AuthorDetails.create(details, function(err,savedData){
			if(err) console.log(err);
			else console.log('Details ID: ' + savedData._id);
		});
		Authors.findOne({fname:fname , lname:lname}, {_id: 1} , function(err,author){
			if(err) console.log(err);
			else if(author === null){
				console.log('Creating new Author: ')
				Authors.create({
					_id: mongoose.Types.ObjectId(),
					fname: data.fname,
					lname: data.lname,
					key: key,
					count: data.num_found,
					detail_id: new_id
				},function(err,data){
					console.log('created');
				});
			} else {
				Authors.update({_id: author._id}, { detail_id: details._id }, function(err,updated){
					console.log('Records Update: ' + updated);
				});
			}
		});
		res.json(data);
	});
}
function getAuthorData(URL, start, skip, selectedAuthor, callback, data, finalCall){
	var sStart = 'start=';
	var startingPosition = URL.match(regex_start);
	var tempURI = URL.replace(startingPosition[0], sStart+start);
	encodeURI(tempURI);
	console.log('Start: ' + start);
	request({
			uri: tempURI,
			method: 'GET',
			type: 'application/json'
		}, function(error, response, body){
			var raw = JSON.parse(body);
			if(start === 0){
				if(raw.num_found > skip){
					//callback called here
					callback(URL, start+skip, skip, selectedAuthor, callback, raw, finalCall);
				} else{
					formatBody(raw, selectedAuthor, function(formattedData){
						//Saving the extracted JSON to a non-strict schema
						extractKeywordDocs(formattedData, function(finalData){
							extractUniversities(finalData, function(finalData2){
								finalCall(finalData2);
							});
						});
					});
				}

			} else {
				raw.docs.forEach(function(doc){
					data.docs.push(doc);
				});
				if(start+skip < raw.num_found){
					console.log('More Doc to transfer');
					callback(URL, start+skip, skip, selectedAuthor, callback, data, finalCall);
				} else{
					formatBody(data, selectedAuthor, function(formattedData){
						extractKeywordDocs(formattedData, function(finalData){
							extractUniversities(finalData, function(finalData2){
								finalCall(finalData2);
							});
						});
					});
				}
			}

		});
}

function extractUniversities(mainJSON, callback){
	var temp = [];
	var index = 0;
	mainJSON.docs.forEach(function(doc){
		extractUniversity(doc.url, function(result){
			index++;
			insertCoAuthorUni(mainJSON, result);
			if(index === mainJSON.docs.length){
				callback(mainJSON);
			}
		});
	});
}

function extractUniversity(url, callback){
	var temp = [];
	sjs.StaticScraper
	.create(url)
	.scrape(function($){
		$('p[class=author]').children('a:not([rel="nofollow"])').each(function(i,element){
			var a = $(element);
			var name = a.children('strong').text();
			var uni = a.children('em').text();
			var link = a.attr('href');
			var fname = decodeURIComponent(link.match(regex_fname)[1]);
			var lname = decodeURIComponent(link.match(regex_lname)[1]);
			var key = link.match(regex_key);
			temp.push({name: name, university: uni, fname: fname, lname: lname,key:key[2]});
		});

		return temp;
	}, function(data){
		callback(data);
	});
}


function insertCoAuthorUni(mainJSON, tempArray){
	for(var i = 0 ; i < mainJSON.coauthors.length; i++){
		if(mainJSON.coauthors[i].university === undefined){
			for(var j = 0; j < tempArray.length; j++){
				if(tempArray[j].name.match(mainJSON.coauthors[i].name) !== null){
					mainJSON.coauthors[i].university = tempArray[j].university;
					mainJSON.coauthors[i].fname = tempArray[j].fname;
					mainJSON.coauthors[i].lname = tempArray[j].lname;
					mainJSON.coauthors[i].key = tempArray[j].key;
					break;
				}
			}
		}
	}
}

function extractKeywordDocs(data, callback){
	var temp  = [];
	data.docs.forEach(function(doc){
		extractKeywords(doc.url, function(results){
			temp.push({docTitle: doc.title, docKeywords: results});
			if(temp.length === data.docs.length){
				data['keywords'] = temp;
				callback(data); 
			}
		});
	});
}

function extractKeywords(url, callback){
	var output;
	alchemyAPI.keywords('url', url, { 'sentiment':0 }, function(response) {
		output = response['keywords'];
		callback(output); //anonymous function in extractKeywords()
	});
}

function formatBody(raw, selectedAuthor, callback){
	var temp = raw;
	var coauthorCount = [];
	var docs = temp.docs;
	docs.forEach(function(doc,i){
		var authors = doc.author_display;
		authors.forEach(function(author){
			if(author.indexOf(selectedAuthor)){
				if(coauthorCount.length == 0){
					coauthorCount.push({name: author, count: 1})
				} else{
					incrementCount(author,coauthorCount,selectedAuthor);
				}
			}
		})
	});

	temp.coauthors = coauthorCount;
	temp.authorName = selectedAuthor;
	callback(temp);
}

function cleanLoadAuthors(model){
	clean(model);
	clean(AuthorDetails);
	console.log('Scraping Authors: ' +  new Date());
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
							var doc_count = sLabel.match(regex_doc_count)[1];
				 			if(sLabel.match(regex_thesis)){
				 				//if(array[array.length - 1].fname !== sFirstName && array[array.length - 1].lname !== sLastName){
				 				temp.push({ _id: mongoose.Types.ObjectId(),fname: sFirstName, lname: sLastName, link: sLink, key: sKey[2], count: doc_count, thesis: true});
				 				//}
				 			} else{
				 				temp.push({ _id: mongoose.Types.ObjectId(),fname: sFirstName, lname: sLastName, link: sLink, key: sKey[2], count: doc_count, thesis: false});
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

/**************************
	END: Author
**************************/

/**************************
	START: Discipline
**************************/

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

/**************************
	END: Discipline
**************************/

function incrementCount(author,array,selectedAuthor){
	for(var i = 0; i < array.length; i++){
		if(array[i].name.match(author)){
			array[i].count++;
			return;
		};
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