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
Calaca.controller('calacaCtrl', ['calacaService', '$scope', '$location', function(results, $scope, $location){

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
          "Madagascar"
        ];

        var paginationTriggered;
        var maxResultsSize = CALACA_CONFIGS.size;
        var searchTimeout;
        var searchStarted;
        var searchEnded;

        $scope.delayedSearch = function(mode) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(function() {
                $scope.search(mode)
            }, CALACA_CONFIGS.search_delay);
        }

         $scope.countryChanged = function  ($event) {              
            if ( typeof $scope.query.general !== '' && $scope.query.country !== '' && $event.keyCode === 13)
            {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(function() {
                    $scope.search(0)
                }, CALACA_CONFIGS.search_delay);
            }
         }

        //On search, reinitialize array, then perform search and load results
        $scope.search = function(m){
            $scope.results = [];
            $scope.offset = m == 0 ? 0 : $scope.offset;//Clear offset if new query
            $scope.loading = m == 0 ? false : true;//Reset loading flag if new query

            if(m == -1 && paginationTriggered) {
                if ($scope.offset - maxResultsSize >= 0 ) $scope.offset -= maxResultsSize;
            }     
            if(m == 1 && paginationTriggered) {
                $scope.offset += maxResultsSize;
            }
            $scope.paginationLowerBound = $scope.offset + 1;
            $scope.paginationUpperBound = ($scope.offset == 0) ? maxResultsSize : $scope.offset + maxResultsSize;
            
            searchStarted = performance.now();
            $scope.loadResults(m);
        };

        //Load search results into array
        $scope.loadResults = function(m) {
            results.search($scope.query, m, $scope.offset).then(function(a) {

                searchEnded = performance.now ();
                wireTimeTook = searchEnded - searchStarted;

                mixpanel.track("Search", 
                  {
                    "Country": $scope.query.country, "General": $scope.query.general, "Page" : $scope.offset,
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
                if(paginationTriggered) {
                    $scope.loading = true;
                }
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