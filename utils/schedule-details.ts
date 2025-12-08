import { format } from 'date-fns';

export const formatDate = (timestamp: number) => {
  if (!timestamp) return 'Invalid date';
  try {
    const timeStr = timestamp.toString().padStart(4, '0');
    const hours = parseInt(timeStr.substring(0, 2));
    const minutes = parseInt(timeStr.substring(2, 4));
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    return format(date, 'h:mm a');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

export const formatTime = (timestamp: number) => {
  if (!timestamp) return 'Invalid time';
  try {
    const timestampMs = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;
    const date = new Date(timestampMs);

    if (isNaN(date.getTime())) {
      return 'Invalid time';
    }

    return format(date, 'h:mm a');
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid time';
  }
};

export const formatDuration = (startTime: number, endTime: number) => {
  try {
    const startMs = startTime.toString().length === 10 ? startTime * 1000 : startTime;
    const endMs = endTime.toString().length === 10 ? endTime * 1000 : endTime;

    const durationMs = endMs - startMs;
    const durationMinutes = Math.floor(durationMs / (1000 * 60));

    if (durationMinutes < 60) {
      return `${durationMinutes} minutes`;
    } else {
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      return `${hours} hour${hours !== 1 ? 's' : ''} ${
        minutes > 0 ? `${minutes} minute${minutes !== 1 ? 's' : ''}` : ''
      }`;
    }
  } catch (error) {
    console.error('Error formatting duration:', error);
    return 'Invalid duration';
  }
};

export const parseRecurrenceRule = (rrule: string) => {
  try {
    const parts = rrule.split('\n');
    const rrulePart = parts.find((part) => part.startsWith('RRULE:'));
    if (!rrulePart) return null;

    const rule = rrulePart.replace('RRULE:', '');
    const params = rule.split(';').reduce((acc, param) => {
      const [key, value] = param.split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const frequency = params.FREQ?.toLowerCase();
    const interval = params.INTERVAL;

    const days = params.BYDAY?.split(',')
      .map((day) => {
        const dayMap: Record<string, string> = {
          MO: 'Monday',
          TU: 'Tuesday',
          WE: 'Wednesday',
          TH: 'Thursday',
          FR: 'Friday',
          SA: 'Saturday',
          SU: 'Sunday',
        };
        return dayMap[day] || day;
      })
      .join(', ');

    const until = params.UNTIL;
    let untilDate = null;
    if (until) {
      const year = parseInt(until.substring(0, 4));
      const month = parseInt(until.substring(4, 6)) - 1;
      const day = parseInt(until.substring(6, 8));
      const hour = parseInt(until.substring(9, 11));
      const minute = parseInt(until.substring(11, 13));
      const second = parseInt(until.substring(13, 15));

      untilDate = new Date(Date.UTC(year, month, day, hour, minute, second));
    }

    return {
      frequency,
      interval,
      days,
      until: untilDate ? format(untilDate, 'MMMM d, yyyy') : null,
    };
  } catch (error) {
    console.error('Error parsing recurrence rule:', error);
    return null;
  }
}; 