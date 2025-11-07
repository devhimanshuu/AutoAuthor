const express = require('express');
const router = express.Router();
const {generateChapterContent,generateOutline} = require('../controllers/aiController');

const {protect} = require('../middlewares/authMiddleware');

//apply protect middleware to all AI routes
router.use(protect);

router.post('/generate-outline', generateOutline);
router.post('/generate-chapter', generateChapterContent);

module.exports = router;