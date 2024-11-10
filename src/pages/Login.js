// src/components/Login.js
import React, { useState } from 'react';
import axios from 'axios';  // Import axios
import './Login.css';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(email)) {
      setError('');
      
      try {
        // Send POST request to send OTP
        const response = await axios.post('http://localhost:5000/send-otp', { email });
        
        if (response.status === 200) {
          alert("OTP sent to your email.");
          onLoginSuccess(email); // Notify App.js of successful login
        } else {
          setError('Failed to send OTP. Please try again.');
        }
      } catch (error) {
        console.error("Error sending OTP:", error);
        setError('An error occurred while sending the OTP. Please try again later.');
      }
      
    } else {
      setError('Please enter a valid email address.');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Login</h2>
        
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="Enter your email"
          className={error ? 'input-error' : ''}
        />
        
        {error && <p className="error-message">{error}</p>}
        
        <button type="submit" className="login-button">Login</button>
      </form>
    </div>
  );
};

export default Login;
