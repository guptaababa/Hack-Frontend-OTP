// src/App.js
import React, { useState } from 'react';
import Login from './pages/Login';
import Submit from './pages/Submit';
import Home from './pages/Home';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [email, setEmail] = useState('');  // Add state to store email

  const handleLoginSuccess = (userEmail) => {
    setIsLoggedIn(true);
    setEmail(userEmail); // Store the email from Login
  };

  const handleOtpVerified = () => {
    setIsOtpVerified(true); // Trigger home page display upon OTP verification
  };

  return (
    <div>
      {isOtpVerified ? (
        <Home />
      ) : isLoggedIn ? (
        <Submit onOtpVerified={handleOtpVerified} email={email} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;