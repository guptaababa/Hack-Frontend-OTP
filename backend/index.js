require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(express.json());

// Connect to SQLite database
const db = new sqlite3.Database('./otp.db', (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Create OTP table if it doesn’t exist
db.run(`
  CREATE TABLE IF NOT EXISTS otp_store (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    otp INTEGER NOT NULL,
    sent_time INTEGER NOT NULL
  )
`);

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  secure: true,
});

// Generate OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
}

// Route to send OTP to user email
app.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const otp = generateOtp();
  const sentTime = Date.now();

  // Insert OTP record into the database
  db.run(
    `INSERT INTO otp_store (email, otp, sent_time) VALUES (?, ?, ?)`,
    [email, otp, sentTime],
    async (err) => {
      if (err) {
        console.error('Error storing OTP in database:', err);
        return res.status(500).json({ message: 'Failed to store OTP' });
      }

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Your OTP Code',
          text: `Your OTP code is ${otp}. It is valid for 5 minutes.`,
        });
        res.json({ message: 'OTP sent successfully' });
      } catch (error) {
        console.error('Error sending OTP email:', error);
        res.status(500).json({ message: 'Failed to send OTP' });
      }
    }
  );
});

// Route to verify OTP
app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  db.get(
    `SELECT * FROM otp_store WHERE email = ? ORDER BY id DESC LIMIT 1`,
    [email],
    (err, row) => {
      if (err) {
        console.error('Error querying OTP from database:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (!row) {
        return res.status(400).json({ message: 'OTP not found or expired' });
      }

      // Check if OTP has expired (5 minutes)
      if (Date.now() > row.sent_time + 5 * 60 * 1000) {
        db.run(`DELETE FROM otp_store WHERE id = ?`, [row.id], (err) => {
          if (err) {
            console.error('Error deleting expired OTP:', err);
          }
        });
        return res.status(400).json({ message: 'OTP has expired' });
      }

      // Check if the provided OTP matches the stored OTP
      if (parseInt(otp, 10) !== row.otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }

      // OTP verified successfully, delete it from the database to prevent reuse
      db.run(`DELETE FROM otp_store WHERE id = ?`, [row.id], (err) => {
        if (err) {
          console.error('Error deleting verified OTP:', err);
        }
      });

      res.json({ message: 'OTP verified successfully' });
    }
  );
});

// Index Route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
