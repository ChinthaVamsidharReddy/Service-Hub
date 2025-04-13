'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface BookingModalProps {
  worker: {
    id: string;
    full_name: string;
    service_type: string;
    hourly_rate: string;
    experience_years?: number;
  };
  onClose: () => void;
  onSuccess: () => void;
}

interface BookingFormData {
  bookingDate: string;
  startTime: string;
  endTime: string;
  description?: string;
}

export default function BookingModal({ worker, onClose, onSuccess }: BookingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors }, watch } = useForm<BookingFormData>();

  const onSubmit = async (data: BookingFormData) => {
    try {
      console.log('Starting booking submission with data:', data);
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please log in to book a service');
        return;
      }

      const bookingData = {
        workerId: worker.id,
        serviceType: (worker.service_type || '').toLowerCase(),
        bookingDate: data.bookingDate,
        startTime: `${data.startTime}:00`,
        endTime: `${data.endTime}:00`,
        description: data.description || ''
      };

      console.log('Worker data:', worker);
      console.log('Sending booking request with data:', bookingData);

      const response = await axios.post('http://localhost:3002/api/bookings', bookingData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Booking response:', response.data);
      
      if (response.data.status === 'success') {
        toast.success(response.data.message || 'Booking created successfully!');
        onSuccess();
        onClose();
      } else {
        toast.error(response.data.message || 'Failed to create booking');
      }
    } catch (error: any) {
      console.error('Booking error:', error.response?.data || error);
      let errorMessage = 'Failed to create booking. Please try again.';
      
      if (error.response?.data?.errors && error.response.data.errors.length > 0) {
        errorMessage = error.response.data.errors[0];
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Book Service</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800">{worker.full_name}</h3>
            <p className="text-gray-600 mb-1">{worker.service_type} - ₹{worker.hourly_rate}/hr</p>
            {worker.experience_years ? (
              <p className="text-sm text-gray-500">
                Experience: {worker.experience_years} {worker.experience_years === 1 ? 'year' : 'years'}
              </p>
            ) : null}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                min={today}
                {...register('bookingDate', { 
                  required: 'Please select a date',
                  validate: value => {
                    const selectedDate = new Date(value);
                    const today = new Date();
                    return selectedDate >= today || 'Please select a future date';
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.bookingDate && (
                <p className="text-red-500 text-xs mt-1">{errors.bookingDate.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  {...register('startTime', { 
                    required: 'Please select start time',
                    validate: value => {
                      if (!value) return 'Start time is required';
                      return true;
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.startTime && (
                  <p className="text-red-500 text-xs mt-1">{errors.startTime.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  {...register('endTime', { 
                    required: 'Please select end time',
                    validate: (value, formValues) => {
                      if (!value) return 'End time is required';
                      if (value <= formValues.startTime) return 'End time must be after start time';
                      return true;
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.endTime && (
                  <p className="text-red-500 text-xs mt-1">{errors.endTime.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Add any specific requirements or details..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 