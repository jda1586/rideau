'use strict';

//Db
const low = require('lowdb');
const fileAsync = require('lowdb/lib/file-async');
var db = low('db.json', {storage: fileAsync });
db.defaults({ users: [], purchases: [], subscriptions: [], lookbook: [], eboutique: [], log: [] }).value(); //Create tables
//Express
var express = require('express');
var router = express.Router();
//Utils
var _ = require('lodash');
var slug = require('slug');

//Landing page
router.get('/', function(req, res, next) {
	return res.render('landing');
});
//Eboutique page
router.get('/eboutique/:name?', function(req, res, next) {
	var products = db.get('eboutique').value();
    var name = req.params.name;

	console.dir(products);
    
    if (!_.isUndefined(name)) {
        var product = _.find(products, _.matchesProperty('name', name));
        return res.render('detail', { product: product });
    }
    
	//TODO: Remove wholeprice if the user is not registered
	return res.render('eboutique', { products: products });
});

/*//Product detail view
router.get('/detail/:name', function (req, res) {
	'use strict';

	var objs = [];
	var name = req.params.name;

	logToDb("Detail view " + name);

	if (!name) return res.redirect('/eboutique');

	connection.query("SELECT * FROM eboutique WHERE name=? AND enabled=1", [name], function(err, rows, fields) {
		if (err) {
			throw err;
			res.send('Error');
		}

		//TO-DO: Optimize please, no need to use an array
		for (var i = 0; i < rows.length; i++) {
			var images = JSON.parse(rows[i].images);
			var itemPrice = getNamepriceField(req, rows[i].price, rows[i].wholeprice);
			objs.push({ id_item: rows[i].id_item, name: rows[i].name, price: itemPrice, description: rows[i].description, information: rows[i].information, fit: rows[i].fit, male_images: images.male, female_images: images.female });
		}

		//connection.end(); //Causes errors when uncommented
		console.log(req.session.isAuthenticated);
		return res.render('detail', { data: objs[0], isAuthenticated: req.session.isAuthenticated });
	});
});*/


/*//Product detail view
//TODO: Add a parameter to the url to show only an specified product from the DB
router.get('/detail/:name', function (req, res) {
	'use strict';

	var objs = [];
	var name = req.params.name;

	logToDb("Detail view " + name);

	if (!name) return res.redirect('/eboutique');

	connection.query("SELECT * FROM eboutique WHERE name=? AND enabled=1", [name], function(err, rows, fields) {
		if (err) {
			throw err;
			res.send('Error');
		}

		//TO-DO: Optimize please, no need to use an array
		for (var i = 0; i < rows.length; i++) {
			var images = JSON.parse(rows[i].images);
			var itemPrice = getNamepriceField(req, rows[i].price, rows[i].wholeprice);
			objs.push({ id_item: rows[i].id_item, name: rows[i].name, price: itemPrice, description: rows[i].description, information: rows[i].information, fit: rows[i].fit, male_images: images.male, female_images: images.female });
		}

		//connection.end(); //Causes errors when uncommented
		console.log(req.session.isAuthenticated);
		return res.render('detail', { data: objs[0], isAuthenticated: req.session.isAuthenticated });
	});
});*/

//This function must appear last on the routes
router.get('*', function(req, res, next) {
	return res.redirect('/');
});

module.exports = router;
