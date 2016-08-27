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

//This function must appear last on the routes
router.get('*', function(req, res, next) {
	return res.redirect('/');
});

module.exports = router;
