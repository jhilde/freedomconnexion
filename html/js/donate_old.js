var clientTokenURL = 'https://ka1l8dezi6.execute-api.us-east-1.amazonaws.com/test/clientToken';
var donationAmount = 0;

 $(".donationAmountButton").on('click', function() {
            alert($(this).val());
          });


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

          $(".donationAmountButton").on('click', function() {
            donationAmount = $(this).val();
            $("#firstPanel").hide();
            $("#secondPanel").show();
          });

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
          });
        });
      });
    }
  });





