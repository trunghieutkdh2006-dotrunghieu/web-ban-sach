// ✅ Đã sửa: Đưa window.location.origin ra ngoài dấu ngoặc kép
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

function normalizeCartItem(book) {
    return {
        id: book._id || book.id || "",
        title: book.title || book.name || "Sản phẩm",
        price: Number(book.price) || 0,
        image: book.image || "",
        quantity: 1,
        author: book.author || ""
    };
}

// =========================
// HELPERS
// =========================
function validateWishlist(value) {
    if (!Array.isArray(value)) return [];
    const valid = value
        .filter(item => item && typeof item === "object" && item._id)
        .reduce((acc, item) => {
            if (!acc.some(existing => existing._id === item._id)) acc.push(item);
            return acc;
        }, []);
    if (valid.length !== (value || []).length) {
        localStorage.setItem("wishlist", JSON.stringify(valid));
    }
    return valid;
}

function cleanWishlist() {
    const before = wishlist.length;
    wishlist = wishlist.filter(w => booksCache.some(b => b._id === w._id));
    if (wishlist.length !== before) {
        localStorage.setItem("wishlist", JSON.stringify(wishlist));
    }
}

function getBookImage(book) {
    if (!book || !book.image || book.image === "undefined") return "img/default-book.png";
    if (book.image.startsWith("http")) return book.image;
    return `${IMAGE_BASE_URL}${book.image}`;
}

function getBookPdf(book) {
    if (!book || !book.samplePdf || book.samplePdf === "undefined") return null;
    if (book.samplePdf.startsWith("http")) return book.samplePdf;
    return `${IMAGE_BASE_URL}${book.samplePdf}`;
}

function openPdfPreview(bookId) {
    const book = booksCache.find(b => b._id === bookId);
    if (!book) return;
    const pdfUrl = getBookPdf(book);
    if (!pdfUrl) return alert('Chưa có file đọc thử cho sách này.');

    document.querySelector('.pdf-preview-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'pdf-preview-overlay';
    overlay.innerHTML = `
        <div class="pdf-preview-modal">
            <button class="pdf-close-btn" onclick="document.querySelector('.pdf-preview-overlay')?.remove()">Đóng</button>
            <iframe src="${pdfUrl}" allowfullscreen></iframe>
        </div>
    `;
    document.body.appendChild(overlay);
}

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", () => {
    loadBooks();
    loadCategories();
    initUserSystem();
    updateCartCount();
});

// =========================
// LOAD BOOKS
// =========================
async function loadBooks() {
    try {
        const res = await fetch(API);
        const books = await res.json();
        booksCache = books;
        cleanWishlist();
        renderBooks(books);
        renderAdminBooks(books);
        renderWishlistIcon();
        renderWishlistPopup();
    } catch (err) {
        console.error("Lỗi tải sách:", err);
    }
}

// =========================
// RENDER FUNCTIONS
// =========================
function renderBooks(books) {
    const container = document.getElementById("new-books");
    if (!container) return;

    if (!books || books.length === 0) {
        container.innerHTML = '<div class="empty-state">Không có sách phù hợp.</div>';
        return;
    }

    if (currentCategory === 'Tất cả') {
        renderSections(books);
        return;
    }

    container.innerHTML = `
        <section class="book-section">
            <div class="section-header">
                <div>
                    <p class="section-tag">Thể loại</p>
                    <h2>${getSectionTitle(currentCategory)}</h2>
                </div>
                <a href="#" class="section-link" onclick="filterByCategory('Tất cả'); return false;">Xem tất cả →</a>
            </div>
            <div class="section-row">
                ${books.map(renderBookCard).join('')}
            </div>
        </section>
    `;
}

async function loadCategories() {
    try {
        const res = await fetch(CATEGORY_API);
        if (!res.ok) throw new Error("Không thể tải thể loại");
        const categories = await res.json();
        renderCategoryMenu(categories);
    } catch (err) {
        console.warn("Lỗi loadCategories:", err);
    }
}

function renderCategoryMenu(categories) {
    const dropdown = document.getElementById("categoryDropdown");
    if (!dropdown) return;
    dropdown.innerHTML = `
        <li><a href="#" onclick="filterByCategory('Tất cả'); return false;">Tất cả</a></li>
        ${categories.map(cat => `
            <li><a href="#" onclick="filterByCategory('${cat.name.replace(/'/g, "\\'")}'); return false;">${cat.name}</a></li>
        `).join('')}
    `;
}

function renderBookCard(book) {
    const id = book._id;
    const displayImage = getBookImage(book);
    const pdfButton = book.samplePdf ? `<button class="read-sample-btn is-primary" onclick="openPdfPreview('${id}')">📖 Đọc thử</button>` : "";
    return `
        <div class="book-card">
            <img src="${displayImage}" onclick="openBookDetail('${id}')" onerror="this.src='img/default-book.png'" />
            <div class="book-info">
                <h3 onclick="openBookDetail('${id}')">${book.title}</h3>
                <p>${book.author}</p>
                <h4>${Number(book.price).toLocaleString()}đ</h4>
                <div class="book-actions">
                    <button class="is-primary" onclick="addToCart('${id}')">🛒 Giỏ</button>
                    ${pdfButton}
                    <button onclick="toggleWishlist('${id}')">
                        ${isWishlisted(id) ? "❤️" : "🤍"}
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ... (Giữ nguyên các hàm helper render khác như getSectionLabel, getSectionTitle, renderSections)

function filterByCategory(category) {
    currentCategory = category;
    const filteredBooks = category === 'Tất cả'
        ? booksCache
        : booksCache.filter(book => String(book.category || '').toLowerCase() === String(category).toLowerCase());
    renderBooks(filteredBooks);
}

// =========================
// USER SYSTEM
// =========================
function initUserSystem() {
    const userBtn = document.getElementById("userBtn");

    if (userBtn) {
        userBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (!user) {
                toggleAuth(true);
            } else {
                const menu = document.getElementById("userDropdown");
                if (menu) menu.classList.toggle("show");
            }
        });
    }

    updateUserUI();

    document.addEventListener("click", () => {
        document.getElementById("userDropdown")?.classList.remove("show");
    });

    // LOGIN FORM - ✅ Đã sửa: Nối chuỗi window.location.origin đúng cách
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value.trim();
            const pass = document.getElementById("loginPass").value;
            try {
                const res = await fetch(window.location.origin + "/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password: pass })
                });
                const data = await res.json();
                if (res.ok) {
                    loginSuccess(data.user, data.token);
                } else {
                    alert(data.message || "Sai email hoặc mật khẩu ❌");
                }
            } catch (err) {
                alert("Không thể kết nối server. Vui lòng thử lại.");
            }
        });
    }

    // REGISTER FORM - ✅ Đã sửa: Nối chuỗi window.location.origin đúng cách
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("regName").value.trim();
            const email = document.getElementById("regEmail").value.trim();
            const pass = document.getElementById("regPass").value;
            try {
                const res = await fetch(window.location.origin + "/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, email, password: pass })
                });
                const data = await res.json();
                if (res.ok) {
                    alert("Đăng ký thành công! Vui lòng đăng nhập 🎉");
                    switchAuthTab("login");
                } else {
                    alert(data.message || "Đăng ký thất bại ❌");
                }
            } catch (err) {
                alert("Không thể kết nối server. Vui lòng thử lại.");
            }
        });
    }
}

// ... (Giữ nguyên các hàm UI khác: loginSuccess, updateUserUI, logout, v.v.)