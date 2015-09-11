/*
 * Calaca - Search UI for Elasticsearch
 * https://github.com/romansanchez/Calaca
 * http://romansanchez.me
 * @rooomansanchez
 * 
 * v1.2.0
 * MIT License
 */

/* Calaca Controller
 *
 * On change in search box, search() will be called, and results are bind to scope as results[]
 *
 TODO: Try Google AutoComplete for Country: http://plnkr.co/edit/il2J8qOI2Dr7Ik1KHRm8?p=preview
*/
Calaca.controller('calacaCtrl', ['calacaService', '$scope', '$http', '$location', function(results, $scope, $http, $location){

        //Init empty array
        $scope.results = [];

        //Init offset
        $scope.offset = 0;
        $scope.query = {"general":'',"country":''};
        
        //TODO: Move this to AJAX Service
        var countries = [
          "South Africa",
          "Morocco",
          "Kenya",
          "Ghana",
          "Croatia",
          "Tanzania",
          "Tunisia",
          "Namibia",
          "Algeria",
          "Zimbabwe",
          "Uganda",
          "Botswana",
          "Mauritius",
          "Egypt",
          "Ethiopia",                    
          "Zambia",  
          "Rwanda",
          "Malawi",     
          "Sudan",
          "Togo",
          "Cameroon",
          "Mali",
          "Mozambique",
          "Senegal",
          "Mauritania",
          "Nigeria",          
          "Swaziland",
          "Madagascar",
          "Congo",
          "Sierra Leone",
          "Sudan",
          "Burundi",
          "Guinea",
          "Seychelles"
        ];

        var paginationTriggered;
        var maxResultsSize = CALACA_CONFIGS.size;
        var searchTimeout;
        var searchStarted;
        var searchEnded;

        $scope.entersearch = function (term, country) {
          $scope.query.general = term
          if (country)
            $scope.query.country = country
          $scope.search(0)
        }

        $scope.trackengagment = function (category, url, title, index) {          
           
            page = ($scope.offset/maxResultsSize) + 1
            resultIndex = $scope.offset + index + 1

            mixpanel.track(category, 
              {
                "Country": $scope.query.country, "General": $scope.query.general, "Page" : page,
                "ResultIndex": resultIndex, "Url": url, "Title":title, 
              }
            );
        }

        $scope.findhighlights = function (result) {

          $http.get(CALACA_CONFIGS.rest_url +'/positivestatements/'+result._id).
            then(function(response) {
                            
              if (response.data)
              {
                result.highlights = [];
                for (var i in response.data)
                  result.highlights.push (response.data[i])
              } 
            }, function(response) {
              // called asynchronously if an error occurs
              // or server returns response with an error status.
              console.error (response)
            });
        }

        //On search, reinitialize array, then perform search and load results
        $scope.search = function(m){

            $scope.results = [];
            $scope.offset = m == 0 ? 0 : $scope.offset;//Clear offset if new query
            $scope.loading = true;

            if(m == -1 && paginationTriggered) {
                if ($scope.offset - maxResultsSize >= 0 ) $scope.offset -= maxResultsSize;
            }     
            if(m == 1 && paginationTriggered) {
                $scope.offset += maxResultsSize;
            }
            $scope.paginationLowerBound = $scope.offset + 1;
            $scope.paginationUpperBound = ($scope.offset == 0) ? maxResultsSize : $scope.offset + maxResultsSize;
            
            searchStarted = new Date ();
            $scope.loadResults(m);
        };

        //Load search results into array
        $scope.loadResults = function(m) {
            results.search($scope.query, m, $scope.offset).then(function(a) {              

                searchEnded = new Date ();
                wireTimeTook = searchEnded.getTime() - searchStarted.getTime();

                page = ($scope.offset/maxResultsSize) + 1

                mixpanel.track("Search", 
                  {
                    "Country": $scope.query.country, "General": $scope.query.general, "Page" : page,
                    "WireTimeTake": wireTimeTook, "RawQueryTimeTaken": a.timeTook, "Count": a.hitsCount
                  }
                );

                //Load results
                var i = 0;
                for(;i < a.hits.length; i++){
                    $scope.results.push(a.hits[i]);
                }

                //Set time took
                $scope.timeTook = a.timeTook;

                //Set total number of hits that matched query
                $scope.hits = a.hitsCount;

                //Pluralization
                $scope.resultsLabel = ($scope.hits != 1) ? "results" : "result";

                //Check if pagination is triggered
                paginationTriggered = $scope.hits > maxResultsSize ? true : false;

                //Set loading flag if pagination has been triggered
                
                $scope.loading = false;

                $scope.lastcountry = $scope.query.country;

                if ($scope.lastcountry  && $scope.lastcountry != '')
                  $scope.invalidcountry = countries.indexOf($scope.lastcountry) > -1;
                else
                  $scope.invalidcountry = true;                
            });
        };

        $scope.paginationEnabled = function() {
            return paginationTriggered ? true : false;
        };        

        function suggest_country(term) {
            var q = term.toLowerCase().trim();
            var results = [];

            // Find first 10 states that start with `term`.
            for (var i = 0; i < countries.length && results.length < 10; i++) {
              var country = countries[i];
              if (country.toLowerCase().indexOf(q) === 0)
                results.push({ label: country, value: country });
            }

            return results;
        }

        $scope.autocomplete_options = {
            suggest: suggest_country
        };

    }]
);