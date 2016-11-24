var frequency = 'one-time';
var amount = 0;
var currentPanel = 'panel-donationInfo';

var panelCompletion = [false, false, false];


function flipPanel(targetPanel) {
  currentPanelObj = $("#" + currentPanel);
  targetPanelObj = $("#" + targetPanel);

  // set panel completion
  switch(currentPanel) {
    case "panel-donationInfo":
      panelCompletion[0] = true;
      break;
    case "panel-donorInfo":
      panelCompletion[1] = true;
      break;
  }

  // hide the current panel
  currentPanelObj.hide();
  
  // show the target panel
  targetPanelObj.height(250).removeClass("hidden");
    
  // set current panel name
  currentPanel = targetPanel;

}

function setError(errorSpan, div) {
  $(errorSpan).removeClass("hidden");
  $(div).addClass("has-error");
}

function setClear(errorSpan, div) {
  $(errorSpan).addClass("hidden");
  $(div).removeClass("has-error");
}


function valRequired(field, errorSpan, div) {
  var hasErrors = false;

  if($(field).val()==="") {
    $(errorSpan).removeClass("hidden");
    $(div).addClass("has-error");
    hasErrors = true;
  }
  else {
    $(errorSpan).addClass("hidden");
    $(div).removeClass("has-error");
  }

  return hasErrors;
}

function valEmail(field, errorSpan, div) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  var isValidEmail = re.test($(field).val());

  if(!isValidEmail) {
    $(errorSpan).removeClass("hidden");
    $(div).addClass("has-error");
  }
  else {
    $(errorSpan).addClass("hidden");
    $(div).removeClass("has-error");
  }

  return !isValidEmail;
}

function valState(field, errorSpan, div) {
  var hasErrors = false;

  console.log("state is " + $(field).val());

  if($(field).val()==="Select") {
    $(errorSpan).removeClass("hidden");
    $(div).addClass("has-error");
    hasErrors = true;
  }
  else {
    $(errorSpan).addClass("hidden");
    $(div).removeClass("has-error");
  }

  return hasErrors;
}

function valZip(field, errorSpan, div) {
  var isValidZip = /(^\d{5}$)|(^\d{5}-\d{4}$)/.test($(field).val());

  console.log("testing zip + " + $(field).val() + " gives: " + isValidZip);

  if(!isValidZip) {
    $(errorSpan).removeClass("hidden");
    $(div).addClass("has-error");
  }
  else {
    $(errorSpan).addClass("hidden");
    $(div).removeClass("has-error");
  }

  return !isValidZip;

}

function validatePanel() {
  console.log("Validating Panel " + currentPanel);
  var hasErrors = false;

  switch(currentPanel) {
    case 'panel-donationInfo':
      if($("#otherAmount").val() < 10) {
        $("#otherAmountError").html("Amount must be at least $10.");
        $("#otherAmountError").removeClass("hidden");
        $("#otherAmountDiv").addClass("has-error");
        hasErrors = true;
      }
      break;
    case 'panel-donorInfo':
      hasErrors = valRequired("#firstName", "#firstNameError", "#firstNameDiv") || hasErrors;
      hasErrors = valRequired("#lastName", "#lastNameError", "#lastNameDiv") || hasErrors;
      hasErrors = valEmail("#email", "#emailError", "#emailDiv") || hasErrors;
      hasErrors = valRequired("#address", "#addressError", "#addressDiv") || hasErrors;
      hasErrors = valRequired("#city", "#cityError", "#cityDiv") || hasErrors;
      hasErrors = valState("#state", "#stateError", "#stateDiv") || hasErrors;
      hasErrors = valZip("#zip", "#zipError", "#zipDiv") || hasErrors;
      break;
    case 'panel-paymentInfo':
      break;
  }

  if(hasErrors) {
    console.log("returning with errors");
  }
  return hasErrors;

}


$(document).ready(function() {
	// Handler for frequency one-time click
  $( "#btn-freq-one" ).on('click', function() {
		frequency = 'one-time';
		$(this).addClass("active");
		$( "#btn-freq-month" ).removeClass("active");
	});

  // Handler for frequency monthly click
	$( "#btn-freq-month" ).on('click', function() {
		frequency = 'monthly';
		$(this).addClass("active");
		$( "#btn-freq-one" ).removeClass("active");
	});

	// Handler for amount button clicked
  $( ".btn-amount" ).on('click', function() {
		var btnClicked = $(this);
		amount = btnClicked.val();

		flipPanel("panel-donorInfo");
	});

  // Handler for chevron clicked
  $( ".panelCircle" ).on('click', function() {
    var chevronClicked = $(this);
    var circleSymbol = $(this).find("i");
    //alert(circleSymbol.attr("class"));
    circleSymbol.removeClass("fa-circle-o");
    circleSymbol.addClass("fa-circle");

    flipPanel(chevronClicked.attr("href"));
    
    alert("chevron clicked: " + chevronClicked.attr("href"));

  });

  // Handler for next button
  $( "#btn-donation-next" ).on('click', function() {
    if(!validatePanel()) {
      flipPanel("panel-donorInfo");
    }
    
  });

    // Handler for next button
  $( "#btn-donor-next" ).on('click', function() {
    if(!validatePanel()) {
      flipPanel("panel-paymentInfo");
    }
  });
  

});

var clientTokenURL = 'https://ka1l8dezi6.execute-api.us-east-1.amazonaws.com/test/clientToken';
var donationAmount = 0;


$.ajax({
  url:      clientTokenURL,
  data:     '',
  dataType: 'json',
  success:  function(json) {
    clientToken = json.clientToken;
    
    braintree.client.create({
      authorization: clientToken
    }, function(clientErr, clientInstance) {
      if(clientErr) {
        alert("Bad Braintree Error");
        return;
      }

      braintree.hostedFields.create({
        client: clientInstance,
        styles: {
          'input': {
            'font-size': '14pt'
          },
          'input.invalid': {
            'color': 'red'
          },
          'input.valid': {
            'color': 'green'
          }
        },
        fields: {
          number: {
            selector: '#card-number',
            placeholder: '4111 1111 1111 1111'
          },
          cvv: {
            selector: '#cvv',
            placeholde: '123'
          },
          expirationDate: {
            selector: '#expiration-date',
            placeholder: '10/2019'
          },
          postalCode: {
            selector: '#postal-code',
            placeholder: '02145'
          }
        }
      }, function(hostedFieldsErr, hostedFieldsInstance) {
        if(hostedFieldsErr) {
          alert("Hosted fields error: " + hostedFieldsErr);
          return;
        }

        console.log("Setting up handlers!");

        hostedFieldsInstance.on('focus', function (event) {
          console.log(event.emittedBy, 'has been focused');
        });

        hostedFieldsInstance.on('cardTypeChange', function (event) {
          console.log(event.emittedBy, 'had card type change');
          console.log(event);

          var imageSrc;
          var imageBase = './img/credit-cards/';
          
          if(event.cards.length == 1) {
            creditCardType = event.cards[0].type;
            
            switch(creditCardType) {
              case 'american-express':
                imageSrc = imageBase+'amex.png';
                break;
              case 'discover':
                imageSrc = imageBase+'discover.png';
                break;
              case 'master-card':
                imageSrc = imageBase+'mastercard.png';
                break;
              case 'visa':
                imageSrc = imageBase+'visa.png';
                break;
              default:
                imageSrc = '';
                break;
            }
          }
          else {
            imageSrc = '';
          }
          
          $( "#creditCardLogo" ).attr('src', imageSrc);
          
        });

        $( "#btn-donate" ).on('click', function() {
				  hostedFieldsInstance.tokenize(function (tokenizeErr, payload) {
            if(tokenizeErr) {
  		        
              // Must do better error handling...send error to lambda?

              switch (tokenizeErr.code) {
                case 'HOSTED_FIELDS_FIELDS_EMPTY':
                  setError("#card-numberError", "#card-numberDiv");
                  setError("#expiration-dateError", "#expiration-dateDiv");
                  setError("#cvvError", "#cvvDiv");
                  setError("#postal-codeError", "#postal-codeDiv");
                  break;
                case 'HOSTED_FIELDS_FIELDS_INVALID':
                  
                  if(tokenizeErr.details.invalidFieldKeys.indexOf("number") >= 0) {
                    setError("#card-numberError", "#card-numberDiv");
                  }
                  else {
                    setClear("#card-numberError", "#card-numberDiv");
                  }

                  if(tokenizeErr.details.invalidFieldKeys.indexOf("expirationDate") >= 0) {
                    setError("#expiration-dateError", "#expiration-dateDiv");
                  }
                  else {
                    setClear("#expiration-dateError", "#expiration-dateDiv");
                  }

                  if(tokenizeErr.details.invalidFieldKeys.indexOf("cvv") >= 0) {
                    setError("#cvvError", "#cvvDiv");
                  }
                  else {
                    setClear("#cvvError", "#cvvDiv");
                  }

                  if(tokenizeErr.details.invalidFieldKeys.indexOf("postalCode") >= 0) {
                    setError("#postal-codeError", "#postal-codeDiv");
                  }
                  else {
                    setClear("#postal-codeError", "#postal-codeDiv");
                  }
                  break;
                case 'HOSTED_FIELDS_FAILED_TOKENIZATION':
                  console.error('Tokenization failed server side. Is the card valid?');
                  break;
                case 'HOSTED_FIELDS_TOKENIZATION_NETWORK_ERROR':
                  console.error('Network error occurred when tokenizing.');
                  break;
                default:
                  console.error('Something bad happened!', tokenizeErr);
              }

  		        return;
  		      }
            else {
              setClear("#card-numberError", "#card-numberDiv");
              setClear("#expiration-dateError", "#expiration-dateDiv");
              setClear("#cvvError", "#cvvDiv");
              setClear("#postal-codeError", "#postal-codeDiv");
            }

            var $form = $( "#donateForm" );
                      
            first_name = $ ("#firstName").val();
            last_name = $ ("#lastName").val();
            email = $ ("#email").val();
            phone = $ ("#phone").val();
            street_address = $ ("#address").val();
            city = $ ("#city").val();
            state = $ ("#state").val();
            zip = $ ("#zip").val();

            var donation_data = {"donation_info" : {"amount" : amount, "frequency" : "one-time"},"donor_info" : {"first_name" : first_name, "last_name" : last_name, "email" : email, "phone" : phone, "address" : {"street_address" : street_address, "city" : city, "state" : state,"zip" : zip}},"nonce" : payload.nonce};

            console.log(JSON.stringify(donation_data));

            $.ajax({
              url: 'https://6z4mdckfb2.execute-api.us-east-1.amazonaws.com/dev/donation',
              dataType: 'json',
              type: 'post',
              contentType: 'application/json',
              data: JSON.stringify(donation_data),
              success: function( data, textStatus, jQxhr ){
                  alert( JSON.stringify(data) );
                  if(data.success){
                    $( "#transactionId").html(data.transaction.id);
                    flipPanel("panel-thankYou");
                  }
                  else {
                    $("#braintreeError").removeClass("hidden");
                    $("#braintreeErrorDiv").addClass("has-error");
                  }
              }
            });
          });
        });
      });
    });
  }
});
      

						/*



		              	

		              	

								$( "#panel-paymentInfo").hide();
								$( "#panel-transaction").height(250).removeClass("hidden");
			                },
			                error: function( jqXhr, textStatus, errorThrown ){
			                    console.log( errorThrown );
		                	}
		              	});
		            });*/
                /*  
				


		    

          $( "#donateForm" ).submit(function( event ) {
            event.preventDefault();

            console.log("Received submit");

            hostedFieldsInstance.tokenize(function (tokenizeErr, payload) {
              if(tokenizeErr) {
                switch (tokenizeErr.code) {
                  case 'HOSTED_FIELDS_FIELDS_EMPTY':
                    console.error('All fields are empty! Please fill out the form.');
                    break;
                  case 'HOSTED_FIELDS_FIELDS_INVALID':
                    console.error('Some fields are invalid:', tokenizeErr.details.invalidFieldKeys);
                    break;
                  case 'HOSTED_FIELDS_FAILED_TOKENIZATION':
                    console.error('Tokenization failed server side. Is the card valid?');
                    break;
                  case 'HOSTED_FIELDS_TOKENIZATION_NETWORK_ERROR':
                    console.error('Network error occurred when tokenizing.');
                    break;
                  default:
                    console.error('Something bad happened!', tokenizeErr);
                }

                return;
              }

              //alert(payload.nonce);

              //console.log(hostedFieldsInstance.getState().fields.postalCode);

              var $form = $( "#donateForm" ),
                amount = $form.find( "input[name='amount']" ).val(),
                first_name = $form.find( "input[name='first_name']" ).val(),
                last_name = $form.find( "input[name='last_name']" ).val(),
                email = $form.find( "input[name='email']" ).val(),
                phone = $form.find( "input[name='phone']" ).val(),
                street_address = $form.find( "input[name='street_address']" ).val(),
                extended_address = $form.find( "input[name='extended_address']" ).val(),
                city = $form.find( "input[name='city']" ).val(),
                state = $form.find( "input[name='state']" ).val(),
                zip = $form.find( "input[name='zip']" ).val();

              var donation_data = {"donation_info" : {"amount" : amount, "frequency" : "one-time"},"donor_info" : {"first_name" : first_name, "last_name" : last_name, "email" : email, "phone" : phone, "address" : {"street_address" : street_address, "extended_address" : extended_address, "city" : city, "state" : state,"zip" : zip}},"nonce" : payload.nonce};

              console.log(JSON.stringify(donation_data));

              $.ajax({
                url: 'https://6z4mdckfb2.execute-api.us-east-1.amazonaws.com/dev/donation',
                dataType: 'json',
                type: 'post',
                contentType: 'application/json',
                data: JSON.stringify(donation_data),
                success: function( data, textStatus, jQxhr ){
                    alert( JSON.stringify(data) );
                },
                error: function( jqXhr, textStatus, errorThrown ){
                    console.log( errorThrown );
                }
              });

            });
          });*/









