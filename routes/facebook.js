var aws = require('aws-sdk');
var redis = require("redis");
var crypto = require('crypto');
var express = require('express');
var PropertiesReader = require("properties-reader");

var router = express.Router();
//var redisClient = redis.createClient();
var properties = PropertiesReader('properties.file');

// properties
var AWS_ACCESS_KEY_ID = properties.get('aws.access.key');
var AWS_SECRET_ACCESS_KEY = properties.get('aws.secret.key');
var FACEBOOK_APP_ID = properties.get('facebook.app.id');
var FACEBOOK_ACCESS_TOKEN = properties.get('facebook.access.token');
var AWS_BUCKET_LOGS = properties.get('aws.s3.bucket.logs');

// set AWS configuration for future requests
aws.config.update({"accessKeyId": AWS_ACCESS_KEY_ID, "secretAccessKey": AWS_SECRET_ACCESS_KEY, "region": "eu-west-1"});
aws.config.apiVersions = {
  dynamodb: '2012-08-10'
};

/* GET event. */
router.get('/events/:id', function(req, res, next) {
	if (req.params.hub.mode == "subscribe") {
		redisClient.get("facebookEvent#" + req.params.id, function (err, reply) {
			if (reply != null && reply == req.query.hub.verify_token) {
				// request is safe to come from Facebook - subscription confirmed
				redisClient.del("facebookEvent#" + req.params.id);
				res.send(req.params.hub.challenge);
			}
		});
	}
});

/* POST event. */
router.post('/events/:id', function(req, res, next) {
	// verify X-Hub-Signature header with app secret
	if (req.get('X-Hub-Signature')) {
		payload = JSON.stringify(req.body);
		hmac = crypto.createHmac("sha1", FACEBOOK_ACCESS_TOKEN).setEncoding('hex');
		hmac.end("sha1=" + payload, function () {
	    	hash = hmac.read();
	    	if (hash == req.get('X-Hub-Signature')) {
	    		// request signature verified
	    		if (payload.object == "page") {
	    			payload.entry.forEach(function(entry) {
				    	//console.log(entry);
					});
	    		}
	    		res.sendStatus(200);
	    	} else {
	    		res.sendStatus(403);
	    	}
		});	
	} else {
		res.sendStatus(403);
	}
});

module.exports = router;
