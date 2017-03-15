
var client_id='RJ5BPB0DNN442EHOXGSAX0QUAEGOKBWH2SFVJNYGS2ONUAXG';
var client_secret='CIHEGYNLARXEK5OAYM2L2EKNQ3C5AF4TEYML0MZP0JMO3N1F';
var accessToken = 'IV5CNTE3I20LAGXMX0SPK3GYBNC4RRBT0WIC3H3NELCPOIVD';
var request = require('request');
var db=require('./db');
var Twit = require('twit');
var client = new Twit({
    consumer_key: 'TtoDa8oLDSzmvjIthYJmhWfkF',
    consumer_secret: 'gOZ1LZIilVafWSxwOsaYifHgRmG5s2Y7CiyN2YNyMittdgZK8s',
    access_token: '3053047260-NN3JWAd9YYmVT0Ct7JSSSx9FrNG0vqNZ0roNYoP',
    access_token_secret: 'mtq1xgSmipDFQMjFQZ6VR772Thxb9Jo6XtOAcodyRrnAn'
});
var headers = {
		'User-Agent': 'Super Agent/0.0.1',
		'Content-Type': 'application/x-www-form-urlencoded'
};



/**
 * This function will use foursquare API to search for specific checkIn and get the needed data
 * @param {String} CheckinId  this is the checkIn ID we get from the twitter url
 * @param {function } callback  this is the call back function to send back the data to the findVenueUsers function OR to findUserCheckIn function
 * @returns void
 */
function getCheckIn(CheckinId,type,callback)
{
	var options = {

			url: 'https://api.foursquare.com/v2/checkins/resolve',
			method: 'GET',
			headers: headers,
			qs: { 'oauth_token': accessToken, 'shortId': CheckinId ,'v': '20131016',m: 'swarm'}

	};
	request(options, function (error, response, body) {


		if (!error && response.statusCode == 200) {
            var json = JSON.parse(body);
            var venueInfo=json.response.checkin.venue;
            var userInfo=json.response.checkin.user;
            var venueLocation=json.response.checkin.venue.location;
            var venueInfoJson=getVenueInfo(venueInfo);
            var loc=venueLocation.lat+','+venueLocation.lng;
            var locLat=venueLocation.lat;
            var locLong=venueLocation.lng;

            db.addVenueInfo(venueInfoJson,function(err,data){});

            updateUserInfo(userInfo.id,function(tID)
            {

                db.addVenueUserInfo(venueInfo.id,tID,function(err,data){});

            });
                var result=[];
                result.push("This user: "+ userInfo.firstName+ "   "+userInfo.lastName+ "   "+" Check in at "+venueInfo.name);
                result.push(userInfo.photo.prefix+ "256x256"+userInfo.photo.suffix);
                result.push(venueInfo.name);
                result.push(loc);
                result.push(locLat);
                result.push(locLong);
                //get more details about the venue
                getVenueDetails(venueInfo.id,function(url,pic,address,cat,telephone,desc)
                {
                    result.push(pic);
                    result.push(cat);
                    result.push(address);
                    result.push(url);
                    result.push(telephone);
                    getUserScreenName(userInfo.id,function(screenName){
                        result.push(userInfo.id);
                        result.push(desc);
                        result.push(userInfo.firstName+"  "+userInfo.lastName);
                        result.push(screenName);
                        callback(result);
                    });


                });
            }

		else
        {
            callback("foursquare error in search");
        }
	})
}

/**
 * This function will create a Json object from The checkIn response
 * @param venue {object} the venue information
 * @returns {json} venueInfo json object
 */
function getVenueInfo(venue)
{
    var venueInfo={};
    venueInfo.vid=venue.id;
    venueInfo.vName=venue.name;
    venueInfo.vAddress=venue.location.address +' '+venue.location.city+' '+venue.location.postalCode+' '+venue.location.country;
    venueInfo.url=venue.url;
    return venueInfo;
}

/**
 * This function will get the venues around the given location
 * @param vLat {double}the location lat
 * @param vLong {double} the location long
 * @param callback  {function} this is the call back function to send back the data to the server
 */
function getSurroundings(vLat,vLong,callback)
{
    var swVal=vLat+","+vLong;
    var lat2=Number(vLat) +0.001;
    var long2=Number(vLong)+0.001;
    var neVal=lat2+","+long2;
    var options2 = {
        url: 'https://api.foursquare.com/v2/venues/search',
        method: 'GET',
        headers: headers,
        qs: { 'oauth_token': accessToken ,'v': '20131016',sw:swVal,ne:neVal,intent:'browse' ,m: 'swarm'}
    };
    request(options2,
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var json = JSON.parse(body);
                var locations=json.response.venues;
                var results=[];
                var count =Object.keys(locations).length;
                locations.forEach(function(location)
                {
                    //call the getVenueDetails to get the venue details
                    getVenueDetails(location.id,function(url,pic,address,cat,telephone)
                    {

                        results.push({data:location,urlLink:url,venuePic:pic,venueAddress:address,venueCat:cat});
                        count-=1;
                        if(count==0)
                        {
                            callback(results);
                        }
                    });
                });
            }
            else
            {
                console.log('foursquare error : '+error + ' status: '+response.statusCode);

            }
        })
}
/**
 * the function will use foursquare API to get the venue details and end it back to the getSurroundings function and to the getCheckIn function
 * @param locationID {int} the foursquare location id
 * @param callback  {function} this is the call back function to send back the data
 */
function getVenueDetails(locationID,callback)

{
    var options = {

        url: "https://api.foursquare.com/v2/venues/"+locationID,
        method: 'GET',
        headers: headers,
        qs: { 'oauth_token': accessToken ,'v': '20131016',m: 'swarm'}

    };
    request(options,
        function (error, response, body) {
            if (!error && response.statusCode == 200) {

                var json = JSON.parse(body);

                var venuePic;
                var venueAddress;
                var venueCat;
                var venueTelephone;
                var venueDescription;
                if(json.response.venue.categories.length>0)
                {
                    venueCat=json.response.venue.categories[0].name;
                }
                else
                {
                    venueCat='No category';
                }
                if(json.response.venue.contact.phone)
                {
                    venueTelephone=json.response.venue.contact.phone;
                }
                else
                {
                    venueTelephone='No telephone number';
                }

                if(json.response.venue.location.address)
                {
                    venueAddress=json.response.venue.location.address;
                }
                else
                {
                    venueAddress='NO address';
                }

                if (json.response.venue.photos.count>0)
                {
                    var items =json.response.venue.photos.groups[0].items;
                    venuePic=items[0].prefix+items[0].width+'x'+items[0].height+items[0].suffix;
                }
                else
                {
                    venuePic='No photo';
                }

                if (json.response.venue.description)
                {
                    venueDescription=json.response.venue.description;
                }
                else
                {
                    venueDescription='No venue description';
                }

                callback(json.response.venue.canonicalUrl,venuePic,venueAddress,venueCat,venueTelephone,venueDescription);

            }
            else console.log('foursquare error : '+error + ' status: '+response);
        })

}

/**
 * This function will update the user information we have the Data base with the information we have in foursquare
 * @param id {int} the foursquare userID
 * @param callback  {function} this is the call back function to send back the screen name
 */
function updateUserInfo(id,callback) {

    var options = {
        url: 'https://api.foursquare.com/v2/users/' + id,
        method: 'GET',
        headers: headers,
        qs: { 'oauth_token': accessToken, 'v': '20140806', m: 'swarm'}
    };

    request(options,
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var json=JSON.parse(body);
                //get the twitter user details and update the details
                getUserDetails(json.response.user.contact.twitter, function (userID,homeCity,photourl,bio,screen) {
                    var userInfo={};
                    userInfo.id=userID;
                    userInfo.location=homeCity;
                    userInfo.profilePic=photourl;
                    userInfo.description=bio;
                    userInfo.screen_name=screen;
                    //call the db.js to update the user record with the information in foursquare
                    db.updateUserInfo(userInfo,function(err,data){});
                    callback(screen);

                });

            }

            else
            {
              console.log('error: '+error + ' status: '+response.statusCode);

            }

        });


}
/**
 * the function will get the twitter user id and his details from twitter
 * @param user {json} the user data
 * @param callback  {function} this is the call back function to send back the user details to updateUserInfo function
 */
function getUserDetails(ScreenName,callback)
{
        client.get('/statuses/user_timeline', {
                screen_name: ScreenName,
                count: 1
            },
        function(err, data, response) {
            if (err) {}
            else
            {
                if(data.length>0)
                {

                     callback(data[0].user.id,data[0].user.location,data[0].user.profile_image_url,
                     data[0].user.description,data[0].user.screen_name);

                }

            }


        });
}

/** this function will get the twitter screen name from foursquare user id and send it to getUserTweets function to get the user tweets
 * @param id  {int} foursquare user id
 * @param callback  {function} this is the call back function to send back the user tweets to the server
 */
function getUserData(id,callback) {

    var options = {
        url: 'https://api.foursquare.com/v2/users/' + id,
        method: 'GET',
        headers: headers,
        qs: { 'oauth_token': accessToken, 'v': '20140806', m: 'swarm'}
    };

    request(options,
        function (error, response, body) {
            if (!error && response.statusCode == 200) {

                var json=JSON.parse(body);

                var twitterScreenName=json.response.user.contact.twitter;
                // this function will get the user tweets from the Database and online
                getUserTweets(twitterScreenName,function(tweets)
                {
                    callback(tweets);
                });

            }

            else
            {
                console.log('error: '+error + ' status: '+response.statusCode);

            }

        });


}
/**
 * this function will get the twitter user screen name from foursquare user id
 * @param id {int} the foursquare user id
 * @param callback
 */
function getUserScreenName(id,callback) {

    var options = {
        url: 'https://api.foursquare.com/v2/users/' + id,
        method: 'GET',
        headers: headers,
        qs: { 'oauth_token': accessToken, 'v': '20140806', m: 'swarm'}
    };
    request(options,
        function (error, response, body) {
            if (!error && response.statusCode == 200) {

                var json=JSON.parse(body);

                callback(json.response.user.contact.twitter);


            }

            else
            {
                console.log('error: '+error + ' status: '+response.statusCode);

            }

        });

}

/**
 * this function will get the usr tweets from the database and online
 * @param twitterScreenName {String} the user twitter screen name
 * @param callback  {function} this is the call back function to send back the user tweets to getUserData function
 */
function getUserTweets(twitterScreenName,callback)
{


    var tweetsText="The last 100 tweets:(online)\n";
    // get the tweets from database
    db.getUserTweetsDB(twitterScreenName,function(err,data)
    {

        var count =Object.keys(data).length;
        // if we have tweets from this user in the database

        if(count>0)
        {

            tweetsText='This is from Data base=\n';
            for(var i=0;i<count;i++)
            {
                tweetsText+=' (***) '+data[i]['TweetText']+'\n';
            }
            tweetsText+='==================================================================\n';
            tweetsText+='==================================================================\n';
            tweetsText+='                       This is online= \n';
            tweetsText+='==================================================================\n';
            tweetsText+='==================================================================\n';

        }


    });
    //get the last 100 tweets from online with tweeter API
    client.get('/statuses/user_timeline', {
            screen_name: twitterScreenName,
            count: 100
        },
        function(err, data, response) {

            if (err) console.log("error in search for tweets for this user");
            var count =data.length;
            for(var i=0;i<count;i++)
            {
                tweetsText+=" (***) "+data[i].text+'\n';
                db.addUserTweet(twitterScreenName,data[i].text,function(err,data){});
                if(i==data.length-1)
                {
                    callback(tweetsText);
                }
            }

        });
}

exports.getCheckIn=getCheckIn;
exports.getSurroundings=getSurroundings;
exports.getUserData=getUserData;