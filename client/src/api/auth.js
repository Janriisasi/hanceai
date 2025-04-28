import API from './axios';

// Login function
export const login = async (data) => {
  try {
    const response = await API.post('/auth/login', data);
    return response.data;  // Return the user data (including token)
  } catch (error) {
    throw error;
  }
};

// Signup function
export const signup = async (data) => {
  try {
    const response = await API.post('/auth/signup', data);
    return response.data;  // Return the user data (including token)
  } catch (error) {
    throw error;
  }
};

// Forgot Password function
export const forgotPassword = async (data) => {
  try {
    const response = await API.post('/auth/forgot-password', data);
    return response.data;  // Return success message
  } catch (error) {
    throw error;
  }
};

// Get current user profile
export const getCurrentUser = async () => {
  try {
    const response = await API.get('/auth/profile');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Logout function (frontend only - clears localStorage)
export const logout = () => {
  localStorage.removeItem('user');
};