'use strict';

const low = require('lowdb'),
	fileAsync = require('lowdb/lib/file-async');

var db = low('db.json', {storage: fileAsync}),
	fs = require('fs'),
	path = require('path'),
	express = require('express'),
	numeral = require('numeral'),
	router = express.Router(),
	_ = require('lodash'),
	slug = require('slugg'),
	md5 = require('md5'),
	stripe = require("stripe")("sk_live_5VbZvybtRRjKCdGyonD2beyv"); //See your keys here: https://dashboard.stripe.com/account/apikeys

db.defaults({users: [], purchases: [], subscriptions: [], log: []}).value(); //Default to these tables if they don't exist

function dirToObj(walkPath) {
	var stats = fs.lstatSync(walkPath),
		data = {};

	fs.readdirSync(walkPath).forEach(function (child) {
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
router.get('*', function (req, res, next) {
	//console.log("Middleware load, auth role " + req.session.role); //Uncomment to debug middleware session roles

	//Load collection menus (these are obtained from the public folder)
	res.locals.collections = dirToObj("public/rideau-data/collections"); //res.locals is automatically merged when rendering a view
	res.locals.auth = {username: req.session.username, role: req.session.role};

	return next();
});

//Landing page
router.get('/', function (req, res, next) {
	return res.render('landing');
});
//Eboutique and product detail pages (now they are on the same route)
router.get('/eboutique/:name?', function (req, res, next) {
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
				if (req.session.role === "wholesaler") {
					data.price = data.price.whole;
				} else {
					data.price = data.price.normal;
				}
				
				console.log("begin");
				console.log(data.look);

				data.look = _.map(data.look.split('|'), function(el) {
					var values = el.split('-');

					console.log("TEST");
					console.log(el);
					
					if (values.length == 2) {
						return {href: values[0], text: values[1]}
					} else {
						var text = values[0];
						var href = "#";

						console.log(text);
						console.log(text);
						console.log(text);

						if (text.indexOf("Martine") > 0) {
							console.log("DO MA");
							href = "http://www.martineali.com" //TODO: Improve this!!!
						} else if (text.indexOf("Moscot") > 0) {
							href = "http://www.moscot.com" //TODO: Improve this!!!
						} else if (text.indexOf("Laurent") > 0) {
							href = "http://www.ysl.com/us" //TODO: Improve this!!!
						} else if (text.indexOf("Visvim") > 0) {
							console.log("DO");
							href = "http://www.visvim.tv" //TODO: Improve this!!!
						}

						return {href: href, text: text};
					}
				})

				return res.render('detail', {data: data});
			}
		} else {
			return res.redirect('/eboutique');
		}
	}

	data = _.pickBy(_.mapValues(data, function (el) {
		if (el.enabled == '1') {
			var tempEl = el;
			
			if (req.session.role === "wholesaler") {
				tempEl.price = el.price.whole;
			} else {
				tempEl.price = el.price.normal;
			}
		
		
			return tempEl;
		}
	}), _.negate(_.isUndefined));

	return res.render('eboutique', {data: data});
});
//Collections view using new sly carrousel
router.get('/collections/:name?', function (req, res, next) {
	var name = req.params.name;

	if (!_.isUndefined(name)) {
		var data = dirToObj("public/rideau-data/collections");

		data = _.pickBy(_.mapValues(data, function (el, key) {
			if (key.indexOf(name) != -1) return el;
		}), _.negate(_.isUndefined));

		data = _.omit(data[_.keys(data)], 'class', 'name');
		
		console.log(data);

		_.each(data, function(value, key) {
			//value.model = value.model.split(','); //Models are no longer sent as array
			value.number = +key;
		});

		return res.render('collections', {data: data});

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
	return res.render('press', {data: data});
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
			date: new Date()
		}).value();
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
		storedCart = req.body.storedCart, //Get the customer data (the information written in the purchase form)
		customerData = req.body.customerData; //Get the customer data (the information written in the purchase form)

	console.log(customerData);

	//var purchaseData = { token: token, amount: amount, description: description, storedCart: storedCart, customerData: customerData }; //TODO: Change all data with this structure to this variable with _.merge

	log("Purchase route call", {
		token: token,
		amount: amount,
		description: description,
		storedCart: storedCart,
		customerData: customerData
	}, "Purchases", "LOW");

	if (_.isUndefined(token) || _.isUndefined(amount) || _.isUndefined(description) || _.isUndefined(storedCart) || _.isUndefined(customerData)) {
		log("Purchase route call with undefined values", {
			token: token,
			amount: amount,
			description: description,
			storedCart: storedCart,
			customerData: customerData
		}, "Purchases", "MEDIUM");
		return res.json({success: false, err: "Incomplete information"});
	}

	//Create a charge: this will charge the user's card
	var charge = stripe.charges.create({
		amount: amount, //Amount in cents
		currency: "usd",
		source: token,
		description: description
	}, function (err, charge) {
		if (err && err.type === 'StripeCardError') {
			//The card has been declined
			log("Card declined!", {
				token: token,
				amount: amount,
				description: description,
				storedCart: storedCart,
				customerData: customerData,
				err: err
			}, "Purchases", "HIGH");
			return res.json({success: false, err: err});
		}

		//Save data to the purchases log
		try {
			db.get('purchases').push({
				token: token,
				amount: amount,
				description: description,
				storedCart: storedCart,
				customerData: customerData,
				charge: charge,
				date: new Date()
			}).value();
		} catch (e) {
			console.log("ERROR: Unable to write to DB. " + e.message);
		}

		log("Card accepted! Payment received", {
			token: token,
			amount: amount,
			description: description,
			storedCart: storedCart,
			customerData: customerData,
			charge: charge
		}, "Purchases", "MEDIUM"); //TODO: Add more information to this log
		return res.json({success: true, charge: charge});
	});
});
//Subscriptions
router.get('/subscriptions/add', function (req, res, next) {
	try {
		db.get('subscriptions')
			.push({email: req.query.email, date: new Date().getTime()})
			.value();
	} catch (e) {
		console.log(e.message);
	}

	return res.json({ok: true});
});
//Wholesalers
router.get('/rideau-admin/admins-and-wholesalers/add', function (req, res, next) {
	try {
		db.get('users')
			.push({
				username: req.query.username,
				password: req.query.password,
				role: req.query.role,
				created_at: new Date().getTime()
			})
			.value();
	} catch (e) {
		console.log(e.message);
	}

	return res.json({ok: true});
});
//Login
router.post('/login', function (req, res, next) {
	var username = req.body.username,
		password = req.body.password;

	var users = db.get('users').cloneDeep().value();
	var match = _.head(_.filter(users, {username: username, password: password}));

	if (!_.isEmpty(match)) {
		req.session.username = match.username;
		req.session.role = match.role;

		return res.json({ok: true, username: match.username, role: match.role}); //Return the username if it was found
	}

	return res.json({ok: false});
});
//Logout
router.get('/logout', function (req, res, next) {
	req.session.destroy();
	return res.redirect('/');
});
//Admin views
router.get('/rideau-admin/:area?', function (req, res, next) {
	if (req.session.role !== "admin") return res.redirect('/');

	var area = req.params.area;

	console.log(area);

	if (!_.isUndefined(area)) {
		if (area == "subscriptions") return res.render('admin/subscriptions', {subscriptions: db.get('subscriptions').value()});
		if (area == "purchases") return res.render('admin/purchases', {purchases: db.get('purchases').value()});
		if (area == "eboutique") return res.render('admin/eboutique', {
			eboutique: dirToObj("public/rideau-data/eboutique"),
			numeral: numeral
		});
		if (area == "users") return res.render('admin/users', {users: db.get('users').value()});
		if (area == "log") return res.render('admin/log', {log: db.get('log').value()});
	}

	return res.render('admin/welcome', {statistics: {users: 30, purchases: 80}});
});
//Save values from eboutique admin
router.post('/rideau-admin/eboutique/save', function (req, res, next) {
	var filePath = ''
	req.body.data.split('.').forEach(function (item) {
		filePath += '/' + item;
	});
	console.log(filePath);
	fs.writeFile('public/rideau-data/eboutique/' + req.body.id + filePath + '.txt', req.body.value, function (err) {
		if (err) {
			return res.json({ok: false, value: '', error: err});
		} else {
			return res.json({ok: true, value: req.body.value, error: ''});
		}
	});
});

//This function must appear last on the routes
router.get('*', function (req, res, next) {
	return res.redirect('/');
});

module.exports = router;
