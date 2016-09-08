'use strict';

const low = require('lowdb'),
	fileAsync = require('lowdb/lib/file-async');
	
var db = low('db.json', {storage: fileAsync }),
	fs = require('fs'),
	path = require('path'),
	express = require('express'),
	router = express.Router(),
	_ = require('lodash'),
	slug = require('slugg');

db.defaults({ users: [], purchases: [], subscriptions: [], lookbook: [], eboutique: [], log: [] }).value(); //Create tables

//DB functions
function getEboutique() {
	return db.get('eboutique').cloneDeep().value();
}
function getCollections() {
	return db.get('collections').cloneDeep().value();
}

//Folder structure functions
function dirTree(filename, getPath) {
	var stats = fs.lstatSync(filename),	
		info = { name: path.basename(filename) };
		if (getPath) info.path = filename;
	
	if (stats.isDirectory()) {
		info.type = "folder";
		info.children = fs.readdirSync(filename).map(function(child) { //TODO: Change this to read async
			return dirTree(filename + '/' + child, getPath);
		});
	} else {
		//Assuming it's a file. In real life it could be a symlink or something else!
		if (path.extname(filename) !== '.txt') {
			info.type = "image";
			info.data = filename;
		} else {
			info.type = "file";
			info.data = _.trim(fs.readFileSync(filename, 'utf8'));
		}
	}
	
	return info;
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
});

//About
router.get('/about', function (req, res, next) {
	return res.render('about');
});
//Press
router.get('/press', function (req, res, next) {
	
	var data = dirTree("public/rideau-data/press");
	data = data.children;
	
	return res.render('press', data);
});
//Sizing
router.get('/sizing', function (req, res, next) {
	return res.render('sizing');
});
//Stockist
router.get('/stockist', function (req, res, next) {
	return res.render('stockist');
});
//Contact
router.get('/contact', function (req, res, next) {
	return res.render('contact');
});

//This function must appear last on the routes
router.get('*', function(req, res, next) {
	return res.redirect('/');
});

module.exports = router;
