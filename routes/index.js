'use strict';

const low = require('lowdb'),
	fileAsync = require('lowdb/lib/file-async');
	
var db = low('db.json', {storage: fileAsync }),
	fs = require('fs'),
	path = require('path'),
	express = require('express'),
	router = express.Router(),
	_ = require('lodash'),
	slug = require('slugg'),
	stripe = require("stripe")("sk_live_5VbZvybtRRjKCdGyonD2beyv"); //See your keys here: https://dashboard.stripe.com/account/apikeys

db.defaults({ users: [], purchases: [], subscriptions: [], log: [] }).value(); //Default to these tables if they don't exist

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
	var name = req.params.name,
		data = dirToObj("public/rideau-data/eboutique");
	
	if (!_.isUndefined(name)) {
		var item = data[name] || data[name.toLowerCase()] || data[name.toUpperCase()];
		
		console.log(item);
		
		if (!_.isUndefined(item)) {
			data = item;
			
			if (!_.isUndefined(data)) {
				data.images.male = _.omit(data.images.male, 'featured'); //Omit the featured image (only shown en eboutique page)
				data.images.female = _.omit(data.images.female, 'featured'); //Omit the featured image (only shown en eboutique page)
				data.key = name; //Append key value (the folder name as is)
				data.sku = name.toLowerCase(); //Append SKU, always in lowercase
			
				console.log(data);
			
				return res.render('detail', { data: data });
			}
		} else {
			return res.redirect('/eboutique');
		}
	}
	
	data = _.pickBy(_.mapValues(data, function(el) {
		if (el.enabled == '1') {
			return el;
		}
	}), _.negate(_.isUndefined));

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

function log(message, object, tag, severity) {
	if (_.isUndefined(message)) return;
	if (_.isUndefined(object)) object = {};
	if (_.isUndefined(tag)) tag = "Unknown";
	if (_.isUndefined(severity)) severity = "LOW";
	
	try {
		db.get('log').push({ 
			message: message,
			object: object,
			tag: tag,
			severity: severity,
			date: new Date() }).value();
	} catch (e) {
		console.log("ERROR: Unable to write to DB. " + e.message);
	}
}

//Stripe payment
router.post('/stripe', function (req, res, next) {
	//Get the credit card details submitted by the form
	var token = req.body.stripeToken, //Get the token generated by Checkout
		amount = req.body.amount, //Get the amount
		description = req.body.description, //Get the purchase description
		customerData = req.body.customerData; //Get the customer data (the information written in the purchase form)
	
	console.log(customerData);
	
	log("Purchase route call", { token: token, amount: amount, description: description, customerData: customerData }, "Purchases", "LOW");
	
	if (_.isUndefined(token) || _.isUndefined(amount) || _.isUndefined(description) || _.isUndefined(customerData)) {
		log("Purchase route call with undefined values", { token: token, amount: amount, description: description, customerData: customerData }, "Purchases", "MEDIUM");
		return res.json({ success: false, err: "Incomplete information" });
	}
	
	//Create a charge: this will charge the user's card
	var charge = stripe.charges.create({
		amount: amount, //Amount in cents
		currency: "usd",
		source: token,
		description: description
	}, function(err, charge) {
		if (err && err.type === 'StripeCardError') {
			//The card has been declined
			log("Card declined!", { token: token, amount: amount, description: description, customerData: customerData, err: err }, "Purchases", "HIGH");
			return res.json({ success: false, err: err });
		}
		
		//Save data to the purchases log
		try {
			db.get('purchases').push({ 
				token: token, 
				amount: amount, 
				description: description, 
				customerData: customerData, 
				charge: charge, 
				date: new Date() 
			}).value();
		} catch (e) {
			console.log("ERROR: Unable to write to DB. " + e.message);
		}
		
		log("Card accepted! Payment received", { token: token, amount: amount, description: description, customerData: customerData, charge: charge }, "Purchases", "MEDIUM"); //TODO: Add more information to this log
		return res.json({ success: true, charge: charge });
	});
});
//Subscriptions
router.get('/subscriptions/add', function (req, res, next) {
	try {
		db.get('subscriptions')
			.push({ email: req.query.email, date: new Date()})
			.value();
	} catch (e) {
		console.log(e.message);
	}
	
	return res.json({ ok: true });
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
