const express = require("express");
const multer = require("multer");
const {
  importAttendanceFileFromBuffer
} = require("../services/attendanceImportService");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/file", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "CSV or Excel file is required."
      });
    }

    const result = await importAttendanceFileFromBuffer(
      req.file.buffer,
      req.file.originalname
    );

    return res.status(200).json({
      success: true,
      message: "Attendance file import finished.",
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to import attendance file.",
      error: error.message
    });
  }
});

module.exports = router;