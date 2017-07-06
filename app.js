var express = require('express');
var path = require('path');
var HolidayAPI = require('node-holidayapi');

var db = require('mongoskin').db("localhost/testdb", { w: 0});
    db.bind('event');


var app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.bodyParser());

var hapi = new HolidayAPI('ac01b53b-e6f7-4e9d-9d0e-532b2f748d9a').v1;

var parameters = {
    // Required
    country: 'US',
    year:    2017,
    // Optional
    // month:    7,
    // day:      4,
    // previous: true,
    // upcoming: true,
    // public:   true,
    // pretty:   true,
};

hapi.holidays(parameters, function (err, data) {
    for(var obj in data.holidays)
    {
        console.log(data.holidays[obj])
        var day_holidays = data.holidays[obj];
        day_holidays.forEach(function(holiday){
            db.event.insert({
                text:holiday.name,
                start_date: holiday.date,
                end_date:	holiday.observed
            });
        })
    }
});
app.get('/init', function(req, res){
	res.send("Test events were added to the database")
});


app.get('/data', function(req, res){
	db.event.find().toArray(function(err, data){
		//set id property for all records
		for (var i = 0; i < data.length; i++)
			data[i].id = data[i]._id;
		
		//output response
		res.send(data);
	});
});


app.post('/data', function(req, res){
	var data = req.body;
	var mode = data["!nativeeditor_status"];
	var sid = data.id;
	var tid = sid;

	delete data.id;
	delete data.gr_id;
	delete data["!nativeeditor_status"];


	function update_response(err, result){
		if (err)
			mode = "error";
		else if (mode == "inserted")
			tid = data._id;

		res.setHeader("Content-Type","text/xml");
		res.send("<data><action type='"+mode+"' sid='"+sid+"' tid='"+tid+"'/></data>");
	}

	if (mode == "updated")
		db.event.updateById( sid, data, update_response);
	else if (mode == "inserted")
		db.event.insert(data, update_response);
	else if (mode == "deleted")
		db.event.removeById( sid, update_response);
	else
		res.send("Not supported operation");
});

app.listen(3000);