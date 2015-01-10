var mongoose = require('mongoose');
// // var j$ = require('jquery');
// // var options = {
// // 	server: { poolSize: 5 },
// // 	replset: { rs_name: 'scraper_v1_replica' }
// // };
// // options.server.socketOptions = options.replset.socketOptions = { keepAlive: 1 };
mongoose.connect('mongodb://localhost/scraper_v1');

var db = mongoose.connection;
var Schema = mongoose.Schema;
db.once('open', function (callback) {
	var kittySchema = mongoose.Schema({
		_id: Schema.Types.ObjectId,
		name: String
		},{
			collection: 'Kittens'
		});

	var Kitten = mongoose.model('Kittens', kittySchema);
	var query = Kitten.remove();
	query.exec();
// 	// var array = [];
	var silence = new Kitten({_id: mongoose.Types.ObjectId(), name: 'silence'});
	silence.save(function(err,data){
		if(err) console.log(err);
		console.log(data._id);
	});
// 	// array.push(silence);
// 	// var bat = new Kitten({name: 'bat'});
// 	// array.push(bat);
// 	var man = new Kitten({name: 'man'});
// 	man.save(function(err,data){
// 		if(err)console.log(err);
// 		console.log(data);
// 	});
// 	man.update({alias: 'men'});
// 	man.save(function(err,data){
// 		if(err)console.log(err);
// 		console.log(data);	
// 	})
	// array.push(man);
	// Kitten.create(array);

	// var global;
	// findMe(global);
	// console.log(global);
	// setTimeout(function(){
	// 	Kitten.find(function(err,data){
	// 		if(err) res.send(err);
	// 		console.log(data);
	// 		global = data;
	// 	});
	// },500)

	// setTimeout(function(){
	// 	console.log(global);
	// },550)

});

// function findMe(){
// 	Kitten.find(function(err,data){
// 		if(err) res.send(err);
// 		console.log(data);
// 		global = data;
// 	});
// }




//callback example

// function try1(obj, callback, another){
// 	var total = obj.n+obj.m;
// 	if(!another) console.log('third parameter is: ' + another);
// 	callback(total);
// }

// try1({n: 4, m:6},function(n){
// 	console.log(n);
// 	try1({n: 1, m: 2},print);
// })

// function print(total){
// 	console.log(total)
// }




/*
	Implementing Dictionary
*/
// var fs = require('fs'),
// 	readline = require('readline');;
// var time = 0;
// var dictionary = {};
// // fs.readFile('words.txt', 'utf8', function (err,data) {
// //   if (err) {
// //     return console.log(err);
// //   }
// //   console.log(data.match('\bwest\b') !== null ? 'Word' : 'Not A Word');

// // });

// var rd = readline.createInterface({
// input: fs.createReadStream('words.txt'),
// output: process.stdout,
//     terminal: false
// });

// var index=0;
// rd.on('line', function(line) {
// 	dictionary[line] = line;
// });

// setTimeout(function(){
// 	console.log('of' in dictionary === true ? 'In' : 'Not in');
// 	//console.log('John'in dictionary === true ? 'John in dictionary' : 'John not in dictionary');
// },500)

// var sjs = require('scraperjs');
// sjs.StaticScraper
// .create('http://arrow.dit.ie/do/discipline_browser/disciplines?discipline_key=438')
// .scrape(function($){
// 	$('.new-discipline').each(function(i,main_discipline){
// 		var subDisciplineURL = $(this).children('.sub-discipline').children('a').attr('href');
// 		console.log(subDisciplineURL === undefined ? 'No more sub-discipline' : 'sub-discipline Present');
// 	});
// }, function(data){

// })