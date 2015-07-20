/*
 * Calaca - Search UI for Elasticsearch
 * https://github.com/romansanchez/Calaca
 * http://romansanchez.me
 * @rooomansanchez
 * 
 * v1.2.0
 * MIT License
 */

/* Service to Elasticsearch */
Calaca.factory('calacaService', ['$q', 'esFactory', '$location', function($q, elasticsearch, $location){

    //Set default url if not configured
    CALACA_CONFIGS.url = (CALACA_CONFIGS.url.length > 0)  ? CALACA_CONFIGS.url : $location.protocol() + '://' +$location.host() + ":9200";

    var client = elasticsearch({ host: CALACA_CONFIGS.url });

    var search = function(query, mode, offset){

        var deferred = $q.defer();

        if (query.general.length==0) {
            deferred.resolve({ timeTook: 0, hitsCount: 0, hits: [] });
            return deferred.promise;
        }

        seachObj = {
                "index": CALACA_CONFIGS.index_name,
                "type": CALACA_CONFIGS.type,
                "body": {
                    "size": CALACA_CONFIGS.size,
                    "from": offset,
                    "query": {
                      "filtered": {
                        "query": {
                          
                          "function_score": {
                            "query": {
                              "bool": {
                                "should": [
                                  {
                                    "multi_match": {
                                      "query": query.general,
                                      "type": "best_fields", 
                                      "fields": ["title", "body"],
                                      "minimum_should_match": "100%"
                                    }
                                  },
                                  {
                                    "match_phrase": {
                                      "title": query.general
                                    }
                                  },
                                  {
                                    "match_phrase": {
                                      "body": query.general
                                    }
                                  }
                                ]
                              }                             
                            },                              
                            "functions": [
                              { 
                                "linear": {
                                  "postdate": {
                                    "origin": "now",
                                    "scale": "90d",
                                    "decay": 0.5
                                  }},
                                  
                              "linear": {
                                "length": {
                                  "origin": 500,
                                  "scale": 100,
                                  "decay": 0.9
                                }}
                              }
                            ],
                            "boost_mode": "sum"
                            
                          }
                        },
                        "filter": {
                          "term": {"country": query.country,"_cache": true}
                        }
                      }
                    },
                    "highlight": {
                      "pre_tags": ["<span style='font-weight:600'>"],
                      "post_tags": ["</span>"],
                      "order" : "score",
                      "fields": {
                        "body": {"fragment_size" : 150, "number_of_fragments" : 3}
                      }
                    }
                }
        }

        if ( typeof query.country == 'undefined' || query.country === '')    
            delete seachObj.body.query.filtered.filter;
    

        client.search(seachObj).then(function(result) {

                var i = 0, hitsIn, hitsOut = [], source, highlight;
                hitsIn = (result.hits || {}).hits || [];
                for(;i < hitsIn.length; i++){
                    source = hitsIn[i]._source;
                    source._id = hitsIn[i]._id;
                    source._index = hitsIn[i]._index;
                    source._type = hitsIn[i]._type;
                    source._score = hitsIn[i]._score;
                    highlight = hitsIn[i].highlight;
                    if (highlight && "body" in highlight)
                    {
                        source.body = '...' + highlight.body[0] + '... ';
                        if (highlight.body.length > 1)
                        {                               
                            for (var j = 1; j < highlight.body.length; j++)
                                source.body += highlight.body[j] + '... ';
                        }
                    }
                    else
                    {
                      source.body = source.body.substring(0, 150) + "..."
                    }
                    hitsOut.push(source);
                }
                deferred.resolve({ timeTook: result.took, hitsCount: result.hits.total, hits: hitsOut });
        }, deferred.reject);

        return deferred.promise;
    };

    return {
        "search": search
    };

    }]
);
