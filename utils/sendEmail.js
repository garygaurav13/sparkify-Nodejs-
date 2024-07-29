require("dotenv").config();
const nodemailer = require("nodemailer");
const response = require("../utils/http-response");
const CONSTANT = require("../constant/config");
const sendEmail = async (data) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            service: process.env.MAIL_MAILER,
            port: process.env.MAIL_PORT,
            secure: false,
            auth: {
                user: process.env.MAIL_USERNAME,
                pass: process.env.MAIL_PASSWORD,
            },
        });

        const mail_data = {
            from: {
                name: CONSTANT.email.EMAIL_FROM_NAME,
                address: process.env.MAIL_FROM_ADDRESS
            },
            ...data
        }
        await transporter.sendMail(mail_data);
    } catch (error) {
        throw new Error(error);
    }
};

module.exports = sendEmail;