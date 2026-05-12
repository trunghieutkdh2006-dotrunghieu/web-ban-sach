const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const User = require("../models/User");

// =========================
// GET ALL USERS
// =========================
router.get("/", async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: "Lỗi server", error: err.message });
    }
});

// =========================
// DELETE USER
// =========================
router.delete("/:id", async (req, res) => {
    try {
        const deleted = await User.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Không tìm thấy user" });
        res.json({ message: "Xóa user thành công" });
    } catch (err) {
        res.status(500).json({ message: "Lỗi server", error: err.message });
    }
});

// =========================
// CHANGE ROLE (admin/user)
// =========================
router.patch("/:id/role", async (req, res) => {
    try {
        const { role } = req.body;
        if (!["admin", "user"].includes(role)) {
            return res.status(400).json({ message: "Role không hợp lệ" });
        }
        const updated = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select("-password");
        if (!updated) return res.status(404).json({ message: "Không tìm thấy user" });
        res.json({ message: "Cập nhật quyền thành công", user: updated });
    } catch (err) {
        res.status(500).json({ message: "Lỗi server", error: err.message });
    }
});

// =========================
// TOGGLE LOCK/UNLOCK
// =========================
router.patch("/:id/lock", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "Không tìm thấy user" });

        user.isLocked = !user.isLocked;
        await user.save();

        res.json({
            message: user.isLocked ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản",
            isLocked: user.isLocked
        });
    } catch (err) {
        res.status(500).json({ message: "Lỗi server", error: err.message });
    }
});

// =========================
// IMPORT USERS FROM EXCEL / CSV
// =========================
router.post("/import", async (req, res) => {
    try {
        const { users } = req.body;
        if (!Array.isArray(users)) {
            return res.status(400).json({ message: "Dữ liệu import không hợp lệ" });
        }

        const created = [];
        const skipped = [];

        for (const item of users) {
            const username = String(item.username || item.name || "").trim();
            const email = String(item.email || "").trim().toLowerCase();
            const password = String(item.password || item.pass || "12345678").trim();
            const role = ["admin", "user"].includes(String(item.role || "").trim().toLowerCase())
                ? String(item.role || "user").trim().toLowerCase()
                : "user";
            const isLocked = String(item.isLocked || item.locked || "false").trim().toLowerCase() === "true";

            if (!username || !email) {
                skipped.push({ email, reason: "Thiếu username hoặc email" });
                continue;
            }

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                skipped.push({ email, reason: "Email đã tồn tại" });
                continue;
            }

            const hashedPassword = await bcrypt.hash(password || "12345678", 10);
            const newUser = new User({ username, email, password: hashedPassword, role, isLocked });
            await newUser.save();
            created.push({ username, email, role, isLocked });
        }

        res.json({
            message: "Import hoàn tất",
            createdCount: created.length,
            skipped,
            created
        });
    } catch (err) {
        res.status(500).json({ message: "Lỗi server", error: err.message });
    }
});

// =========================
// UPDATE PROFILE
// =========================
router.patch("/:id/profile", async (req, res) => {
    try {
        const { name, address, phone, city, state } = req.body;
        const updates = {};
        
        if (name !== undefined) updates.name = name;
        if (address !== undefined) updates.address = address;
        if (phone !== undefined) updates.phone = phone;
        if (city !== undefined) updates.city = city;
        if (state !== undefined) updates.state = state;

        const updated = await User.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true }
        ).select("-password");

        if (!updated) return res.status(404).json({ message: "Không tìm thấy user" });
        res.json({ message: "Cập nhật hồ sơ thành công", user: updated });
    } catch (err) {
        res.status(500).json({ message: "Lỗi server", error: err.message });
    }
});

module.exports = router;