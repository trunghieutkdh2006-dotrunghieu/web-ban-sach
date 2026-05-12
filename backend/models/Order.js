const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    items: [
        {
            bookId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Book"
            },

            title: String,

            price: Number,

            quantity: Number,

            image: String
        }
    ],

    subtotal: {
        type: Number,
        default: 0
    },

    discount: {
        type: Number,
        default: 0
    },

    totalPrice: {
        type: Number,
        required: true
    },

    shippingAddress: {
        type: String,
        default: ""
    },

    paymentMethod: {
        type: String,
        default: "cod"
    },

    status: {
        type: String,
        default: "Đang xử lý"
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("Order", orderSchema);