const express = require("express");

const router = express.Router();

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const User = require("../models/User");



// =========================
// REGISTER
// =========================

router.post("/register", async (req, res) => {

    try {

        const {
            username,
            email,
            password
        } = req.body;


        // CHECK EMPTY
        if(
            !username ||
            !email ||
            !password
        ){

            return res.status(400).json({
                message:"Vui lòng nhập đầy đủ thông tin"
            });

        }


        // CHECK EMAIL EXIST
        const existingUser =
        await User.findOne({ email });

        if(existingUser){

            return res.status(400).json({
                message:"Email đã tồn tại"
            });

        }


        // HASH PASSWORD
        const hashedPassword =
        await bcrypt.hash(password, 10);


        // CREATE USER
        const newUser =
        new User({

            username,

            email,

            password: hashedPassword,

            role:"user"

        });

        await newUser.save();


        // RESPONSE
        res.status(201).json({

            success:true,

            message:"Đăng ký thành công"

        });

    } catch(err){

        console.log(err);

        res.status(500).json({

            success:false,

            message:"Lỗi server"

        });

    }

});



// =========================
// LOGIN
// =========================

router.post("/login", async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;

        console.log(req.body);


        // CHECK EMPTY
        if(
            !email ||
            !password
        ){

            return res.status(400).json({

                success:false,

                message:"Vui lòng nhập email và mật khẩu"

            });

        }


        // FIND USER
        const user =
        await User.findOne({ email });

        if(!user){

            return res.status(400).json({

                success:false,

                message:"Email không tồn tại"

            });

        }


        // CHECK PASSWORD
        const isMatch =
        await bcrypt.compare(
            password,
            user.password
        );

        if(!isMatch){

            return res.status(400).json({

                success:false,

                message:"Sai mật khẩu"

            });

        }


        // CREATE TOKEN
        const token =
        jwt.sign(

            {

                id: user._id,

                role: user.role

            },

            "SECRET_KEY",

            {

                expiresIn:"7d"

            }

        );


        // RESPONSE
        res.json({

            success:true,

            message:"Đăng nhập thành công",

            token,

            user: {

                id: user._id,

                username: user.username,

                email: user.email,

                role: user.role

            }

        });

    } catch(err){

        console.log(err);

        res.status(500).json({

            success:false,

            message:"Lỗi server"

        });

    }

});



// =========================
// GET PROFILE
// =========================

router.get("/profile", async (req, res) => {

    try {

        const token =
        req.headers.authorization;

        if(!token){

            return res.status(401).json({

                message:"Chưa đăng nhập"

            });

        }


        // VERIFY TOKEN
        const decoded =
        jwt.verify(
            token,
            "SECRET_KEY"
        );


        // FIND USER
        const user =
        await User.findById(
            decoded.id
        ).select("-password");


        res.json(user);

    } catch(err){

        console.log(err);

        res.status(401).json({

            message:"Token không hợp lệ"

        });

    }

});



// =========================
// CHANGE PASSWORD
// =========================

router.post("/change-password", async (req, res) => {

    try {

        const {
            email,
            oldPassword,
            newPassword
        } = req.body;


        const user =
        await User.findOne({ email });

        if(!user){

            return res.status(404).json({

                message:"Không tìm thấy user"

            });

        }


        // CHECK OLD PASSWORD
        const isMatch =
        await bcrypt.compare(
            oldPassword,
            user.password
        );

        if(!isMatch){

            return res.status(400).json({

                message:"Mật khẩu cũ sai"

            });

        }


        // HASH NEW PASSWORD
        const hashedPassword =
        await bcrypt.hash(
            newPassword,
            10
        );


        user.password =
        hashedPassword;

        await user.save();


        res.json({

            message:"Đổi mật khẩu thành công"

        });

    } catch(err){

        console.log(err);

        res.status(500).json({

            message:"Lỗi server"

        });

    }

});



module.exports = router;