// const API = "https://passenger-grapple-dynamic.ngrok-free.dev/api/books"
const API = "http://localhost:5001/api/books";
const IMAGE_BASE_URL = "http://localhost:5001";

// =========================
// 1. TẢI DANH SÁCH SÁCH
// =========================
async function loadBooks() {
    try {
        const res = await fetch(API);
        if (!res.ok) throw new Error("Không thể tải sách");

        const books = await res.json();
        const container = document.getElementById("admin-books");
        if (!container) return;

        container.innerHTML = books.map(book => {
            // Xử lý link ảnh: Nếu là link ngoài (http) thì giữ nguyên, nếu là path local thì nối URL base
            const imageUrl =
    book.image && book.image !== "undefined"
        ? (book.image.startsWith("http")
            ? book.image
            : `${IMAGE_BASE_URL}${book.image}`)
        : "https://picsum.photos/200/300";
            return `
                <div class="book-item" id="book-${book._id}">
                    <img src="${imageUrl}" onerror="this.style.display='none'" alt="${book.title}" />
                    <h3>${book.title}</h3>
                    <p><strong>Tác giả:</strong> ${book.author}</p>
                    <p class="price">${Number(book.price).toLocaleString()}đ</p>
                    <button type="button" class="delete-btn" onclick="deleteBook('${book._id}')">❌ Xoá</button>
                </div>
            `;
        }).join("");

    } catch (err) {
        console.error("Lỗi loadBooks:", err);
    }
}

// =========================
// 2. XOÁ SÁCH
// =========================
async function deleteBook(id) {
    if (!id || id === "undefined") {
        alert("ID sách không hợp lệ!");
        return;
    }

    if (!confirm("Bạn có chắc muốn xoá sách này?")) return;

    try {
        const res = await fetch(`${API}/${id}`, { method: "DELETE" });
        const result = await res.json();

        if (res.ok) {
            const el = document.getElementById(`book-${id}`);
            if (el) el.remove();
            alert("Xoá thành công ✅");
        } else {
            alert("Lỗi: " + (result.message || "Không xác định"));
        }
    } catch (err) {
        console.error("Lỗi deleteBook:", err);
        alert("Không thể kết nối server.");
    }
}

// =========================
// 3. THÊM SÁCH (Dùng JSON để gửi URL)
// =========================
const addBookForm = document.getElementById("addBookForm");
if (addBookForm) {
    addBookForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("title", document.getElementById("title").value);
        formData.append("author", document.getElementById("author").value);
        formData.append("price", document.getElementById("price").value);
        formData.append("description", document.getElementById("description").value);
        const imageInput = document.getElementById("image");
        if (imageInput && imageInput.files.length > 0) {
            formData.append("image", imageInput.files[0]);
        }

        try {
            const res = await fetch(`${API}/add`, {
                method: "POST",
                body: formData
            });

            const result = await res.json();

            if (res.ok) {
                alert("Thêm sách thành công ✅");
                addBookForm.reset();
                await loadBooks(); // Cập nhật lại danh sách hiển thị
            } else {
                alert("Lỗi: " + (result.message || "Không thể thêm sách"));
            }
        } catch (err) {
            console.error("Lỗi thêm sách:", err);
            alert("Lỗi kết nối server!");
        }
    });
}

// =========================
// KHỞI TẠO
// =========================
document.addEventListener("DOMContentLoaded", loadBooks);