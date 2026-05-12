const BASE_URL = "http://localhost:5001/api";

async function loadAllReviews() {
    const container = document.getElementById('all-reviews-container');
    
    try {
        // 1. Gọi API lấy tất cả review
        const res = await fetch(`${BASE_URL}/reviews`);
        const data = await res.json();

        if (data.length === 0) {
            container.innerHTML = "<p style='text-align:center;'>Chưa có đánh giá nào từ cộng đồng.</p>";
            return;
        }

        // 2. Vẽ giao diện cho từng review
        container.innerHTML = data.map(r => `
            <div class="review-card">
                <div class="rev-header">
                    <img src="${r.bookImg || 'https://via.placeholder.com/50'}" class="rev-book-thumb">
                    <div class="rev-info">
                        <span class="rev-book-name">${r.bookTitle}</span>
                        <div class="rev-stars">${renderStars(r.rating)}</div>
                    </div>
                </div>
                <div class="rev-body">
                    <p class="rev-comment">"${r.comment}"</p>
                    <div class="rev-footer">
                        <span class="rev-user"><i class="fas fa-user-edit"></i> ${r.userName}</span>
                        <span class="rev-date">${r.date}</span>
                    </div>
                </div>
                <button onclick="goToBook('${r.bookId}')" class="btn-view-book">Xem sách</button>
            </div>
        `).join('');

    } catch (err) {
        console.error("Lỗi:", err);
        container.innerHTML = "<p>Không thể tải dữ liệu review lúc này.</p>";
    }
}

// Hàm vẽ sao
function renderStars(rating) {
    return "⭐".repeat(rating);
}

// Hàm chuyển hướng đến trang chi tiết sách
function goToBook(id) {
    window.location.href = `product.html?id=${id}`;
}

// Chạy hàm khi trang load xong
window.onload = loadAllReviews;