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

//DB functions
function getEboutique() {
    return db.get('eboutique').cloneDeep().value();
}
function getCollections() {
    return db.get('collections').cloneDeep().value();
}

//Landing page
router.get('/', function(req, res, next) {
    return res.render('landing');
});
//Eboutique and product detail pages (now they are on the same route)
router.get('/eboutique/:name?', function(req, res, next) {
    var products = _.filter(getEboutique(), { enabled: 1 });
    var name = req.params.name;
    
    if (!_.isUndefined(name)) {
        var product = _.find(products, _.matchesProperty('name', name));
        
        if (!_.isUndefined(product)) {
            return res.render('detail', { product: product });
        }
    }
    
    //TODO: Remove wholeprice if the user is not registered
    return res.render('eboutique', { products: products });
});
//Collections view using new sly carrousel
router.get('/collections/:name?', function(req, res, next) {
    var looks = getCollections();
    var name = req.params.name;
    
    console.log(name);
    
    if (!_.isUndefined(name)) {
        var album = _.find(looks, { name : name });
        if (!_.isUndefined(album)) {
            console.log(album);
            return res.render('collections', { album: album });
        }
    }
    
    return res.redirect('/');
    
    /*var objs = [];
	if (!album) return res.redirect('/');

	connection.query("SELECT * FROM lookbook WHERE album=?", [album], function(err, rows, fields) {
		if (err) {
			 throw err;
			 return;
		}

		var images = JSON.parse(rows[0].images);
		for (var i = 0; i < images.length; i++) {
			objs.push(images[i]);
		}

		//connection.end(); //Causes errors when uncommented
		return res.render('collections', { objs: objs, album: album, isMobile: isMobile(req) });
	});*/
    
    
});

/*
//Lookbook using the new sly style
router.get('/lookbook/:album?', function (req, res, next) {
	'use strict';

	var album = req.params.album;
	var objs = [];

	logToDb("Lookbook view " + album);

	if (!album) return res.redirect('/');

	connection.query("SELECT * FROM lookbook WHERE album=?", [album], function(err, rows, fields) {
		if (err) {
			 throw err;
			 return;
		}

		var images = JSON.parse(rows[0].images);
		for (var i = 0; i < images.length; i++) {
			objs.push(images[i]);
		}

		//connection.end(); //Causes errors when uncommented
		return res.render('lookbook', { objs: objs, album: album, isMobile: isMobile(req) });
	});
});    
*/

//This function must appear last on the routes
router.get('*', function(req, res, next) {
    return res.redirect('/');
});

module.exports = router;
