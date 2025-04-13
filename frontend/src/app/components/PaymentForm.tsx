'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
// import { useRouter } from 'next/navigation';
import { useRouter } from 'next/router';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

interface PaymentFormProps {
  bookingId: number;
  onPaymentComplete: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ bookingId, onPaymentComplete }) => {
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'qr'>('card');
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [qrCodeError, setQrCodeError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: '',
  });
  const [amount, setAmount] = useState<number | null>(null); // State to store the total amount
  const router = useRouter();

  useEffect(() => {
    // Fetch booking details to get the total amount
    const fetchBookingDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to fetch booking details: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.status === 'success' && data.data) {
          setAmount(data.data.amount); // Set the total amount from the booking data
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Error fetching booking details:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to fetch booking details');
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

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
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
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

    setCardDetails((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      let paymentDetails = {};
      if (selectedMethod === 'card') {
        // Validate card details
        if (!cardDetails.cardNumber || !cardDetails.expiryDate || !cardDetails.cvv || !cardDetails.name) {
          toast.error('Please fill in all card details');
          return;
        }
        paymentDetails = cardDetails;
      }

      const response = await fetch(`${API_URL}/payments/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId,
          amount,
          paymentMethod: selectedMethod,
          paymentDetails,
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        toast.success('Payment processed successfully');
        onPaymentComplete();
      } else {
        toast.error(data.message || 'Payment processing failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  if (amount === null) {
    return <p>Loading payment details...</p>; // Show a loading state while fetching the amount
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Payment Details</h2>
      <div className="mb-6">
        <p className="text-lg font-semibold text-center">Amount to Pay: ₹{amount}</p>
      </div>

      <div className="flex justify-center gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded-lg ${
            selectedMethod === 'card' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
          onClick={() => handleMethodChange('card')}
        >
          Card Payment
        </button>
        <button
          className={`px-4 py-2 rounded-lg ${
            selectedMethod === 'qr' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
          onClick={() => handleMethodChange('qr')}
        >
          QR Code
        </button>
      </div>

      {selectedMethod === 'qr' && (
        <div className="text-center">
          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {qrCodeError && (
            <div className="text-red-600 mb-4">
              {qrCodeError}
              <button
                onClick={fetchQRCode}
                className="block mx-auto mt-2 text-blue-600 hover:text-blue-800"
              >
                Retry
              </button>
            </div>
          )}

          {qrCodeData && (
            <div className="bg-white p-4 rounded-lg shadow-md inline-block">
              <img
                src={qrCodeData}
                alt="Payment QR Code"
                className="mx-auto mb-4"
                width={300}
                height={300}
              />
              <p className="text-sm text-gray-600 mt-2">Scan this QR code with your UPI app to pay</p>
              <button
                onClick={handleSubmit}
                disabled={isProcessing}
                className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          )}
        </div>
      )}

      {selectedMethod === 'card' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Cardholder Name</label>
            <input
              type="text"
              name="name"
              value={cardDetails.name}
              onChange={handleCardInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              placeholder="John Doe"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Card Number</label>
            <input
              type="text"
              name="cardNumber"
              value={cardDetails.cardNumber}
              onChange={handleCardInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              placeholder="1234 5678 9012 3456"
              required
              maxLength={16}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
              <input
                type="text"
                name="expiryDate"
                value={cardDetails.expiryDate}
                onChange={handleCardInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                placeholder="MM/YY"
                required
                maxLength={5}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">CVV</label>
              <input
                type="text"
                name="cvv"
                value={cardDetails.cvv}
                onChange={handleCardInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                placeholder="123"
                required
                maxLength={3}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Pay Now'}
          </button>
        </form>
      )}
    </div>
  );
};

export default PaymentForm;