import React from 'react';
import { SERVICE_TYPES_DISPLAY } from '@/app/constants/services';

interface ServiceDetailsModalProps {
  serviceType: string;
  onClose: () => void;
  onSearch: (serviceType: string) => void;
}

const serviceInfo = {
  home_cleaning: {
    description: "Professional home cleaning services to keep your space spotless",
    features: [
      "Deep cleaning of all rooms",
      "Bathroom and kitchen sanitization",
      "Dusting and vacuuming",
      "Window cleaning",
      "Floor mopping and polishing"
    ],
    benefits: [
      "Save time and energy",
      "Professional-grade cleaning",
      "Flexible scheduling",
      "Trained and verified staff",
      "Satisfaction guaranteed"
    ],
    priceRange: "$25-$45 per hour",
    icon: "🧹"
  },
  plumbing: {
    description: "Expert plumbing services for all your repair and installation needs",
    features: [
      "Pipe repair and replacement",
      "Drain cleaning",
      "Fixture installation",
      "Water heater services",
      "Emergency repairs"
    ],
    benefits: [
      "24/7 emergency service",
      "Licensed professionals",
      "Quality materials",
      "Warranty on work",
      "Upfront pricing"
    ],
    priceRange: "$50-$100 per hour",
    icon: "🔧"
  },
  electrical_work: {
    description: "Comprehensive electrical services for your home and business",
    features: [
      "Wiring installation and repair",
      "Circuit breaker service",
      "Lighting installation",
      "Safety inspections",
      "Electrical upgrades"
    ],
    benefits: [
      "Licensed electricians",
      "Safety compliance",
      "Modern equipment",
      "Emergency response",
      "Quality assurance"
    ],
    priceRange: "$60-$120 per hour",
    icon: "⚡"
  },
  painting: {
    description: "Transform your space with our professional painting services",
    features: [
      "Interior and exterior painting",
      "Wall preparation",
      "Color consultation",
      "Texture application",
      "Trim and detail work"
    ],
    benefits: [
      "Quality materials",
      "Expert painters",
      "Clean workmanship",
      "Color matching",
      "Protective covering"
    ],
    priceRange: "$35-$75 per hour",
    icon: "🎨"
  }
};

export default function ServiceDetailsModal({ serviceType, onClose, onSearch }: ServiceDetailsModalProps) {
  const info = serviceInfo[serviceType as keyof typeof serviceInfo];
  const displayName = SERVICE_TYPES_DISPLAY[serviceType as keyof typeof SERVICE_TYPES_DISPLAY];

  const handleFindWorkers = () => {
    onSearch(serviceType);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span>{info.icon}</span>
            {displayName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="mb-8">
            <p className="text-lg text-gray-600 leading-relaxed">
              {info.description}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-blue-800 mb-4">Services Included</h3>
              <ul className="space-y-3">
                {info.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-blue-700">
                    <svg className="w-5 h-5 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-green-800 mb-4">Benefits</h3>
              <ul className="space-y-3">
                {info.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2 text-green-700">
                    <svg className="w-5 h-5 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg mb-8">
            <h3 className="text-xl font-semibold text-purple-800 mb-2">Pricing</h3>
            <p className="text-purple-700 text-lg">
              Average price range: <span className="font-semibold">{info.priceRange}</span>
            </p>
            <p className="text-purple-600 text-sm mt-2">
              *Final price may vary based on job complexity and specific requirements
            </p>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleFindWorkers}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold"
            >
              Find {displayName} Workers
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 