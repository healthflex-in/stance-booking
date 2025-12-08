'use client';

import { useAnalyticsContext } from '@/contexts/AnalyticsProvider';

// Analytics service for all HealthFlex events
export class HealthFlexAnalytics {
  private analytics: any;

  constructor(analyticsContext: any) {
    this.analytics = analyticsContext;
  }

  // Authentication Events
  trackLogin(method: string, userId?: string, userType?: string) {
    this.analytics.trackLogin(method);
    this.analytics.trackEvent('healthflex_login', {
      method,
      user_id: userId,
      user_type: userType,
      timestamp: new Date().toISOString()
    });
  }
  
  trackLogout(userId?: string, sessionDuration?: number) {
    this.analytics.trackEvent('healthflex_logout', {
      user_id: userId,
      session_duration: sessionDuration,
      timestamp: new Date().toISOString()
    });
  }

  // Center Management Events
  trackCenterSwitch(fromCenterId: string, toCenterId: string, userId: string) {
    this.analytics.trackEvent('center_switch', {
      from_center_id: fromCenterId,
      to_center_id: toCenterId,
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  }

  trackCenterCreate(centerId: string, centerName: string, userId: string) {
    this.analytics.trackEvent('center_create', {
      center_id: centerId,
      center_name: centerName,
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  }

  trackCenterUpdate(centerId: string, centerName: string, userId: string, changes: Record<string, any>) {
    this.analytics.trackEvent('center_update', {
      center_id: centerId,
      center_name: centerName,
      user_id: userId,
      changes: Object.keys(changes),
      timestamp: new Date().toISOString()
    });
  }

  // Appointment Events
  trackAppointmentBookingStart(centerId: string, patientId?: string, source?: string) {
    this.analytics.trackEvent('appointment_booking_start', {
      center_id: centerId,
      patient_id: patientId,
      source: source || 'web',
      timestamp: new Date().toISOString()
    });
  }

  trackAppointmentBookingStep(step: string, centerId: string, patientId?: string, consultantId?: string) {
    this.analytics.trackEvent('appointment_booking_step', {
      step,
      center_id: centerId,
      patient_id: patientId,
      consultant_id: consultantId,
      timestamp: new Date().toISOString()
    });
  }

  trackAppointmentBookingComplete(appointmentId: string, appointmentData: {
    centerId: string;
    patientId: string;
    consultantId: string;
    treatmentId: string;
    sessionType: string;
    amount: number;
    paymentMethod?: string;
  }) {
    this.analytics.trackEvent('appointment_booking_complete', {
      appointment_id: appointmentId,
      ...appointmentData,
      timestamp: new Date().toISOString()
    });

    // Track conversion
    this.analytics.trackConversion('appointment_booked', appointmentData.amount);
  }

  trackAppointmentEdit(appointmentId: string, changes: Record<string, any>, userId: string, source: 'calendar' | 'dashboard') {
    this.analytics.trackEvent('appointment_edit', {
      appointment_id: appointmentId,
      changes: Object.keys(changes),
      user_id: userId,
      source,
      timestamp: new Date().toISOString()
    });
  }

  trackWhatsAppShare(type: 'appointment' | 'invoice' | 'advance', itemId: string, recipientPhone: string, userId: string) {
    this.analytics.trackEvent('whatsapp_share', {
      type,
      item_id: itemId,
      recipient_phone: recipientPhone,
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  }

  // Invoice Events
  trackInvoiceCreate(invoiceId: string, invoiceData: {
    patientId: string;
    amount: number;
    appointmentId?: string;
    centerId: string;
  }, userId: string, source: 'dashboard' | 'billing') {
    this.analytics.trackEvent('invoice_create', {
      invoice_id: invoiceId,
      ...invoiceData,
      user_id: userId,
      source,
      timestamp: new Date().toISOString()
    });
  }

  trackInvoiceEdit(invoiceId: string, changes: Record<string, any>, userId: string, type: 'pending_payments' | 'general') {
    this.analytics.trackEvent('invoice_edit', {
      invoice_id: invoiceId,
      changes: Object.keys(changes),
      user_id: userId,
      edit_type: type,
      timestamp: new Date().toISOString()
    });
  }

  // Advance Events
  trackAdvanceCreate(advanceId: string, advanceData: {
    patientId: string;
    amount: number;
    centerId: string;
  }, userId: string) {
    this.analytics.trackEvent('advance_create', {
      advance_id: advanceId,
      ...advanceData,
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  }

  trackAdvanceEdit(advanceId: string, changes: Record<string, any>, userId: string, type: 'associate_users' | 'general') {
    this.analytics.trackEvent('advance_edit', {
      advance_id: advanceId,
      changes: Object.keys(changes),
      user_id: userId,
      edit_type: type,
      timestamp: new Date().toISOString()
    });
  }

  // Patient Events
  trackPatientCreate(patientId: string, patientData: {
    centerId: string;
    source: string;
  }, userId: string) {
    this.analytics.trackEvent('patient_create', {
      patient_id: patientId,
      ...patientData,
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  }

  trackPatientEdit(patientId: string, changes: Record<string, any>, userId: string, saved: boolean) {
    this.analytics.trackEvent('patient_edit', {
      patient_id: patientId,
      changes: Object.keys(changes),
      user_id: userId,
      saved,
      timestamp: new Date().toISOString()
    });
  }

  // Doctor Events
  trackDoctorCreate(doctorId: string, doctorData: {
    centerId: string;
    specialization: string;
  }, userId: string) {
    this.analytics.trackEvent('doctor_create', {
      doctor_id: doctorId,
      ...doctorData,
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  }

  trackDoctorEdit(doctorId: string, changes: Record<string, any>, userId: string, saved: boolean) {
    this.analytics.trackEvent('doctor_edit', {
      doctor_id: doctorId,
      changes: Object.keys(changes),
      user_id: userId,
      saved,
      timestamp: new Date().toISOString()
    });
  }

  trackDoctorDelete(doctorId: string, userId: string) {
    this.analytics.trackEvent('doctor_delete', {
      doctor_id: doctorId,
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  }

  // Report Events
  trackReportSave(reportId: string, reportType: 'first_assessment' | 'timeline', patientId: string, userId: string) {
    this.analytics.trackEvent('report_save', {
      report_id: reportId,
      report_type: reportType,
      patient_id: patientId,
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  }

  trackReportExport(reportId: string, reportType: 'first_assessment' | 'timeline', format: string, patientId: string, userId: string) {
    this.analytics.trackEvent('report_export', {
      report_id: reportId,
      report_type: reportType,
      format,
      patient_id: patientId,
      user_id: userId,
      timestamp: new Date().toISOString()
    });

    this.analytics.trackDownload(`report_${reportId}.${format}`, format);
  }

  // Upload Events
  trackFileUpload(fileId: string, uploadType: 'first_assessment' | 'timeline' | 'general', fileName: string, fileSize: number, patientId?: string, userId?: string) {
    this.analytics.trackEvent('file_upload', {
      file_id: fileId,
      upload_type: uploadType,
      file_name: fileName,
      file_size: fileSize,
      patient_id: patientId,
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  }

  // Staff Schedule Events
  trackStaffScheduleSave(scheduleId: string, scheduleData: {
    staffId: string;
    centerId: string;
    scheduleType: string;
  }, userId: string) {
    this.analytics.trackEvent('staff_schedule_save', {
      schedule_id: scheduleId,
      ...scheduleData,
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  }

  // Service Events
  trackServiceCreate(serviceId: string, serviceData: {
    name: string;
    price: number;
    centerId: string;
  }, userId: string) {
    this.analytics.trackEvent('service_create', {
      service_id: serviceId,
      ...serviceData,
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  }

  trackServiceEdit(serviceId: string, changes: Record<string, any>, userId: string) {
    this.analytics.trackEvent('service_edit', {
      service_id: serviceId,
      changes: Object.keys(changes),
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  }

  trackServiceDelete(serviceId: string, userId: string) {
    this.analytics.trackEvent('service_delete', {
      service_id: serviceId,
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  }

  // Package Events
  trackPackageCreate(packageId: string, packageData: {
    name: string;
    price: number;
    centerId: string;
  }, userId: string) {
    this.analytics.trackEvent('package_create', {
      package_id: packageId,
      ...packageData,
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  }

  trackPackageEdit(packageId: string, changes: Record<string, any>, userId: string) {
    this.analytics.trackEvent('package_edit', {
      package_id: packageId,
      changes: Object.keys(changes),
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  }

  trackPackageDelete(packageId: string, userId: string) {
    this.analytics.trackEvent('package_delete', {
      package_id: packageId,
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  }

  // Billing Events
  trackBillingExport(exportType: 'invoices' | 'advances', itemIds: string[], format: string, userId: string) {
    this.analytics.trackEvent('billing_export', {
      export_type: exportType,
      item_count: itemIds.length,
      format,
      user_id: userId,
      timestamp: new Date().toISOString()
    });

    this.analytics.trackDownload(`${exportType}_export.${format}`, format);
  }

  // AI Events
  trackAIDataRequest(formType: 'patient_timeline', patientId: string, userId: string) {
    this.analytics.trackEvent('ai_data_request', {
      form_type: formType,
      patient_id: patientId,
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  }

  // Error Events
  trackError(errorType: string, errorMessage: string, context?: Record<string, any>) {
    this.analytics.trackEvent('healthflex_error', {
      error_type: errorType,
      error_message: errorMessage,
      context,
      timestamp: new Date().toISOString()
    });
  }

  // Performance Events
  trackPageLoadTime(pageName: string, loadTime: number) {
    this.analytics.trackEvent('page_load_time', {
      page_name: pageName,
      load_time: loadTime,
      timestamp: new Date().toISOString()
    });
  }

  // Form Events
  trackFormStart(formName: string, context?: Record<string, any>) {
    this.analytics.trackEvent('form_start', {
      form_name: formName,
      context,
      timestamp: new Date().toISOString()
    });
  }

  trackFormComplete(formName: string, success: boolean, context?: Record<string, any>) {
    this.analytics.trackFormSubmission(formName, success);
    this.analytics.trackEvent('form_complete', {
      form_name: formName,
      success,
      context,
      timestamp: new Date().toISOString()
    });
  }
}

// Hook to use HealthFlex Analytics
export const useHealthFlexAnalytics = () => {
  const analyticsContext = useAnalyticsContext();
  return new HealthFlexAnalytics(analyticsContext);
};