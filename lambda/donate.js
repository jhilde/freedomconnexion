'use strict';

var Validator = require('jsonschema').Validator;
var braintree = require("braintree");
var config = require('./env.json');

var braintreeConfig = new BraintreeConfig(config.braintree);


var inputSchema = {
    "type" : "object",
    "properties" : {
        "amount" : { "type" : "number", "minimum" : 10},
        "paymentMethodNonce" : {"type" : "string"},
        "firstName" : {"type" : "string" , "minimum" : 2},
        "lastName" : {"type" : "string" , "minimum" : 2},
        "phone" : {"type" : "string"},
        "email" : {"type" : "string", "format" : "email"},
        "address" : {"type" : "string" , "minimum" : 2},
        "address2" : {"type" : "string"},
        "city" : {"type" : "string" , "minimum" : 2},
        "state" : {"type" : "string" , "minimum" : 2, "maximum" : 2},
    },
    "required" : ["amount", "paymentMethodNonce", "firstName", "lastName", "email", "address", "city", "state"]
};

function BraintreeConfig(n) {
    this.merchantId = n.merchantId;
    this.publicKey = n.publicKey;
    this.privateKey = n.privateKey;
    this.merchantAccountId = n.merchantAccountId;

    if(n.environment == "production") {
        this.environment = braintree.Environment.Production;
        
    }
    else {
        this.environment = braintree.Environment.Sandbox;
    }
}

function Donation(n) {
    // Since we've already validated, we assume all data is present and valid

    this.donation_info = {};
    this.donation_info.amount = n.donation_info.amount;

    if(n.donation_info.frequency){
    	this.donation_info.frequency = n.donation_info.frequency;
    }
    else{
    	this.donation_info.frequency = 'one-time';
    }

    this.donor_info = {};
    this.donor_info.first_name = n.donor_info.first_name;
    this.donor_info.last_name = n.donor_info.last_name;
    this.donor_info.email = n.donor_info.email;
    this.donor_info.phone = n.donor_info.phone;

    this.donor_info.address = {};
    this.donor_info.address.street_address = n.donor_info.address.street_address;
    this.donor_info.address.extended_address = n.donor_info.address.extended_address;
    this.donor_info.address.city = n.donor_info.city;
    this.donor_info.address.state = n.donor_info.address.state;
    this.donor_info.address.zip = n.donor_info.address.zip;

    this.nonce = n.nonce;

}
function BraintreeGateway() {
	return braintree.connect({
        environment:        braintreeConfig.environment,
        merchantId:         braintreeConfig.merchantId,
        publicKey:          braintreeConfig.publicKey,
        privateKey:         braintreeConfig.privateKey,
        merchantAccountId:  braintreeConfig.merchantAccountId 
    }); 
};

function BraintreeSale(donation) {
	this.amount = donation.donation_info.amount;
	this.paymentMethodNonce = donation.nonce;
	
	this.customer = {};
	this.customer.firstName = donation.donor_info.first_name;
	this.customer.lastName = donation.donor_info.last_name;
	this.customer.phone = donation.donor_info.phone;
	this.customer.email = donation.donor_info.email;

	this.billing = {};
    this.billing.streetAddress = donation.donor_info.address.street_address;
    this.billing.extendedAddress = donation.donor_info.address.extended_address;
    this.billing.locality = "HelloMe";
    this.billing.region = donation.donor_info.address.state;
    this.billing.postalCode = donation.donor_info.address.zip;
	
	this.options = {};
	this.options.submitForSettlement = true;
}

exports.donate = (event, context, callback) => {
    console.log("Called donate");
    console.log(event.body_json);

    // We need to validate the input
    //var v = new Validator();
    //var validation = v.validate(event,inputSchema);

    //console.log(validation);

    var donation = new Donation(event.body_json);
    console.log(JSON.stringify(donation));

    var gateway = BraintreeGateway();
    console.log(gateway);

    var braintreeSale = new BraintreeSale(donation);

    gateway.transaction.sale(braintreeSale, function(err, result) {
    	if(result) {
    		if(result.success) {
    			console.log("Transction ID: " + result.transaction.id);
    			callback(null, result);
    		}
    		else {
    			console.log(result.message);
    			callback(null, result);
    		}
    	}
    	else {
    		console.log(err);
    		callback(err, "Error");
    	}
    });
};

exports.clientToken = function(event, context) {
    var clientToken;

    var gateway = BraintreeGateway();

    gateway.clientToken.generate({}, function (err, response) {
    
        clientToken = { 'clientToken': response.clientToken };

        context.succeed(clientToken);
    });
};