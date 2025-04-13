import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

interface PaymentFormProps {
  bookingId: number;
  amount: number;
  platformFee: number;
  customer_id: number;
  onPaymentComplete: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ bookingId, customer_id, amount, platformFee, onPaymentComplete }) => {
  console.log('PaymentForm Props:', { bookingId, amount, platformFee, customer_id });
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'qr'>('card');
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [qrCodeError, setQrCodeError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBookingLoading, setIsBookingLoading] = useState(true);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: ''
  });
  const [transactionId, setTransactionId] = useState(''); // State for transaction ID
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (selectedMethod === 'qr' && bookingId) {
      fetchQRCode();
    }
    if (bookingId) {
      fetchBookingDetails();
      checkExistingPayment();
    }
  }, [selectedMethod, bookingId]);

  const fetchQRCode = async () => {
    setIsLoading(true);
    setQrCodeError(null);
    console.log('Fetching QR code for booking:', bookingId);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${API_URL}/payments/qr-code/${bookingId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch QR code: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.status === 'success' && data.data.qrCode) {
        setQrCodeData(data.data.qrCode);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching QR code:', error);
      setQrCodeError(error instanceof Error ? error.message : 'Failed to fetch QR code');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBookingDetails = async () => {
    setIsBookingLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch booking details');
      }

      const data = await response.json();
      if (data.status === 'success') {
        // Convert numeric values to ensure they're treated as numbers
        const bookingData = {
          ...data.data,
          total_amount: Number(data.data.total_amount),
          platform_fee: Number(data.data.platform_fee)
        };
        setBookingDetails(bookingData);
        console.log('Fetched booking details:', bookingData);
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      toast.error('Failed to load booking details');
    } finally {
      setIsBookingLoading(false);
    }
  };

  const checkExistingPayment = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${API_URL}/payments/check/${bookingId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check payment status');
      }

      const data = await response.json();
      if (data.status === 'success' && data.data.hasPayment) {
        // Payment already exists
        toast.error('Payment already exists for this booking');
        // Notify the parent component to hide the payment form
        onPaymentComplete();
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  const handleMethodChange = (method: 'card' | 'qr') => {
    setSelectedMethod(method);
    setQrCodeError(null);
  };

  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cardNumber') {
      formattedValue = value.replace(/\D/g, '').slice(0, 16);
    } else if (name === 'expiryDate') {
      formattedValue = value
        .replace(/\D/g, '')
        .slice(0, 4)
        .replace(/(\d{2})(\d)/, '$1/$2');
    } else if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 3);
    }

    setCardDetails(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  const handleConfirmSubmit = async () => {
    if (!transactionId.trim()) {
      toast.error('Transaction ID is required for payment verification');
      return;
    }
    
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Prepare payload with explicit data types
      const payload = {
        bookingId: Number(bookingId),
        transactionId: transactionId.trim(),
        paymentMethod: selectedMethod === 'card' ? 'credit_card' : 'upi'
      };

      console.log('Submitting payment with data:', payload);

      const response = await fetch(`${API_URL}/payments/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      // Try to parse response as JSON, but handle cases where it might not be valid JSON
      let data;
      const responseText = await response.text();
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', responseText);
        data = { status: 'error', message: 'Invalid server response' };
      }

      console.log('Server response:', {
        status: response.status,
        statusText: response.statusText,
        data,
        responseText
      });

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      if (data.status === 'success') {
        toast.success('Payment processed successfully');
        onPaymentComplete();
      } else {
        toast.error(data.message || 'Payment processing failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsProcessing(false);
      setShowConfirmDialog(false); // Close dialog after processing
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmDialog(true); // Show confirmation dialog
  };

  const handleTransactionIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTransactionId(e.target.value);
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-800">Payment Details</h2>
      
      {isBookingLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : bookingDetails ? (
        <>
          <div className="mb-8 space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100">
              <p className="text-xl font-semibold text-center text-blue-800 mb-4">
                Amount to Pay: <span className="text-2xl">₹{bookingDetails.total_amount}</span>
              </p>
              <div className="border-t border-blue-200 pt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700">Service Amount:</span>
                  <span className="font-medium">₹{(Number(bookingDetails.total_amount || 0) - Number(bookingDetails.platform_fee || 0)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Platform Fee:</span>
                  <span className="font-medium">₹{Number(bookingDetails.platform_fee || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between mt-2 pt-3 border-t border-blue-200">
                  <span className="font-semibold text-lg">Total:</span>
                  <span className="font-bold text-lg text-blue-800">₹{Number(bookingDetails.total_amount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-indigo-50 p-5 rounded-lg border border-indigo-100">
              <h3 className="font-medium text-indigo-800 text-lg mb-3">Service Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex gap-2 items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-700">Service:</span>
                  <span className="font-medium text-gray-900">{bookingDetails.service_type}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-gray-700">Worker:</span>
                  <span className="font-medium text-gray-900">{bookingDetails.worker_details?.name}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-700">Date:</span>
                  <span className="font-medium text-gray-900">{new Date(bookingDetails.booking_date).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700">Time:</span>
                  <span className="font-medium text-gray-900">{bookingDetails.start_time} - {bookingDetails.end_time}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Choose Payment Method</h3>
            <div className="grid grid-cols-3 gap-4">
              <div 
                className={`border p-4 rounded-lg cursor-pointer transition ${selectedMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                onClick={() => handleMethodChange('card')}
              >
                <div className="flex flex-col items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span className="font-medium">Credit/Debit Card</span>
                </div>
              </div>
              <div 
                className={`border p-4 rounded-lg cursor-pointer transition ${selectedMethod === 'qr' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                onClick={() => handleMethodChange('qr')}
              >
                <div className="flex flex-col items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <span className="font-medium">UPI/QR Code</span>
                </div>
              </div>
              <div 
                className={`border p-4 rounded-lg cursor-pointer opacity-50`}
              >
                <div className="flex flex-col items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="font-medium text-gray-500">Net Banking (Coming Soon)</span>
                </div>
              </div>
            </div>
          </div>

          {selectedMethod === 'qr' && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              {isLoading && (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              )}

              {qrCodeError && (
                <div className="text-red-600 mb-4 p-4 bg-red-50 rounded-lg">
                  {qrCodeError}
                  <button
                    onClick={fetchQRCode}
                    className="block mx-auto mt-2 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Retry
                  </button>
                </div>
              )}

              {qrCodeData && (
                <div className="p-6 rounded-lg shadow-md inline-block bg-gradient-to-b from-white to-blue-50 border border-blue-100">
                  <div className="bg-white p-2 rounded-lg border-2 border-blue-200 mb-4">
                    <img
                      src={qrCodeData}
                      alt="Payment QR Code"
                      className="mx-auto"
                      width={250}
                      height={250}
                    />
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Scan this QR code with your UPI app
                    </p>
                    <div className="flex justify-center space-x-4 mb-2">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/1200px-UPI-Logo-vector.svg.png" alt="UPI" className="h-8" />
                    </div>
                    <p className="text-xs text-gray-500">
                      Supports all UPI apps including Google Pay, PhonePe, Paytm, BHIM
                    </p>
                  </div>
                  
                  <div className="mt-6 bg-white p-4 rounded-lg border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter UPI Transaction ID
                    </label>
                    <input
                      type="text"
                      name="transactionId"
                      value={transactionId}
                      onChange={handleTransactionIdChange}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter UPI Transaction ID"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Please enter the transaction ID received after completing the payment
                    </p>
                  </div>
                  
                  <button
                    onClick={handleSubmit}
                    disabled={isProcessing || !transactionId.trim()}
                    className="mt-6 w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium text-lg"
                  >
                    {isProcessing ? 'Processing...' : 'Confirm Payment'}
                  </button>
                </div>
              )}
            </div>
          )}

          {selectedMethod === 'card' && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-6">
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={cardDetails.name}
                      onChange={handleCardInputChange}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="cardNumber"
                        value={cardDetails.cardNumber}
                        onChange={handleCardInputChange}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 pr-10"
                        placeholder="1234 5678 9012 3456"
                        required
                        maxLength={16}
                      />
                      <div className="absolute right-3 top-3 flex space-x-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        name="expiryDate"
                        value={cardDetails.expiryDate}
                        onChange={handleCardInputChange}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="MM/YY"
                        required
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CVV
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="cvv"
                          value={cardDetails.cvv}
                          onChange={handleCardInputChange}
                          className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="123"
                          required
                          maxLength={3}
                        />
                        <div className="absolute right-3 top-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transaction Reference
                    </label>
                    <input
                      type="text"
                      name="transactionId"
                      value={transactionId}
                      onChange={handleTransactionIdChange}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter transaction reference"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Please enter a reference ID for this transaction
                    </p>
                  </div>
                </div>
                
                <div className="mt-8">
                  <button
                    type="submit"
                    disabled={isProcessing || !transactionId.trim()}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium text-lg"
                  >
                    {isProcessing ? 'Processing...' : 'Confirm Payment'}
                  </button>
                </div>
                
                <div className="flex items-center justify-center mt-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-sm text-gray-600">Secure Payment</span>
                </div>
              </form>
            </div>
          )}

          {showConfirmDialog && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Confirm Payment</h3>
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-gray-700 mb-3">Are you sure you want to proceed with the payment?</p>
                  <div className="font-medium flex justify-between">
                    <span>Total Amount:</span>
                    <span className="text-blue-800 font-bold">₹{Number(bookingDetails.total_amount || 0).toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowConfirmDialog(false)}
                    className="mr-3 px-4 py-2 bg-gray-200 rounded-lg text-gray-800 font-medium hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmSubmit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : 'Confirm'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-red-600 py-4 bg-red-50 rounded-lg">
          Failed to load booking details. Please try again.
          <button 
            onClick={fetchBookingDetails} 
            className="mt-2 block mx-auto text-blue-600 hover:text-blue-800 font-medium"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentForm;