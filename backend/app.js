const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const Joi = require("joi");
require("dotenv").config();

const app = express();
app.use(express.json());

// Define CORS options
const corsOptions = {
  origin: (origin, callback) => {
    console.log("Request Origin:", origin); // Log the incoming origin for debugging
    
    // Temporarily allow all origins for testing
    const allowedOrigins = [
      "http://localhost:3000", // Local development URL
      "https://portfolio-gamma-seven-39.vercel.app", // First production domain
    ];

    // Check if the request's origin is in the allowed origins list or if there's no origin (for server-to-server requests)
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true); // Allow the request
    } else {
      callback(new Error("Not allowed by CORS"), false); // Reject the request
    }
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
};

// Apply CORS middleware before routes to handle preflight requests
app.use(cors(corsOptions));

// Validation schema with improved error messages
const emailSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.empty": "Please provide your name.",
  }),
  email: Joi.string().email().required().messages({
    "string.empty": "Please provide your email address.",
    "string.email": "The email address you entered is invalid. Please provide a valid email.",
  }),
  subject: Joi.string().trim().required().messages({
    "string.empty": "Please provide a subject for your message.",
  }),
  message: Joi.string().trim().required().messages({
    "string.empty": "The message field cannot be empty. Please provide your message.",
  }),
});

// Root route
app.get("/", (req, res) => {
  res.send("Welcome to the Email API! The server is up and running.");
});

// Email route
app.post("/api/send-email", async (req, res) => {
  try {
    // Validate input with Joi
    const { error, value } = emailSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { name, email, subject, message } = value;

    // Log the email and subject for debugging
    console.log("Sending email:", { name, email, subject, message });

    // Configure Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Your email here (configured in .env)
        pass: process.env.EMAIL_PASS, // Your email password or app password here (configured in .env)
      },
    });

    const mailOptions = {
      from: email, // Sender's email
      to: process.env.EMAIL_USER, // Your email address where messages will be sent
      subject: `${subject} - from ${name}`,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    if (info.accepted.length) {
      return res.status(200).json({
        message: "Thank you! Your email has been sent successfully. We will get back to you soon.",
      });
    } else {
      throw new Error("The email could not be sent. Please try again later.");
    }
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      message: "Something went wrong while sending the email. Please try again later.",
    });
  }
});

// Handle OPTIONS request for preflight CORS check
app.options("/api/send-email", cors(corsOptions));  // Allow OPTIONS requests

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}. Ready to send emails!`);
});
