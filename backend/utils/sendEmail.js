import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const sendEmail = async (options) => {
  // 1. Create a transporter
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address
      pass: process.env.EMAIL_PASS, // Your Gmail App Password
    },
  });

  // 2. Define the email options
  const mailOptions = {
    from: `"${options.fromName}" <${process.env.EMAIL_USER}>`, // sender address
    to: options.to, // list of receivers
    subject: options.subject, // Subject line
    html: options.html, // html body
  };

  // 3. Actually send the email
  try {
    const info = await transporter.sendMail(mailOptions);
    // eslint-disable-next-line no-console
    // console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error sending email:', error);
    throw new Error('Email could not be sent');
  }
};

export default sendEmail; 