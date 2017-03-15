
var APIKey='AIzaSyDCIPOTroktG_GcKwGoqo3vmMn68jxL70I';
var request = require('request');
/**
 * this function will get a list of places around a given alt and long from Google API
 * @param json {json} the place details
 * @param callback
 */
function getPlaceName(json,callback) {

    var options = {

        url: 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location='+json.lat1+','+json.long1+'&radius=200&key='+APIKey
    };
    request(options,
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var json=JSON.parse(body);
                var result =json.results;

                var resultarray =[];
                for (var i=0;i<result.length;i++)
                {
                    resultarray.push('Palce name:   '+ result[i].name +'  Type:   '+result[i].types[0] );
                }
                callback(resultarray);


            }

            else
            {
                console.log('error: '+error );
            }

        });


}

exports.getPlaceName=getPlaceName;
