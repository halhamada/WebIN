var mysql = require('mysql');

var pool = mysql.createPool({
	host     : 'stusql.dcs.shef.ac.uk',
	port     : '3306',
	user     : 'acp14hja',
	password : 'f2f7df2c',
	database : 'acp14hja'

});
/**
 * this function will add the user data to the database users table if there is a duplicate it will update the user info
 * @param userInfo {json} the user data
 * @param callback
 */
function updateUserInfo(userInfo,callback)
{
	var sql_insertData='INSERT INTO users'+
	'(twitterID,location,profilePic,uDescrip,uName)'+
	'VALUES(?,?,?,?,?) '+'ON DUPLICATE KEY UPDATE location=Values(location),profilePic=Values(profilePic),'
	+'uDescrip=VALUES(uDescrip)';

	var userinfoValues=[userInfo.id,userInfo.location,userInfo.profilePic,
	                    userInfo.description, userInfo.screen_name,
	                    ];
	pool.getConnection(function(err, connection) {
		if(err) { console.log(err); callback(true); return; }
		connection.query(sql_insertData, userinfoValues, function(err, results) {
			connection.release();
			if(err) { console.log(err); callback(true); return; }
			callback(false, results);
		});
	});
}

/**
 * this function will add the venue details to the database table venue and update the data in case of duplicate
 * @param venueInfo {json} this is the venue information
 * @param callback
 */
function addVenueInfo(venueInfo,callback)
{
    var sql_insertData='INSERT INTO venue'+
        '(vID,vName,vAddress,url)'+
        'VALUES(?,?,?,?)'+'ON DUPLICATE KEY UPDATE vName= Values(vName),vAddress= Values(vAddress),url= Values(url)';

    var venueinfoValues=[venueInfo.vid,venueInfo.vName,venueInfo.vAddress,  venueInfo.vDescription];
    pool.getConnection(function(err, connection) {
        if(err) { console.log(err); callback(true); return; }
        connection.query(sql_insertData, venueinfoValues, function(err, results) {
            connection.release();
            if(err) { console.log(err); callback(true); return; }
            callback(false, results);
        });
    });
}

/**
 * add a record in venueUser table in the database
 * @param vID   {int} the venue id
 * @param tID   {string} twitter screenName
 * @param callback
 */
function addVenueUserInfo(vID,tID,callback)
{
    var sql_insertData='INSERT INTO venueUser'+
        '(tID,vID)'+
        'VALUES(?,?)'+'ON DUPLICATE KEY UPDATE tID=Values(tID), vID=Values(vID)';

    var venueUserValues=[tID,vID];
    pool.getConnection(function(err, connection) {
        if(err) { console.log(err); callback(true); return; }
        connection.query(sql_insertData, venueUserValues, function(err, results) {
            connection.release();
            if(err) { console.log(err); callback(true); return; }
            callback(false, results);
        });
    });
}

/**
 * this function will add the user tweets in UserTweets table in the database
 * @param sName {string} the user ScreenName
 * @param tweetText {string} the tweet
 * @param callback
 */
function addUserTweet(sName,tweetText,callback)
{

    var sql_insertData='INSERT INTO UserTweets'+
        '(tScreenName ,TweetText)'+
        'VALUES(?,?)'+'ON DUPLICATE KEY UPDATE tScreenName=Values(tScreenName), TweetText=Values(TweetText)';

    var userTweetValues=[sName,tweetText];
    pool.getConnection(function(err, connection) {
        if(err) { console.log(err); //callback(true); return;
        }
        connection.query(sql_insertData, userTweetValues, function(err, results) {
            connection.release();
            if(err) { console.log(err); }
            callback(false, results);
        });
    });
}

/**
 * This function will get the tweets from the database
 * @param screenName {String} the user screen name
 * @param callback
 */
function getUserTweetsDB(screenName, callback) {
    var sql = "SELECT TweetText FROM UserTweets WHERE tScreenName =?";
    // get a connection from the pool
    pool.getConnection(function(err, connection) {
        if(err) { console.log(err);// callback(true); return;
        }
        // make the query
        connection.query(sql, [screenName], function(err, results) {
            connection.release();
            if(err) { console.log(err);
                  callback(true); return;
            }

             callback(false, results);
        });
    });
}

/**
 * this function will add retweet information to the retwit table
 * @param retwitInfo {json} the retweet information
 * @param callback
 */
function updateRetwitInfo(retwitInfo,callback)
{
	var sql_insertData='INSERT INTO retwit'+
	'(uName,retwitName)'+
	'VALUES(?,?) ';

	pool.getConnection(function(err, connection) {
		if(err) { console.log(err); callback(true); return; }
		connection.query(sql_insertData, retwitInfo, function(err, results) {
			connection.release();
			if(err) { console.log(err); callback(true); return; }
			callback(false, results);
		});
	});
}

/**
 * this function will get the users who retweet for the user from database
 * @param name {string} twitter screen name
 * @param callback
 */
function getWhoRetwit(name, callback) {
	var sql = "SELECT uName FROM retwit WHERE retwitName=? LIMIT 10";
	// get a connection from the pool
	pool.getConnection(function(err, connection) {
		if(err) { console.log(err); callback(true); return; }
		// make the query
		connection.query(sql, [name], function(err, results) {
			connection.release();
			if(err) { console.log(err); callback(true); return; }
			callback(false, results);
		});
	});
};

/**
 * this function will get the list of users on user do a retweet for them
 * @param name {string} twitter screen name
 * @param callback
 */
function getRetwitWho(name, callback) {
	var sql = "SELECT retwitName FROM retwit WHERE uName=? LIMIT 10";
	// get a connection from the pool
	pool.getConnection(function(err, connection) {
		if(err) { console.log(err); callback(true); return; }
		// make the query
		connection.query(sql, [name], function(err, results) {
			connection.release();
			if(err) { console.log(err); callback(true); return; }
			callback(false, results);
		});
	});
};


/**
 * this function will get the user information from users table in the database using the screenName
 * @param name {string} twitter screen name
 * @param callback
 */
function getUsersInfoFromName(name, callback) {
	var sql = "SELECT * FROM users WHERE uName=?";
	// get a connection from the pool
	pool.getConnection(function(err, connection) {
		if(err) { console.log(err); callback(true); return; }
		// make the query
		connection.query(sql, [name], function(err, results) {
			connection.release();
			if(err) { console.log(err); callback(true); return; }
			callback(false, results);
		});
	});
}

/**
 * this function will get a lis of users who visit a venue
 * @param venueName {String} venue name
 * @param callback
 */
function getUserWhoVisitVenueInfo(venueName, callback) {
    var sql = "SELECT users.uName FROM acp14hja.users , acp14hja.venueUser ,acp14hja.venue Where venue.vID=venueUser.vID and venue.vName='"+venueName+"' and users.uName=venueUser.tID";
    // get a connection from the pool
    pool.getConnection(function(err, connection) {
        if(err) { console.log(err); callback(true); return; }
        // make the query
        connection.query(sql, [venueName], function(err, results) {
            connection.release();
            if(err) { console.log(err); callback(true); return; }


            callback(false, results);

        });
    });
}




exports.updateUserInfo=updateUserInfo;
exports.getUsersInfoFromName=getUsersInfoFromName;
exports.updateRetwitInfo=updateRetwitInfo;
exports.getRetwitWho=getRetwitWho;
exports.getWhoRetwit=getWhoRetwit;
exports.addVenueInfo=addVenueInfo;
exports.getUserWhoVisitVenueInfo=getUserWhoVisitVenueInfo;
exports.addVenueUserInfo=addVenueUserInfo;
exports.getUserTweetsDB=getUserTweetsDB;
exports.addUserTweet=addUserTweet;