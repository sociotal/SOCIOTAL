# Sociotal User Environment
##Last Version: 5.0.1
Sociotal node.js application.

- mongodb (IMPORTANT: USE VERSION 2.6.10 - Version 3.0 is not supported) and mongoose (as database engine and data modeling)
- express (as http engine)
- jade (for web views)
- social login: (for social account sign in/up);
- passport (for traditional user/pass sign in)
- ascoltatori (for event based operations)
- agenda (for scheduling tasks)

and many other dependencies are visible in package.json

## Install

**NOTE:** You need to have node.js, mongodb and [imagemagick](http://www.imagemagick.org/script/index.php) installed and running.

- Download the project.
- Open terminal and write these commands:

```sh
  $ npm install
```
- Install PM2 process manager (**it replaces `forever`**), [PM2](https://github.com/Unitech/pm2)
```sh
  $ sudo npm install -g pm2
```


##RUNNING NOTE, ENABLING DEBUG mode
**To enable all debug console logging, use the Environment Variable `DEBUG=*`**

## Email SMTP server configuration
In order to run the server it is necessary to configure the application with a valid SMTP server and email account to send messages.

Web User Environment use emails to confirm a registration account, retrieve forgot password and send emails to a community by the CommunityMail channel.

To configure the application edit the file `config/config.js`

Change the **optionsSmtpTransport** object:
```sh
  var optionsSmtpTransport = {
      host: 'SMTP_SERVER_ADDRESS',
      port: SMPT_PORT,
      auth: {
          user: 'USENAME_ACCOUNT',
          pass: 'PASSWORD_ACCOUNT' },
      authMethod: 'PLAIN'

  };
```

## Google reCAPTCHA configuration
To ensure to protection from spam and abuse the Web User Environment uses the reCAPTCHA system.

It is necessary to configure the application whit a valid key provided by https://www.google.com/recaptcha

To configure the application edit the file `config/config.js`

Change the **recaptcha_secret_key** and **recaptcha_site_key** object:
```sh
  var recaptcha_secret_key = "YOUR_VALID_RECAPTCHA_SECTER_KEY";
  var recaptcha_site_key = "YOUR_VALID_RECAPTCHA_SITE_KEY";
```


## Running in DEVELOPMENT mode (localhost:3000 and dev DB)

```sh
  $ npm start
```

**NB:** By Default, the previous command sets the version of the SocIoTal Context Manager API to **v1Http**.

**To set the correct Context Manager API version, use che `CM=v1Http | v1Https | v2Http | v2Https | v2Http3570 | v2Https3571 | v3Https` Environment variable.**

**NB:** the v3Https supports integration with Capability Manager and Context Manager V3

To run in background
```sh
  $ NODE_ENV=development CM=v1Http | v1Https | v2Http | v2Https pm2 start server.js
```

  To check running applications
```sh
  $ pm2 list
```

  To stop service
```sh
  $ pm2 stop {index} Eg.: 0, 1
```

## Running in STAGE mode (hostname:3000 and dev DB)
Default hostname is `sociotal.crs4.it`, change it in config.js if needed.

**To set the correct Context Manager API version, use che `CM=v1Http | v1Https | v2Http | v2Https | v2Http3570 | v2Https3571 | v3Https` Environment variable.**

**NB:** the v3Https supports integration with Capability Manager and Context Manager V3

```sh
  $ NODE_ENV=stage CM=v1Http | v1Https | v2Http | v2Https | v2Http3570 | v2Https3571 | v3Https node server.js
```

  To run in background
```sh
  $ NODE_ENV=stage CM=v1Http | v1Https | v2Http | v2Https | v2Http3570 | v2Https3571 | v3Https pm2 start server.js
```

  To check running applications
```sh
  $ pm2 list
```

  To stop service
```sh
  $ pm2 stop {index} Eg.: 0, 1
```


## Running in PRODUCTION mode (NGINX running on 80, node running on 8080 and prod DB)

NGINX **MUST** be running on port 80 and with configuration file: `nginx.conf` (located in the root dir).

Default hostname is sociotal.crs4.it, change it in config.js if needed.

**To set the correct Context Manager API version, use che `CM=v1Http | v1Https | v2Http | v2Https | v2Http3570 | v2Https3571 | v3Https` Environment variable.**

**NB:** the v3Https supports integration with Capability Manager and Context Manager V3

```sh
  $ NODE_ENV=production PORT=8080 CM=v1Http | v1Https | v2Http | v2Https | v2Http3570 | v2Https3571 | v3Https node server.js
```

  To run in background
```sh
  $ NODE_ENV=production PORT=8080 CM=v1Http | v1Https | v2Http | v2Https | v2Http3570 | v2Https3571 | v3Https pm2 start server.js
```

  To check running applications
```sh
  $ pm2 list
```

  To stop service
```sh
  $ pm2 stop {index} Eg.: 0, 1
```



**NOTE:** Do not forget to update your facebook, twitter and github APP_ID and APP_SECRET in `config/config.js`. Also if you want to use image uploads, don't forget to replace the S3 and Rackspace keys in `config/imager.js`.




## Related modules

1. [node-genem](https://github.com/madhums/node-genem) A module to generate the MVC skeleton using this approach.
2. [node-notifier](http://github.com/madhums/node-notifier) - used for notifications via emails and push notificatiions
3. [node-imager](http://github.com/madhums/node-imager) - used to resize, crop and upload images to S3/rackspace
4. [node-view-helpers](http://github.com/madhums/node-view-helpers) - some common view helpers
5. [mongoose-migrate](https://github.com/madhums/mongoose-migrate#readme) - Keeps track of the migrations in a mongodb collection (fork of visionmedia/node-migrate)
6. [mongoose-user](http://github.com/madhums/mongoose-user) - Generic methods, statics and virtuals used for user schemas

## Directory structure
```
-app/
  |__controllers/
  |__models/
  |__mailer/
  |__views/
-config/
  |__routes.js
  |__config.js
  |__passport.js (auth config)
  |__imager.js (imager config)
  |__express.js (express.js configs)
  |__middlewares/ (custom middlewares)
-public/
```

## TESTING

```sh
$ npm test
```

# CHANGELOG

## v5.0.1
- bug fix api/data

## v5.0.0
- revised API
- improvement anomaly detection
- integration completed
- several bug fixing

## v4.7.2
- BUG access to other resources with every token
- create channel API now returns the channel

## v4.7.1
- API create channel fixed

## v4.7.0
- RELEASE on sociotal.crs4.it

## v4.6.1
- COMMUNITY CHANNEL AND COMMUNITY ALERT is now async
- HARD BUG FIXING #3
- icon restyling

## v4.6.0
- COMMUNITY CHANNEL AND COMMUNITY ALERT ADDED
- new complete community api integration. HARD BUG FIXING #2
- added certificate for UC to support CM in the 3571 ports

## v4.5.2
- new complete community api integration. HARD BUG FIXING #2

## v4.5.1
- new complete community api integration. HARD BUG FIXING #1

## v4.5.0
- new complete community api integration.

## v4.3.2
- permission controls added with the device management: only owners can delete their devices


## v4.3.1
- identity manager created with certificate
- owner and update parameters are now hidden from the table


## v4.3.0
- add and remove users to a community


## v4.2.0
- now you can add and delete a community
- community token and ids are stored in a user array in db


## v4.1.2
- BUG #52: a user can view channels of other users
- UI: extend max input characters creating channel and devices to 30, truncate channel and device names ...


## v4.1.1
- Bubbles: add members list, identity and owner attributes

## v4.0.1
- BUG #46: check tags in channels

## v4.0.0
- Beta version of the Web User Environment including these new features:
  - Integration with security framework from WP2 and WP3:
    - secured identity management
    - security control over the data transmission
  - A revamped, modern, responsive and consistent Web UI design, including better information and explanations for final users, feedback and a more user-friendly management of Channels, Devices, Connections and Smartphones
  - Alpha version of the anomaly data detection
  - Noticeable performance improvement, thanks to the re-design of some internal components
  - Improoved API thanks to several bug fixed
  
## v3.5.0
- first version of integration of UC API v3
- new API requested by UC to retrieve a capability token using UMU lib

## v3.4.0
- first version of the Capability Client lib from UMU

## v3.3.1
- fixed bugs for anomaly detection:
  - anomaly is calculated only for numbers
  - anomaly is now calculated for every attribute in every notification
  - trainsets are extracted on the fly getting the last N valid values

## v3.3.0
- first version of the anomaly detection

## v3.2.3
- creation of the certificate file after the user signup

## v3.2.2
- create users folder if not exists in certificates

## v3.2.2
- create users folder if not exists in certificates

## v3.2.1
- NGINX config for HTTPS
- BUG #38 fixed
- confirmation boxes text edited

## v3.1.2
- HTTPS enabled: socket.io review

## v3.1.1
- Added new list of attribute devices
- Added identity-manager folder
- BUG #36 fixed: error creating devices with attribute names containing spaces and comma.

## v3.1.0
- User certificates generator


## v3.0.6
- fix BUG #35 restore channels list for mobile
- fix text in debug channel view

## v3.0.5
- xively bug on edit fixed
- Channels API fixed for smartphones
- version on header is automatic

## v3.0.4
- connection explanation added
- minor text fixing

## v3.0.3
- BUG #24: MISSING FAVICON fixed
- BUG #12 WEB UI: (CONNECTION) When sending a notification, it would be nice to add and “insert text” within the white box fixed
Other bugs fixed with the new release:
- BUG #4
- BUG #21
- BUG #2

## v3.0.2
- BUG#30 Fixed
- Fixed bug for retrieve password page at login.  

## v3.0.1
- bugs fixing

## v3.0.0
- NEW SOCIOTAL USER ENVIRONMENT. First draft of the new sociotal version 

## v2.1.6
- config.hostname replaced by req.host to avoid errors on lbsdev.crs4.it

## v2.1.5
- Context Manager ID added in channel details
- BUG#26, on subscribe channel, data not received from CM.

## v2.1.2
- On Facebook longin check if users exists and update user with infos by Facebook
- BUG#23, check greater than in connection

## v2.1.1
- Minor changes: Add text to login facebook Add text version to header
- BUG#21, In creation of a new device when enter is pushed in a field the attributes popup is opened
- BUG#22, In device details can not delete a device without attributes

## v2.1.0
- Facebook login/OAuth activation

## v2.0.2
Bugs fixing: 
- BUG#17, (DEVICE CREATION) Change the ID everytime a value is changed in the form -  FIXED
- BUG#18, remove create channel button from device form and remove delete button when creating device -  FIXED
- BUG#19, details added on popup notification on delete channel and delete device 
- BUG#20. device is deleted anyway even if I’m pressing cancel button on delete device - FIXED

## v2.0.1
Bugs fixing: configuration for Context Manager URLs is now complete for all envs.

## v2.0.0
**This version API is NOT backwards-compatible with v1.0.0**

- In JSON representations returned by API, all `_id` fields are now replaced by `id` field name.

CHANNELS:
```sh
POST /channels
body validation
returns 201 Created

GET /channels
sensible user data not returned

PUT /channels/:channelId
body validation

GET /channels/:channelId        
sensible user data not returned  
```

COMPOSITIONS:

refactored code for composition search
```sh
POST /channels/:channelId/compositions
body validation
returns 201 Created

PUT /channels/:channelId/compositions/:compId
body validation


GET /channels/:channelId/compositions/:compId
returns a single composition instead of the list

DEL /channels/:channelId/compositions/:compositionId
200 OK returned
```