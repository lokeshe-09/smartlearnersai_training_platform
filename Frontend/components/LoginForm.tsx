import React, { useState, useEffect } from 'react';
import { GraduationCap, BookOpen, User, Mail, Lock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import InputField from './InputField';
import { authAPI } from '../services/api';

interface LoginFormProps {
  onLoginSuccess: (username: string) => void;
}

type AuthMode = 'login' | 'signup';

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  // Form state
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Clear messages when switching modes
  useEffect(() => {
    setError('');
    setSuccessMessage('');
  }, [mode]);

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    // Client-side validation
    if (!username.trim()) {
      setError('Username is required.');
      setIsLoading(false);
      return;
    }

    if (!password) {
      setError('Password is required.');
      setIsLoading(false);
      return;
    }

    if (mode === 'signup') {
      if (!email.trim()) {
        setError('Email is required.');
        setIsLoading(false);
        return;
      }

      if (password.length < 4) {
        setError('Password must be at least 4 characters.');
        setIsLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        setIsLoading(false);
        return;
      }
    }

    try {
      if (mode === 'login') {
        const response = await authAPI.login({ username, password });

        if (response.success && response.user) {
          setSuccessMessage('Login successful!');
          setTimeout(() => {
            const displayName = response.user!.first_name || response.user!.username;
            const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
            onLoginSuccess(capitalizedName);
          }, 500);
        } else {
          setError(response.message || 'Invalid credentials. Please try again.');
        }
      } else {
        const response = await authAPI.signup({
          username,
          email,
          password,
          confirm_password: confirmPassword,
        });

        if (response.success && response.user) {
          setSuccessMessage('Account created!');
          setTimeout(() => {
            const displayName = response.user!.first_name || response.user!.username;
            const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
            onLoginSuccess(capitalizedName);
          }, 500);
        } else {
          setError(response.message || 'Registration failed. Please try again.');
        }
      }
    } catch (err) {
      setError('Network error. Please check if the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    resetForm();
  };

  return (
    <div className="bg-slate-50/95 backdrop-blur-sm rounded-[2.5rem] shadow-2xl px-8 py-10 md:px-10 md:py-12 w-full mx-auto transition-transform hover:scale-[1.01] duration-300 border border-white/50">

      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-[#0072BC] text-2xl md:text-4xl font-extrabold tracking-wide mb-6 whitespace-nowrap">
          SMARTLEARNERS.AI
        </h1>

        {/* Icons Group */}
        <div className="flex justify-center gap-4 mb-4 text-[#00A0E3]">
          <GraduationCap size={32} strokeWidth={2.5} />
          <BookOpen size={32} strokeWidth={2.5} />
          <User size={32} strokeWidth={2.5} />
        </div>

        <h2 className="text-[#0e3b68] text-2xl font-bold mb-2">
          Student Portal
        </h2>
        <p className="text-slate-500 text-sm font-medium tracking-wide">
          {mode === 'login' ? 'Unlock your potential. Shape the future.' : 'Create your account to get started.'}
        </p>
      </div>

      {/* Form Section */}
      <form onSubmit={handleSubmit} className="space-y-5">

        <InputField
          id="username"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          icon={<Mail size={20} className="text-[#00A0E3]" />}
        />

        {mode === 'signup' && (
          <InputField
            id="email"
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={20} className="text-[#00A0E3]" />}
          />
        )}

        <InputField
          id="password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock size={20} className="text-[#00A0E3]" />}
          isPassword={true}
        />

        {mode === 'signup' && (
          <InputField
            id="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={<Lock size={20} className="text-[#00A0E3]" />}
            isPassword={true}
          />
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100 animate-pulse">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg border border-green-100">
            <CheckCircle size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-[#00b4db] to-[#004e92] hover:from-[#00c6ea] hover:to-[#005cb2] text-white font-bold py-3.5 px-4 rounded-full shadow-lg transform transition-all duration-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              {mode === 'login' ? 'Verifying...' : 'Creating...'}
            </span>
          ) : (
            mode === 'login' ? 'Access Dashboard' : 'Create Account'
          )}
        </button>

      </form>

      {/* Footer Links */}
      <div className="mt-8 flex justify-between items-center text-sm font-semibold">
        <a href="#" className="text-[#00A0E3] hover:text-[#0072BC] transition-colors">
          Forgot Password?
        </a>
        <button
          type="button"
          onClick={toggleMode}
          className="text-[#00A0E3] hover:text-[#0072BC] transition-colors"
        >
          {mode === 'login' ? 'Sign Up' : 'Sign In'}
        </button>
      </div>

      {/* Copyright */}
      <div className="mt-8 text-center">
        <p className="text-gray-400 text-xs">
          © 2026 SMARTLEARNERS AI. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
