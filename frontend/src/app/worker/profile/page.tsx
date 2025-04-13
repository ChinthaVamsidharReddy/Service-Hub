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

export default function WorkerProfilePage() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors }, watch } = useForm<WorkerProfileFormData>({
    resolver: zodResolver(workerProfileSchema),
    defaultValues: {
      serviceType: '',
      experienceYears: 0,
      hourlyRate: 0,
      location: '',
      description: '',
      availability: false
    }
  });

  useEffect(() => {
    // Fetch existing profile if it exists
    const fetchWorkerProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Please log in first');
          router.push('/auth/login');
          return;
        }

        const response = await axios.get('http://localhost:3002/api/worker/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const profile = response.data.data;
        console.log('Fetched profile:', profile);

        if (profile && profile.serviceType) {
          setIsEditing(true);
          setValue('serviceType', profile.serviceType);
          setValue('experienceYears', profile.experienceYears);
          setValue('hourlyRate', profile.hourlyRate);
          setValue('location', profile.location);
          setValue('description', profile.description || '');
          setValue('availability', profile.availability || false);
        }
      } catch (error: any) {
        if (error.response?.status !== 404) {
          console.error('Error fetching worker profile:', error);
        }
        // For 404 or any other error, we stay on create profile page
        setIsEditing(false);
      }
    };

    fetchWorkerProfile();
  }, [setValue, router]);

  const onSubmit = async (data: WorkerProfileFormData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in first');
        router.push('/auth/login');
        return;
      }

      // Format data exactly as required by the API
      const profileData = {
        serviceType: data.serviceType.toLowerCase(),
        experienceYears: Number(data.experienceYears),
        hourlyRate: Number(data.hourlyRate),
        location: data.location,
        description: data.description || "Professional worker with experience"
      };

      console.log('Submitting profile data:', profileData);

      const response = await axios.post('http://localhost:3002/api/worker/profile', profileData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.data) {
        console.log('Profile Creation Success:', response.data);
        localStorage.setItem('worker', JSON.stringify(response.data.data));
        toast.success('Profile created successfully! You can now receive bookings.');
        router.push('/worker/dashboard');
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error: any) {
      console.error('Profile Creation Error:', error.response?.data || error);
      const errorMessage = error.response?.data?.message || 'Failed to save profile';
      toast.error(errorMessage);
      
      // Log detailed error information
      if (error.response) {
        console.log('Error Response:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
    }
  };

  // New method to programmatically set and submit profile data
  const submitPrefilledProfile = async () => {
    const profileData = {
      serviceType: "plumbing",
      experienceYears: 5,
      hourlyRate: 25.00,
      location: "New York",
      description: "Professional plumber with 5 years of experience",
      availability: true
    };

    try {
      const token = localStorage.getItem('token');
      
      // Ensure all numeric fields are properly converted
      const processedData = {
        ...profileData,
        experienceYears: Number(profileData.experienceYears),
        hourlyRate: Number(profileData.hourlyRate)
      };
      
      const response = await axios.post('http://localhost:3002/api/worker/profile', processedData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Log the full response for debugging
      console.log('Prefilled Profile Creation Response:', response.data);
      
      toast.success('Profile created successfully!');
      router.push('/worker/dashboard');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Handle specific error responses from the backend
        if (error.response) {
          const errorMessage = error.response.data.errors 
            ? error.response.data.errors.map((err: any) => err.msg).join(', ')
            : error.response.data.message || 'Failed to create profile';
          
          // Log detailed error information
          console.error('Prefilled Profile Creation Error:', {
            status: error.response.status,
            data: error.response.data,
            requestData: profileData
          });
          
          toast.error(errorMessage);
        } else if (error.request) {
          toast.error('No response from server. Please check your connection.');
          console.error('No response received:', error.request);
        } else {
          toast.error('An unexpected error occurred');
          console.error('Error setting up request:', error.message);
        }
      } else {
        toast.error('An unexpected error occurred');
        console.error('Unexpected error:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white shadow-2xl rounded-xl p-10 border border-gray-100">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isEditing ? 'Update Worker Profile' : 'Create Worker Profile'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isEditing 
              ? 'Update your professional details' 
              : 'Complete your worker profile to start receiving bookings'}
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
                Hourly Rate ($)
                <span className="text-red-500 ml-1">*</span>
                <p className="text-xs text-gray-500 mt-1">
                  Approximate ₹{errors.hourlyRate ? '0' : ((Number(watch('hourlyRate')) || 0) * 83).toFixed(0)} per hour
                </p>
              </label>
              <input 
                type="number" 
                step="0.01"
                {...register('hourlyRate', { valueAsNumber: true })}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Your hourly rate"
              />
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
              {isEditing ? 'Update Profile' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 