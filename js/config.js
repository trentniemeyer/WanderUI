/*
 * Calaca - Search UI for Elasticsearch
 * https://github.com/romansanchez/Calaca
 * http://romansanchez.me
 * @rooomansanchez
 * 
 * v1.2.0
 * MIT License
 */

/* Configs */
/**
 *
 * url - Cluster http url
 * index_name - Index name or comma-separated list
 * type - Type
 * size - Number of results to display at a time when pagination is enabled.
 * search_delay - Delay between actual search request in ms. Reduces number of queries to cluster by not making a request on each keystroke. 
 */

var CALACA_CONFIGS = {
	url: "http://13.92.81.151:9200",
	rest_url: "http://13.92.81.151:5000",
	index_name: "blogs",
	type: "blog",
	size: 20,
	search_delay: 500
}
