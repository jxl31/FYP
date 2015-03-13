/*
	Algorithm reference: https://github.com/jasondavies/d3-cloud/
*/

'use strict';

angular.module('CloudDirective',[])
	.directive('customWordCloud', ['AuthorAPI',function (AuthorAPI) {
		return {
			restrict: 'E',
			templateUrl: 'views/visualisation/cloud.html',
			scope: {
				data: '=data',
				indexes: '=indexes',
				loading: '&',
			},
			link: function (scope, iElement, iAttrs) {
				scope.loading({loaded: false});
				scope.allDates = getDates();
				scope.selectedDateFilter = null;
				var margin = {
						top: 50,
						right: 20,
						bottom: 20,
						left: 20
					},
					width = $('.cloud-visualisation-container').width(),
					height = 500;

				var color = d3.scale.category20(),
					svg;
			    var el = $('.cloud-visualisation-container')[0];
			    	
				svg = d3.select(el).append('svg')
			    		.attr('width',width + margin.left + margin.right)
						.attr("height", height + margin.top + margin.bottom)
					.append('g')
						.attr('transform', "translate(" + [width >> 1, height >> 1] + ")");

			    processData(function(words){
			    	scope.titleDate = getTitleDate(words);
			    	if(scope.data.processedKeywords === undefined){
			    		words.forEach(function(d){
			    			checkWordsForwardSlash(d);
			    		});
			    		var promiseK = AuthorAPI.saveKeywords(scope.data.details_id, words);
				    	promiseK.then(function(msg){
				    		console.log(msg);
				    	});
			    	}
			    	d3.layout.cloud()
			    		.size([width, height])
						.timeInterval(10)
						.words(words)
						.padding(1)
						.font('Impact')
						.fontSize(function(d) { return d.size; })
						.rotate(function() { return ~~(Math.random()*5) * 30 - 70;  })
						.on('end', draw)
						.start();

			    });

			    scope.$watch('titleDate', function(n,o){
			    	if(n !== o){
			    		console.log(scope.titleDate);
			    	}
			    })

			    function updateViz(){
			    	var filteredData = filterByDate(scope.selectedDateFilter);
			    	scope.titleDate = scope.selectedDateFilter;
			    	console.log(filteredData);
			    	processData(function(words){
			    		console.log(words);
			    		svg.selectAll('text').remove();
			    		d3.layout.cloud()
				    		.size([width, height])
							.timeInterval(10)
							.words(words)
							.padding(1)
							.font('Impact')
							.fontSize(function(d) { return d.size; })
							.rotate(function() { return ~~(Math.random()*5) * 30 - 70;  })
							.on('end', draw)
							.start();

			    	}, filteredData)

			    }


			    function draw(words){

					var word = 
						svg.selectAll("text")
					        .data(words)
					      .enter().append("text")
					        .style("font-size", function(d) { return d.size + "px"; })
					        .style("font-family", "Impact")
					        .style("fill", function(d, i) { return color(i); })
					        .attr("text-anchor", "middle")
					        .attr("transform", function(d) {
					          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
					        })
					        .text(function(d) { return d.text; });
			    }

			    scope.toggleDate = function(date){
			    	scope.selectedDateFilter = date;
			    	updateViz();
			    }

			    function getDates (){
					var dates = [];
					scope.data.coauthors.forEach(function(author){
						author.dates.forEach(function(date){
							if(dates.length === 0)
								dates.push(date); 
							else if($.inArray(date,dates) === -1)
								dates.push(date);
						});
					});

					return dates;
				}

			    function getTitleDate(words){
			    	var title = '';
			    	var dates = [];
			    	words.forEach(function(word){
			    		scope.data.docs.forEach(function(doc){
			    			if(word.from === doc.title){
			    				var date = doc.publication_date.match('\\d+[/\\-](\\d+)')[1];
			    				if(dates.length === 0) dates.push(date);
			    				else if($.inArray(date, dates) === -1) dates.push(date);
			    			}
			    		});
			    	});

			    	if(dates.length <= 1){
			    		return title.concat(dates.toString());
			    	} else {
			    		var from = d3.min(dates, function(d){
							return parseInt(d);
						});

						var to = d3.max(dates, function(d){
							return parseInt(d);
						});

						return title.concat(from,'-',to);
			    	}
			    }


			    function filterByDate (selectedDate){
			    	var tempWords = [];
			    	scope.data.docs.forEach(function(doc){
		    			if(doc.publication_date.match('\\d+[/\\-](\\d+)')[1] === selectedDate){
		    				scope.data.keywords.forEach(function(keywords){
		    					if(keywords.docTitle === doc.title){
		    						keywords.docKeywords.map(function(word){
		    							tempWords.push({
		    								text: word.text,
		    								size: 5 + word.relevance * 30,
		    								from: keywords.docTitle
		    							});
		    						})
		    					}
		    				});
		    			}
		    		});

		    		return tempWords;
			    }


				function processData(callback, filteredData){
					var tempWords = [];
					if(filteredData !== undefined){
						filteredData.forEach(function(word){
							if(!ifSimilarWords(tempWords, word.text)){
								tempWords.push({
									text: word.text,
									size: word.size,
									from: word.from
								});
							}
						});
					} else if(scope.data.processedKeywords === undefined){
						var max = scope.data.keywords.length > 10 ? 10 : 30;
						var wScale = max === 30 ? 45 : 20; 
						if(scope.indexes === undefined){
							scope.data.keywords.forEach(function(d){
								console.log(d.docTitle);
								if(d.docKeywords !== undefined){
									var docLength = d.docKeywords.length;
									for(var i = 0; i < max; i++){
										if(i < docLength){
											if(!ifSimilarWords(tempWords, d.docKeywords[i].text)){
												tempWords.push({
													text: d.docKeywords[i].text, 
													size: 5 + d.docKeywords[i].relevance * wScale,
													from: d.docTitle 
												});
											}
										} else {
											return;
										}
									}
								}
							});
						} else {
							for(var i = 0; i < scope.indexes.length; i++){
								for(var j = 0; j < scope.data.keywords.length; j++){
									if(scope.indexes[i] === scope.data.keywords[j].docTitle){
										if(scope.data.keywords[j].docKeywords !== undefined){
											var docLength = scope.data.keywords[j].docKeywords.length;
											for(var x = 0; x < max ; x++){
												if(x < docLength){
													//console.log('x:' + x + ', l:' + scope.data.keywords[j].docKeywords.length);
													if(!ifSimilarWords(tempWords, scope.data.keywords[j].docKeywords[x].text)){
														tempWords.push({
															text: scope.data.keywords[j].docKeywords[x]['text'],
															size: 5 + scope.data.keywords[j].docKeywords[x].relevance * wScale, 
															from: scope.data.keywords[j].docTitle
														});
													}
												}else{
													break;
												}
											}
										}
									}
								}
							}
						}
					} else {
						tempWords.push(scope.data.processedKeywords);
					}
	
					scope.loading({loaded: true});
					callback(tempWords);
				}

				function checkWordsForwardSlash(word){
					if(word.text.indexOf('/') != -1){
						word.text = word.text.replace('/' , ' or ');
					}
				}

				function ifSimilarWords(array, lookupWord){
					for(var i = 0; i < array.length; i++){
						//console.log('Word: ' + lookupWord + ', Compared Word: ' + array[i].text + ', EditDistance: ' + getEditDistance(lookupWord, array[i].text));
						if(getEditDistance(lookupWord, array[i].text) <= 1){
							return true;
						} else if(i+1 === array.length){
							return false;
						}
					}
				}

				//https://en.wikibooks.org/wiki/Algorithm_Implementation/Strings/Levenshtein_distance#JavaScript
				function getEditDistance(w1,w2){
					if(w1.length === 0) return w2.length; 
					if(w2.length === 0) return w1.length; 

					var matrix = [];

					// increment along the first column of each row
					var i;
					for(i = 0; i <= w2.length; i++){
					matrix[i] = [i];
					}

					// increment each column in the first row
					var j;
					for(j = 0; j <= w1.length; j++){
					matrix[0][j] = j;
					}

					// Fill in the rest of the matrix
					for(i = 1; i <= w2.length; i++){
						for(j = 1; j <= w1.length; j++){
						  if(w2.charAt(i-1) == w1.charAt(j-1)){
						    matrix[i][j] = matrix[i-1][j-1];
						  } else {
						    matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
						                            Math.min(matrix[i][j-1] + 1, // insertion
						                                     matrix[i-1][j] + 1)); // deletion
						  }
						}
					}

					return matrix[w2.length][w1.length];
				}
			}
		}
	}])