'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

// OTP Form validation schema
const otpSchema = z.object({
  otp: z.string().min(6, 'OTP must be at least 6 characters').max(6, 'OTP must be exactly 6 characters')
});

type OTPFormData = z.infer<typeof otpSchema>;

export default function VerifyOTPPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [timer, setTimer] = useState(60); // 60 seconds countdown
  const [canResend, setCanResend] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema)
  });

  useEffect(() => {
    // Get email from session storage
    const resetEmail = sessionStorage.getItem('resetEmail');
    if (!resetEmail) {
      toast.error('Email not found. Please start the password reset process again.');
      router.push('/auth/forgot-password');
      return;
    }
    
    setEmail(resetEmail);
    
    // Start countdown timer
    const interval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [router]);

  const onSubmit = async (data: OTPFormData) => {
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:3002/api/auth/verify-otp', {
        email,
        otp: data.otp
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Failed to verify OTP');
      }
      
      toast.success('OTP verified successfully!');
      
      // Store token for the reset page
      sessionStorage.setItem('resetToken', response.data.resetToken);
      
      // Redirect to reset password page
      router.push('/auth/reset-password');
    } catch (error) {
      console.error('OTP Verification Error:', error);
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          toast.error('Request timed out. The server might be busy or temporarily unavailable.');
        } else if (error.code === 'ERR_NETWORK') {
          toast.error('Network error. Please check your connection or the server status.');
        } else if (error.response) {
          const errorMessage = error.response.data?.message || 'Invalid OTP';
          toast.error(errorMessage);
        } else {
          toast.error('An unexpected error occurred while connecting to the server');
        }
      } else {
        toast.error('Failed to verify OTP. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:3002/api/auth/resend-otp', {
        email
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Failed to resend OTP');
      }
      
      toast.success('New OTP sent to your email!');
      
      // Reset timer
      setTimer(60);
      setCanResend(false);
    } catch (error) {
      console.error('Resend OTP Error:', error);
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          toast.error('Request timed out. The server might be busy or temporarily unavailable.');
        } else if (error.code === 'ERR_NETWORK') {
          toast.error('Network error. Please check your connection or the server status.');
        } else if (error.response) {
          const errorMessage = error.response.data?.message || 'Failed to resend OTP';
          toast.error(errorMessage);
        } else {
          toast.error('An unexpected error occurred while connecting to the server');
        }
      } else {
        toast.error('Failed to resend OTP. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block"
          >
            <div className="bg-blue-600 text-white p-4 rounded-full inline-block mb-4">
              <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Enter Verification Code</h2>
          <p className="text-gray-600">We've sent a 6-digit code to your email</p>
          <p className="text-gray-500 text-sm mt-1">{email}</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <div className="mt-1">
                <input 
                  type="text" 
                  {...register('otp')}
                  className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center tracking-widest text-lg font-semibold transition-all duration-200"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                />
              </div>
              {errors.otp && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-xs mt-1"
                >
                  {errors.otp.message}
                </motion.p>
              )}
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
          
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600 mb-2">
              {canResend ? 'Didn\'t receive a code?' : `Resend code in ${timer} seconds`}
            </p>
            <button
              onClick={handleResendOTP}
              disabled={!canResend || isLoading}
              className={`text-sm font-medium ${canResend ? 'text-blue-600 hover:text-blue-500 cursor-pointer' : 'text-gray-400 cursor-not-allowed'} transition-colors duration-200`}
            >
              Resend Code
            </button>
            <div className="mt-4 border-t border-gray-100 pt-4">
              <a href="/auth/login" className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200">
                Back to login
              </a>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
} 