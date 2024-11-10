// src/pages/Submit.js
import React, { useState } from 'react';
import './Submit.css';

const Submit = ({ onOtpVerified }) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const handleOtpChange = (e) => {
    setOtp(e.target.value);
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();

    const correctOtp = '123456';
    if (otp === correctOtp) {
      alert("OTP verified successfully!");
      setError('');
      onOtpVerified(); // Call the function to navigate to Home
    } else {
      setError('Incorrect OTP. Please try again.');
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