const express = require('express');

module.exports = (CountryCityState) => {
  const router = express.Router();

  // GET /api/csc/search?search=query&limit=15&offSet=0
  router.get('/search', async (req, res) => {
    const { search } = req.query;
    const limit = req.query.limit ? req.query.limit : 15;
    const offSet = req.query.offSet ? req.query.offSet : 0;

    if (!search || search.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search length must be greater than 3 characters',
      });
    }

    try {
      // Full-text search (uses MongoDB text index on csc field)
      const fullTextSearch = await CountryCityState.find(
        { $text: { $search: search } }
      )
        .select('csc')
        .limit(Number(limit))
        .skip(Number(offSet));

      // Regex autocomplete search
      const regex = new RegExp(`${search}`, 'gi');
      const autocompleteCSCQuery = CountryCityState.find({
        $or: [{ csc: { $regex: regex } }],
      })
        .select('csc')
        .limit(Number(limit))
        .skip(Number(offSet));

      const [fulltextsearch, autocompletecscquery] = await Promise.all([
        fullTextSearch,
        autocompleteCSCQuery,
      ]);

      // Merge: full-text results first, then regex results not already included
      const cscIds = fulltextsearch.map((csc) => csc._id.toString());
      const filteredAutoCompleteSearchQuery = autocompletecscquery.filter(
        (csc) => !cscIds.includes(csc._id.toString())
      );

      res.status(200).json({
        success: true,
        results: [...fulltextsearch, ...filteredAutoCompleteSearchQuery],
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  return router;
};
