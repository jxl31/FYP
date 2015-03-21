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
	Set up Dictionary needed for the comparison of non names authors in discipline
*/
// var dictionary = {};


// var rd = readline.createInterface({
//     input: fs.createReadStream('words.txt'),
//     output: process.stdout,
//     terminal: false
// });
// rd.on('line', function(line) {
// 	dictionary[line] = line;
// });

/*
	Mongoose Config 
*/
var options = {
	server: { poolSize: 5 },
	replset: { rs_name: 'scraper_v1' }
};
//keeps the connection alive for a very long time
options.server.socketOptions = options.replset.socketOptions = { keepAlive: 1 };
mongoose.connect('mongodb://localhost/scraper_v1',options);
var db = mongoose.connection;

/*Routers*/
var app = express(); //express app
var router = express.Router(); //routers
var alchemyAPI = new AlchemyAPI();

var dbUpdateInterval = 1000 * 60 * 60 * 12; //12 hours
//var CONTEXT_KEY = 490738;

/*
	Regex
*/
var regex_key = '(context|ancestor_key)[=\\:](\\d+)',
	regex_fname = 'author_fname.{3}%22(.*?)%22',
	regex_lname = 'author_lname.{3}%22(.*?)%22',
	regex_corp = 'corporate_author.{3}%22(.*?)%22',
	regex_thesis = '[\\[\\(]Thesis[\\]\\)]',
	regex_start = 'start=(\\d)',
	regex_doc_count = 'Docs:\\s(\\d+)',
	regex_query = '(\\?q=(.*))',
	regex_date = '\\d+[/\\-](\\d+)';
	//regex_num = '\\((\\d+)\\)';

/*
	URL's
*/
var URL_ARROW = 'http://arrow.dit.ie',
	URL_DISCIPLINE = URL_ARROW + '/do/discipline_browser/disciplines',
	URL_AUTHORS = URL_ARROW + '/authors.html',
	URL_AUTHOR = 'http://arrow.dit.ie/do/search/results/json?start=0&facet=&facet=&facet=&facet=&facet=&facet=&q=author_lname%3A"lastname"%20AND%20author_fname%3A"firstname"&op_1=AND&field_1=text%3A&value_1=&start_date=&end_date=&context=authorKey&sort=date_desc&format=json&search=Search',
	URL_CORP = 'http://arrow.dit.ie/do/search/results/json?q=corporate_author%3A%22fullname%22&query=Search&start=0&context=corpKey&facet=&facet=&facet=&facet=&facet=&facet=';

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
	fullname: String,
	fname: String,
	lname: String,
	link: String,
	key: Number,
	count: Number,
	corp: Boolean,
	detail_id: String,
	dates: [String]
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
	//setInterval(cleanLoadAuthors(Authors), dbUpdateInterval);
	//setInterval(cleanLoadDiscpline(Disciplines), dbUpdateInterval);

	router.use(function(req, res, next) {
		next(); // make sure we go to the next routes and don't stop here
	});

	//ROUTE: Get all available authors in DIT
	router.route('/authors').get(function(req,res){
		Authors.find({},function (err, authors) {
			if (err) return console.error(err);
			else if (authors === null) res.json('No authors found.');
			return res.json(authors);
		});
	});

	//ROUTE: Get Author from discipline
	router.route('/author/:fullname/:url').get(function(req,res){
		var fullname = decodeURIComponent(req.params.fullname);
		var url = decodeURIComponent(req.params.url);
		for(var i = 0 ; i < 3; i++){
			url = decodeURIComponent(url);
		}
		Authors.findOne({fname:req.params.fullname}, function(err,author){
			if(err) res.json(err);
			if(author === null){
				getAuthorThroughDiscipline(fullname, url, function(data){
					if(!data.corp){
						console.log('New Author');
						persistAndSendAuthorDetails(res, data.fname, data.lname, data.key, fullname, data.corp);					
					} else {
						console.log('New Corp Author');
						persistAndSendCorpAuthorDetails(res, data.fullname, data.key, data.corp);
					}

					
				});
			} else {
				res.json(author);
			}
		});
	});

	//ROUTE: Get Author Details
	router.route('/author/:fname/:lname/:key').get(function(req,res){
		console.log(req.params.fname);
		console.log(req.params.lname);
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
					else {
						console.log('Gets here');
						res.json(data._doc.details);
					}
				});
			} else if(!primary){
				res.json('Not in author list');	
			} else {
				console.log('New Author');
				persistAndSendAuthorDetails(res, req.params.fname, req.params.lname, req.params.key);
			}
		});
	});

	router.route('/author/:details_id/:keywords').put(function(req,res){
		var d_id =  req.params.details_id;
		var p_keywords = req.params.keywords;
		AuthorDetails.update({_id: d_id},{processedKeywords: p_keywords}, function(err,data){
			if(err) res.json(err);
			else{
				return res.json('Update Success');
			}
		});
	});

	//ROUTE: Get all disciplines
	router.route('/disciplines').get(function(req,res){
		Disciplines.find({}, function(err, disciplines){
			if(err) return console.error(err);
			return res.json(disciplines);
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
function getAuthorThroughDiscipline(fullname, url, callback){
	getFirstLink(url, function(link){
		extractFnameAndLastName(link, function(oAuthor){
			callback(oAuthor);
		})
	});
}

function getFirstLink(url, callback){
	var fullURL = URL_ARROW + url;
	console.log(fullURL);
	sjs.StaticScraper
	.create(fullURL)
	.scrape(function($){
		var span = $('.author-list')[0];
		var a = $(span.prev);
		var link = a.attr('href');
		return link;
	}, function(data){
		callback(data);
	});
}

function extractFnameAndLastName(link, callback){
	sjs.StaticScraper
	.create(link)
	.scrape(function($){
		var obj = {};
		var p = $('p[class=author]').children('a:not([rel="nofollow"])')
		var a = $(p);
		var link = a.attr('href');
		if(link.match(regex_corp)){
			obj = {
				fullname: decodeURIComponent(link.match(regex_corp)[1]),
				key: link.match(regex_key)[2],
				corp: true
			}
		} else {
			var fname = decodeURIComponent(link.match(regex_fname)[1]);
			var lname = decodeURIComponent(link.match(regex_lname)[1]);
			var key = link.match(regex_key);
			obj = {
				fname: fname,
				lname: lname,
				key: key[2],
				link: link,
				corp: false
			}
		}

		return obj;
	}, function(data){
		callback(data);
	});
}

function persistAndSendCorpAuthorDetails(res, fullname, key, corp){
	//var sGeneralURL = 'http://arrow.dit.ie/do/search/results/json?q=corporate_author%3A%22fullname%22&query=Search&start=0&context=corpKey&facet=&facet=&facet=&facet=&facet=&facet=';

	var sCorpURL = URL_CORP.replace('fullname',fullname).replace('corpKey',key);
	var selectedCorp = encodeURIComponent(fullname);
	var decodedCorp = decodeURIComponent(fullname);

	getCorpData(sCorpURL, selectedCorp, function(data){
		data['corp'] = true;
		data['fullname'] = decodedCorp;
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

		Authors.findOne({fullname: decodedCorp}, {_id: 1}, function(err,author){
			if(err) res.json(err);
			else if(author === null){
				console.log('Creating new Author: ')
				Authors.create({
					_id: mongoose.Types.ObjectId(),
					fullname: decodedCorp,
					key: key,
					count: data.num_found,
					corp: corp,
					detail_id: new_id
				},function(err,data){
					console.log('Corp created.');
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

function persistAndSendAuthorDetails(res,fname,lname, key, fullname, corp, url){
	var resJSON;
	var start = 0;
	var skip = 25;
	var sAuthorURI = URL_AUTHOR.replace('firstname', fname).replace('lastname', lname).replace('authorKey', key);
	var selectedAuthor = fname + ' ' + lname;
	getAuthorData(sAuthorURI, start, skip, selectedAuthor, getAuthorData, resJSON , function(data){
		data['fname'] = fname;
		data['lname'] = lname;
		data['corp'] = corp;
		if(fullname !== undefined){
			data['fullname'] = fullname;
		}
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
					corp: corp,
					detail_id: new_id
				},function(err,data){
					console.log('Author created.');
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

function getCorpData(url, selectedCorp, callback){
	request({
			uri: url,
			method: 'GET',
			type: 'application/json'
		}, function(error, response, body){
			var raw = JSON.parse(body);
			raw['corp'] = true;
			formatBody(raw, selectedCorp, function(formattedData){
				extractKeywordDocs(formattedData, function(finalData){
					//extractUniversities(finalData, function(finalData2){
						callback(finalData);
					//});
				});
			});
		});
}


function getAuthorData(URL, start, skip, selectedAuthor, callback, data, finalCall){
	var sStart = 'start=';
	var startingPosition = URL.match(regex_start);
	var tempURI = URL.replace(startingPosition[0], sStart+start);
	encodeURI(tempURI);
	console.log('Start: ' + start);
	console.log(tempURI);
	request({
			uri: tempURI,
			method: 'GET',
			type: 'application/json'
		}, function(error, response, body){
			var raw = JSON.parse(body);
			raw['corp'] = false;
			if(start === 0){
				if(raw.num_found > skip){
					//callback called here
					callback(URL, start+skip, skip, selectedAuthor, callback, raw, finalCall);
				} else{
					formatBody(raw, selectedAuthor, function(formattedData){
						//Saving the extracted JSON to a non-strict schema{
						finalCall(formattedData);
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
						finalCall(formattedData);
					});
				}
			}

		});
}

/**
	Increments co-authors and also add authorName to the returned json
*/
function formatBody(raw, selectedAuthor, callback){
	var temp = raw;
	extractUniversities(temp, selectedAuthor, function(data){
		extractKeywordDocs(data, function(finalData){
			finalData.authorName = decodeURIComponent(selectedAuthor);
			callback(finalData);
		})
	}); //will also add the coauthors
}

/**
	Function that calls extractUniversity() multiple times for each link that is found
*/

function extractUniversities(mainJSON, selectedAuthor, callback){
	var temp = [];
	var index = 0;
	var coAuthors = [];
	mainJSON.docs.forEach(function(doc){
		extractUniversity(doc.url,mainJSON['corp'], function(result){
			index++;
			var date = doc['publication_date'].match(regex_date)[1];
			insertCoAuthorUni(mainJSON, date, coAuthors,selectedAuthor, result, function(){
			});
			if(index === mainJSON.docs.length){
				mainJSON.coauthors = coAuthors;
				callback(mainJSON);
			}
		});
	});
}

/**
	Scrapes the university for each author which is used for disambiguating
	authors from each other.
*/

function extractUniversity(url, corp,callback){
	var temp = [];
	sjs.StaticScraper
	.create(url)
	.scrape(function($){
		$('p[class=author]').children('a:not([rel="nofollow"])').each(function(i,element){
			var a = $(element);
			var name = a.children('strong').text();
			var link = a.attr('href');
			if(!corp){
				//university
				var uni = a.children('em').text();
				if(uni === ''){
					uni = 'Not Defined';
				}
				//first name
				var fname = decodeURIComponent(link.match(regex_fname)[1]);
				//last name
				var lname = decodeURIComponent(link.match(regex_lname)[1]);
				var key = link.match(regex_key);
				temp.push({name: name, university: uni, fname: fname, lname: lname,key:key[2]});
			} else {
				var key = link.match(regex_key);
				temp.push({name: name, link: link, key:key[2]});
			}
			
			
		});

		return temp;
	}, function(data){
		callback(data);
	});
}

/**
	Cleanly replaces the coauthors array by substituting it by the 
	firstname and lastname of each authors url.
*/

function insertCoAuthorUni(mainJSON, publication_date,coAuthors, selectedAuthor, tempArray, callback){
	tempArray.forEach(function(author){
		incrementCount(author, publication_date, coAuthors, selectedAuthor, mainJSON['corp']);
	});

	callback();
}

function incrementCount(author, publication_date, coAuthors, selectedAuthor, corp){
	var decodedAuthor = decodeURIComponent(selectedAuthor);
	if(author.name.indexOf(selectedAuthor) && author.name.match(regex_thesis) === null){
		if(coAuthors.length === 0){
			if(!corp){
				coAuthors.push({
					name: author.name,
					count: 1,
					key: author.key,
					university: author.university,
					fname: author.fname,
					lname: author.lname,
					dates: [publication_date]
				});
			} else {
				coAuthors.push({
					name: author.name,
					count: 1,
					key: author.key,
					dates: [publication_date]
				});
			}
			
		} else {
			//check every author in coauthors;
			for(var i = 0; i < coAuthors.length; i++){
				if(!corp){
					if(coAuthors[i].fname.match(author.fname) && coAuthors[i].lname.match(author.lname)){
						if(coAuthors[i].dates.indexOf(publication_date) < 0){
							coAuthors[i].dates.push(publication_date);
						}
						coAuthors[i].count++;
						return;
					}
				} else {
					if(coAuthors[i].name.match(author.name)){
						if(coAuthors[i].dates.indexOf(publication_date) < 0){
							coAuthors[i].dates.push(publication_date);
						}
						coAuthors[i].count++;
						return;
					}
				}
				
			}
			var name = author.name;
			if(!corp){
				coAuthors.push({
					name: name, 
					count: 1, 
					key: author.key, 
					university: author.university,
					fname: author.fname, 
					lname: author.lname,
					dates: [publication_date]
				});
			} else {
				coAuthors.push({
					name: name, 
					count: 1, 
					key: author.key, 
					dates: [publication_date]
				});
			}
			return;
		}
	}
}

/**
	Function that calls extractKeywords() multiple times for each document
*/

/*
	data: contains the JSON object holding the details of the author
	callback: callback function of extractKeywordDocs
*/
function extractKeywordDocs(data, callback){
	var temp  = [];
	var index = 0;
	data.docs.forEach(function(doc){
		extractKeywords(doc.url, function(results){
			index++;
			temp.push({docTitle: doc.title, docKeywords: results});
			if(index === data.docs.length){
				data['keywords'] = temp;
				callback(data);
			}
		});
	});
}

/**
	Extracts keywords using alchemyAPI.keywowrds()
*/

function extractKeywords(url, callback){
	var output;
	alchemyAPI.keywords('url', url, { 'sentiment':0 }, function(response) {
		output = response['keywords'];
		callback(output); //anonymous function in extractKeywords()
	});
}

/**
	Loads authors from arrow.dit.ie/authors.html
*/
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
	//scrapedDisciplines contains the extracted disciplines 
	//loop through these disciplines and extract its authors
	scrapedDisciplines.forEach(function(disciplineDetails,index,array){
		disciplines.push(disciplineDetails);
		//function to scrape authors
		scrapeAuthorsDiscipline(disciplineDetails, function(from, scrapedAuthors){
			disciplines.forEach(function(lookup, index1, array){
				//compare the discipline where the author came from the list of stored discipline
				if(lookup.discipline === from){
					//store authors in the discipline.author field
					disciplines[index1].authors = scrapedAuthors;
					//create the discisipline with authors
					Disciplines.create(disciplines[index1]);
					//if the discipline scraped is a sub discipline
					if('parent' in  disciplines[index1]){
						var thisIndex = index1;
						var parentName = disciplines[thisIndex].parent;
						//find the parent discipline and insert into the subdiscipline field
						Disciplines.findOne(parentName,function(err, data){
							if(err) console.log('Cannot find discipline: '+err)
							Disciplines.update({discipline: parentName}, 
								{$push: {'subdisciplines': {_id: disciplines[thisIndex]._id}}}, 
								function(err, numAffected, rawResponse){
									if(err) console.log(err);
								});
						});
					}
				}
			});
			//after scraping the authors check if the scraped discipline contains
			//a sub-discipline if so do the procedure all over again
			if(disciplineDetails.subdisciplineURL !== undefined){
				scrapeDisciplines(
					URL_ARROW + disciplineDetails.subdisciplineURL, 
					doDisciplineScraping, 
					{parent: disciplineDetails.discipline}
				);
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
			//discipline
			var disciplineName = discipline.children('dt').text();
			//url for subdiscipline
			var subDisciplineURL = discipline.children('.sub-discipline').children('a').attr('href');
			//url for the list of authors that have this discipline
			var authorsURL = discipline.children('.authors').children('a').attr('href');
			var toBeStored = {};
			if(sub){ //if sub-discpline is present
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
		callback(data); //calling doDisciplineScraping function here
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
			var a = tr.children('td:nth-child(2)').children('a');
			var fullname = a.text();
			var link = encodeURIComponent(a.attr('href'));
			var docCount = parseInt(tr.children('td:nth-child(3)').text());

			if(fullname.match(regex_thesis) === null){
				temp.push({
					fullname: fullname,
					count: docCount,
					link: link
				});
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