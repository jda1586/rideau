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
function dirToTree(filename, getPath) {
	var stats = fs.lstatSync(filename),
		info = { name: path.basename(filename) };
		if (getPath) info.path = filename;
	
	if (stats.isDirectory()) {
		info.type = "folder";
		info.children = fs.readdirSync(filename).map(function(child) { //TODO: Change this to read async
			return dirToTree(filename + '/' + child, getPath);
		});
	} else {
		//Assuming it's a file. In real life it could be a symlink or something else!
		if (path.extname(filename) !== '.txt') {
			info.type = "image";
			info.data = filename.split("public").pop(); //Remove "public" from the path
		} else {
			info.type = "file";
			info.data = _.trim(fs.readFileSync(filename, 'utf8'));
		}
	}
	
	return info;
}

function treeToJSON(tree, clearPublicPath) {
	var info = {};
	
	_.each(tree, function(el) {
		if (el.type === "folder") {
			info[el.name] = treeToJSON(el.children);
		} else {
			var keyName = (el.name.split('.'))[0]; //Remove extension
			info[keyName] = el.data;
			//
		}
	});
	
	return info;
}

function dirToArray(walkPath) {
	var stats = fs.lstatSync(walkPath),
		data = { walkKey: walkPath.substr(walkPath.lastIndexOf('/') + 1), walkPath: walkPath.split("public").pop(), walkInside: [] };
	
	fs.readdirSync(walkPath).forEach(function(child) {
		var stats = fs.lstatSync(walkPath + "/" + child);
		
		if (stats.isFile()) {
		
			if (path.extname(child) !== '.txt') {
				var keyName = (child.split('.'))[0];
				data[keyName] = walkPath.split("public").pop() + "/" + child;
			} else {
				var keyName = (child.split('.'))[0];
				data[keyName] = _.trim(fs.readFileSync(walkPath + "/" + child, 'utf8'));
			}
		
		
		} else {
			data["walkInside"].push(dirToArray(walkPath + "/" + child));
		}
	
	});

	return data;
}

function dirToObj(walkPath) {
	var stats = fs.lstatSync(walkPath),
		data = {};
	
	fs.readdirSync(walkPath).forEach(function(child) {
		var stats = fs.lstatSync(walkPath + "/" + child);
		if (stats.isFile()) {
			if (path.extname(child) !== '.txt') {
				var keyName = (child.split('.'))[0];
				data[keyName] = walkPath.split("public").pop() + "/" + child;
			} else {
				var keyName = (child.split('.'))[0];
				data[keyName] = _.trim(fs.readFileSync(walkPath + "/" + child, 'utf8'));
			}
		} else {
			data[child] = dirToObj(walkPath + "/" + child);
		}
	});

	return data;
}

//Middleware
router.get('*', function(req, res, next) {
	console.log("Middleware load");
	
	//Load collection menus (these are obtained from the public folder)
	var extraData = dirToObj("public/rideau-data/collections");
	res.locals.extraData = extraData; //res.locals is automatically merged when rendering a view
	
	return next();
});

//Landing page
router.get('/', function(req, res, next) {
	return res.render('landing');
});
//Eboutique and product detail pages (now they are on the same route)
router.get('/eboutique/:name?', function(req, res, next) {
	var name = req.params.name.toLowerCase();
	var data = dirToObj("public/rideau-data/eboutique");
	
	console.log(name.toUpperCase());
	console.log(name);
	console.log(name);
	console.log(name);
	
	data = _.pickBy(_.mapValues(data, function(el) {
		if (el.enabled == '1') {
			return el;
		}
		
	}), _.negate(_.isUndefined));
	
	if (!_.isUndefined(name)) {
		data = data[name];
		
		if (!_.isUndefined(data)) {
			data.images.male = _.omit(data.images.male, 'featured'); //Omit the featured image (only shown en eboutique page)
			data.images.female = _.omit(data.images.female, 'featured'); //Omit the featured image (only shown en eboutique page)
			data.sku = name; //Append SKU
		
			console.log(data);
		
			return res.render('detail', { data: data });
		}
	}

	return res.render('eboutique', { data: data });
});
//Collections view using new sly carrousel
router.get('/collections/:name?', function(req, res, next) {
	var name = req.params.name;
	
	if (!_.isUndefined(name)) {
		var data = dirToObj("public/rideau-data/collections");
		data = _.pickBy(_.mapValues(data, function(el, key) {
			if (key.indexOf(name) != -1) return el;
		}), _.negate(_.isUndefined));
		data = data[_.head(_.keys(data))];
		
		return res.render('collections', { data: data });
		
	}
	
	return res.redirect('/');
});
//About
router.get('/about', function (req, res, next) {
	return res.render('about');
});
//Press
router.get('/press', function (req, res, next) {
	var data = dirToObj("public/rideau-data/press");
	return res.render('press', { data: data });
});
//Sizing
router.get('/sizing', function (req, res, next) {
	return res.render('sizing');
});
//Stockists
router.get('/stockists', function (req, res, next) {
	return res.render('stockists');
});
//Contact
router.get('/contact', function (req, res, next) {
	return res.render('contact');
});
//Admin
router.get('/rideau-admin', function (req, res, next) {
	return res.render('rideau-admin');
});
//This function must appear last on the routes
router.get('*', function(req, res, next) {
	return res.redirect('/');
});

module.exports = router;
