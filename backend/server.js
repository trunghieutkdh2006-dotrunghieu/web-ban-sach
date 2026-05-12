// // const express = require("express");
// // const mongoose = require("mongoose");
// // const cors = require("cors");
// // const path = require("path");
// // require("dotenv").config();

// // const http = require("http");
// // const { Server } = require("socket.io");

// // const app = express();
// // const server = http.createServer(app);

// // // =========================
// // // SOCKET.IO
// // // =========================
// // const io = new Server(server, {
// //     cors: { origin: "*" }
// // });

// // app.set("io", io);

// // io.on("connection", (socket) => {
// //     console.log("Admin connected:", socket.id);
// // });

// // // =========================
// // // MIDDLEWARE
// // // =========================
// // app.use(cors());
// // app.use(express.json());

// // // =========================
// // // ✅ API ROUTES — phải đặt TRƯỚC static và wildcard
// // // =========================
// // const bookRoutes = require("./routes/books");
// // const authRoutes = require("./routes/auth");
// // const orderRoutes = require("./routes/orders");
// // const reviewRoutes = require("./routes/review");
// // const userRoutes = require("./routes/user");

// // app.use("/api/books", bookRoutes);
// // app.use("/api/auth", authRoutes);
// // app.use("/api/orders", orderRoutes);
// // app.use("/api/reviews", reviewRoutes);
// // app.use("/api/users", userRoutes);

// // // =========================
// // // MONGO
// // // =========================
// // mongoose.connect(process.env.MONGO_URI)
// //     .then(() => console.log("MongoDB Connected"))
// //     .catch(err => console.log(err));

// // // =========================
// // // ✅ FRONTEND STATIC — đặt SAU routes API
// // // =========================
// // app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// // app.use(express.static(path.join(__dirname, "../frontend")));  // ← thêm dòng này

// // // ✅ Wildcard chỉ dành cho GET (không chặn DELETE, PUT, POST)
// // app.get("*", (req, res) => {
// //     res.sendFile(path.join(__dirname, "../frontend/index.html"));
// // });

// // // =========================
// // // START
// // // =========================
// // const PORT = 5001;
// // server.listen(PORT, () => {
// //     console.log("Server running on", PORT);
// // });
// // // POST thêm sách
// // app.post("/api/books/add", async (req, res) => {
// //     try {
// //         const { title, author, price, image, description } = req.body;

// //         const newBook = new Book({
// //             title,
// //             author,
// //             price,
// //             image, // 👈 BẮT BUỘC PHẢI CÓ
// //             description
// //         });

// //         await newBook.save();
// //         res.status(201).json(newBook);

// //     } catch (err) {
// //         console.log(err);
// //         res.status(500).json({ message: "Lỗi server" });
// //     }
// // });
// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const path = require("path");
// const Book = require('./models/Book');
// require("dotenv").config();

// const http = require("http");
// const { Server } = require("socket.io");

// const app = express();
// const server = http.createServer(app);

// // =========================
// // SOCKET.IO
// // =========================
// const io = new Server(server, {
//     cors: { origin: "*" }
// });

// app.set("io", io);

// // =========================
// // MIDDLEWARE
// // =========================
// app.use(cors());
// app.use(express.json());

// // =========================
// // API ROUTES
// // =========================
// app.use("/api/books", require("./routes/books"));
// app.use("/api/categories", require("./routes/categories"));
// app.use("/api/auth", require("./routes/auth"));
// app.use("/api/orders", require("./routes/orders"));
// app.use("/api/reviews", require("./routes/review"));
// app.use("/api/users", require("./routes/user"));

// // =========================
// // STATIC FILES (QUAN TRỌNG)
// // =========================

// // 👇 FIX 1: cho phép truy cập ảnh uploads
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// // 👇 FIX 2: frontend


// // Khi Root Directory là 'backend', __dirname chính là thư mục backend
// // Chúng ta dùng path.resolve để nhảy ra ngoài thư mục gốc rồi vào frontend
// const frontendPath = path.resolve(__dirname, '..', 'frontend');

// app.use(express.static(frontendPath));

// app.get("*", (req, res) => {
//     const indexPath = path.join(frontendPath, "index.html");
//     res.sendFile(indexPath, (err) => {
//         if (err) {
//             console.error("Lỗi thực tế tại đường dẫn:", indexPath);
//             // In ra thư mục hiện tại để debug trên Render Logs
//             console.error("Server đang đứng ở thư mục:", process.cwd());
//             res.status(404).send("Giao diện đang được cập nhật, vui lòng thử lại sau!");
//         }
//     });
// });

// // =========================
// // MONGODB
// // =========================
// mongoose.connect(process.env.MONGO_URI)
//     .then(() => console.log("MongoDB Connected"))
//     .catch(err => console.log(err));

// // START SERVER
// // =========================
// const PORT = process.env.PORT || 5001; 

// server.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });
// // Deploy update 13/05
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

// Import Model
const Book = require('./models/Book');

const app = express();
const server = http.createServer(app);

// =========================
// SOCKET.IO
// =========================
const io = new Server(server, {
    cors: { origin: "*" }
});
app.set("io", io);

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
});

// =========================
// MIDDLEWARE
// =========================
app.use(cors());
app.use(express.json());

// =========================
// API ROUTES
// =========================
// Đảm bảo các file trong folder routes của bạn đã đúng tên
app.use("/api/books", require("./routes/books"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/reviews", require("./routes/review"));
app.use("/api/users", require("./routes/user"));

// API POST thêm sách nhanh (để bạn test)
app.post("/api/books/add-quick", async (req, res) => {
    try {
        const { title, author, price, image, description } = req.body;
        const newBook = new Book({ title, author, price, image, description });
        await newBook.save();
        res.status(201).json(newBook);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi server khi thêm sách" });
    }
});

// =========================
// STATIC FILES & FRONTEND
// =========================

// 1. Phục vụ ảnh upload
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 2. Cấu hình đường dẫn Frontend cho Render
// Khi Root Directory là 'backend', chúng ta cần nhảy ra ngoài 1 cấp để vào 'frontend'
const frontendPath = path.resolve(__dirname, "..", "frontend");
app.use(express.static(frontendPath));

// 3. Xử lý các yêu cầu giao diện (Wildcard)
// Đặt sau cùng để không đè lên các API routes ở trên
app.get("*", (req, res) => {
    const indexPath = path.join(frontendPath, "index.html");
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error("Lỗi: Không tìm thấy index.html tại:", indexPath);
            console.error("Thư mục thực tế (cwd):", process.cwd());
            res.status(404).send("Giao diện đang được cập nhật, vui lòng thử lại sau!");
        }
    });
});

// =========================
// DATABASE CONNECTION
// =========================
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch(err => {
        console.error("❌ MongoDB Connection Error:");
        console.error(err);
    });

// =========================
// START SERVER
// =========================
// Render sẽ cung cấp PORT thông qua biến môi trường, mặc định là 10000
const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📂 Serving frontend from: ${frontendPath}`);
});

// Deploy Update: 13/05/2026 - Fixed Duplicate Declarations