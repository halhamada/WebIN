var Twit = require('twit');

var client = new Twit({
    consumer_key: 'TtoDa8oLDSzmvjIthYJmhWfkF',
    consumer_secret: 'gOZ1LZIilVafWSxwOsaYifHgRmG5s2Y7CiyN2YNyMittdgZK8s',
    access_token: '3053047260-NN3JWAd9YYmVT0Ct7JSSSx9FrNG0vqNZ0roNYoP',
    access_token_secret: 'mtq1xgSmipDFQMjFQZ6VR772Thxb9Jo6XtOAcodyRrnAn'
});
var request = require("request");
var foursquare=require('./foursquare');
var db=require('./db');


/**
 * this function will get the public discussion through keyword and location (optional)
 * tweet api: search/tweets
 * @param keyword {String} the search keyword
 * @param location{String} the search location
 * @param callback {Function} is the assisting function getDiscussionJson.
 * @returns void
 */
function searchKeyword(keyword,location,callback)
{
	if(location)
	{
		client.get('search/tweets', {
			q: keyword,
			geocode:location+","+ "2mi",
			count: 8
		},
		function(err, data, response) {
			if (err) console.log("error in searchKeyword");
			getDiscusJson(err,data,callback);

		});
	}
	else
	{
		client.get('search/tweets', {
			q: keyword,
			count: 8
		},
		function(err, data, response) {
			if (err) console.log("error error in searchKeyword");
			getDiscusJson(err,data,callback);

		});
	}    
}
/**
 * this function would calculating the n most frequent words used by a list of screen names and
 * parse the results in appropriate data structures.
 * tweet api used : search/tweets
 * @param json {Object} contains
 *   screen names (string) in the format "aaa,bbb,ccc"
 *   keyNo(Number) which is the number of key words
 *   dayNo(Number) which is the last X days.
 * @param callback send data to server.
 * @returns void
 */
function findMostFreqKey(json,callback)
{
	var screennames=json.screenNames;
	var keyNo=json.keyNo?Number(json.keyNo):1;
	var dayNo=json.dayNo?Number(json.dayNo):1;

	var nameArr=screennames.split(',');

	//record count to make sure get all results from multiple call of twit api
	var count=nameArr.length;
	var datetime=new Date();
	datetime.setDate(datetime.getDate()-dayNo);
	var timeStr=getTimeStr(datetime);
	var searchStr="";
	var res={};
	var gdict={};

	for(var i=0;i<nameArr.length;i++)
	{
		searchStr="from:"+nameArr[i]+" since:"+timeStr;
		client.get('search/tweets', {
			q: searchStr

		},
		function(err, data, response) {
			if (err) console.log("error in findMostFreqKey");
			else{
				var oneresult=[];
				var dict={};
				var wordlist=[];
				var screenname="";
				for (var indx in data.statuses) {
					var tweet = data.statuses[indx];		  
					var text=tweet.text;
					wordlist=text.split(" ");
					screenname=tweet.user.screen_name;


					wordlist.forEach(function (word) {
						if (word in dict)
							dict[word]+=1;
						else
							dict[word]=1;
						if(word in gdict)
							gdict[word]+=1;
						else
							gdict[word]=1;
					});

				}

				res[screenname]=dict;
				count-=1;

				if(count==0)
				{

					var allwords=Object.keys(gdict);
					allwords.sort(function(w1,w2)
							{
						if(gdict[w1]>gdict[w2]) return -1;
						else if(gdict[w1]<gdict[w2]) return 1;
						else if(w1>w2) return 1;
						else return -1;

							});
					var sortedKeywords=[];
					var resgArray=[];
					var namenumberArray={};
					var nameList=Object.keys(res);
					for (var j=0;j<nameList.length;j++)
					{
						var name=nameList[j];
						namenumberArray[name]=[];
					}

					for(var i=0;i<keyNo;i++)
					{
						var word=allwords[i];
						sortedKeywords.push(word);
						resgArray.push(gdict[word]);
						for (var j=0;j<nameList.length;j++)
						{
							var name=nameList[j];
							var wordcount=res[name][word];
							namenumberArray[name].push(wordcount?wordcount:0);
						}

					}
					var resJson={};
					resJson.sortedKeywords=sortedKeywords;
					resJson.namenumberArray=namenumberArray;
					resJson.resgArray=resgArray;

                    var mebers=namenumberArray;
                    var keywordsL=sortedKeywords;
                    var totals=resgArray;
                    var zeoroCountPlaces=[];
                    for (var j=0;j<nameList.length;j++)
                    {
                        var name=nameList[j];

                        var member=mebers[name];
                        for(var i=0;i<keyNo;i++)
                        {
                           // console.log(member[i]);
                            if(member[i]==0)
                            {

                                zeoroCountPlaces.push(i);

                            }

                        }

                        if(j==nameList.length-1)
                        {

                            for (var j=0;j<nameList.length;j++)
                            {
                                var name=nameList[j];

                                var member=mebers[name];
                                for(var i=0;i<keyNo;i++)
                                {

                                    for(var x=0;x<zeoroCountPlaces.length;x++)
                                    {
                                        if(i==zeoroCountPlaces[x])
                                        {

                                            member[i]='*';
                                            keywordsL[i]='*';
                                            totals[i]='*';

                                        }

                                    }

                                }

                            }

                            callback(resJson);
                        }

                    }


				}


			}});

	}    
}

/**
 * This function is the assisting function which would generate timeString from datatime.
 * It will be invoked by function findMostFreqKey.
 * @param datetime is the datetime of last X days.
 * @return the time string 
 */
function getTimeStr(datetime)
{
	var year=datetime.getYear()+1900;
	var month=datetime.getMonth()+1;
	var day=datetime.getDate();
	var res=year.toString()+"-"+month.toString()+"-"+day.toString();
	return res;
}

/**
 * This function is the assisting function which would parse public discussion from the results returned from tweet api
 * It also stores the useful info in the database.
 * It will be invoked by function searchKeyword.
 * @param id {String} is a string which is id_string in the tweet api.
 * @param callback {Function} send data to server.
 * @returns void
 */

function getDiscusJson(err,data,callback)
{
    if(err){ console.log("err in getDiscusJson"); callback(true); return;}
	var arr=[];
	for (var indx in data.statuses) {
		var tweet = data.statuses[indx];
		var discuss='on: ' + tweet.created_at + ' : @' + tweet.user.screen_name + ' : ' + tweet.text + '\n';
		var idStr=tweet.id_str;
		var user=tweet.user;

		var userInfo=getUserInfo(user);
		db.updateUserInfo(userInfo,function(err,data){});
		if(tweet.retweeted_status)
		{
			var retwitWho=tweet.retweeted_status.user;
			var retwitWhoInfo=getUserInfo(retwitWho);
			db.updateUserInfo(retwitWhoInfo,function(err,data){});
			db.updateRetwitInfo([user.screen_name,retwitWhoInfo.screen_name],function(err,data){});
		}

		arr.push({"twit":discuss,"twitid":idStr});
	}
	callback(false,arr);
}

/**
 * This function will create a json object will the user data
 * @param user the user information from twitter
 * @returns userInfo {json}
 */
function getUserInfo(user)
{
	var userInfo={};
	userInfo.id=user.id;
	userInfo.location=user.location;
	userInfo.profile_location=user.profile_location;
	userInfo.description=user.description;
	userInfo.screen_name=user.screen_name;

    userInfo.profilePic=user.profile_image_url;
	return userInfo;
}


/**
 * This function will get the people who retweets from id
 * tweet api: statuses/retweets
 * @param id {String} is a string which is id_string in the tweet api
 * @param callback {Function} send data to server
 * @returns void
 */
function reTweet(id, callback)
{

	client.get('statuses/retweets', {
		id: id,
		count:10

	}, function(err, data, response) {
		var namelist="nobody retweet .";
		if (err) console.log("error in reTweet");
		else
		{

			if(data.length>0)
			{
				namelist="users who retweets:\n";
					data.forEach(function(dataUnit)
							{
						var user=dataUnit["user"];
						namelist+="name:"+user.name+"  screen_name:"+user.screen_name+"  \n";
							});
			}


		}
		callback(namelist);


	});
}


/**
 * This function will use the twitter API to search for the tweets in specific area that contains swarmapp as part of the URL and this indicate that the user
 * checkIn in this place
 * @param json {Object} this is the data we received from server that contain the location input && number of days from the user if number of days is 0 a streaming API is used to git the results when its available
 * @param callback {Function} callback  this is the call back function to send back the data to the server
 * @returns void
 */
function findVenueUsers(json,callback)
{
    var twitLoc=json.twitLoc;

    var dayNo=json.dayNo?Number(json.dayNo):1;
    var venues=[];

    if(dayNo>0)
    {

        var datetime=new Date();
        datetime.setDate(datetime.getDate()-dayNo);
        var timeStr=getTimeStr(datetime);
        client.get('search/tweets', {q: "swarmapp  since:"+timeStr
                , geocode:twitLoc+","+ "1km"
            },
            function(err, data, response)
            {
                if (err) console.log('error: '+err + ' status: '+response.statusCode);
                else
                {
                    if(data.statuses)
                    {
                        for (var indx in data.statuses)
                        {
                            var tweet = data.statuses[indx];
                            var text=tweet.text;
                            venues[indx]=text;

                        }

                        getURL(venues, 2,function (data)
                        {
                            callback(data);
                        });

                    }
                    else {console.log("No data available");}


                }
            });

    }

    else
    {

        console.log("Wait for the results its streaming mode");
        var lat2=Number(json.lat1) +0.1;
        var long2=Number(json.long1)+0.1;

       // var stream = client.stream('statuses/filter', {  locations: json.lat1+","+json.long1+","+lat2+","+long2 });
        var stream = client.stream('statuses/filter', {  locations: json.lat1+","+json.long1+","+lat2+","+long2 });
        stream.on( 'tweet', function (tweet) {

            var text=tweet.text;

            venues[0]=text;


            getURL(venues,2 ,function (data)
            {

                callback(data);

            });



        });

    }


}


/**
 * This function will use the twitter API to search for the tweets from specific user that contains swarmapp as part of the URL and this indicate that the user
 * checkIn in this place
 * @param json {Object} this is the data we received from server that contain username that we search about && number of days from the user if number of days is 0 a streaming API is used to git the results when its available
 * @param callback {FUnction} callback  this is the call back function to send back the data to the server
 * @returns void
 */

function findUserCheckin(json,callback)
{

    var screenName=json.screenNames;
    var venues=[];
    var dayNo=json.dayNo?Number(json.dayNo):1;

    if(dayNo>0)
    {
        var datetime=new Date();
        datetime.setDate(datetime.getDate()-dayNo);
        var timeStr=getTimeStr(datetime);
        client.get('search/tweets', {q: "swarmapp from:"+screenName+" since:"+timeStr},
            function(err, data, response)
            {
                if (err) console.log("error");
                else
                {

                    for (var indx in data.statuses)
                    {
                        var tweet = data.statuses[indx];
                        var text=tweet.text;
                        venues[indx]=text;

                    }
                    getURL(venues,1 ,function (data)
                    {
                        callback(data);
                    });
                }
            });
    }
    else
    {
        console.log("Wait for the results its streaming mode");
        getUserID(screenName,function(userID)
        {

            var stream = client.stream('statuses/filter', {follow:userID});
            stream.on('tweet', function (tweet) {
                var text=tweet.text;
                venues[0]=text;

                getURL(venues,1 ,function (data)
                {
                    callback(data);
                });

            });
        });

    }

}
/**
 * this function will get hte twitter userID from the screenName
 * @param screen_name {String} twitter user screenName
 * @param callback {FUnction} callback  this is the call back function to send the userID
 */
function getUserID(screen_name,callback)
{
    client.get('search/tweets', {
            q: "from:"+screen_name,
            count: 1
        },
        function(err, data, response) {
            if (err) console.log("error");
            if(data.statuses.length>0) {

                callback(data.statuses[0].user.id);
            }


        });
}

/**
 * This function will use the twitter API to search for the tweets in specific area that contains swarmapp as part of the URL and this indicate that the user
 * checkIn in this place
 * @param json {Object} this is the data we received from server that contain the location input && number of days from the user if number of days is 0 a streaming API is used to git the results when its available
 * @param callback {Function} callback  this is the call back function to send back the data to the server
 * @returns void
 */

function findUserLocationCheckIn(json,callback)
{
    var locationName=json.LocName;
    var venues=[];
    var dayNo=json.dayNo?Number(json.dayNo):1;
    if(dayNo>0)
    {
        var datetime=new Date();
        datetime.setDate(datetime.getDate()-dayNo);
        var timeStr=getTimeStr(datetime);

        client.get('search/tweets', {q: locationName + " swarmapp " + " since:"+timeStr},
            function(err, data, response)
            {
                if (err) console.log("error");
                else
                {

                    for (var indx in data.statuses)
                    {
                        var tweet = data.statuses[indx];
                        var text=tweet.text;
                        venues[indx]=text;
                        // console.log(text);
                    }

                    getURL(venues,1 ,function (data)
                    {

                        callback(data);
                    });

                }
            });
    }
    else
    {
        console.log("Wait for the results its streaming mode");
        var stream = client.stream('statuses/filter', { track: locationName + " swarmapp " });
        stream.on('tweet', function (tweet) {
            var text=tweet.text;
            venues[0]=text;

            getURL(venues,1 ,function (data)
            {
                callback(data);
            });

        });

    }

}


/**
 * This function will extract the short_urls from the tweets and send them as an array to expandUrl
 * @param arr {Array} this is an array contain the tweets we get from the user account in the specific number of days
 * @param type {Int} if it 1 we get the venues the user check in at and if it is 2 we return the users how check in in a specific place
 * @param callback {Function} we will send the data back to findUserCheckin OR  findVenueUsers
 * @returns void
 */
function getURL(arr,type,callback)
{

    if(arr.length>0)

    {

        var re=/(^|\s)((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/gi;
        var shortURLs=[];
        for (i = 0; i < arr.length; i++)
        {
            var m=arr[i].match(re);
            if(m!=null)
            {
                shortURLs.push(m[0]);

            }
            else
            {
                break;
            }


        }
        expandUrl(shortURLs,type,function(data)
        {
            callback(data);
        });
    }
    else
    {
        callback("No results");
    }

}
var count;

/**
 * This function will expands the short form of url we revived to normal url and send it to getID to extract the checkIn ID from it
 * @param shortUrlarr {Array} arr this is an array contain the short url we received from getURL
 * @param type {Int} if it 1 we get the venues the user check in at and if it is 2 we return the users how check in in a specific place
 * @param callback {Function} we will send the data back to getUrl
 * @returns void
 */
function expandUrl(shortUrlarr,type,callback)
{
    var expandedURLs=[];

    count =shortUrlarr.length;

    for (i = 0; i < shortUrlarr.length; i++)
    {

        request({method: "HEAD", url: shortUrlarr[i], followAllRedirects: true},
            function (error, response)
            {

                if (error)
                {
                    count-=1;

                }

                else
                {


                    getID(response.request.href,type ,function (data)
                    {

                        if(data=='foursquare error in search')
                        {
                            count-=1;

                        }
                        else
                        {


                            expandedURLs.push({"data":data[0],"profilPic":data[1],"venueLocation":data[3],"venueName":data[2],venueLat:data[4],
                                venueLong:data[5],venuePic:data[6],venueCat:data[7],address:data[8],url:data[9],telephone:data[10],
                                userID:data[11],venueDescription:data[12],userFullName:data[13],userScreenName:data[14]});
                            count-=1;
                            if(count==0)
                            {

                                callback(expandedURLs);

                            }
                        }




                    });
                }

            });

    }

}

/**
 * This function will extract the checkIn ID from url and send it to  foursquare.getCheckIn to get the data about this CheckIN
 * @param str {String} this the url
 * @param type {Int} if it 1 we get the venues the user check in at and if it is 2 we return the users how check in in a specific place
 * @param callback {Function} callback we will send the data back to expandUrl
 * @returns void
 */

function getID(str,type,callback)
{


    var re=/https\:\/\/www\.swarmapp\.com(.+)/;
    var m=str.match(re);
    var xid=(m&&m.length>1)?m[1]:null;
    if(xid==null)
    {
        count-=1;
    }
    else
    {
        var paraArr=xid.split("/");
        var id=paraArr[paraArr.length-1].trim();

        if(id.length<12)
        {
            foursquare.getCheckIn(id,type,function (data)
            {

                callback(data);
            });
        }
        else
        {
            count-=1;
        }
    }


}

exports.searchKeyword=searchKeyword;
exports.reTweet=reTweet;
exports.findMostFreqKey=findMostFreqKey;
exports.findUserCheckin=findUserCheckin;
exports.findVenueUsers=findVenueUsers;

exports.findUserLocationCheckIn=findUserLocationCheckIn;
