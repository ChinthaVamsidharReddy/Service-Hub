'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SERVICE_TYPES, SERVICE_TYPES_DISPLAY } from '@/app/constants/services';

const serviceInfo = {
  home_cleaning: {
    title: "Professional Home Cleaning",
    description: "Transform your living space with our comprehensive home cleaning services",
    longDescription: "Our professional home cleaning service delivers spotless results every time. We use eco-friendly products and follow a detailed cleaning checklist to ensure no corner is left untouched.",
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
    icon: "🧹",
    color: "blue"
  },
  plumbing: {
    title: "Expert Plumbing Solutions",
    description: "Professional plumbing services for all your repair and installation needs",
    longDescription: "Our licensed plumbers handle everything from minor repairs to major installations. Available 24/7 for emergency services, we ensure your plumbing systems work flawlessly.",
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
    icon: "🔧",
    color: "green"
  },
  electrical_work: {
    title: "Professional Electrical Services",
    description: "Safe and reliable electrical services for your home and business",
    longDescription: "Our certified electricians provide comprehensive electrical services with a focus on safety and reliability. From simple repairs to complete rewiring, we handle it all.",
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
    icon: "⚡",
    color: "yellow"
  },
  painting: {
    title: "Expert Painting Services",
    description: "Transform your space with our professional painting services",
    longDescription: "Our skilled painters deliver exceptional results for both interior and exterior projects. We use premium materials and techniques to ensure a lasting, beautiful finish.",
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
    icon: "🎨",
    color: "purple"
  }
};

const ServiceCard = ({ service, onClick }: { service: string; onClick: () => void }) => {
  const info = serviceInfo[service as keyof typeof serviceInfo];
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      <div className={`p-6 border-b border-gray-100`}>
        <div className="flex items-center gap-4">
          <span className="text-4xl">{info.icon}</span>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">{info.title}</h3>
            <p className="text-gray-600 mt-1">{info.description}</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-4">
        <p className="text-gray-500 text-sm">Starting from</p>
        <p className="text-2xl font-bold text-gray-800">{info.priceRange}</p>
      </div>
    </motion.div>
  );
};

const ServiceDetails = ({ service, onClose }: { service: string; onClose: () => void }) => {
  const info = serviceInfo[service as keyof typeof serviceInfo];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{info.icon}</span>
            <h2 className="text-3xl font-bold text-gray-800">{info.title}</h2>
          </div>
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
            <p className="text-xl text-gray-600 leading-relaxed">
              {info.longDescription}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-blue-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-blue-800 mb-4">What We Offer</h3>
              <ul className="space-y-4">
                {info.features.map((feature, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 text-blue-700"
                  >
                    <svg className="w-5 h-5 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                    </svg>
                    <span>{feature}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            <div className="bg-green-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-green-800 mb-4">Why Choose Us</h3>
              <ul className="space-y-4">
                {info.benefits.map((benefit, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 text-green-700"
                  >
                    <svg className="w-5 h-5 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                    </svg>
                    <span>{benefit}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-xl mb-8">
            <h3 className="text-xl font-semibold text-purple-800 mb-4">Pricing</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-700 text-lg">
                  Starting from <span className="font-semibold">{info.priceRange}</span>
                </p>
                <p className="text-purple-600 text-sm mt-2">
                  *Final price may vary based on job complexity and specific requirements
                </p>
              </div>
              <button
                onClick={onClose}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Book Now
              </button>
            </div>
          </div>

          <div className="bg-orange-50 p-6 rounded-xl">
            <h3 className="text-xl font-semibold text-orange-800 mb-4">Quality Guarantee</h3>
            <p className="text-orange-700">
              We stand behind our work with a 100% satisfaction guarantee. If you're not completely satisfied with our service, we'll make it right.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function ServicesPage() {
  const [selectedService, setSelectedService] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-gray-900 mb-4"
          >
            Our Professional Services
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Discover our range of professional services designed to make your life easier.
            Each service is delivered by verified experts committed to quality.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 mb-12">
          {Object.keys(serviceInfo).map((service) => (
            <ServiceCard
              key={service}
              service={service}
              onClick={() => setSelectedService(service)}
            />
          ))}
        </div>

        {selectedService && (
          <ServiceDetails
            service={selectedService}
            onClose={() => setSelectedService(null)}
          />
        )}

        <div className="mt-16 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Why Choose Our Services?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌟</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Quality Assured</h3>
              <p className="text-gray-600">All our professionals are verified and trained to deliver the best service</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Fast Response</h3>
              <p className="text-gray-600">Quick booking confirmation and service delivery when you need it</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Best Value</h3>
              <p className="text-gray-600">Competitive pricing with no compromise on service quality</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 