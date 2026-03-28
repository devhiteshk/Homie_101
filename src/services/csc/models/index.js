const mongoose = require('mongoose');

const registerModels = (conn) => {
  const CountryCityStateSchema = new mongoose.Schema(
    {
      csc: { type: String, required: true },
      city: {
        name: String, countryCode: String, stateCode: String, latitude: String, longitude: String,
      },
      state: {
        name: String, isoCode: String, countryCode: String, latitude: String, longitude: String,
      },
      country: {
        name: String, isoCode: String, flag: String, phonecode: String, currency: String,
        latitude: String, longitude: String,
        timezones: [{
          zoneName: String, gmtOffset: Number, gmtOffsetName: String, abbreviation: String, tzName: String,
        }],
      },
    },
    { timestamps: true }
  );

  // Required for $text full-text search — mirrors the original DB index
  CountryCityStateSchema.index({ csc: 'text' });

  return {
    CountryCityState: conn.model('CountryCityState', CountryCityStateSchema),
  };
};

module.exports = registerModels;
