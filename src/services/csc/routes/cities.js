const express = require('express');

module.exports = (CountryCityState) => {
  const router = express.Router();

  // GET /api/csc/cities?name=Mumbai
  // Find a city by name across all countries — useful for disambiguation
  router.get('/cities', async (req, res) => {
    const { name } = req.query;

    if (!name || name.length < 2) {
      return res.status(400).json({ success: false, message: 'City name must be at least 2 characters' });
    }

    try {
      const regex = new RegExp(`^${name}$`, 'i');
      const results = await CountryCityState.find({ 'city.name': { $regex: regex } })
        .select('city state country -_id')
        .limit(50);

      if (!results.length) {
        return res.status(404).json({ success: false, message: 'City not found' });
      }

      const formatted = results.map((r) => ({
        city: r.city,
        state: { name: r.state.name, isoCode: r.state.isoCode },
        country: { name: r.country.name, isoCode: r.country.isoCode, flag: r.country.flag },
      }));

      res.status(200).json({ success: true, count: formatted.length, results: formatted });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  return router;
};
