// src/components/Login.js
import React, { useState } from 'react';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(email)) {
      alert("Login successful");
      setError('');
      // Add further login logic here, such as authentication
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