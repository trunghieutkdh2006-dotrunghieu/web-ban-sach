// =========================
// CONSTANTS
// =========================
const CART_KEY = "cart";
const API_BASE_URL = "http://localhost:5001/api";
const IMAGE_BASE_URL = "http://localhost:5001";
const VALID_COUPONS = {
    "TAIEBOOK10": 0.1,
    "SALE20": 0.2,
    "FREEDEL": 0
};
let appliedCoupon = null;

// =========================
// STORAGE HELPERS
// =========================
const ADDRESS_KEY = "shippingAddress";

function getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function loadShippingAddress() {
    return localStorage.getItem(ADDRESS_KEY) || "";
}

function saveShippingAddress(address) {
    localStorage.setItem(ADDRESS_KEY, address || "");
}

function getShippingAddress() {
    const field = document.getElementById("shipping-address");
    const address = field ? field.value.trim() : loadShippingAddress();
    return address || loadShippingAddress();
}

function saveOrderHistory(order) {
    const history = JSON.parse(localStorage.getItem('ordersHistory')) || [];
    const existingIndex = history.findIndex(item => item.id === order.id || item._id === order._id);
    if (existingIndex !== -1) {
        history[existingIndex] = order;
    } else {
        history.push(order);
    }
    localStorage.setItem('ordersHistory', JSON.stringify(history));
}

function getCartImage(item) {
    if (!item || !item.image || item.image === "undefined") {
        return "img/default-book.png";
    }
    if (item.image.startsWith("http")) {
        return item.image;
    }
    if (item.image.startsWith("/")) {
        return `${IMAGE_BASE_URL}${item.image}`;
    }
    return item.image;
}

function normalizeCartItem(item) {
    return {
        id: item.id || item._id || "",
        title: item.title || item.name || "Sản phẩm",
        price: Number(item.price) || 0,
        image: item.image || "",
        quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
        author: item.author || ""
    };
}

// =========================
// ADD TO CART
// =========================
function addToCart(book) {
    let cart = getCart();
    const normalized = normalizeCartItem(book);
    const existing = cart.find(item => item.id === normalized.id);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push(normalized);
    }

    saveCart(cart);
    updateCartUI();
    if (window.Swal) {
        Swal.fire({
            icon: "success",
            title: "Đã thêm vào giỏ hàng",
            text: `${normalized.title} đã được thêm vào giỏ hàng.`,
            timer: 1200,
            showConfirmButton: false
        });
    } else {
        alert("Đã thêm vào giỏ hàng");
    }
}

// =========================
// REMOVE ITEM
// =========================
function removeFromCart(id) {
    let cart = getCart().filter(item => item.id !== id && item._id !== id);
    saveCart(cart);
    updateCartUI();
}

// =========================
// CLEAR CART
// =========================
function clearCart() {
    const cart = getCart();
    if (!cart.length) {
        if (window.Swal) {
            Swal.fire({ icon: 'info', title: 'Giỏ hàng đã trống' });
        } else {
            alert('Giỏ hàng đã trống');
        }
        return;
    }
    const confirmed = window.Swal ? Swal.fire({
        title: 'Xóa toàn bộ giỏ hàng?',
        text: 'Hành động này sẽ xóa hết sản phẩm trong giỏ.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy'
    }).then(result => {
        if (!result.isConfirmed) return;
        localStorage.removeItem(CART_KEY);
        appliedCoupon = null;
        updateCartUI();
        Swal.fire({ icon: 'success', title: 'Đã xóa giỏ hàng' });
    }) : (() => {
        if (!confirm('Xóa toàn bộ giỏ hàng?')) return;
        localStorage.removeItem(CART_KEY);
        appliedCoupon = null;
        updateCartUI();
        alert('Đã xóa giỏ hàng');
    })();
    return confirmed;
}

// =========================
// CART COUNT BADGE
// =========================
function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
    const badge = document.getElementById('cart-count');
    if (badge) badge.innerText = count;
}

// =========================
// UPDATE QUANTITY
// =========================
function updateQuantity(id, change) {
    let cart = getCart();
    const item = cart.find(i => i.id === id || i._id === id);

    if (!item) return;
    item.quantity = Number(item.quantity || 0) + change;
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== id && i._id !== id);
    }

    saveCart(cart);
    updateCartUI();
}

// =========================
// CART TOTALS
// =========================
function calculateTotals() {
    const cart = getCart();
    let subtotal = 0;
    cart.forEach(item => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 1;
        subtotal += price * quantity;
    });

    let discount = 0;
    if (appliedCoupon && Object.prototype.hasOwnProperty.call(VALID_COUPONS, appliedCoupon)) {
        discount = subtotal * VALID_COUPONS[appliedCoupon];
    }

    const total = Math.max(0, subtotal - discount);
    return { subtotal, discount, total };
}

// =========================
// LOAD / RENDER CART
// =========================
function loadCart() {
    const cart = getCart();
    const container = document.getElementById("cart-items");
    const totalEl = document.getElementById("cart-total");
    const subtotalEl = document.getElementById("subtotal");
    const discountEl = document.getElementById("discount-amount");
    const paymentDetails = document.getElementById("payment-details");

    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <p>Giỏ hàng đang trống</p>
                <a href="index.html">Quay lại cửa hàng</a>
            </div>
        `;
        if (totalEl) totalEl.innerText = "0đ";
        if (subtotalEl) subtotalEl.innerText = "0đ";
        if (paymentDetails) paymentDetails.innerHTML = '<p>Thêm sản phẩm vào giỏ để thanh toán.</p>';
        return;
    }

    let html = "";
    cart.forEach(item => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 1;
        const itemTotal = price * quantity;

        html += `
            <div class="cart-item">
                <img src="${getCartImage(item)}" alt="${item.title}" />
                <div class="cart-item-info">
                    <h4>${item.title}</h4>
                    <p>${item.author || "Không rõ tác giả"}</p>
                    <span class="cart-price">${formatMoney(price)}</span>
                    <div class="quantity-control">
                        <button onclick="updateQuantity('${item.id}', -1)">-</button>
                        <span>${quantity}</span>
                        <button onclick="updateQuantity('${item.id}', 1)">+</button>
                    </div>
                    <button class="remove-btn" onclick="removeFromCart('${item.id}')">Xóa</button>
                </div>
                <div class="cart-item-total">${formatMoney(itemTotal)}</div>
            </div>
        `;
    });

    container.innerHTML = html;

    const { subtotal, discount, total } = calculateTotals();
    if (subtotalEl) subtotalEl.innerText = formatMoney(subtotal);
    if (discountEl) discountEl.innerText = formatMoney(discount);
    if (totalEl) totalEl.innerText = formatMoney(total);
    renderPaymentDetails();
}

// =========================
// COUPON
// =========================
function applyCoupon() {
    const couponInput = document.getElementById("coupon-input");
    if (!couponInput) return;
    const code = couponInput.value.trim().toUpperCase();
    if (!code) {
        if (window.Swal) {
            Swal.fire("Vui lòng nhập mã giảm giá.");
        } else {
            alert("Vui lòng nhập mã giảm giá.");
        }
        return;
    }
    if (!Object.prototype.hasOwnProperty.call(VALID_COUPONS, code)) {
        if (window.Swal) {
            Swal.fire({ icon: "error", title: "Mã không hợp lệ", text: "Vui lòng nhập mã khác." });
        } else {
            alert("Mã không hợp lệ, vui lòng nhập mã khác.");
        }
        return;
    }
    appliedCoupon = code;
    if (window.Swal) {
        Swal.fire({ icon: "success", title: "Áp dụng mã thành công", text: `Giảm ${Math.round(VALID_COUPONS[code] * 100)}%` });
    }
    updateCartUI();
}

// =========================
// PAYMENT METHOD
// =========================
function getSelectedPaymentMethod() {
    const radios = document.querySelectorAll('input[name="paymentMethod"]');
    for (const radio of radios) {
        if (radio.checked) return radio.value;
    }
    return "cod";
}
function openQR(src) {
    document.getElementById("qrModal").style.display = "flex";
    document.getElementById("qrModalImg").src = src;
}

function closeQR() {
    document.getElementById("qrModal").style.display = "none";
}

function renderPaymentDetails() {
    const paymentDetails = document.getElementById("payment-details");
    if (!paymentDetails) return;
    const method = getSelectedPaymentMethod();
    let html = "";

    if (method === "cod") {
        html = `<p>Bạn sẽ thanh toán khi nhận hàng. Vui lòng chuẩn bị tiền mặt hoặc thẻ khi nhận hàng.</p>`;
    } else if (method === "card") {
        html = `
            <div class="payment-fields">
                <input type="text" id="card-name" placeholder="Tên trên thẻ" />
                <input type="text" id="card-number" placeholder="Số thẻ" />
                <div class="payment-row">
                    <input type="text" id="card-expiry" placeholder="MM/YY" />
                    <input type="text" id="card-cvc" placeholder="CVC" />
                </div>
            </div>
        `;
    } else if (method === "mb") {
    html = `
            <div class="qr-payment">

                <p>
                    Quét mã QR bằng app MB BANK để thanh toán.
                </p>

                <img 
                    src="img/mb.png"
                    alt="MB QR"
                    class="qr-image"
                    onclick="openQR(this.src)"
                >

                <p class="qr-note">
                    Chủ tài khoản: Đỗ Trung Hiếu<br>
                    Nội dung: TAIEBOOKS123
                </p>

            </div>
        `;

}
    else if (method === "vietinbank") {
    html = `
        <div class="qr-payment">

            <p>
                Quét mã QR bằng app VIETINBANK để thanh toán.
            </p>

            <img 
                src="img/VietinBank.png"
                alt="VIETINBANK QR"
                class="qr-image"
                onclick="openQR(this.src)"
            >

            <p class="qr-note">
                Chủ tài khoản: Lưu Thị Tuyết<br>
                Nội dung: TAIEBOOKS123
            </p>

        </div>
    `;
}
else if (method === "techcombank") {
    html = `
        <div class="qr-payment">

            <p>
                Quét mã QR bằng app TECHCOMBANK để thanh toán.
            </p>

            <img 
                src="img/techcombank.png"
                alt="TECHCOMBANK QR"
                class="qr-image"
                onclick="openQR(this.src)"
            >

            <p class="qr-note">
                Chủ tài khoản: Lưu Thị Tuyết<br>
                Nội dung: TAIEBOOKS123
            </p>

        </div>
    `;
}

    paymentDetails.innerHTML = html;
}

// =========================
// CHECKOUT
// =========================
function processCheckout() {
    const cart = getCart();
    if (!cart.length) {
        if (window.Swal) {
            Swal.fire({ icon: "warning", title: "Giỏ hàng trống", text: "Vui lòng thêm sản phẩm trước khi thanh toán." });
        } else {
            alert("Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi thanh toán.");
        }
        return;
    }

    const paymentMethod = getSelectedPaymentMethod();
    const { subtotal, discount, total } = calculateTotals();

    let status = "Đang xử lý";
    if (paymentMethod === "cod") {
        status = "Chưa thanh toán";
    } else if (paymentMethod === "card" || paymentMethod === "momo" || paymentMethod === "vnpay") {
        status = "Đã thanh toán";
    }

    if (paymentMethod === "card") {
        const cardName = document.getElementById("card-name")?.value.trim();
        const cardNumber = document.getElementById("card-number")?.value.trim();
        const cardExpiry = document.getElementById("card-expiry")?.value.trim();
        const cardCvc = document.getElementById("card-cvc")?.value.trim();
        if (!cardName || !cardNumber || !cardExpiry || !cardCvc) {
            Swal.fire({ icon: "error", title: "Thiếu thông tin thẻ", text: "Vui lòng nhập đầy đủ thông tin thẻ." });
            return;
        }
    }

    const shippingAddress = getShippingAddress();
    if (!shippingAddress) {
        Swal.fire({ icon: "error", title: "Thiếu địa chỉ", text: "Vui lòng nhập địa chỉ nhận hàng." });
        return;
    }

    Swal.fire({
        title: "Xác nhận thanh toán",
        html: `Tổng: <strong>${formatMoney(total)}</strong><br>Phương thức: <strong>${paymentMethod.toUpperCase()}</strong>${discount ? `<br>Giảm: <strong>${formatMoney(discount)}</strong>` : ""}<br>Địa chỉ: <strong>${shippingAddress}</strong>`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Thanh toán",
        cancelButtonText: "Hủy"
    }).then(async result => {
        if (!result.isConfirmed) return;

        const user = JSON.parse(localStorage.getItem("user")) || {};
        const shippingAddressValue = getShippingAddress();

        const orderPayload = {
            userId: user.id || user._id || 'guest',
            items: cart,
            subtotal,
            discount,
            totalPrice: total,
            paymentMethod,
            shippingAddress: shippingAddressValue,
            status,
            createdAt: new Date().toISOString()
        };

        const submitOrder = async () => {
            try {
                const token = user.token || user.accessToken || null;
                const response = await fetch(`${API_BASE_URL}/orders`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify(orderPayload)
                });
                if (!response.ok) {
                    throw new Error(`Lỗi ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                console.error("Order submit failed", error);
                return null;
            }
        };

        const savedOrder = await submitOrder();
        const order = savedOrder?.order || orderPayload;
        order.id = order.id || order._id || `ORDER-${Date.now()}`;
        order.total = order.total || order.totalPrice || total;
        order.totalPrice = order.totalPrice || order.total || total;
        order.userId = order.userId || orderPayload.userId;
        order.shippingAddress = order.shippingAddress || orderPayload.shippingAddress;
        saveOrderHistory(order);
        localStorage.setItem("lastOrder", JSON.stringify(order));
        localStorage.removeItem(CART_KEY);
        appliedCoupon = null;
        updateCartUI();

        Swal.fire({ icon: "success", title: "Thanh toán thành công", text: "Cảm ơn bạn đã mua hàng!" });
        setTimeout(() => {
            window.location.href = "thank-you.html";
        }, 1200);
    });
}

// =========================
// FORMAT MONEY
// =========================
function formatMoney(amount) {
    return Number(amount).toLocaleString("vi-VN") + "đ";
}

// =========================
// MAIN UPDATE FUNCTION
// =========================
function updateCartUI() {
    loadCart();
    updateCartCount();
}

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", () => {
    updateCartUI();
    const radios = document.querySelectorAll('input[name="paymentMethod"]');
    radios.forEach(radio => radio.addEventListener("change", renderPaymentDetails));
    renderPaymentDetails();

    const shippingAddressInput = document.getElementById("shipping-address");
    if (shippingAddressInput) {
        shippingAddressInput.value = loadShippingAddress();
        shippingAddressInput.addEventListener("input", () => saveShippingAddress(shippingAddressInput.value));
    }
});
