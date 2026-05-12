const express = require("express");
const router = express.Router();
const Book = require("../models/Book");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// =========================
// MULTER CONFIG
// =========================
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
    }
});

const upload = multer({ storage });

// =========================
// GET ALL BOOKS
// =========================
router.get("/", async (req, res) => {
    try {
        const filter = {};
        if (req.query.category) {
            filter.category = String(req.query.category).trim();
        }
        const books = await Book.find(filter);
        res.json(books);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =========================
// GET ONE BOOK
// =========================
router.get("/:id", async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        res.json(book);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =========================
// ADD BOOK (hỗ trợ upload ảnh và PDF đọc thử)
// =========================
router.post("/add", upload.fields([
    { name: "image", maxCount: 1 },
    { name: "samplePdf", maxCount: 1 }
]), async (req, res) => {
    try {
        const { title, author, price, description, category } = req.body;

        const imageFile = req.files?.image?.[0];
        const sampleFile = req.files?.samplePdf?.[0];

        const imageUrl = imageFile ? `/uploads/${imageFile.filename}` : "";
        const samplePdfUrl = sampleFile ? `/uploads/${sampleFile.filename}` : "";

        const newBook = new Book({
            title,
            author,
            price: Number(price),
            description,
            category: category ? String(category).trim() : "Khác",
            image: imageUrl,
            samplePdf: samplePdfUrl
        });

        await newBook.save();

        res.json({
            message: "Thêm sách thành công",
            book: newBook
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =========================
// DELETE BOOK
// =========================
router.delete("/:id", async (req, res) => {
    try {
        const bookId = req.params.id;
        const deletedBook = await Book.findByIdAndDelete(bookId);

        if (!deletedBook) {
            return res.status(404).json({ message: "Không tìm thấy sách" });
        }

        res.json({ message: "Xóa thành công" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
});

// =========================
// UPDATE BOOK
// =========================
router.put("/:id", upload.fields([
    { name: "image", maxCount: 1 },
    { name: "samplePdf", maxCount: 1 }
]), async (req, res) => {
    try {
        const updates = {};
        const { title, author, price, description, category } = req.body;

        if (title !== undefined) updates.title = title;
        if (author !== undefined) updates.author = author;
        if (price !== undefined && price !== '') updates.price = Number(price);
        if (description !== undefined) updates.description = description;
        if (category !== undefined) updates.category = String(category).trim() || "Khác";

        const imageFile = req.files?.image?.[0];
        const sampleFile = req.files?.samplePdf?.[0];
        if (imageFile) {
            updates.image = `/uploads/${imageFile.filename}`;
        }
        if (sampleFile) {
            updates.samplePdf = `/uploads/${sampleFile.filename}`;
        }

        const updated = await Book.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: "Không tìm thấy sách" });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;