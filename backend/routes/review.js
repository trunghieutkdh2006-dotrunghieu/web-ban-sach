const express = require("express");

const router = express.Router();

const Review = require("../models/Review");



// =========================
// THÊM REVIEW
// =========================

router.post("/", async (req, res) => {

    try {

        const newReview = new Review(req.body);

        await newReview.save();

        res.json({
            message: "Đánh giá thành công",
            review: newReview
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

});



// =========================
// LẤY TẤT CẢ REVIEW
// =========================
router.get("/", async (req, res) => {
    try {
        const reviews = await Review.find().sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// =========================
// LẤY REVIEW THEO SÁCH
// =========================

router.get("/:bookId", async (req, res) => {

    try {

        const reviews = await Review.find({
            bookId: req.params.bookId
        }).sort({ createdAt: -1 });

        res.json(reviews);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

});



module.exports = router;