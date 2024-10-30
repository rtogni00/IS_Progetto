const express = require('express');
const jwt = require('jsonwebtoken');

const SECRET = process.env.SUPER_SECRET;

const tokenChecker = function(req, res, next) {
	
	// check header or url parameters or post parameters for token
	const token = req.body.token || req.query.token || req.headers['x-access-token'];

	// if there is no token
	if (!token) {
		return res.status(401).send({ 
			success: false,
			message: 'No token provided.'
		});
	} else {

		// decode token, verifies secret and checks exp
		jwt.verify(token, SECRET, async(err, decoded) => {			
			if (err) {
				return res.status(403).send({
					success: false,
					message: 'Failed to authenticate token.'
				});		
			} else {
				console.log("Decoded token:", decoded); // Debugging line
				// if everything is good, save to request for use in other routes
				req.loggedUser = decoded;
				next();
			}
		});
	}
	
};

module.exports = tokenChecker
