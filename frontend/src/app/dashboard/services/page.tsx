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
    priceRange: "₹250-₹450 per hour",
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
    priceRange: "₹500-₹1,000 per hour",
    icon: "🔧",
    color: "green"
  },
  Electrical_work: {
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
    priceRange: "₹600-₹1,200 per hour",
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
    priceRange: "₹350-₹750 per hour",
    icon: "🎨",
    color: "purple"
  },
  carpentry: {
    title: "Skilled Carpentry Services",
    description: "Custom woodwork and furniture repairs by expert carpenters",
    longDescription: "Our experienced carpenters specialize in custom woodworking, furniture repair, and installation services. We use quality materials and precise craftsmanship for outstanding results.",
    features: [
      "Custom furniture building",
      "Door and window installation",
      "Cabinet making and repair",
      "Wooden flooring installation",
      "Structural repairs"
    ],
    benefits: [
      "Skilled craftsmen",
      "Quality wood materials",
      "Custom designs",
      "Attention to detail",
      "Timely completion"
    ],
    priceRange: "₹400-₹900 per hour",
    icon: "🪚",
    color: "brown"
  },
  pest_control: {
    title: "Effective Pest Control",
    description: "Comprehensive pest management services for your home and business",
    longDescription: "Our professional pest control services eliminate unwanted pests and prevent future infestations. We use safe, eco-friendly methods that are effective against a wide range of pests common in India.",
    features: [
      "Cockroach treatment",
      "Termite control",
      "Rodent management",
      "Mosquito and fly control",
      "Bed bug elimination"
    ],
    benefits: [
      "Safe for family and pets",
      "Eco-friendly solutions",
      "Preventive treatments",
      "Expert technicians",
      "Regular follow-ups"
    ],
    priceRange: "₹1,500-₹4,000 per service",
    icon: "🐜",
    color: "red"
  },
  appliance_repair: {
    title: "Appliance Repair Services",
    description: "Quick and reliable repairs for all your home appliances",
    longDescription: "Our technicians are trained to diagnose and repair a wide range of household appliances. We provide fast, reliable service to get your appliances back in working order with minimal disruption.",
    features: [
      "Refrigerator repair",
      "Washing machine servicing",
      "AC maintenance and repair",
      "Microwave and oven fixes",
      "Water purifier servicing"
    ],
    benefits: [
      "Experienced technicians",
      "Genuine spare parts",
      "90-day warranty",
      "Same-day service",
      "Transparent pricing"
    ],
    priceRange: "₹300-₹1,500 per service",
    icon: "🔌",
    color: "blue"
  },
  gardening: {
    title: "Professional Gardening",
    description: "Complete garden maintenance and landscaping services",
    longDescription: "Our gardening professionals help maintain beautiful outdoor spaces. From regular maintenance to complete landscape transformations, we ensure your garden stays healthy and vibrant year-round.",
    features: [
      "Garden maintenance",
      "Landscaping design",
      "Plant selection and care",
      "Irrigation system setup",
      "Seasonal clean-ups"
    ],
    benefits: [
      "Experienced gardeners",
      "Eco-friendly practices",
      "Regular scheduling options",
      "Custom garden designs",
      "Plant health expertise"
    ],
    priceRange: "₹300-₹700 per hour",
    icon: "🌱",
    color: "green"
  }
};

const ServiceCard = ({ service, onClick }: { service: string; onClick: () => void }) => {
  const info = serviceInfo[service as keyof typeof serviceInfo];
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all"
      onClick={onClick}
    >
      <div className={`p-6 border-b border-gray-100`}>
        <div className="flex items-center gap-4">
          <div className="text-4xl bg-blue-50 p-3 rounded-full">{info.icon}</div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">{info.title}</h3>
            <p className="text-gray-600 mt-1">{info.description}</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-4">
        <p className="text-gray-500 text-sm">Starting from</p>
        <p className="text-2xl font-bold text-green-700">{info.priceRange}</p>
        <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
          View Details
        </button>
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
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
          <div className="grid md:grid-cols-4 gap-8">
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
              <h3 className="text-lg font-semibold mb-2">Transparent Pricing</h3>
              <p className="text-gray-600">Clear pricing in ₹ with no hidden charges or surprise fees</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🛡️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Service Guarantee</h3>
              <p className="text-gray-600">100% satisfaction guarantee with service warranty on all work</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 