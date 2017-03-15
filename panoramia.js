var request = require('request');


var headers = {
    'User-Agent': 'Super Agent/0.0.1',
    'Content-Type': 'application/x-www-form-urlencoded'
};


/**
 * this function will get a list of pictures around a given area from panoramio API
 * @param json {json} the place details
 * @param callback
 */
function getPanoramio(json,callback) {

    var miny=Number(json.lat1) -0.003;
    var minx=Number(json.long1)-0.003;

    var maxy=Number(json.lat1) +0.003;
    var maxx=Number(json.long1) +0.003;

    var options = {
        url: 'http://www.panoramio.com/map/get_panoramas.php?set=public&from=0&to=20&minx='+minx+'&miny='+miny+'&maxx='+maxx+'&maxy='+maxy+'&size=medium&mapfilter=true' ,
        method: 'GET'

    };

    request(options,
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var json=JSON.parse(body);
                var result=json.photos;

                var resultArray=[];
               for (var i=0;i<result.length;i++)
               {
                   resultArray.push('This photo is taken by:'+  result[i].owner_name+'  for  '+result[i].photo_title + ' on: '+ result[i].upload_date +"    "+"<a href='" +result[i].photo_file_url+ "'target=_blank> Show in new tab  <//a> ");
               }
               callback(resultArray);


            }

            else
            {
                console.log('error: '+error );

            }

        });


}



exports.getPanoramio=getPanoramio;
