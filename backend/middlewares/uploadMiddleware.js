const multer = require('multer');
const path = require('path');
const fs = require('fs');

//create upload directory if not exists
const uploadDir = "uploads";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

//set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + '-' + Date.now() + path.extname(file.originalname)
    );
  },
});

//check file type
const checkFileType = function (file, cb) {
  const filetypes = /jpeg|jpg|png/;
  const extname = filetypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {  
    return cb(null, true);
  }
    else {
    cb(new Error('Invalid file type'));
  }
};

const upload = multer({
  storage: storage,
  linits: { fileSize: 2 * 1024 * 1024 }, //2MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single('coverImage');

module.exports = upload;
