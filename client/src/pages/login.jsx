import React, { useState } from 'react';
import { login, signup, forgotPassword } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const Login = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const resetMessages = () => {
    setError('');
    setSuccessMessage('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    resetMessages();
    setIsLoading(true);
    
    try {
      const userData = await login({ email, password });
      
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Redirect to homepage after successful login
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    resetMessages();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const userData = await signup({ 
        name: fullName,
        email, 
        password 
      });
      
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Redirect to homepage after successful signup
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    resetMessages();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await forgotPassword({ 
        email,
        newPassword: password 
      });
      
      setSuccessMessage(response.message || 'Password has been reset successfully.');
      setTimeout(() => {
        setActiveTab('login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black flex flex-col md:flex-row items-center p-4 md:p-0">
      {/* Logo Section */}
      <div className="flex-1 flex items-center justify-center mb-8 md:mb-0 md:pl-20">
        <div className="flex items-center">
          <img
            src="/Logo.svg"
            alt="HanceAI Logo"
            className="h-20 md:h-30 w-auto"
          />
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 flex items-center justify-center w-full md:pr-20">
        <div className="w-full max-w-md p-6 md:p-8 rounded-lg border border-purple-600 shadow-lg shadow-purple-600/20 bg-black">
          {error && (
            <div className="mb-4 p-3 bg-red-900 bg-opacity-30 border border-red-800 text-red-200 rounded text-sm">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 p-3 bg-green-900 bg-opacity-30 border border-green-800 text-green-200 rounded text-sm">
              {successMessage}
            </div>
          )}
          
          {activeTab === 'login' && (
            <form onSubmit={handleLogin}>
              <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-6 md:mb-8">Login</h2>
              <div className="mb-4">
                <label htmlFor="email" className="block text-white mb-2 text-sm md:text-base">Email</label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-3 py-2 md:px-4 md:py-3 rounded-md bg-white text-black border-none focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm md:text-base"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-2">
                <label htmlFor="password" className="block text-white mb-2 text-sm md:text-base">Password</label>
                <input
                  type="password"
                  id="password"
                  className="w-full px-3 py-2 md:px-4 md:py-3 rounded-md bg-white text-black border-none focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm md:text-base"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="text-right mb-4 md:mb-6">
                <button
                  type="button"
                  className="text-purple-600 hover:text-purple-400 transition-colors cursor-pointer text-sm md:text-base"
                  onClick={() => {
                    resetMessages();
                    setActiveTab('forgot');
                  }}
                >
                  Forgot Password?
                </button>
              </div>
              <button
                type="submit"
                className="w-full py-2 md:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors whitespace-nowrap cursor-pointer flex justify-center items-center text-sm md:text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                ) : null}
                Login
              </button>
              <div className="mt-4 md:mt-6 text-center text-white text-sm md:text-base">
                Don't have an account?{' '}
                <button
                  type="button"
                  className="text-purple-600 hover:text-purple-400 transition-colors cursor-pointer"
                  onClick={() => {
                    resetMessages();
                    setActiveTab('signup');
                  }}
                >
                  Sign up
                </button>
              </div>
            </form>
          )}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignup}>
              <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-6 md:mb-8">Sign Up</h2>
              <div className="mb-4">
                <label htmlFor="fullName" className="block text-white mb-2 text-sm md:text-base">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  className="w-full px-3 py-2 md:px-4 md:py-3 rounded-md bg-white text-black border-none focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm md:text-base"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="signupEmail" className="block text-white mb-2 text-sm md:text-base">Email</label>
                <input
                  type="email"
                  id="signupEmail"
                  className="w-full px-3 py-2 md:px-4 md:py-3 rounded-md bg-white text-black border-none focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm md:text-base"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="signupPassword" className="block text-white mb-2 text-sm md:text-base">Password</label>
                <input
                  type="password"
                  id="signupPassword"
                  className="w-full px-3 py-2 md:px-4 md:py-3 rounded-md bg-white text-black border-none focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm md:text-base"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4 md:mb-6">
                <label htmlFor="confirmPassword" className="block text-white mb-2 text-sm md:text-base">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  className="w-full px-3 py-2 md:px-4 md:py-3 rounded-md bg-white text-black border-none focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm md:text-base"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 md:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors whitespace-nowrap cursor-pointer flex justify-center items-center text-sm md:text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                ) : null}
                Sign Up
              </button>
              <div className="mt-4 md:mt-6 text-center text-white text-sm md:text-base">
                Already have an account?{' '}
                <button
                  type="button"
                  className="text-purple-600 hover:text-purple-400 transition-colors cursor-pointer"
                  onClick={() => {
                    resetMessages();
                    setActiveTab('login');
                  }}
                >
                  Login
                </button>
              </div>
            </form>
          )}
          {activeTab === 'forgot' && (
            <form onSubmit={handleForgotPassword}>
              <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-3 md:mb-4">Reset Password</h2>
              <p className="text-white text-center mb-4 md:mb-6 text-sm md:text-base">
                Enter your email and new password below.
              </p>
              <div className="mb-4">
                <label htmlFor="recoveryEmail" className="block text-white mb-2 text-sm md:text-base">Email</label>
                <input
                  type="email"
                  id="recoveryEmail"
                  className="w-full px-3 py-2 md:px-4 md:py-3 rounded-md bg-white text-black border-none focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm md:text-base"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="newPassword" className="block text-white mb-2 text-sm md:text-base">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  className="w-full px-3 py-2 md:px-4 md:py-3 rounded-md bg-white text-black border-none focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm md:text-base"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4 md:mb-6">
                <label htmlFor="confirmNewPassword" className="block text-white mb-2 text-sm md:text-base">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmNewPassword"
                  className="w-full px-3 py-2 md:px-4 md:py-3 rounded-md bg-white text-black border-none focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm md:text-base"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 md:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors whitespace-nowrap cursor-pointer flex justify-center items-center text-sm md:text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                ) : null}
                Reset Password
              </button>
              <div className="mt-4 md:mt-6 text-center text-white text-sm md:text-base">
                Remember password?{' '}
                <button
                  type="button"
                  className="text-purple-600 hover:text-purple-400 transition-colors cursor-pointer"
                  onClick={() => {
                    resetMessages();
                    setActiveTab('login');
                  }}
                >
                  Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;