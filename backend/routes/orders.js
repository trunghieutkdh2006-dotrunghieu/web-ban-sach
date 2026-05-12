const express = require("express");

const router = express.Router();

const Order = require("../models/Order");



// =========================
// TẠO ĐƠN HÀNG
// =========================

router.post("/", async (req, res) => {

    try {

        const newOrder = new Order(req.body);

        await newOrder.save();

        res.json({
            message: "Đặt hàng thành công",
            order: newOrder
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

});



// =========================
// LẤY TOÀN BỘ ĐƠN HÀNG
// =========================

router.get("/", async (req, res) => {

    try {

        const orders = await Order.find()
        .sort({ createdAt: -1 });

        res.json(orders);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

});



// =========================
// LẤY ĐƠN THEO USER
// =========================

router.get("/user/:userId", async (req, res) => {

    try {

        const orders = await Order.find({
            userId: req.params.userId
        }).sort({ createdAt: -1 });

        res.json(orders);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

});

// =========================
// CẬP NHẬT ĐỊA CHỈ / TRẠNG THÁI ĐƠN HÀNG
// =========================
router.patch("/:id", async (req, res) => {
    try {
        const updates = {};
        if (req.body.shippingAddress !== undefined) updates.shippingAddress = req.body.shippingAddress;
        if (req.body.status !== undefined) updates.status = req.body.status;

        const order = await Order.findByIdAndUpdate(req.params.id, updates, {
            new: true
        });

        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
        }

        res.json({ message: "Cập nhật đơn hàng thành công", order });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// =========================
// HỦY ĐƠN HÀNG
// =========================
router.patch("/:id/cancel", async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id, {
            status: "Đã hủy"
        }, { new: true });

        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
        }

        res.json({ message: "Đơn hàng đã được huỷ", order });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;