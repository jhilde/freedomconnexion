'use strict';

var Validator = require('jsonschema').Validator;
var braintree = require("braintree");
var config = require('./env.json');

var braintreeConfig = new BraintreeConfig(config.braintree);
var sendgridConfig = new SendgridConfig(config.sendgrid);





/*var inputSchema = {
    "type" : "object",
    "properties" : {
        "donation_info" : { 
            "type" : "object",
            "properties" : {
                "amount" : { "type" : "number", "minimum" : 10},
            },
            "required" : ["amount"]
        },
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
    "required" : ["paymentMethodNonce", "firstName", "lastName", "email", "address", "city", "state"]
};*/



/*var inputSchema = {
    "type" : "object",
    "properties" : {
        "donation_info" : { 
            "type" : "object",
            "properties" : {
                "amount" : { "type" : "number", "minimum" : 10},
            },
            "required" : [ "amount" ]
        },
    },
    "required" : [ ]
};
*/

function SendgridConfig(n) {
    var helper = require('sendgrid').mail;

    console.log("helper: " + helper);

    this.apiKey = n.apiKey;
    this.templateID = n.templateID;
    
    this.from = new helper.Email(n.fromEmail, n.fromName);

    this.subject = n.subject;

}


function sendEmail(donorEmail, donorFirstName, donorLastName, amount, transactionID) {
    console.log("Sending email");

    var helper = require('sendgrid').mail;

    console.log("2nd helper: " + helper);

    var mail = new helper.Mail();
    
    console.log("mail" + mail);
    
    mail.setFrom(sendgridConfig.from);

    mail.setSubject(sendgridConfig.subject);

    var personalization = new helper.Personalization();


    var email = new helper.Email(donorEmail, donorFirstName + " " + donorLastName);
    personalization.addTo(email);

    personalization.addBcc(sendgridConfig.from);

    personalization.setSubject(sendgridConfig.subject);

    var substitution = new helper.Substitution("DONOR_FIRST", donorFirstName);
    personalization.addSubstitution(substitution);

    substitution = new helper.Substitution("AMOUNT", "$" + amount);
    personalization.addSubstitution(substitution);

    substitution = new helper.Substitution("TRANSACTION_ID", transactionID);
    personalization.addSubstitution(substitution);

    mail.addPersonalization(personalization);

    var content = new helper.Content("text/html", "<html></html>");
    mail.addContent(content);

    mail.setTemplateId(sendgridConfig.templateID);

    console.log("key: " + sendgridConfig.apiKey);

    var sg = require('sendgrid')(sendgridConfig.apiKey);



    var requestBody = mail.toJSON();
    var request = sg.emptyRequest();
    request.method = 'POST';
    request.path = '/v3/mail/send';
    request.body = requestBody;
    console.log("About to send request");
    return sg.API(request);

}

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

function addError(errors, attribute, code, message) {
    errors.push({"attribute" : attribute, "code" : code, "message" : message});
}

function valCurrency(value, errors, error_attribute, error_code, error_message, isRequired, min, max) {
    // Check for existence 
    if(value) {
        // Check for proper currency
        var re = /^[+]?[0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]{2})?$/;
        var isCurrencyValid = re.test(value);

        if(isCurrencyValid) {
            // Check for min
            if(min && value < min) {
                addError(errors, error_attribute, error_code, error_attribute + " less than min of " + min);
            }
            
            // Check for max
            else if(max && value > max) {
                addError(errors, error_attribute, error_code, error_attribute + " greater than max of " + max);
            }
        }
        else {
            addError(errors, error_attribute, error_code, error_attribute + " is not proper currency format");
        }
    }

    // Check if it is required
    else if(isRequired) {
        addError(errors, error_attribute, error_code, error_attribute + " is missing");
    }

    return value;
}

function valEmail(value, errors, error_attribute, error_code, error_message, isRequired) {
    // Check for existence 
    if(value) {
        // Check for proper email
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        var isEmailValid = re.test(value);

        if(!isEmailValid) {
            addError(errors, error_attribute, error_code, error_attribute + " is not proper email format");
        }
    }

    // Check if it is required
    else if(isRequired) {
       addError(errors, error_attribute, error_code, error_attribute + " is missing");
    }

    return value;
}

function valZip(value, errors, error_attribute, error_code, error_message, isRequired) {
    // Check for existence 
    if(value) {
        // Check for proper email
        var re = /(^\d{5}$)|(^\d{5}-\d{4}$)/;
        var isZipValid = re.test(value);

        if(!isZipValid) {
            addError(errors, error_attribute, error_code, error_attribute + " is not proper email format");
        }
    }

    // Check if it is required
    else if(isRequired) {
        addError(errors, error_attribute, error_code, error_attribute + " is missing");
    }

    return value;
}

function valString(value, errors, error_attribute, error_code, error_message, isRequired, minLength, maxLength) {
    // Check for existence 
    if(value) {
        // Check for min length
        if(minLength && value.length < minLength) {
            addError(errors, error_attribute, error_code, error_attribute + " less than min length of " + minLength);
        }
            
        // Check for max
        else if(maxLength && value.length > maxLength) {
            addError(errors, error_attribute, error_code, error_attribute + " greater than max length of " + maxLength);
        }
    }

    // Check if it is required
    else if(isRequired) {
        addError(errors, error_attribute, error_code, error_attribute + " is missing");
    }

    return value;
}

function valEnum(value, errors, error_attribute, error_code, error_message, isRequired, optionBundle) {
    var validValues = optionBundle.values;
    var defaultValue = optionBundle.default;

    var finalValue = value;

    // If there's no value and there's a default, replace with default
    // Value missing
    if(!value) {
        // Default value present
        if(defaultValue) {
            finalValue = defaultValue;
        }
        else if(isRequired) {
            addError(errors, error_attribute, error_code, error_attribute + " is missing");
        }
    }
    // Value present
    else {
        if(validValues.indexOf(value) < 0) {
            addError(errors, error_attribute, error_code, error_attribute + " incorrect value");
        }
    }

    return finalValue;
}

function valSection(value, errors, error_attribute, error_code, error_message, isRequired) {
    // Check for existence 
    if(!value && isRequired) {
        addError(errors, error_attribute, error_code, error_attribute + " is missing");
    }

    return value;
}


function Donation(n) {
    // Let's validate here

    var stateValues = ["AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA",
"KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC",
"ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

    this.errors = [];
    
    
    // Validate donation_info
    valSection(n.donation_info, this.errors, "donation_info", "donate-0001", "");
    this.donation_info = {};

    // Validate donation_info.amount
    this.donation_info.amount = valCurrency(n.donation_info.amount, this.errors, "amount", "donate-0002", "", true, 10, null);

    // Validate donation_info.frequency
    this.donation_info.frequency = valEnum(n.donation_info.frequency, this.errors, "frequency", "donate-0003", "", true, {"values" : ["one-time", "monthly"], "default" : "one-time"});

    

    // Validate donor_info
    valSection(n.donor_info, this.errors, "donor_info", "donate-0004", "");
    this.donor_info = {};

    // Validate donor_info.first_name
    this.donor_info.first_name = valString(n.donor_info.first_name, this.errors, "first_name", "donate-0005", "", true, 1, 255);

    // Validate donor_info.last_name
    this.donor_info.last_name = valString(n.donor_info.last_name, this.errors, "last_name", "donate-0006", "", true, 1, 255);

    // Validate donor_info.email
    this.donor_info.email = valEmail(n.donor_info.email, this.errors, "email", "donate-0007", "", true);

    // Validate donor_info.phone
    this.donor_info.phone = valString(n.donor_info.phone, this.errors, "phone", "donate-0008", "", false, 1, 255);

    console.log("Got here");

    // Validate donor_info.address
    valSection(n.donor_info.address, this.errors, "donor_info.address", "donate-0009", "");
    this.donor_info.address = {};

    // Validate donor_info.address.street_address
    this.donor_info.address.street_address = valString(n.donor_info.address.street_address, this.errors, "street_address", "donate-0010", "", true, 1, 255);

    // Validate donor_info.address.extended_address
    this.donor_info.address.extended_address = valString(n.donor_info.address.extended_address, this.errors, "extended_address", "donate-0011", "", false, 1, 255);

    // Validate donor_info.address.city
    this.donor_info.address.city = valString(n.donor_info.address.city, this.errors, "city", "donate-0012", "", true, 1, 255);

    // Validate donor_info.address.state
    this.donor_info.address.state = valEnum(n.donor_info.address.state, this.errors, "state", "donate-0013", "", true, {"values" : stateValues});

    // Validate donor_info.address.zip
    this.donor_info.address.zip = valString(n.donor_info.address.zip, this.errors, "zip", "donate-0014", "", true);

    


    // Validate nonce
    this.nonce = valString(n.nonce, this.errors, "nonce", "donate-0013", "", true, null, null);


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

function BraintreeCustomer(donation) {
    this.paymentMethodNonce = donation.nonce;

    this.firstName = donation.donor_info.first_name;
    this.lastName = donation.donor_info.last_name;
    this.phone = donation.donor_info.phone;
    this.email = donation.donor_info.email;

    this.creditCard = {};

    this.creditCard.billingAddress = {};
    this.creditCard.billingAddress.firstName = donation.donor_info.first_name;
    this.creditCard.billingAddress.lastName = donation.donor_info.last_name;
    this.creditCard.billingAddress.streetAddress = donation.donor_info.address.street_address;
    this.creditCard.billingAddress.extendedAddress = donation.donor_info.address.extended_address;
    this.creditCard.billingAddress.locality = donation.donor_info.address.city;
    this.creditCard.billingAddress.region = donation.donor_info.address.state;
    this.creditCard.billingAddress.postalCode = donation.donor_info.address.zip;
    
}

function BraintreeSubscription(cardToken, planId, amount) {
    this.paymentMethodToken = cardToken;
    this.planId = planId;
    this.price = amount;  
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

    // if there are errors, we're just going to return them and stop all processing
    if(donation.errors.length > 0)
    {
        console.log("We've got errors");
        console.log(donation.errors);
        donation.success = false;
        callback(null,donation);
        return;
    }


    var gateway = BraintreeGateway();
    //console.log(gateway);

    
    if(donation.donation_info.frequency == "monthly") {
        var braintreeCustomer = new BraintreeCustomer(donation);

        gateway.customer.create(braintreeCustomer, function(err, result) {
            if(result) {
                if(result.success) {
                    console.log("Created customer: " + result.customer.id);
                    console.log("Created payement method: " + result.customer.creditCards[0].token);

                    var braintreeSubscription = new BraintreeSubscription(result.customer.creditCards[0].token, "monthly_donation",donation.donation_info.amount);

                    gateway.subscription.create(braintreeSubscription, function (err, result) {
                        if(result.success) {
                            console.log("Created subscription: " + result.subscription.id);

                            sendEmail(donation.donor_info.email, donation.donor_info.first_name, donation.donor_info.last_name, donation.donation_info.amount, result.subscription.id).then(response => {
                                console.log(response.statusCode);
                                console.log(response.body);
                                console.log(response.headers);    
                            })
                            .catch(error => {
                                //error is an instance of SendGridError
                                //The full response is attached to error.response
                                console.log("Wow error with sendgrid:" + error.response);
                            })
                            .then(function() {
                                console.log("In the second then!");
                                callback(null, result);
                            });
                        }
                        else {
                            callback(null, result);
                        }
                    });

                }
                else {
                    callback(null, result);
                }
            }
            else {
                callback(null, err);
            }            
        });
    }
    else {
        var braintreeSale = new BraintreeSale(donation);

        gateway.transaction.sale(braintreeSale, function(err, result) {
            if(result) {
                if(result.success) {
                    console.log("Transction ID: " + result.transaction.id);
                    //Let's send the email
                    console.log("Sending to: " + donation.donor_info.email);
                    sendEmail(donation.donor_info.email, donation.donor_info.first_name, donation.donor_info.last_name, donation.donation_info.amount, result.transaction.id).then(response => {
                        console.log(response.statusCode);
                        console.log(response.body);
                        console.log(response.headers);

                        
                    })
                    .catch(error => {
                        //error is an instance of SendGridError
                        //The full response is attached to error.response
                        console.log("Wow error with sendgrid:" + error.response);
                    })
                    .then(function() {
                        console.log("In the second then!");
                        callback(null, result);
                    });
                    
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
    }
};

exports.clientToken = function(event, context) {
    var clientToken;

    var gateway = BraintreeGateway();

    gateway.clientToken.generate({}, function (err, response) {
    
        clientToken = { 'clientToken': response.clientToken };

        context.succeed(clientToken);
    });
};