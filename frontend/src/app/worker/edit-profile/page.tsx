'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { SERVICE_TYPES, SERVICE_TYPES_DISPLAY, SERVICE_TYPES_ARRAY, ServiceType } from '@/app/constants/services';

// Worker Profile Validation Schema
const workerProfileSchema = z.object({
  serviceType: z.string().refine(value => SERVICE_TYPES_ARRAY.includes(value as ServiceType), {
    message: 'Please select a valid service type'
  }),
  experienceYears: z.number().min(0, 'Experience years must be non-negative'),
  hourlyRate: z.number().min(0, 'Hourly rate must be non-negative'),
  location: z.string().min(2, 'Location must be at least 2 characters'),
  description: z.string().optional(),
  availability: z.boolean().optional()
});

type WorkerProfileFormData = z.infer<typeof workerProfileSchema>;

// No need for format functions anymore since we're using the correct format already
const formatServiceTypeForApi = (serviceType: string): string => serviceType;
const convertApiServiceTypeToDisplay = (apiServiceType: string): string => 
  SERVICE_TYPES_DISPLAY[apiServiceType as keyof typeof SERVICE_TYPES_DISPLAY] || apiServiceType;

export default function EditWorkerProfilePage() {
  const router = useRouter();
  const { register, handleSubmit, setValue, formState: { errors }, watch } = useForm<WorkerProfileFormData>({
    resolver: zodResolver(workerProfileSchema)
  });

  useEffect(() => {
    // Fetch existing profile
    const fetchWorkerProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3002/api/worker/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const profile = response.data.data;
        if (profile) {
          // Convert API service type to display format
          const displayServiceType = convertApiServiceTypeToDisplay(profile.serviceType) || profile.serviceType;
          setValue('serviceType', displayServiceType);
          setValue('experienceYears', profile.experienceYears || profile.experience_years || 0);
          setValue('hourlyRate', profile.hourlyRate || profile.hourly_rate || 0);
          setValue('location', profile.location || '');
          setValue('description', profile.description || '');
          setValue('availability', profile.availability === undefined ? true : profile.availability);
        } else {
          // Redirect to create profile if no profile exists
          router.push('/worker/profile');
        }
      } catch (error) {
        console.error('Error fetching worker profile', error);
        router.push('/worker/profile');
      }
    };

    fetchWorkerProfile();
  }, []);

  const onSubmit = async (data: WorkerProfileFormData) => {
    try {
      const token = localStorage.getItem('token');
      
      // Format service type for API
      const formattedData = {
        ...data,
        serviceType: formatServiceTypeForApi(data.serviceType),
        experienceYears: Number(data.experienceYears),
        hourlyRate: Number(data.hourlyRate),
        availability: data.availability || false
      };

      const response = await axios.post('http://localhost:3002/api/worker/profile', formattedData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      toast.success('Profile updated successfully!');
      router.push('/worker/dashboard');
    } catch (error) {
      // More detailed error logging
      if (axios.isAxiosError(error)) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response) {
          console.error('Error response:', error.response.data);
          console.error('Error status:', error.response.status);
          toast.error(error.response.data.message || 'Failed to update profile');
        } else if (error.request) {
          // The request was made but no response was received
          console.error('No response received:', error.request);
          toast.error('No response from server. Please check your connection.');
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Error setting up request:', error.message);
          toast.error('An unexpected error occurred');
        }
      } else {
        // Handle non-axios errors
        console.error('Unexpected error:', error);
        toast.error('An unexpected error occurred');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white shadow-2xl rounded-xl p-10 border border-gray-100">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Update Worker Profile
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Update your professional details
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700">
                Service Type
                <span className="text-red-500 ml-1">*</span>
              </label>
              <select 
                {...register('serviceType')}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                <option value="">Select a Service</option>
                {SERVICE_TYPES_ARRAY.map((service) => (
                  <option key={service} value={service}>
                    {SERVICE_TYPES_DISPLAY[service as keyof typeof SERVICE_TYPES_DISPLAY]}
                  </option>
                ))}
              </select>
              {errors.serviceType && <p className="text-red-500 text-xs mt-1">{errors.serviceType.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="experienceYears" className="block text-sm font-medium text-gray-700">
                Experience (Years)
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input 
                type="number" 
                {...register('experienceYears', { valueAsNumber: true })}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Years of experience"
              />
              {errors.experienceYears && <p className="text-red-500 text-xs mt-1">{errors.experienceYears.message}</p>}
            </div>
            <div>
              <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700">
                Hourly Rate (₹)
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input 
                  type="number" 
                  step="0.01"
                  {...register('hourlyRate', { valueAsNumber: true })}
                  className="pl-7 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Your hourly rate in Rupees"
                />
              </div>
              {errors.hourlyRate && <p className="text-red-500 text-xs mt-1">{errors.hourlyRate.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input 
              type="text" 
              {...register('location')}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="City or service area"
            />
            {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description (Optional)
            </label>
            <textarea 
              {...register('description')}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="Tell us about your skills and experience"
              rows={3}
            />
          </div>

          <div className="flex items-center">
            <input 
              type="checkbox" 
              {...register('availability')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="availability" className="ml-2 block text-sm text-gray-900">
              Available for Bookings
            </label>
          </div>

          <div>
            <button 
              type="submit" 
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
            >
              Update Profile
            </button>
          </div>
          
          <div className="text-center mt-4">
            <a 
              href="/worker/dashboard" 
              className="text-sm font-medium text-blue-600 hover:text-blue-500 transition"
            >
              Back to Dashboard
            </a>
          </div>
        </form>
      </div>
    </div>
  );
} 