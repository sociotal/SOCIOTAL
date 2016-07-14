var debug = require('debug')('models:context');
var mongoose = require('mongoose');
var Imager = require('imager');
var env = process.env.NODE_ENV || 'development';
var config = require('../../config/config')[env];
var imagerConfig = require(config.root + '/config/imager.js');
var Schema = mongoose.Schema;


/**
 * Context Schema
 */
ContextSchema = new Schema({
  name: {type: String, default: '', trim: true},
  context_id: {type: String, default: '', trim: true},
  type: {type: String, default: '', trim: true},
  user: {type: Schema.ObjectId, ref: 'User'},
  description: {type: String, default: '', trim: true},
  tags: {type: [], default: ""},
  image: {
    cdnUri: String,
    files: []
  },
  createdAt: {type: Date, default: Date.now}

}, {collection: 'contexts', discriminatorKey: '_type'});


/**
 * Pre-remove hook
 */

ContextSchema.pre('remove', function (next) {
  var imager = new Imager(imagerConfig, 'S3');
  var files = this.image.files;

  // if there are files associated with the item, remove from the cloud too
  imager.remove(files, function (err) {
    if (err) return next(err);
  }, 'Context');

  next();
});

/**
 * Methods
 */

ContextSchema.methods = {
  uploadAndSave: function (images, cb) {

    debug("dentro upload and save");
    if (!images || !images.length) return this.save(cb);

    var imager = new Imager(imagerConfig, 'S3');
    var self = this;

    this.validate(function (err) {
      if (err) return cb(err);
      imager.upload(images, function (err, cdnUri, files) {
        if (err) return cb(err);
        if (files.length) {
          self.image = {cdnUri: cdnUri, files: files};
        }
        self.save(cb);
      }, 'channel');
    });
  }
};

/**
 * Statics
 */

ContextSchema.statics = {

  /**
   * Find channel by id
   *
   * @param {ObjectId} id
   * @param {Function} cb
   * @api private
   */

  load: function (id, cb) {
    this.findOne({_id: id})
      .populate('user', 'name email username')
      .populate('comments.user')
      .exec(cb);
  },


  list: function (options, cb) {
    var criteria = options.criteria || {};

    this.find(criteria)
      .populate('user', 'name username')
      .sort({'createdAt': -1}) // sort by date
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  },

  templates: [

    // WeatherStation template
    {
      "name": "WeatherStation",
      "type": "urn:x-org:sociotal:resource:weatherstation",
      "project": "SocIoTal",
      "deployment": "CRS4",
      "id": "",
      "attributes": [
        {
          "name": "Owner",
          "value": "ownerID",
          "type": "http://sensorml.com/ont/swe/property/RoleCode",
          "metadatas": [
            {
              "name": "DataDescription",
              "value": "string",
              "type": "http://sensorml.com/ont/swe/property/DataDescription"
            }
          ]
        },
        {
          "name": "AmbientTemperature",
          "value": "0",
          "type": "http://sensorml.com/ont/swe/property/AmbientTemperature",
          "metadatas": [
            {
              "name": "DateTimeStamp",
              "value": "20150204T094121Z",
              "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
            },
            {
              "name": "Unit",
              "value": "celsius",
              "type": "http://purl.oclc.org/NET/ssnx/qu/qu#Unit"
            },
            {
              "name": "accuracy",
              "value": "0,25",
              "type": "http://sensorml.com/ont/swe/property/QuantitativeAttributeAccuracy"
            },
            {
              "name": "DataDescription",
              "value": "float",
              "type": "http://sensorml.com/ont/swe/property/DataDescription"
            }
          ]
        },
        {
          "name": "HumidityValue",
          "value": "0",
          "type": "http://sensorml.com/ont/swe/property/HumidityValue",
          "metadatas": [
            {
              "name": "DateTimeStamp",
              "value": "20150204T094121Z",
              "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
            },
            {
              "name": "Unit",
              "value": "percentage",
              "type": "http://purl.oclc.org/NET/ssnx/qu/qu#Unit"
            },
            {
              "name": "accuracy",
              "value": "1",
              "type": "http://sensorml.com/ont/swe/property/QuantitativeAttributeAccuracy"
            },
            {
              "name": "DataDescription",
              "value": "integer",
              "type": "http://sensorml.com/ont/swe/property/DataDescription"
            }
          ]
        },
        {
          "name": "Location",
          "value": "43.472057, -3.800156",
          "type": "http://sensorml.com/ont/swe/property/Location",
          "metadatas": [
            {
              "name": "WorldGeographicReferenceSystem",
              "value": "WGS84",
              "type": "http://sensorml.com/ont/swe/property/WorldGeographicReferenceSystem"
            },
            {
              "name": "DataDescription",
              "value": "string",
              "type": "http://sensorml.com/ont/swe/property/DataDescription"
            }
          ]
        }
      ]
    }, // end WS

    // F2F
    {
      "name": "Smartphone",
      "type": "urn:x-org:sociotal:resource:smartphone",
      "project": "SocIoTal",
      "deployment": "CRS4",
      "id": "",
      "attributes": [
        {
          "name": "Owner",
          "value": "ownerID",
          "type": "http://sensorml.com/ont/swe/property/RoleCode",
          "metadatas": [
            {
              "name": "DataDescription",
              "value": "string",
              "type": "http://sensorml.com/ont/swe/property/DataDescription"
            }
          ]
        },
        {
          "name": "F2FInteraction",
          "value": "false",
          "type": "boolean",
          "metadatas": [
            {
              "name": "DiscoveredDevice",
              "value": "Nick?s MacBook Air",
              "type": "http://sensorml.com/ont/swe/property/pseudonym"
            },
            {
              "name": "SocialRelation",
              "value": "PERSONAL",
              "type": "string"
            },
            {
              "name": "Timestamp",
              "value": "20150317132543",
              "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
            },
            {
              "name": "Location",
              "value": "-0.58823666, 51.24346692",
              "type": "http://sensorml.com/ont/swe/property/Location"
            },
            {
              "name": "DiscoveredDevice",
              "value": "MIR-THUNDER",
              "type": "string"
            },
            {
              "name": "Timestamp",
              "value": "20150317130256",
              "type": "string-ISO8601"
            },
            {
              "name": "Location",
              "value": "-0.58823666, 51.24346692",
              "type": "coords"
            }
          ]

        }
      ]
    },


    {
      "name": "Bubble",
      "type": "urn:x-org:sociotal:resource:bubble",
      "project": "SocIoTal",
      "deployment": "CRS4",
      "id": "",
      "attributes": [
        {
          "name": "Owner",
          "value": "ownerID",
          "type": "http://sensorml.com/ont/swe/property/RoleCode",
          "metadatas": [
            {
              "name": "DataDescription",
              "value": "string",
              "type": "http://sensorml.com/ont/swe/property/DataDescription"
            }
          ]
        },
        {
          "name": "Organization",
          "value": "organization_name",
          "type": "http://sensorml.com/ont/swe/property/OrganizationName",
          "metadatas": [
            {
              "name": "DataDescription",
              "value": "string",
              "type": "http://sensorml.com/ont/swe/property/DataDescription"
            }]
        },
        {
          "name": "ProjectName",
          "value": "project_name",
          "type": "http://sensorml.com/ont/swe/property/PlatformName",
          "metadatas": [
            {
              "name": "DataDescription",
              "value": "string",
              "type": "http://sensorml.com/ont/swe/property/DataDescription"
            }]
        }
      ]
    },

    {
      "name": "Blank",
      "type": "urn:x-org:sociotal:resource:generic",
      "project": "SocIoTal",
      "deployment": "CRS4",
      "id": "",
      "attributes": [
        {
          "name": "Owner",
          "value": "ownerID",
          "type": "http://sensorml.com/ont/swe/property/RoleCode",
          "metadatas": [
            {
              "name": "DataDescription",
              "value": "string",
              "type": "http://sensorml.com/ont/swe/property/DataDescription"
            }
          ]
        }
      ]
    }
  ],
  templatesAttributesComplete: [
    {
      "name": "Owner",
      "value": "ownerID",
      "type": "http://sensorml.com/ont/swe/property/RoleCode",
      "metadatas": [
        {
          "name": "DataDescription",
          "value": "string",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }]
    },
    {
      "name": "AmbientTemperature",
      "value": "0",
      "type": "http://sensorml.com/ont/swe/property/AmbientTemperature",
      "metadatas": [
        {
          "name": "DateTimeStamp",
          "value": "20150204T094121Z",
          "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
        },
        {
          "name": "Unit",
          "value": "celsius",
          "type": "http://purl.oclc.org/NET/ssnx/qu/qu#Unit"
        },
        {
          "name": "accuracy",
          "value": "0,25",
          "type": "http://sensorml.com/ont/swe/property/QuantitativeAttributeAccuracy"
        },
        {
          "name": "DataDescription",
          "value": "float",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "HumidityValue",
      "value": "0",
      "type": "http://sensorml.com/ont/swe/property/HumidityValue",
      "metadatas": [
        {
          "name": "DateTimeStamp",
          "value": "20150204T094121Z",
          "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
        },
        {
          "name": "Unit",
          "value": "percentage",
          "type": "http://purl.oclc.org/NET/ssnx/qu/qu#Unit"
        },
        {
          "name": "accuracy",
          "value": "1",
          "type": "http://sensorml.com/ont/swe/property/QuantitativeAttributeAccuracy"
        },
        {
          "name": "DataDescription",
          "value": "integer",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "Location",
      "value": "43.472057, -3.800156",
      "type": "http://sensorml.com/ont/swe/property/Location",
      "metadatas": [
        {
          "name": "WorldGeographicReferenceSystem",
          "value": "WGS84",
          "type": "http://sensorml.com/ont/swe/property/WorldGeographicReferenceSystem"
        },
        {
          "name": "DataDescription",
          "value": "string",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "F2FInteraction",
      "value": "false",
      "type": "boolean",
      "metadatas": [
        {
          "name": "DiscoveredDevice",
          "value": "Nick?s MacBook Air",
          "type": "http://sensorml.com/ont/swe/property/pseudonym"
        },
        {
          "name": "SocialRelation",
          "value": "PERSONAL",
          "type": "string"
        },
        {
          "name": "Timestamp",
          "value": "20150317132543",
          "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
        },
        {
          "name": "Location",
          "value": "-0.58823666, 51.24346692",
          "type": "http://sensorml.com/ont/swe/property/Location"
        },
        {
          "name": "DiscoveredDevice",
          "value": "MIR-THUNDER",
          "type": "string"
        },
        {
          "name": "Timestamp",
          "value": "20150317130256",
          "type": "string-ISO8601"
        },
        {
          "name": "Location",
          "value": "-0.58823666, 51.24346692",
          "type": "coords"
        }
      ]

    },
    {
      "name": "Organization",
      "value": "organization_name",
      "type": "http://sensorml.com/ont/swe/property/OrganizationName",
      "metadatas": [
        {
          "name": "DataDescription",
          "value": "string",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }]
    },
    {
      "name": "ProjectName",
      "value": "project_name",
      "type": "http://sensorml.com/ont/swe/property/PlatformName",
      "metadatas": [
        {
          "name": "DataDescription",
          "value": "string",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }]
    },
    {
      "name": "Atmospheric_Pressure",
      "value": "1",
      "type": "https://api.smartsantander.eu/v2/phenomena/atmosphericPressure",
      "metadatas": [{
        "name": "DateTimeStamp",
        "value": "20141030T113343Z",
        "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
      },
        {
          "name": "Unit",
          "value": "bar",
          "type": "http://purl.oclc.org/NET/ssnx/qu/qu#Unit"
        },
        {
          "name": "accuracy",
          "value": "0.5",
          "type": "http://sensorml.com/ont/swe/property/QuantitativeAttributeAccuracy"
        },
        {
          "name": "DataDescription",
          "value": "float",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "BatteryLevel",
      "value": "80",
      "type": "https://api.smartsantander.eu/v2/phenomena/batteryLevel",
      "metadatas": [
        {
          "name": "DateTimeStamp",
          "value": "20141030T113343Z",
          "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
        },
        {
          "name": "Unit",
          "value": "percentage",
          "type": "http://purl.oclc.org/NET/ssnx/qu/qu#Unit"
        },
        {
          "name": "accuracy",
          "value": "0.5",
          "type": "http://sensorml.com/ont/swe/property/QuantitativeAttributeAccuracy"
        },
        {
          "name": "DataDescription",
          "value": "float",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "Atmospheric_airParticles",
      "value": "0.016",
      "type": "https://api.smartsantander.eu/v2/phenomena/chemicalAgentAtmosphericConcentration:airParticles",
      "metadatas": [{
        "name": "DateTimeStamp",
        "value": "20141030T113343Z",
        "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
      },
        {
          "name": "Unit",
          "value": "milligramPerCubicMetre",
          "type": "http://purl.oclc.org/NET/ssnx/qu/qu#Unit"
        },
        {
          "name": "accuracy",
          "value": "0.005",
          "type": "http://sensorml.com/ont/swe/property/QuantitativeAttributeAccuracy"
        },
        {
          "name": "DataDescription",
          "value": "float",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "Atmospheric_CO",
      "value": "0",
      "type": "https://api.smartsantander.eu/v2/phenomena/chemicalAgentAtmosphericConcentration:CO",
      "metadatas": [{
        "name": "DateTimeStamp",
        "value": "20141030T113343Z",
        "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
      },
        {
          "name": "Unit",
          "value": "milligramPerCubicMetre",
          "type": "http://purl.oclc.org/NET/ssnx/qu/qu#Unit"
        },
        {
          "name": "accuracy",
          "value": "0.5",
          "type": "http://sensorml.com/ont/swe/property/QuantitativeAttributeAccuracy"
        },
        {
          "name": "DataDescription",
          "value": "float",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "Atmospheric_CO2",
      "value": "0",
      "type": "string",
      "metadatas": [{
        "name": "DateTimeStamp",
        "value": "20141030T113343Z",
        "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
      },
        {
          "name": "Unit",
          "value": "milligramPerCubicMetre",
          "type": "http://purl.oclc.org/NET/ssnx/qu/qu#Unit"
        },
        {
          "name": "accuracy",
          "value": "0.5",
          "type": "http://sensorml.com/ont/swe/property/QuantitativeAttributeAccuracy"
        },
        {
          "name": "DataDescription",
          "value": "float",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "Atmospheric_NO2",
      "value": "57",
      "type": "https://api.smartsantander.eu/v2/phenomena/chemicalAgentAtmosphericConcentration:NO2",
      "metadatas": [{
        "name": "DateTimeStamp",
        "value": "20141030T113343Z",
        "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
      },
        {
          "name": "Unit",
          "value": "microgramPerCubicMetre",
          "type": "http://purl.oclc.org/NET/ssnx/qu/qu#Unit"
        },
        {
          "name": "accuracy",
          "value": "1",
          "type": "http://sensorml.com/ont/swe/property/QuantitativeAttributeAccuracy"
        },
        {
          "name": "DataDescription",
          "value": "float",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "Atmospheric_O3",
      "value": "48",
      "type": "https://api.smartsantander.eu/v2/phenomena/chemicalAgentAtmosphericConcentration:O3",
      "metadatas": [{
        "name": "DateTimeStamp",
        "value": "20141030T113343Z",
        "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
      },
        {
          "name": "Unit",
          "value": "microgramPerCubicMetre",
          "type": "http://purl.oclc.org/NET/ssnx/qu/qu#Unit"
        },
        {
          "name": "accuracy",
          "value": "1",
          "type": "http://sensorml.com/ont/swe/property/QuantitativeAttributeAccuracy"
        },
        {
          "name": "DataDescription",
          "value": "float",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "ElectricCurrent",
      "value": "3",
      "type": "https://api.smartsantander.eu/v2/phenomena/electricCurrent",
      "metadatas": [{
        "name": "DateTimeStamp",
        "value": "20141030T113343Z",
        "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
      },
        {
          "name": "Unit",
          "value": "ampere",
          "type": "http://purl.oclc.org/NET/ssnx/qu/qu#Unit"
        },
        {
          "name": "accuracy",
          "value": "0.5",
          "type": "http://sensorml.com/ont/swe/property/QuantitativeAttributeAccuracy"
        },
        {
          "name": "DataDescription",
          "value": "float",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "Illuminance",
      "value": "200",
      "type": "https://api.smartsantander.eu/v2/phenomena/illuminance",
      "metadatas": [{
        "name": "DateTimeStamp",
        "value": "20141030T113343Z",
        "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
      },
        {
          "name": "Unit",
          "value": "lux",
          "type": "http://purl.oclc.org/NET/ssnx/qu/qu#Unit"
        },
        {
          "name": "accuracy",
          "value": "1",
          "type": "http://sensorml.com/ont/swe/property/QuantitativeAttributeAccuracy"
        },
        {
          "name": "DataDescription",
          "value": "float",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "Mass",
      "value": "1",
      "type": "https://api.smartsantander.eu/v2/phenomena/mass",
      "metadatas": [{
        "name": "DateTimeStamp",
        "value": "20141030T113343Z",
        "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
      },
        {
          "name": "Unit",
          "value": "kilogram",
          "type": "http://purl.oclc.org/NET/ssnx/qu/qu#Unit"
        },
        {
          "name": "accuracy",
          "value": "0.005",
          "type": "http://sensorml.com/ont/swe/property/QuantitativeAttributeAccuracy"
        },
        {
          "name": "DataDescription",
          "value": "float",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "Rainfall",
      "value": "0.4",
      "type": "https://api.smartsantander.eu/v2/phenomena/rainfall",
      "metadatas": [{
        "name": "DateTimeStamp",
        "value": "20141030T113343Z",
        "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
      },
        {
          "name": "Unit",
          "value": "millimetrePerHour",
          "type": "http://purl.oclc.org/NET/ssnx/qu/qu#Unit"
        },
        {
          "name": "accuracy",
          "value": "0.05",
          "type": "http://sensorml.com/ont/swe/property/QuantitativeAttributeAccuracy"
        },
        {
          "name": "DataDescription",
          "value": "float",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "SoundPressureLevel_ambient",
      "value": "0.4",
      "type": "https://api.smartsantander.eu/v2/phenomena/soundPressureLevel:ambient",
      "metadatas": [{
        "name": "DateTimeStamp",
        "value": "20141030T113343Z",
        "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
      },
        {
          "name": "Unit",
          "value": "decibel",
          "type": "http://purl.oclc.org/NET/ssnx/qu/qu#Unit"
        },
        {
          "name": "accuracy",
          "value": "0.5",
          "type": "http://sensorml.com/ont/swe/property/QuantitativeAttributeAccuracy"
        },
        {
          "name": "DataDescription",
          "value": "integer",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "Speed_average",
      "value": "10",
      "type": "https://api.smartsantander.eu/v2/phenomena/speed:average",
      "metadatas": [{
        "name": "DateTimeStamp",
        "value": "20141030T113343Z",
        "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
      },
        {
          "name": "Unit",
          "value": "kilometrePerHour",
          "type": "http://purl.oclc.org/NET/ssnx/qu/qu#Unit"
        },
        {
          "name": "accuracy",
          "value": "0.5",
          "type": "http://sensorml.com/ont/swe/property/QuantitativeAttributeAccuracy"
        },
        {
          "name": "DataDescription",
          "value": "float",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "WindSpeed",
      "value": "50",
      "type": "https://api.smartsantander.eu/v2/phenomena/windSpeed",
      "metadatas": [{
        "name": "DateTimeStamp",
        "value": "20141030T113343Z",
        "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
      },
        {
          "name": "Unit",
          "value": "kilometrePerHour",
          "type": "http://purl.oclc.org/NET/ssnx/qu/qu#Unit"
        },
        {
          "name": "accuracy",
          "value": "0.5",
          "type": "http://sensorml.com/ont/swe/property/QuantitativeAttributeAccuracy"
        },
        {
          "name": "DataDescription",
          "value": "float",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "PresenceState_people",
      "value": "1",
      "type": "https://api.smartsantander.eu/v2/phenomena/presenceState:people",
      "metadatas": [{
        "name": "DateTimeStamp",
        "value": "20141030T113343Z",
        "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
      },
        {
          "name": "Unit",
          "value": "index",
          "type": "http://purl.oclc.org/NET/ssnx/qu/qu#Unit"
        },
        {
          "name": "accuracy",
          "value": "1",
          "type": "http://sensorml.com/ont/swe/property/QuantitativeAttributeAccuracy"
        },
        {
          "name": "DataDescription",
          "value": "integer",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },

    {
      "name": "Domain",
      "value": "sociotal",
      "type": "urn:ietf:params:scim:schemas:core:2.0:domain",
      "metadatas": [
        {
          "name": "DataDescription",
          "value": "string",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "Department",
      "value": "umu",
      "type": "urn:ietf:params:scim:schemas:core:2.0:department",
      "metadatas": [
        {
          "name": "DataDescription",
          "value": "string",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "StreetAddress",
      "value": "Campus de Espinardo",
      "type": "urn:ietf:params:scim:schemas:core:2.0:streetAddress",
      "metadatas": [
        {
          "name": "DataDescription",
          "value": "string",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "Locality",
      "value": "Espinardo-Murcia",
      "type": "urn:ietf:params:scim:schemas:core:2.0:locality",
      "metadatas": [
        {
          "name": "DataDescription",
          "value": "string",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "PostalCode",
      "value": "30100",
      "type": "urn:ietf:params:scim:schemas:core:2.0:postalCode",
      "metadatas": [
        {
          "name": "DataDescription",
          "value": "string",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "Country",
      "value": "Spain",
      "type": "urn:ietf:params:scim:schemas:core:2.0:country",
      "metadatas": [
        {
          "name": "DataDescription",
          "value": "string",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    }
  ],

  templatesAttributesForWeatherStation: [
    {
      "name": "AmbientTemperature",
      "value": "0",
      "type": "http://sensorml.com/ont/swe/property/AmbientTemperature",
      "metadatas": [
        {
          "name": "DateTimeStamp",
          "value": "20150204T094121Z",
          "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
        },
        {
          "name": "Unit",
          "value": "celsius",
          "type": "http://purl.oclc.org/NET/ssnx/qu/qu#Unit"
        },
        {
          "name": "accuracy",
          "value": "0,25",
          "type": "http://sensorml.com/ont/swe/property/QuantitativeAttributeAccuracy"
        },
        {
          "name": "DataDescription",
          "value": "float",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "Location",
      "value": "43.472057, -3.800156",
      "type": "http://sensorml.com/ont/swe/property/Location",
      "metadatas": [
        {
          "name": "WorldGeographicReferenceSystem",
          "value": "WGS84",
          "type": "http://sensorml.com/ont/swe/property/WorldGeographicReferenceSystem"
        },
        {
          "name": "DataDescription",
          "value": "string",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "HumidityValue",
      "value": "0",
      "type": "http://sensorml.com/ont/swe/property/HumidityValue",
      "metadatas": [
        {
          "name": "DateTimeStamp",
          "value": "20150204T094121Z",
          "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
        },
        {
          "name": "Unit",
          "value": "percentage",
          "type": "http://purl.oclc.org/NET/ssnx/qu/qu#Unit"
        },
        {
          "name": "accuracy",
          "value": "1",
          "type": "http://sensorml.com/ont/swe/property/QuantitativeAttributeAccuracy"
        },
        {
          "name": "DataDescription",
          "value": "integer",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },

    {
      "name": "Atmospheric_Pressure",
      "value": "1",
      "type": "https://api.smartsantander.eu/v2/phenomena/atmosphericPressure",
      "metadatas": [{
        "name": "DateTimeStamp",
        "value": "20141030T113343Z",
        "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
      },
        {
          "name": "Unit",
          "value": "bar",
          "type": "http://purl.oclc.org/NET/ssnx/qu/qu#Unit"
        },
        {
          "name": "accuracy",
          "value": "0.5",
          "type": "http://sensorml.com/ont/swe/property/QuantitativeAttributeAccuracy"
        },
        {
          "name": "DataDescription",
          "value": "float",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "BatteryLevel",
      "value": "80",
      "type": "https://api.smartsantander.eu/v2/phenomena/batteryLevel",
      "metadatas": [
        {
          "name": "DateTimeStamp",
          "value": "20141030T113343Z",
          "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
        },
        {
          "name": "Unit",
          "value": "percentage",
          "type": "http://purl.oclc.org/NET/ssnx/qu/qu#Unit"
        },
        {
          "name": "accuracy",
          "value": "0.5",
          "type": "http://sensorml.com/ont/swe/property/QuantitativeAttributeAccuracy"
        },
        {
          "name": "DataDescription",
          "value": "float",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "Atmospheric_airParticles",
      "value": "0",
      "type": "https://api.smartsantander.eu/v2/phenomena/chemicalAgentAtmosphericConcentration:airParticles",
      "metadatas": [{
        "name": "DateTimeStamp",
        "value": "20141030T113343Z",
        "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
      },
        {
          "name": "Unit",
          "value": "milligramPerCubicMetre",
          "type": "http://purl.oclc.org/NET/ssnx/qu/qu#Unit"
        },
        {
          "name": "accuracy",
          "value": "0.005",
          "type": "http://sensorml.com/ont/swe/property/QuantitativeAttributeAccuracy"
        },
        {
          "name": "DataDescription",
          "value": "float",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "Atmospheric_CO2",
      "value": "0",
      "type": "string",
      "metadatas": [{
        "name": "DateTimeStamp",
        "value": "20141030T113343Z",
        "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
      },
        {
          "name": "Unit",
          "value": "milligramPerCubicMetre",
          "type": "http://purl.oclc.org/NET/ssnx/qu/qu#Unit"
        },
        {
          "name": "accuracy",
          "value": "0.5",
          "type": "http://sensorml.com/ont/swe/property/QuantitativeAttributeAccuracy"
        },
        {
          "name": "DataDescription",
          "value": "float",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "Atmospheric_CO",
      "value": "0",
      "type": "https://api.smartsantander.eu/v2/phenomena/chemicalAgentAtmosphericConcentration:CO",
      "metadatas": [{
        "name": "DateTimeStamp",
        "value": "20141030T113343Z",
        "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
      },
        {
          "name": "Unit",
          "value": "milligramPerCubicMetre",
          "type": "http://purl.oclc.org/NET/ssnx/qu/qu#Unit"
        },
        {
          "name": "accuracy",
          "value": "0.5",
          "type": "http://sensorml.com/ont/swe/property/QuantitativeAttributeAccuracy"
        },
        {
          "name": "DataDescription",
          "value": "float",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "Atmospheric_NO2",
      "value": "57",
      "type": "https://api.smartsantander.eu/v2/phenomena/chemicalAgentAtmosphericConcentration:NO2",
      "metadatas": [{
        "name": "DateTimeStamp",
        "value": "20141030T113343Z",
        "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
      },
        {
          "name": "Unit",
          "value": "microgramPerCubicMetre",
          "type": "http://purl.oclc.org/NET/ssnx/qu/qu#Unit"
        },
        {
          "name": "accuracy",
          "value": "1",
          "type": "http://sensorml.com/ont/swe/property/QuantitativeAttributeAccuracy"
        },
        {
          "name": "DataDescription",
          "value": "float",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "Atmospheric_O3",
      "value": "48",
      "type": "https://api.smartsantander.eu/v2/phenomena/chemicalAgentAtmosphericConcentration:O3",
      "metadatas": [{
        "name": "DateTimeStamp",
        "value": "20141030T113343Z",
        "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
      },
        {
          "name": "Unit",
          "value": "microgramPerCubicMetre",
          "type": "http://purl.oclc.org/NET/ssnx/qu/qu#Unit"
        },
        {
          "name": "accuracy",
          "value": "1",
          "type": "http://sensorml.com/ont/swe/property/QuantitativeAttributeAccuracy"
        },
        {
          "name": "DataDescription",
          "value": "float",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "Illuminance",
      "value": "200",
      "type": "https://api.smartsantander.eu/v2/phenomena/illuminance",
      "metadatas": [{
        "name": "DateTimeStamp",
        "value": "20141030T113343Z",
        "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
      },
        {
          "name": "Unit",
          "value": "lux",
          "type": "http://purl.oclc.org/NET/ssnx/qu/qu#Unit"
        },
        {
          "name": "accuracy",
          "value": "1",
          "type": "http://sensorml.com/ont/swe/property/QuantitativeAttributeAccuracy"
        },
        {
          "name": "DataDescription",
          "value": "float",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "Rainfall",
      "value": "0.4",
      "type": "https://api.smartsantander.eu/v2/phenomena/rainfall",
      "metadatas": [{
        "name": "DateTimeStamp",
        "value": "20141030T113343Z",
        "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
      },
        {
          "name": "Unit",
          "value": "millimetrePerHour",
          "type": "http://purl.oclc.org/NET/ssnx/qu/qu#Unit"
        },
        {
          "name": "accuracy",
          "value": "0.05",
          "type": "http://sensorml.com/ont/swe/property/QuantitativeAttributeAccuracy"
        },
        {
          "name": "DataDescription",
          "value": "float",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "SoundPressureLevel_ambient",
      "value": "0.4",
      "type": "https://api.smartsantander.eu/v2/phenomena/soundPressureLevel:ambient",
      "metadatas": [{
        "name": "DateTimeStamp",
        "value": "20141030T113343Z",
        "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
      },
        {
          "name": "Unit",
          "value": "decibel",
          "type": "http://purl.oclc.org/NET/ssnx/qu/qu#Unit"
        },
        {
          "name": "accuracy",
          "value": "0.5",
          "type": "http://sensorml.com/ont/swe/property/QuantitativeAttributeAccuracy"
        },
        {
          "name": "DataDescription",
          "value": "integer",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "WindSpeed",
      "value": "50",
      "type": "https://api.smartsantander.eu/v2/phenomena/windSpeed",
      "metadatas": [{
        "name": "DateTimeStamp",
        "value": "20141030T113343Z",
        "type": "http://sensorml.com/ont/swe/property/DateTimeStamp"
      },
        {
          "name": "Unit",
          "value": "kilometrePerHour",
          "type": "http://purl.oclc.org/NET/ssnx/qu/qu#Unit"
        },
        {
          "name": "accuracy",
          "value": "0.5",
          "type": "http://sensorml.com/ont/swe/property/QuantitativeAttributeAccuracy"
        },
        {
          "name": "DataDescription",
          "value": "float",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    }
  ],

  templatesAttributesForBubble: [
    {
      "name": "Owner",
      "value": "ownerID",
      "type": "http://sensorml.com/ont/swe/property/RoleCode",
      "metadatas": [
        {
          "name": "DataDescription",
          "value": "string",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }]
    },
    {
      "name": "Organization",
      "value": "organization_name",
      "type": "http://sensorml.com/ont/swe/property/OrganizationName",
      "metadatas": [
        {
          "name": "DataDescription",
          "value": "string",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }]
    },
    {
      "name": "ProjectName",
      "value": "project_name",
      "type": "http://sensorml.com/ont/swe/property/PlatformName",
      "metadatas": [
        {
          "name": "DataDescription",
          "value": "string",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }]
    },
    {
      "name": "Domain",
      "value": "sociotal",
      "type": "urn:ietf:params:scim:schemas:core:2.0:domain",
      "metadatas": [
        {
          "name": "DataDescription",
          "value": "string",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "Department",
      "value": "umu",
      "type": "urn:ietf:params:scim:schemas:core:2.0:department",
      "metadatas": [
        {
          "name": "DataDescription",
          "value": "string",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "StreetAddress",
      "value": "Campus de Espinardo",
      "type": "urn:ietf:params:scim:schemas:core:2.0:streetAddress",
      "metadatas": [
        {
          "name": "DataDescription",
          "value": "string",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "Locality",
      "value": "Espinardo-Murcia",
      "type": "urn:ietf:params:scim:schemas:core:2.0:locality",
      "metadatas": [
        {
          "name": "DataDescription",
          "value": "string",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "PostalCode",
      "value": "30100",
      "type": "urn:ietf:params:scim:schemas:core:2.0:postalCode",
      "metadatas": [
        {
          "name": "DataDescription",
          "value": "string",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    },
    {
      "name": "Country",
      "value": "Spain",
      "type": "urn:ietf:params:scim:schemas:core:2.0:country",
      "metadatas": [
        {
          "name": "DataDescription",
          "value": "string",
          "type": "http://sensorml.com/ont/swe/property/DataDescription"
        }
      ]
    }

  ]

};


mongoose.model('ContextSchema', ContextSchema);
//exports.ChannelSchema = ChannelSchema;
module.exports = ContextSchema;


// Car template
//{   "type": "Car",
//    "id": "",
//    "attributes": [
//        {
//            "name": "Speed",
//            "value": "0",
//            "type": "int",
//            "metadatas": [ {
//                "name": "Unit ",
//                "value": "int",
//                "type": "Km/h"
//            },
//                {
//                    "name": "DataDescription",
//                    "value": "integer",
//                    "type": "http://sensorml.com/ont/swe/property/DataDescription"
//                }
//            ]
//        },
//        {
//            "name": "Fuel",
//            "value": "0",
//            "type": "http://sensorml.com/ont/swe/property/Fuel",
//            "metadatas": [ {
//                "name": "Unit ",
//                "value": "float",
//                "type": "Lt"
//            },
//                {
//                    "name": "DataDescription",
//                    "value": "float",
//                    "type": "http://sensorml.com/ont/swe/property/DataDescription"
//                }
//            ]
//        }
//
//    ]
//},
//// Person
//{   "type": "Person",
//    "id": "",
//    "attributes": [
//        {
//            "name": "Age",
//            "value": "0",
//            "type": "http://sensorml.com/ont/swe/property/Age",
//            "metadatas": [
//                {
//                    "name": "DataDescription",
//                    "value": "integer",
//                    "type": "http://sensorml.com/ont/swe/property/DataDescription"
//                }
//            ]
//        },
//        {
//            "name": "Height",
//            "value": "186",
//            "type": "http://sensorml.com/ont/swe/property/Height",
//            "metadatas": [
//                {
//                    "name": "DataDescription",
//                    "value": "float",
//                    "type": "http://sensorml.com/ont/swe/property/DataDescription"
//                }
//            ]
//        },
//        {
//            "name": "Weight",
//            "value": "81",
//            "type": "http://sensorml.com/ont/swe/property/Weight",
//            "metadatas": [
//                {
//                    "name": "DataDescription",
//                    "value": "float",
//                    "type": "http://sensorml.com/ont/swe/property/DataDescription"
//                }
//            ]
//        }
//
//    ]
//},
//// Room
//{   "type": "Room",
//    "id": "",
//    "attributes": [
//        {
//            "name": "Light",
//            "value": "0",
//            "type": "http://sensorml.com/ont/swe/property/light",
//            "metadatas": [
//                {
//                    "name": "DataDescription",
//                    "value": "float",
//                    "type": "http://sensorml.com/ont/swe/property/DataDescription"
//                }
//            ]
//        }
//    ]
//},
