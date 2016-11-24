module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		
        lambda_invoke: {
            createUser: {
                options: {
                    handler: 'createUser',
                    file_name: 'auth.js',
                    event: 'createUser-event.json'
                }
            },
            authenticateUser: {
                options: {
                    handler: 'authenticateUser',
                    file_name: 'auth.js',
                    event: 'authenticateUser-event.json'
                }
            },
            donate: {
                options: {
                    handler: 'donate',
                    file_name: 'donate.js',
                    event: 'donate-event.json'
                }
            },
            sendEmail: {
                options: {
                    handler: 'sendEmail',
                    file_name: 'sendEmail.js',
                    event: 'donate-event.json'
                }
            },
            searchTransactions: {
                options: {
                    handler: 'searchTransactions',
                    file_name: 'admin.js',
                    event: 'donate-event.json'
                }
            }
        },
		lambda_package: {
        	default: {
            	options: {
                    include_time: false,
                    include_version: false
            	}
        	}
        },
        lambda_deploy: {
        	createUser: {
            	arn: 'arn:aws:lambda:us-east-1:669821887388:function:auth_createUser',
                package: './dist/freedomconnexion-lambda_latest.zip',
            	options: {
                // Task-specific options go here.
            	}
        	},
            authenticateUser: {
                arn: 'arn:aws:lambda:us-east-1:669821887388:function:auth_authenticateUser',
                package: './dist/freedomconnexion-lambda_latest.zip',
                options: {
                // Task-specific options go here.
                }
            },
            donate: {
                arn: 'arn:aws:lambda:us-east-1:669821887388:function:donate_donate',
                package: './dist/freedomconnexion-lambda_latest.zip',
                options: {
                // Task-specific options go here.
                }
            }
        }
	});

	grunt.loadNpmTasks('grunt-aws-lambda');


};