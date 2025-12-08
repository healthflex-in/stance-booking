

import { FormData, WEEKDAYS } from '@/types/StaffFormData';
import { RRule, Frequency } from 'rrule';

export const formatDateToYYYYMMDD = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const convertTimeToMinutes = (timeStr: string) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 100 + minutes;
};

// Define our own interface that matches RRule constructor expectations
interface RRuleConfig {
  freq: Frequency;
  dtstart?: Date;
  interval?: number;
  count?: number;
  until?: Date;
  byweekday?: any;
  [key: string]: any;
}

export const generateRRule = (formData: FormData) => {
  const [year, month, day] = formData.startDate.split('-').map(Number);
  const utcStartDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

  let endDateObj: Date;

  // Create rule options with our interface
  let ruleOptions: RRuleConfig = {
    freq: Frequency.DAILY,
    dtstart: utcStartDate,
  };

  if (
      formData.scheduleType === 'justToday' ||
      formData.scheduleType === 'oneTime' ||
      !formData.frequencyUnit // No frequency specified - single day only
  ) {
    ruleOptions = {
      ...ruleOptions,
      freq: Frequency.DAILY,
      interval: 1,
      count: 1,
    };
  } else {
    ruleOptions = {
      ...ruleOptions,
      freq:
          formData.frequencyUnit === 'Week'
              ? Frequency.WEEKLY
              : Frequency.MONTHLY,
      interval: parseInt(formData.frequency),
    };

    if (formData.repeatDays.length > 0) {
      const byDays = formData.repeatDays.map((d) => WEEKDAYS[d]);
      ruleOptions.byweekday = byDays;
    }

    if (formData.endType === 'on' && formData.endDate) {
      const [endYear, endMonth, endDay] = formData.endDate
          .split('-')
          .map(Number);
      ruleOptions.until = new Date(
          Date.UTC(endYear, endMonth - 1, endDay, 23, 59, 59, 999)
      );
    } else if (formData.endType === 'after') {
      ruleOptions.count = parseInt(formData.endAfter);
    }
  }

  const rruleInstance = new RRule(ruleOptions);
  const rruleString = rruleInstance.toString();

  if (
      formData.scheduleType === 'justToday' ||
      formData.scheduleType === 'oneTime' ||
      !formData.frequencyUnit // No frequency specified
  ) {
    endDateObj = new Date(
        Date.UTC(
            utcStartDate.getUTCFullYear(),
            utcStartDate.getUTCMonth(),
            utcStartDate.getUTCDate(),
            23,
            59,
            59,
            999
        )
    );
  } else if (formData.endType === 'on' && formData.endDate) {
    const [endYear, endMonth, endDay] = formData.endDate.split('-').map(Number);
    endDateObj = new Date(
        Date.UTC(endYear, endMonth - 1, endDay, 23, 59, 59, 999)
    );
  } else if (formData.endType === 'after') {
    const allOccurrences = rruleInstance.all();
    if (allOccurrences.length > 0) {
      const lastOccurrence = allOccurrences[allOccurrences.length - 1];
      endDateObj = new Date(
          Date.UTC(
              lastOccurrence.getUTCFullYear(),
              lastOccurrence.getUTCMonth(),
              lastOccurrence.getUTCDate(),
              23,
              59,
              59,
              999
          )
      );
    } else {
      endDateObj = new Date(utcStartDate);
      endDateObj.setUTCFullYear(utcStartDate.getUTCFullYear() + 1);
      endDateObj.setUTCHours(23, 59, 59, 999);
    }
  } else {
    endDateObj = new Date(utcStartDate);
    endDateObj.setUTCFullYear(utcStartDate.getUTCFullYear() + 1);
    endDateObj.setUTCHours(23, 59, 59, 999);
  }

  return {
    rrule: rruleString,
    startDate: utcStartDate.toISOString(),
    endDate: endDateObj.toISOString(),
  };
};