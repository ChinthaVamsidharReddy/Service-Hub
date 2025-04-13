export const SERVICE_TYPES = {
  HOME_CLEANING: 'home_cleaning',
  PLUMBING: 'plumbing',
  ELECTRICAL_WORK: 'electrical_work',
  PAINTING: 'painting'
} as const;

export type ServiceType = typeof SERVICE_TYPES[keyof typeof SERVICE_TYPES];

// For display purposes
export const SERVICE_TYPES_DISPLAY = {
  home_cleaning: 'Home Cleaning',
  plumbing: 'Plumbing',
  electrical_work: 'Electrical Work',
  painting: 'Painting'
} as const;

export const SERVICE_TYPES_ARRAY = Object.values(SERVICE_TYPES); 