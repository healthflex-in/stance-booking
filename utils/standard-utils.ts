export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}

export function capitalizeFirstLetter(str: string) {
  if (!str) return str; // handle empty/null/undefined input
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function toTitleCase(str: string): string {
  return str
    .replace(/_/g, ' ') // Replace underscores with spaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}


// Generate time slots from 8 AM to 8 PM
export const timeSlots = Array.from({ length: 17 }, (_, i) => {
  const hour = (i + 6);
  return `${hour.toString().padStart(2, '0')}:00`;
});

export const getDaysInWeek = (currentDate: Date) => {
  const days = [];
  const start = new Date(currentDate);
  // Set to Monday of the current week
  start.setDate(start.getDate() - start.getDay() + 1);

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    days.push({
      name: date.toLocaleDateString('en-US', { weekday: 'long' }),
      date: date,
      dayOfMonth: date.getDate(),
      dateString: date.toISOString().split('T')[0],
    });
  }
  return days;
};

export const getDayAppointments = (currentDate: Date) => {
  const date = new Date(currentDate);
  // Ensure we're working with the local date
  date.setHours(0, 0, 0, 0);

  // Get the date string in local timezone
  const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  const dateString = localDate.toISOString().split('T')[0];

  return {
    name: date.toLocaleDateString('en-US', { weekday: 'long' }),
    date: date,
    dayOfMonth: date.getDate(),
    dateString: dateString,
  };
};

export const isValidTimestamp = (timestamp: number): boolean => {
  return typeof timestamp === 'number' && !isNaN(timestamp) && timestamp > 0;
};

// Returns 'DARK' or 'LIGHT' based on the perceived brightness of the color
export function themePicker(hex: string): 'DARK' | 'LIGHT' {
  // Remove hash if present
  hex = hex.replace('#', '');
  // Parse r, g, b
  let r = 0, g = 0, b = 0;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }
  // Perceived brightness formula
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? 'LIGHT' : 'DARK';
}

export function getTimeValue(date: Date): number {
	const hours = date.getHours()
	const minutes = date.getMinutes()
	return hours * 100 + minutes
}

export const formatDateToYYYYMMDD = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};
