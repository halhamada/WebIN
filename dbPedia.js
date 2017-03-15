var SparqlClient = require('sparql-client');
var util = require('util');
var endpoint = 'http://dbpedia.org/sparql';
var client = new SparqlClient(endpoint);
var request = require('request');

/**
 * this function will send a Sparql request to SparqlClient to get the venues around the given venue
 * @param venue {string} the venue name
 * @param callback {function} send the list of the venues found to the server
 */
function venueUriRetrieve(venue,callback)
{
    getUri(venue,function(venueUri)
    {

        if(venueUri=='No result found in dbPedia')
        {
            callback('No result found in dbPedia');
        }
        else
        {
            var query = 'PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#'+'\> SELECT ?subject ?label ?lat ?long WHERE {  <'+venueUri+'> geo:lat ?venueLat. '+
                ' <'+venueUri+'> geo:long ?venueLong.' +
                '?subject geo:lat ?lat.'+
                '?subject geo:long ?long.'+
                '?subject rdfs:label ?label.'+
                'FILTER('+
                'xsd:double(?lat) - xsd:double(?venueLat) <= 0.05 &&'+
                'xsd:double(?venueLat) - xsd:double(?lat) <= 0.05 &&'+
                'xsd:double(?long) - xsd:double(?venueLong) <= 0.05 &&'+
                'xsd:double(?venueLong) - xsd:double(?long) <= 0.05 &&'+
                'lang(?label) = "en").'+
                '} LIMIT 20';


            client.query(query) .execute(function(error, results) {

                var body=[];

                var locations=results.results.bindings;
                var count =Object.keys(locations).length;
                if(count>0)
                {
                    locations.forEach(function(location)
                    {

                        body.push({venueName:location.label.value,lat:location.lat.value,long:location.long.value,uri:location.subject.value});

                        count-=1;
                        if(count==0)
                        {

                            callback(body);

                        }
                    });
                }
                else
                {
                    callback('No result found in dbPedia');
                }



            });
        }



    });


}
/**
 * this function will get the best uri result by sending a request to lookup dbpedia search API
 * @param venue {string} venue name
 * @param callback {function} send the venue uri to venueUriRetrieve function
 */
function getUri(venue,callback)
{
    var options = {
        url: 'http://lookup.dbpedia.org/api/search/KeywordSearch?QueryClass=place&QueryString='+venue,
        headers:{'Accept':'application/json'}

    };
    request(options, function (error, response, body) {
        if(error){callback('No result found in dbPedia');}
        else
        {
            // if there is an error in the request because of the venue name .. send no result found
            if(body=='<h1>400 Bad Request</h1>URISyntaxException thrown') {callback('No result found in dbPedia');}
            else
            {
                var json=JSON.parse(body);
                //if there is no results
                if(Object.keys(json.results).length>0)
                {
                    callback(json.results[0].uri);

                }
                else
                {
                    callback('No result found in dbPedia');
                }
            }

        }


    });

}

exports.venueUriRetrieve=venueUriRetrieve;