const express = require('express');

module.exports = (CountryCityState) => {
  const router = express.Router();

  // GET /api/csc/countries
  // Returns all unique countries with metadata
  router.get('/countries', async (req, res) => {
    try {
      const results = await CountryCityState.aggregate([
        {
          $group: {
            _id: '$country.isoCode',
            name: { $first: '$country.name' },
            isoCode: { $first: '$country.isoCode' },
            flag: { $first: '$country.flag' },
            phonecode: { $first: '$country.phonecode' },
            currency: { $first: '$country.currency' },
            latitude: { $first: '$country.latitude' },
            longitude: { $first: '$country.longitude' },
          },
        },
        { $match: { _id: { $ne: null } } },
        { $sort: { name: 1 } },
        {
          $project: {
            _id: 0,
            name: 1,
            isoCode: 1,
            flag: 1,
            phonecode: 1,
            currency: 1,
            latitude: 1,
            longitude: 1,
          },
        },
      ]);

      res.status(200).json({ success: true, count: results.length, results });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // GET /api/csc/countries/:isoCode
  // Returns a single country with full detail including timezones
  router.get('/countries/:isoCode', async (req, res) => {
    try {
      const record = await CountryCityState.findOne({
        'country.isoCode': req.params.isoCode.toUpperCase(),
      }).select('country');

      if (!record) {
        return res.status(404).json({ success: false, message: 'Country not found' });
      }

      res.status(200).json({ success: true, result: record.country });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // GET /api/csc/countries/:isoCode/states
  // Returns all states for a given country
  router.get('/countries/:isoCode/states', async (req, res) => {
    try {
      const results = await CountryCityState.aggregate([
        { $match: { 'country.isoCode': req.params.isoCode.toUpperCase() } },
        {
          $group: {
            _id: '$state.isoCode',
            name: { $first: '$state.name' },
            isoCode: { $first: '$state.isoCode' },
            countryCode: { $first: '$state.countryCode' },
            latitude: { $first: '$state.latitude' },
            longitude: { $first: '$state.longitude' },
          },
        },
        { $match: { _id: { $ne: null } } },
        { $sort: { name: 1 } },
        { $project: { _id: 0, name: 1, isoCode: 1, countryCode: 1, latitude: 1, longitude: 1 } },
      ]);

      if (!results.length) {
        return res.status(404).json({ success: false, message: 'Country not found or has no states' });
      }

      res.status(200).json({ success: true, count: results.length, results });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // GET /api/csc/countries/:isoCode/states/:stateCode/cities
  // Returns all cities in a given state
  router.get('/countries/:isoCode/states/:stateCode/cities', async (req, res) => {
    try {
      const results = await CountryCityState.find({
        'country.isoCode': req.params.isoCode.toUpperCase(),
        'state.isoCode': req.params.stateCode.toUpperCase(),
      }).select('city -_id');

      if (!results.length) {
        return res.status(404).json({ success: false, message: 'No cities found for this state' });
      }

      const cities = results.map((r) => r.city);
      res.status(200).json({ success: true, count: cities.length, results: cities });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  return router;
};
