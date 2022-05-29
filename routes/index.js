const express = require('express');
const multipart = require('connect-multiparty');
const multipartMiddleware = multipart()
const router = express.Router();
const { uploadFile } = require('../services/file_upload_service');

/* POST media file. */
router.post('/upload', multipartMiddleware,uploadFile);

module.exports = router;
