const IMAGE_BASE_URL = "window.location.origin";

let currentBook = null;

function getBookImage(book) {
    if (!book || !book.image || book.image === "undefined") {
        return "https://via.placeholder.com/300x400";
    }
    if (book.image.startsWith("http")) {
        return book.image;
    }
    return `${IMAGE_BASE_URL}${book.image}`;
}

function getBookPdf(book) {
    if (!book || !book.samplePdf || book.samplePdf === "undefined") {
        return null;
    }
    if (book.samplePdf.startsWith("http")) {
        return book.samplePdf;
    }
    return `${IMAGE_BASE_URL}${book.samplePdf}`;
}

// =========================
// GET BOOK ID
// =========================

const params =
new URLSearchParams(
    window.location.search
);

const bookId =
params.get("id");



// =========================
// LOAD BOOK DETAIL
// =========================

async function loadBook() {

    try {

        const response =
        await fetch(
            `window.location.origin/api/books/${bookId}`
        );

        const book =
        await response.json();

        currentBook = book;


        // IMAGE
        document.getElementById(
            "book-image"
        ).src =
        getBookImage(book);


        // TITLE
        document.getElementById(
            "book-title"
        ).innerText =
        book.title;


        // AUTHOR
        document.getElementById(
            "book-author"
        ).innerText =
        "Tác giả: " + book.author;


        // PRICE
        document.getElementById(
            "book-price"
        ).innerText =
        Number(book.price)
        .toLocaleString()
        + "đ";


        // DESCRIPTION
        document.getElementById(
            "book-description"
        ).innerText =
        book.description ||
        "Chưa có mô tả.";

        const pdfUrl = getBookPdf(book);
        const readButton = document.getElementById('read-sample-btn');
        if (readButton) {
            if (pdfUrl) {
                readButton.style.display = 'inline-block';
            } else {
                readButton.style.display = 'none';
            }
        }
    } catch(err){

        console.log(err);

    }

}

function openPdfPreview() {
    const pdfUrl = getBookPdf(currentBook);
    if (!pdfUrl) {
        return alert('Chưa có file đọc thử cho sách này.');
    }

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

loadBook();



// =========================
// ADD TO CART
// =========================

function addCurrentBookToCart() {

    addToCart({

        id: currentBook._id,

        title: currentBook.title,

        price: currentBook.price,

        image: currentBook.image

    });

}