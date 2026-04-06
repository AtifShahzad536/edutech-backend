const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const emailService = {
  sendEmail: async (options) => {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'EduTech <noreply@edutech.com>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('📧 Email sent: %s', info.messageId);
      return info;
    } catch (error) {
      console.error('❌ Email Error:', error);
      throw error;
    }
  },

  sendWelcomeEmail: async (user) => {
    return emailService.sendEmail({
      to: user.email,
      subject: 'Welcome to EduTech!',
      html: `<h1>Welcome, ${user.firstName}!</h1><p>We are excited to have you on board. Start your learning journey today!</p>`,
    });
  }
};

module.exports = emailService;
