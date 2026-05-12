// ✅ Sửa lỗi URL: Đưa window.location.origin ra ngoài dấu ngoặc kép
const API = window.location.origin + "/api/books";
const CATEGORY_API = window.location.origin + "/api/categories";
const IMAGE_BASE_URL = window.location.origin;

// =========================
// GLOBAL STATE
// =========================
let booksCache = [];
let currentCategory = "Tất cả";
let wishlist = validateWishlist(JSON.parse(localStorage.getItem("wishlist")));
let user = JSON.parse(localStorage.getItem("user")) || null;
const CART_KEY = "cart";

function getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
    const badge = document.getElementById("cart-count");
    if (badge) badge.innerText = count;
}

// =========================
// HELPERS
// =========================
function validateWishlist(value) {
    if (!Array.isArray(value)) return [];
    return value.filter(item => item && typeof item === "object" && item._id);
}

function getBookImage(book) {
    if (!book || !book.image || book.image === "undefined") return "img/default-book.png";
    if (book.image.startsWith("http")) return book.image;
    return `${IMAGE_BASE_URL}${book.image}`;
}

function isWishlisted(id) {
    return wishlist.some(item => item._id === id);
}

// =========================
// INIT & LOAD
// =========================
document.addEventListener("DOMContentLoaded", () => {
    loadBooks();
    loadCategories();
    initUserSystem();
    updateCartCount();
});

async function loadBooks() {
    try {
        const res = await fetch(API);
        const books = await res.json();
        booksCache = books;
        renderBooks(books);
        // Kiểm tra nếu có hàm renderAdminBooks thì mới gọi (tránh lỗi image_9020d9.jpg)
        if (typeof renderAdminBooks === "function") renderAdminBooks(books);
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

// =========================
// RENDER FUNCTIONS
// =========================
function renderBooks(books) {
    const container = document.getElementById("new-books");
    if (!container) return;
    container.innerHTML = books.map(renderBookCard).join('');
}

function renderBookCard(book) {
    const id = book._id;
    return `
        <div class="book-card">
            <img src="${getBookImage(book)}" onerror="this.src='img/default-book.png'" />
            <div class="book-info">
                <h3>${book.title}</h3>
                <p>${book.author}</p>
                <h4>${Number(book.price).toLocaleString()}đ</h4>
                <div class="book-actions">
                    <button class="is-primary" onclick="addToCart('${id}')">🛒 Giỏ</button>
                    <button onclick="toggleWishlist('${id}')">${isWishlisted(id) ? "❤️" : "🤍"}</button>
                </div>
            </div>
        </div>
    `;
}

function renderCategoryMenu(categories) {
    const dropdown = document.getElementById("categoryDropdown");
    if (!dropdown) return;
    dropdown.innerHTML = `<li><a href="#" onclick="filterByCategory('Tất cả')">Tất cả</a></li>` + 
        categories.map(cat => `<li><a href="#" onclick="filterByCategory('${cat.name}')">${cat.name}</a></li>`).join('');
}

// =========================
// USER SYSTEM (Sửa lỗi ReferenceError trong image_9020d9.jpg)
// =========================
function initUserSystem() {
    updateUserUI();
    
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value;
            const pass = document.getElementById("loginPass").value;
            try {
                const res = await fetch(window.location.origin + "/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password: pass })
                });
                const data = await res.json();
                if (res.ok) {
                    localStorage.setItem("user", JSON.stringify(data.user));
                    localStorage.setItem("token", data.token);
                    user = data.user;
                    updateUserUI();
                    toggleAuth(false);
                } else {
                    alert(data.message);
                }
            } catch (err) { alert("Lỗi kết nối!"); }
        });
    }
}

function updateUserUI() {
    const userBtn = document.getElementById("userBtn");
    if (!userBtn) return;
    userBtn.innerText = user ? `Chào, ${user.username}` : "Đăng nhập";
}

function toggleAuth(show) {
    const modal = document.getElementById("authModal");
    if (modal) modal.style.display = show ? "flex" : "none";
}

function filterByCategory(category) {
    const filtered = category === "Tất cả" ? booksCache : booksCache.filter(b => b.category === category);
    renderBooks(filtered);
}

function addToCart(id) {
    const book = booksCache.find(b => b._id === id);
    if (!book) return;
    let cart = getCart();
    const item = cart.find(i => i.id === id);
    if (item) item.quantity++; else cart.push({id: book._id, title: book.title, price: book.price, quantity: 1});
    saveCart(cart);
    updateCartCount();
    alert("Đã thêm vào giỏ hàng!");
}

// Hàm giả định để tránh lỗi nếu bạn chưa có trang admin trong file này
function renderAdminBooks(books) {
    console.log("Admin books loaded");
}