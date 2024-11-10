// src/pages/Submit.js
import React, { useState } from 'react';
import axios from 'axios'; 
import './Submit.css';

const Submit = ({ onOtpVerified, email }) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const handleOtpChange = (e) => {
    setOtp(e.target.value);
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();

    try {
      // Send POST request to verify OTP
      const response = await axios.post('http://localhost:5000/verify-otp', { email, otp });

      if (response.status === 200) {
        alert("OTP verified successfully!");
        setError('');
        onOtpVerified(); // Call the function to navigate to Home
      } else {
        setError('Incorrect OTP. Please try again.');
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setError('An error occurred while verifying the OTP. Please try again later.');
    }
  };

  return (
    <div className="submit-container">
      <form onSubmit={handleOtpSubmit} className="submit-form">
        <h2>OTP Verification</h2>
        
        <label htmlFor="otp">Enter OTP:</label>
        <input
          type="text"
          id="otp"
          value={otp}
          onChange={handleOtpChange}
          placeholder="Enter OTP"
          className={error ? 'input-error' : ''}
        />
        
        {error && <p className="error-message">{error}</p>}
        
        <button type="submit" className="submit-button">Submit</button>
      </form>
    </div>
  );
};

export default Submit;
