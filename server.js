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

var server=app.listen(3000,function(){
	console.log("We have started our server on port 3000");
});
