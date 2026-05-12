// Cấu hình URL đúng (không để trong ngoặc kép)
const API = window.location.origin + "/api/books";
const CATEGORY_API = window.location.origin + "/api/categories";
const IMAGE_BASE_URL = window.location.origin;

// Biến trạng thái toàn cục
let booksCache = [];
let user = JSON.parse(localStorage.getItem("user")) || null;
const CART_KEY = "cart";

// Khởi chạy khi trang tải xong
document.addEventListener("DOMContentLoaded", () => {
    loadBooks();
    loadCategories();
    initUserSystem();
    updateCartCount();
});

// --- CÁC HÀM XỬ LÝ DỮ LIỆU ---

async function loadBooks() {
    try {
        const res = await fetch(API);
        const books = await res.json();
        booksCache = books;
        renderBooks(books);
        // Sửa lỗi dòng 121 trong image_901cfb.png bằng cách định nghĩa hàm này bên dưới
        renderAdminBooks(books);
    } catch (err) {
        console.error("Lỗi tải sách:", err);
    }
}

async function loadCategories() {
    try {
        const res = await fetch(CATEGORY_API);
        const categories = await res.json();
        renderCategoryMenu(categories);
    } catch (err) {
        console.warn("Lỗi loadCategories:", err);
    }
}

// --- CÁC HÀM RENDER GIAO DIỆN ---

function renderBooks(books) {
    const container = document.getElementById("new-books");
    if (!container) return;
    container.innerHTML = books.map(book => `
        <div class="book-card">
            <img src="${getBookImage(book)}" onerror="this.src='img/default-book.png'" />
            <div class="book-info">
                <h3>${book.title}</h3>
                <p>${book.author}</p>
                <h4>${Number(book.price).toLocaleString()}đ</h4>
                <button class="is-primary" onclick="addToCart('${book._id}')">🛒 Thêm vào giỏ</button>
            </div>
        </div>
    `).join('');
}

// Định nghĩa hàm để sửa lỗi dòng 117/121 trong image_901cfb.png
function renderAdminBooks(books) {
    const adminContainer = document.getElementById("admin-book-list");
    if (adminContainer) {
        console.log("Rendering admin view...");
    }
}

function renderCategoryMenu(categories) {
    const dropdown = document.getElementById("categoryDropdown");
    if (!dropdown) return;
    dropdown.innerHTML = `<li><a href="#" onclick="filterByCategory('Tất cả')">Tất cả</a></li>` + 
        categories.map(cat => `<li><a href="#" onclick="filterByCategory('${cat.name}')">${cat.name}</a></li>`).join('');
}

function getBookImage(book) {
    if (!book || !book.image) return "img/default-book.png";
    return book.image.startsWith("http") ? book.image : IMAGE_BASE_URL + book.image;
}

// --- HỆ THỐNG NGƯỜI DÙNG & AUTH ---

function initUserSystem() {
    // Sửa lỗi dòng 231 trong image_901cfb.png bằng cách gọi hàm đã định nghĩa bên dưới
    updateUserUI();
    
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value;
            const password = document.getElementById("loginPass").value;
            
            try {
                const res = await fetch(window.location.origin + "/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (res.ok) {
                    localStorage.setItem("user", JSON.stringify(data.user));
                    localStorage.setItem("token", data.token);
                    user = data.user;
                    updateUserUI();
                    toggleAuth(false); // Gọi hàm toggleAuth đã định nghĩa
                } else {
                    alert(data.message);
                }
            } catch (err) {
                console.error("Login error:", err);
            }
        });
    }
}

// Định nghĩa hàm updateUserUI để sửa lỗi ReferenceError
function updateUserUI() {
    const userBtn = document.getElementById("userBtn");
    if (userBtn) {
        userBtn.innerText = user ? `Chào, ${user.username}` : "Đăng nhập";
    }
}

// Định nghĩa hàm toggleAuth để sửa lỗi dòng 223 trong image_901cfb.png
function toggleAuth(show) {
    const modal = document.getElementById("authModal");
    if (modal) {
        modal.style.display = show ? "flex" : "none";
    }
}

// --- GIỎ HÀNG ---

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById("cart-count");
    if (badge) badge.innerText = count;
}

function addToCart(id) {
    const book = booksCache.find(b => b._id === id);
    if (!book) return;
    let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    const item = cart.find(i => i.id === id);
    if (item) item.quantity++; else cart.push({id: book._id, title: book.title, price: book.price, quantity: 1});
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
    alert("Đã thêm vào giỏ hàng!");
}

function filterByCategory(category) {
    const filtered = category === "Tất cả" ? booksCache : booksCache.filter(b => b.category === category);
    renderBooks(filtered);
}