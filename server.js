var express=require('express');
var foursquare=require('./foursquare');
var twitter=require('./twitter');
var assist=require('./assist');
var db=require('./db');
var app=express();
var pano=require('./panoramia');
var gPlaces=require('./googlePlaces');
var dbPediaPlaces=require('./dbPedia');
app.use(express.static('public'));

// redirect any get request to the main page
app.get('/',function(req,res) {
	        res.sendFile(__dirname+'/queryInterface.html');
		}
);

app.post('/results.html',function(req,res)
	{
        var body="";
        req.on('data', function (data) {
        body += data;
        //flood attack or faulty client
        if (body.length > 1e6)
        {
            res.writeHead(413,
            {'Content-Type': 'text/plain'}).end();
            req.connection.destroy();
        }});
	var mainData={};
	req.on('end', function ()
	{
		var json=JSON.parse(body);
		var count=assist.getSearchCount(json);
        //if the request have a keyword
		if(json.twitKey)
		{
			twitter.searchKeyword(json.twitKey,json.twitLoc,function(err,data)
			{
                //if the callback have an error
                if(err)
                {
                      mainData.SKErr=true;
                      count-=1;
                      assist.toBrowser(count,mainData,res);
                 }
                // send the data back to the web browsers
                else
                {
                     mainData.discussion=data;
                     count-=1;
                     assist.toBrowser(count,mainData,res);
                }
			});
		}
        // if the request have a screenNames
		if(json.screenNames)
		{

			var screennames=json.screenNames;
            var nameArr=screennames.split(',');
            //if it is only one screeName.. get the places this user has checkIn
            if(nameArr.length==1)
			{
                twitter.findUserCheckin(json,function(data)
				{
                    mainData.venueCheckInByUsers=data;
					count-=1;
					assist.toBrowser(count,mainData,res);

				});
			}
            // if it is multiple screenNames get the discussion data
			else
			{

				twitter.findMostFreqKey(json,function(data)
				{
					mainData.freq=data;
					count-=1;
					assist.toBrowser(count,mainData,res);

				});
			}

		}
        // if the request have a location name it the details about the user who checkIn in this location
		if(json.LocName)
		{
			twitter.findUserLocationCheckIn(json,function(data)
			{
                mainData.UserLocationCheckIn=data;
				count-=1;
				assist.toBrowser(count,mainData,res);

			});
		}
        // if the request have a location lat and long  get the details about the user who checkIn in this location
        if(json.twitLoc)
        {
            count+=2;
            // get the places around this venue from google API
            gPlaces.getPlaceName(json,function(data)
            {
                mainData.googlePlacesNames=data;
                count-=1;
                assist.toBrowser(count,mainData,res);
            });
            // get the details about the user who checkIn in this location
            twitter.findVenueUsers(json,function(data)
            {
                mainData.venueUsers=data;
                count-=1;
                assist.toBrowser(count,mainData,res);

            });
            // get the pictures around this venue from panoramia API
            pano.getPanoramio(json,function(data)
            {
                mainData.panoramia=data;
                count-=1;
                assist.toBrowser(count,mainData,res);
            });
        }

    });
	}
);

// get the reTweet details
app.get('/retwit',function(req,res)
{
    var id=req.query.id;
    twitter.reTweet(id,function(data)
	{
        res.end(data);
    });

});

// get the venues Around this venue from foursquare API
app.get('/venuesurroundings',function(req,res)
{
    foursquare.getSurroundings(req.query.vLat,req.query.vLong,function(data)
    {
        res.json(data);
        res.end();
    });

});

// get the venues Around this venue from bdpedia
app.get('/venuesurroundingsdbPedia',function(req,res)
{

    var locationID=req.query.id;
    dbPediaPlaces.venueUriRetrieve(locationID,function(data)
    {
        res.json(data);
        res.end();
    });

});

// get the latest 100 tweets for the user from database an online
app.get('/userTweets',function(req,res)
{
    foursquare.getUserData(req.query.id,function(data)
    {
        res.end(data);
    });

});

// handling the search queries
app.post('/searchDB',function(req,res)
{

    var body="";
    req.on('data', function (data) {
        body += data;
        //flood attack or faulty client
        if (body.length > 1e6) {
            res.writeHead(413,
                    {'Content-Type': 'text/plain'}).end();
            req.connection.destroy();
        }});
    var mainData={};

    req.on('end', function ()
    {
        var json=JSON.parse(body);
        var count=assist.getSearchCount(json);
        // if the query is about user .. get the user details
        if (json.userName)
        {
            db.getUsersInfoFromName(json.userName,function(err,data)
            {
                count-=1;
                if(err)
                {
                    console.log("database error!");
                    mainData.dberr="error";
                    assist.toBrowser(count,mainData,res);
                }
                else
                {
                    mainData.userInfo=data;
                    if(data[0])
                    {
                        var uName=data[0].uName;
                        db.getRetwitWho(uName,function(err,data)
                        {
                            var retwitWhoLists=[];
                            data.forEach(function(unitData)
                             {
                                retwitWhoLists.push(unitData["retwitName"]);
                             });
                            mainData.retwitWhoLists=retwitWhoLists;
                            db.getWhoRetwit(uName,function(err,data)
                             {
                                var retwitByWhoLists=[];
                                data.forEach(function(unitData)
                                {
                                    retwitByWhoLists.push(unitData["uName"]);
                                });
                                mainData.retwitByWhoLists=retwitByWhoLists;
                                assist.toBrowser(count,mainData,res);
                              });

                         });
                    }
                    else
                    {
                        assist.toBrowser(count,mainData,res);

                    }
                }

            });
        }
        // if the query it asking about a venue ... get the people who visit this venue
        else if(json.venueNames)
        {

            db.getUserWhoVisitVenueInfo(json.venueNames,function(err,data)
            {

                count-=1;
                if(err)
                {
                    console.log("database error!");
                    mainData.dberr="error";
                    assist.toBrowser(count,mainData,res);
                }
                else
                {
                    mainData.venueUsersList = data;
                    assist.toBrowser(count,mainData,res);
                }

            });
        }
    });
});

//redirect an direct access to the main page
app.get('/*',function(req,res)
{
	res.redirect('/');
});

var server=app.listen(3000,function(){
	console.log("We have started our server on port 3000");
});
