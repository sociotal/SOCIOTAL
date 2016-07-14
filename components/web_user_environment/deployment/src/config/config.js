


var path = require('path');
var rootPath = path.normalize(__dirname + '/..');
var templatePath = path.normalize(__dirname + '/../app/mailer/templates');
var notifier = {
    service: 'postmark',
    APN: false,
    email: false, // true
    actions: ['comment'],
    tplPath: templatePath,
    key: 'POSTMARK_KEY',
    parseAppId: 'PARSE_APP_ID',
    parseApiKey: 'PARSE_MASTER_KEY'
};



var optionsSmtpTransport = {
      host: 'SMTP_SERVER_ADDRESS',
      port: SMPT_PORT,
      auth: {
          user: 'USENAME_ACCOUNT',
          pass: 'PASSWORD_ACCOUNT' },
      authMethod: 'PLAIN'

  };

var recaptcha_secret_key = "YOUR_VALID_RECAPTCHA_SECTER_KEY";
var recaptcha_site_key = "YOUR_VALID_RECAPTCHA_SITE_KEY";

var pathsContextManager = {
    v3LocalMachine: 'https://localhost:8443/SocIoTal_CM_REST_V3',
    v3Https:'https://193.144.201.50:3501/SocIoTal_CM_REST_V3',
    v3Http:'http://193.144.201.50:3500/SocIoTal_CM_REST_V3',
    v3Http3570:'http://193.144.201.50:3570/SocIoTal_CM_REST_V3',
    v3Https3571:'https://193.144.201.50:3571/SocIoTal_CM_REST_V3',
    v2Https:'https://193.144.201.50:3501/SocIoTal_CM_REST_V2',
    v2Http:'http://193.144.201.50:3500/SocIoTal_CM_REST_V2',
    v2Https3571:'https://193.144.201.50:3571/SocIoTal_CM_REST_V2',
    v2Http3570:'http://193.144.201.50:3570/SocIoTal_CM_REST_V2',
    v1Https:'https://193.144.201.50:3501/SocIoTal_Context_UC_REST',
    v1Http:'http://193.144.201.50:3500/SocIoTal_Context_UC_REST'
};

var identityManagerRemoteServer = {
    admin_token : "1M7ci8BYKJmdevM7tWct",
    domain_id : "................",
    keyrock_ip : "sociotalkeyrock.inf.um.es",
    keyrock_port : "35357",
    keyrock_port_ssl : "443"
};

var capabilityManagerServer = {
    keystore_password : "lxxekBfcFPBZW6XdZNfV",
    capability_manager_address : "https://sociotal.inf.um.es:8443/CapabilityManagerServlet/CapabilityManager",
};

//**********************************************************************************************************************

var identityManagerLocalMachine = {                                // CHECK PARAMS FOR THE INTEGRATED VIRTUAL MACHINE
    admin_token : "Ud1d36gb6xfiHJbFQPU6",
    domain_id : "................",
    keyrock_ip : "localhost",
    keyrock_port : "35357",
    keyrock_port_ssl : "8443"
};

var capabilityManagerLocalMachine = {
    keystore_password : "lxxekBfcFPBZW6XdZNfV",
    capability_manager_address : "https://localhost:8443/CapabilityManagerServlet/CapabilityManager"
};

//**********************************************************************************************************************




module.exports = {

    //PRODUCTION
    production: {
        port: 80,
        db: 'mongodb://localhost/sociotal',
        root: rootPath,
        notifier: notifier,
        identityManagerParams: identityManagerRemoteServer,
        capabilityManagerParams: capabilityManagerServer,
        GCM_APIKEY: 'AIzaSyBmKrBxe17yEF7xD6V67DpXL7WSbDGhN7g',
        app: {
            name: 'SocIoTal UserEnv'
        },
        recaptcha_site_key : recaptcha_site_key,
        recaptcha_secret_key : recaptcha_secret_key,

        channelTypes: ['SocIoTalChannel', 'DebugChannel', 'XivelyChannel', 'ThirtyBoxesChannel'], // , 'PhoneChannel', 'GenericDeviceChannel'
        channelsJadeTemplates: [
            {type: "XivelyChannel", details: "details/xively", form: "forms/xively"},
            {type: "DebugChannel", details: "details/debug", form: "forms/debug"},
            {type: "ThirtyBoxesChannel", details: "details/30Box", form: "forms/30Box"},
            {type: "GenericDeviceChannel", details: "details/generic", form: "forms/generic"},
            {type: "SocIoTalChannel", details: "details/sociotal", form: "forms/sociotal"},
            {type: "PhoneChannel", details: "details/phone", form: "forms/phone"},
            {type: "CommunityMailChannel", details: "details/mail", form: "forms/mail"}
        ],
        facebook: {
            clientID: "539774772806896",
            clientSecret: "7ae5c38bf110537b0476905c8ac614ef"
            // callbackURL: "http://localhost:3000/auth/facebook/callback" // configured in config/routes -> /auth/facebook, /auth/facebook/callback
        },

        connectionPubSubTopic: "connection-event",
        bearerTokenLen: 8,
        activationTokenLen: 32,

        //Context manager (UC) endpoints
        contextManager: pathsContextManager,

        smtpTransportOptions: optionsSmtpTransport,
        capability_tokens_folder: "/home/developer/projects/prod/sociotal/app/controllers/security-manager/capability_tokens/",
        certs: "/home/developer/projects/prod/sociotal/app/controllers/security-manager/certs/"


    },

    //DEVELOPMENT LOCALHOST
    development: {
        port: 3000,
        db: 'mongodb://localhost/sociotalDev',
        root: rootPath,
        notifier: notifier,
        identityManagerParams: identityManagerRemoteServer,
        capabilityManagerParams: capabilityManagerServer,

        GCM_APIKEY: 'AIzaSyBmKrBxe17yEF7xD6V67DpXL7WSbDGhN7g',
        app: {
            name: 'SocIoTal UserEnv'
        },
        recaptcha_site_key : recaptcha_site_key,
        recaptcha_secret_key : recaptcha_secret_key,
        channelTypes: ['SocIoTalChannel', 'DebugChannel', 'XivelyChannel', 'ThirtyBoxesChannel'], // , 'PhoneChannel', 'GenericDeviceChannel'
        channelsJadeTemplates: [
            {type: "XivelyChannel", details: "details/xively", form: "forms/xively"},
            {type: "DebugChannel", details: "details/debug", form: "forms/debug"},
            {type: "ThirtyBoxesChannel", details: "details/30Box", form: "forms/30Box"},
            {type: "GenericDeviceChannel", details: "details/generic", form: "forms/generic"},
            {type: "SocIoTalChannel", details: "details/sociotal", form: "forms/sociotal"},
            {type: "PhoneChannel", details: "details/phone", form: "forms/phone"},
            {type: "CommunityMailChannel", details: "details/mail", form: "forms/mail"}

        ],
        facebook: {
            clientID: "539774772806896",
            clientSecret: "7ae5c38bf110537b0476905c8ac614ef"
            // callbackURL: "http://localhost:3000/auth/facebook/callback" // configured in config/routes -> /auth/facebook, /auth/facebook/callback
        },

        connectionPubSubTopic: "connection-event",
        bearerTokenLen: 8,
        activationTokenLen: 32,


        //Context manager (UC) endpoints
        contextManager: pathsContextManager,
        smtpTransportOptions: optionsSmtpTransport
    },



    //INTEGRATED VIRTUAL MACHINE LOCALHOST
    virtualMachine: {
        port: 3000,
        db: 'mongodb://localhost/sociotal',
        root: rootPath,
        notifier: notifier,
        identityManagerParams: identityManagerLocalMachine,
        capabilityManagerParams: capabilityManagerLocalMachine,

        GCM_APIKEY: 'AIzaSyBmKrBxe17yEF7xD6V67DpXL7WSbDGhN7g',
        app: {
            name: 'SocIoTal UserEnv'
        },
        recaptcha_site_key : recaptcha_site_key,
        recaptcha_secret_key : recaptcha_secret_key,
        channelTypes: ['SocIoTalChannel', 'DebugChannel', 'XivelyChannel', 'ThirtyBoxesChannel'], // , 'PhoneChannel', 'GenericDeviceChannel'
        channelsJadeTemplates: [
            {type: "XivelyChannel", details: "details/xively", form: "forms/xively"},
            {type: "DebugChannel", details: "details/debug", form: "forms/debug"},
            {type: "ThirtyBoxesChannel", details: "details/30Box", form: "forms/30Box"},
            {type: "GenericDeviceChannel", details: "details/generic", form: "forms/generic"},
            {type: "SocIoTalChannel", details: "details/sociotal", form: "forms/sociotal"},
            {type: "PhoneChannel", details: "details/phone", form: "forms/phone"},
            {type: "CommunityMailChannel", details: "details/mail", form: "forms/mail"}

        ],
        facebook: {
            clientID: "539774772806896",
            clientSecret: "7ae5c38bf110537b0476905c8ac614ef"
            // callbackURL: "http://localhost:3000/auth/facebook/callback" // configured in config/routes -> /auth/facebook, /auth/facebook/callback
        },

        connectionPubSubTopic: "connection-event",
        bearerTokenLen: 8,
        activationTokenLen: 32,


        //Context manager (UC) endpoints
        contextManager: pathsContextManager,
        smtpTransportOptions: optionsSmtpTransport
    }




};


