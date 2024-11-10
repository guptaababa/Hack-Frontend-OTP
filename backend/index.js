require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3').verbose();
const os = require('os'); // To get network interfaces for the MAC address

const app = express();

// Enable CORS with default settings
app.use(cors());

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

// Whitelisted email addresses
const whitelistedEmails = ['shravanisonawane1708@gmail.com'];

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

// Send an email to the admin about unauthorized access
async function notifyAdmin(email, ip, mac, userAgent, timestamp) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'harshbhushangupta@gmail.com',
      subject: 'Unauthorized Login Attempt',
      text: `An unauthorized login attempt was made with email: ${email}. Here are the details:
            IP Address: ${ip}
            MAC Address: ${mac}
            User-Agent: ${userAgent}
            Time of Attempt: ${timestamp}`,
    });
  } catch (error) {
    console.error('Error notifying admin:', error);
  }
}

// Function to get the real IP address (considering reverse proxies)
function getIpAddress(req) {
  const forwardedIps = req.headers['x-forwarded-for'];
  if (forwardedIps) {
    // If X-Forwarded-For header exists, get the first IP (real client IP)
    return forwardedIps.split(',')[0];
  }
  return req.ip; // Fallback to req.ip if no X-Forwarded-For header
}


// Route to send OTP to user email
app.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  if (!whitelistedEmails.includes(email)) {
    const ip = getIpAddress(req);  // IP address of the requester
    const mac = req.headers['x-mac-address'] || 'MAC Address not available'; // MAC address (if available)
    const userAgent = req.get('User-Agent'); // User-Agent string from headers
    const timestamp = new Date().toISOString(); // Timestamp of the attempt

    // Notify the admin about the unauthorized login attempt
    notifyAdmin(email, ip, mac, userAgent, timestamp)
      .then(() => {
        console.log('Admin notified of unauthorized login attempt.');
      })
      .catch((error) => {
        console.error('Error notifying admin:', error);
      });

    // Proceed with other steps like denying access
    return res.status(400).json({ message: 'This email is not authorized to log in.' });
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

  if (!whitelistedEmails.includes(email)) {
    const ip = req.ip; // Capture the user's IP address
    const mac = getMacAddress(); // Capture the MAC address
    notifyAdmin(email, ip, mac); // Notify admin about unauthorized access
    return res.status(403).json({ message: 'Unauthorized email address' });
  }

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
