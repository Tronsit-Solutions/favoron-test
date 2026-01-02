// Cities organized by country for the trip form

export const GUATEMALAN_CITIES = [
  { value: 'Guatemala City', label: 'Ciudad de Guatemala' },
  { value: 'Antigua Guatemala', label: 'Antigua Guatemala' },
  { value: 'Quetzaltenango', label: 'Quetzaltenango' },
  { value: 'Escuintla', label: 'Escuintla' },
  { value: 'Mixco', label: 'Mixco' },
  { value: 'Villa Nueva', label: 'Villa Nueva' },
  { value: 'Cobán', label: 'Cobán' },
  { value: 'Huehuetenango', label: 'Huehuetenango' },
  { value: 'Otra ciudad', label: 'Otra ciudad' },
];

export const US_CITIES = [
  { value: 'New York', label: 'New York, NY' },
  { value: 'Los Angeles', label: 'Los Angeles, CA' },
  { value: 'Chicago', label: 'Chicago, IL' },
  { value: 'Houston', label: 'Houston, TX' },
  { value: 'Phoenix', label: 'Phoenix, AZ' },
  { value: 'Philadelphia', label: 'Philadelphia, PA' },
  { value: 'San Antonio', label: 'San Antonio, TX' },
  { value: 'San Diego', label: 'San Diego, CA' },
  { value: 'Dallas', label: 'Dallas, TX' },
  { value: 'Austin', label: 'Austin, TX' },
  { value: 'San Jose', label: 'San Jose, CA' },
  { value: 'Fort Worth', label: 'Fort Worth, TX' },
  { value: 'Jacksonville', label: 'Jacksonville, FL' },
  { value: 'Columbus', label: 'Columbus, OH' },
  { value: 'Charlotte', label: 'Charlotte, NC' },
  { value: 'San Francisco', label: 'San Francisco, CA' },
  { value: 'Indianapolis', label: 'Indianapolis, IN' },
  { value: 'Seattle', label: 'Seattle, WA' },
  { value: 'Denver', label: 'Denver, CO' },
  { value: 'Washington', label: 'Washington, DC' },
  { value: 'Boston', label: 'Boston, MA' },
  { value: 'El Paso', label: 'El Paso, TX' },
  { value: 'Nashville', label: 'Nashville, TN' },
  { value: 'Detroit', label: 'Detroit, MI' },
  { value: 'Oklahoma City', label: 'Oklahoma City, OK' },
  { value: 'Portland', label: 'Portland, OR' },
  { value: 'Las Vegas', label: 'Las Vegas, NV' },
  { value: 'Memphis', label: 'Memphis, TN' },
  { value: 'Louisville', label: 'Louisville, KY' },
  { value: 'Baltimore', label: 'Baltimore, MD' },
  { value: 'Milwaukee', label: 'Milwaukee, WI' },
  { value: 'Albuquerque', label: 'Albuquerque, NM' },
  { value: 'Tucson', label: 'Tucson, AZ' },
  { value: 'Fresno', label: 'Fresno, CA' },
  { value: 'Sacramento', label: 'Sacramento, CA' },
  { value: 'Atlanta', label: 'Atlanta, GA' },
  { value: 'Miami', label: 'Miami, FL' },
  { value: 'Orlando', label: 'Orlando, FL' },
  { value: 'Tampa', label: 'Tampa, FL' },
];

export const SPAIN_CITIES = [
  { value: 'Madrid', label: 'Madrid' },
  { value: 'Barcelona', label: 'Barcelona' },
  { value: 'Valencia', label: 'Valencia' },
  { value: 'Sevilla', label: 'Sevilla' },
  { value: 'Zaragoza', label: 'Zaragoza' },
  { value: 'Málaga', label: 'Málaga' },
  { value: 'Murcia', label: 'Murcia' },
  { value: 'Palma de Mallorca', label: 'Palma de Mallorca' },
  { value: 'Las Palmas', label: 'Las Palmas' },
  { value: 'Bilbao', label: 'Bilbao' },
  { value: 'Alicante', label: 'Alicante' },
  { value: 'Córdoba', label: 'Córdoba' },
  { value: 'Valladolid', label: 'Valladolid' },
  { value: 'Otra ciudad', label: 'Otra ciudad' },
];

export const MEXICO_CITIES = [
  { value: 'Ciudad de México', label: 'Ciudad de México' },
  { value: 'Guadalajara', label: 'Guadalajara' },
  { value: 'Monterrey', label: 'Monterrey' },
  { value: 'Puebla', label: 'Puebla' },
  { value: 'Tijuana', label: 'Tijuana' },
  { value: 'León', label: 'León' },
  { value: 'Cancún', label: 'Cancún' },
  { value: 'Mérida', label: 'Mérida' },
  { value: 'Querétaro', label: 'Querétaro' },
  { value: 'Otra ciudad', label: 'Otra ciudad' },
];

// Function to get cities by country code
export const getCitiesByCountry = (countryCode: string): { value: string; label: string }[] => {
  switch (countryCode.toLowerCase()) {
    case 'guatemala':
      return GUATEMALAN_CITIES;
    case 'estados-unidos':
      return US_CITIES;
    case 'espana':
      return SPAIN_CITIES;
    case 'mexico':
      return MEXICO_CITIES;
    default:
      return [];
  }
};

// Check if a country has predefined cities
export const countryHasCities = (countryCode: string): boolean => {
  return ['guatemala', 'estados-unidos', 'espana', 'mexico'].includes(countryCode.toLowerCase());
};
