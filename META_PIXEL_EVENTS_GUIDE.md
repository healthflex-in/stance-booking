# Meta Pixel Events - Complete Mobile Booking Flow Guide 📊

## Overview
This guide covers all Meta Pixel events (both standard and custom) implemented in the Stance Health mobile booking flow. Each event tracks specific user actions to optimize ad targeting and measure conversion performance.

---

## 🎯 **STANDARD META PIXEL EVENTS**

### **1. CompleteRegistration**
**What it does**: Tracks when a patient completes their profile registration  
**When triggered**: After successful patient account creation  
**Business value**: Measures registration conversion rate  
**Parameters**:
- `content_name`: "Patient Registration"
- `patient_id`: Unique patient identifier
- `center_id`: Selected healthcare center
- `status`: "new" or "returning"

```javascript
// Example trigger
fbq('track', 'CompleteRegistration', {
  content_name: 'Patient Registration',
  patient_id: 'pat_123',
  center_id: 'center_456',
  status: 'new'
});
```

---

### **2. Lead**
**What it does**: Tracks lead generation when patient provides contact information  
**When triggered**: When patient enters phone number and gets verified  
**Business value**: Measures lead quality and acquisition cost  
**Parameters**:
- `content_name`: "Patient Lead"
- `content_category`: "healthcare"
- `patient_id`: Patient identifier
- `center_id`: Healthcare center
- `is_returning_user`: Boolean flag

```javascript
// Example trigger
fbq('track', 'Lead', {
  content_name: 'Patient Lead',
  content_category: 'healthcare',
  patient_id: 'pat_123',
  center_id: 'center_456'
});
```

---

### **3. ViewContent**
**What it does**: Tracks when users view important content pages  
**When triggered**: 
- Mobile booking flow start
- Session details page load
**Business value**: Measures content engagement and user interest  
**Parameters**:
- `content_type`: "appointment_details"
- `content_name`: Page/section name
- `source`: Traffic source
- `center_id`: Healthcare center

```javascript
// Example trigger
fbq('track', 'ViewContent', {
  content_type: 'appointment_details',
  content_name: 'Session Details',
  center_id: 'center_456'
});
```

---

### **4. FindLocation**
**What it does**: Tracks when users search for or select healthcare centers  
**When triggered**: When patient selects a healthcare center  
**Business value**: Measures location preference and center popularity  
**Parameters**:
- `content_name`: "Healthcare Center"
- `center_id`: Selected center ID
- `center_name`: Center display name
- `patient_id`: Patient identifier

```javascript
// Example trigger
fbq('track', 'FindLocation', {
  content_name: 'Healthcare Center',
  center_id: 'center_456',
  center_name: 'Stance Health Indiranagar',
  patient_id: 'pat_123'
});
```

---

### **5. Schedule**
**What it does**: Tracks appointment scheduling actions  
**When triggered**: When patient selects a time slot for appointment  
**Business value**: Measures booking intent and scheduling success  
**Parameters**:
- `content_name`: "Physiotherapy Appointment"
- `content_category`: "healthcare"
- `appointment_time`: Selected time slot
- `appointment_date`: Selected date
- `center_id`: Healthcare center
- `patient_id`: Patient identifier

```javascript
// Example trigger
fbq('track', 'Schedule', {
  content_name: 'Physiotherapy Appointment',
  content_category: 'healthcare',
  appointment_time: '10:00 AM - 11:00 AM',
  appointment_date: 'Mon, 15 Jan',
  center_id: 'center_456'
});
```

---

### **6. InitiateCheckout**
**What it does**: Tracks when users start the checkout process  
**When triggered**: When patient reaches booking confirmation page  
**Business value**: Measures checkout funnel performance  
**Parameters**:
- `content_type`: "appointment"
- `content_category`: "healthcare"
- `currency`: "INR"
- `value`: Treatment price
- `content_ids`: Treatment/service IDs
- `num_items`: Number of services (usually 1)

```javascript
// Example trigger
fbq('track', 'InitiateCheckout', {
  content_type: 'appointment',
  content_category: 'healthcare',
  currency: 'INR',
  value: 100,
  content_ids: ['treatment_123'],
  num_items: 1
});
```

---

### **7. AddPaymentInfo**
**What it does**: Tracks when users add payment information  
**When triggered**: When patient selects a payment method  
**Business value**: Measures payment funnel progression  
**Parameters**:
- `content_category`: "healthcare_payment"
- `currency`: "INR"
- `value`: Payment amount
- `payment_method`: Selected payment method
- `patient_id`: Patient identifier

```javascript
// Example trigger
fbq('track', 'AddPaymentInfo', {
  content_category: 'healthcare_payment',
  currency: 'INR',
  value: 100,
  payment_method: 'upi',
  patient_id: 'pat_123'
});
```

---

### **8. Purchase**
**What it does**: Tracks successful payment completion  
**When triggered**: When payment is successfully processed  
**Business value**: Measures revenue and conversion success  
**Parameters**:
- `content_type`: "appointment"
- `content_category`: "healthcare"
- `currency`: "INR"
- `value`: Payment amount
- `content_ids`: Appointment/service IDs
- `transaction_id`: Payment transaction ID
- `num_items`: Number of services purchased

```javascript
// Example trigger
fbq('track', 'Purchase', {
  content_type: 'appointment',
  content_category: 'healthcare',
  currency: 'INR',
  value: 100,
  content_ids: ['apt_789'],
  transaction_id: 'pay_xyz123',
  num_items: 1
});
```

---

### **9. Contact**
**What it does**: Tracks contact/communication events  
**When triggered**: When payment processing starts  
**Business value**: Measures user engagement with business  
**Parameters**:
- `content_name`: "Payment Processing"
- `value`: Transaction amount
- `order_id`: Order identifier
- `payment_method`: Payment method used

```javascript
// Example trigger
fbq('track', 'Contact', {
  content_name: 'Payment Processing',
  value: 100,
  order_id: 'order_456',
  payment_method: 'razorpay'
});
```

---

## 🔧 **CUSTOM META PIXEL EVENTS**

### **1. PatientDetailsStart**
**What it does**: Tracks when patient begins profile creation  
**When triggered**: When patient onboarding component loads  
**Business value**: Measures top-of-funnel engagement  
**Parameters**:
- `form_type`: "patient_registration"
- `patient_id`: Patient identifier (if available)
- `center_id`: Healthcare center

```javascript
// Example trigger
fbq('trackCustom', 'PatientDetailsStart', {
  form_type: 'patient_registration',
  center_id: 'center_456'
});
```

---

### **2. PhoneVerification**
**What it does**: Tracks phone number verification attempts  
**When triggered**: When patient clicks "Verify Number" button  
**Business value**: Measures verification success rates and friction points  
**Parameters**:
- `verification_type`: "mobile_number"
- `phone_length`: Length of entered phone number
- `center_id`: Healthcare center

```javascript
// Example trigger
fbq('trackCustom', 'PhoneVerification', {
  verification_type: 'mobile_number',
  phone_length: 10,
  center_id: 'center_456'
});
```

---

### **3. PatientProfileComplete**
**What it does**: Tracks successful patient profile completion  
**When triggered**: After patient registration is successfully created  
**Business value**: Measures registration completion rates  
**Parameters**:
- `profile_type`: "new_patient" or "returning_patient"
- `patient_id`: Created patient ID
- `center_id`: Healthcare center
- `is_returning`: Boolean flag

```javascript
// Example trigger
fbq('trackCustom', 'PatientProfileComplete', {
  profile_type: 'new_patient',
  patient_id: 'pat_123',
  center_id: 'center_456',
  is_returning: false
});
```

---

### **4. CenterSearch**
**What it does**: Tracks when patient starts searching for centers  
**When triggered**: When center selection page loads  
**Business value**: Measures location-based interest  
**Parameters**:
- `search_type`: "location_selection"
- `patient_id`: Patient identifier

```javascript
// Example trigger
fbq('trackCustom', 'CenterSearch', {
  search_type: 'location_selection',
  patient_id: 'pat_123'
});
```

---

### **5. SlotSearch**
**What it does**: Tracks appointment slot searching behavior  
**When triggered**: When session details page loads  
**Business value**: Measures scheduling intent and availability issues  
**Parameters**:
- `search_type`: "appointment_scheduling"
- `center_id`: Healthcare center
- `patient_id`: Patient identifier
- `selected_date`: Date being searched (if any)

```javascript
// Example trigger
fbq('trackCustom', 'SlotSearch', {
  search_type: 'appointment_scheduling',
  center_id: 'center_456',
  patient_id: 'pat_123',
  selected_date: '2024-01-15'
});
```

---

### **6. AppointmentScheduled**
**What it does**: Tracks successful appointment scheduling  
**When triggered**: When patient selects a time slot  
**Business value**: Measures scheduling success before payment  
**Parameters**:
- `booking_type`: "physiotherapy_session"
- `appointment_id`: Temporary appointment ID
- `patient_id`: Patient identifier
- `center_id`: Healthcare center

```javascript
// Example trigger
fbq('trackCustom', 'AppointmentScheduled', {
  booking_type: 'physiotherapy_session',
  appointment_id: 'temp_123',
  patient_id: 'pat_123',
  center_id: 'center_456'
});
```

---

### **7. CheckoutStart**
**What it does**: Tracks checkout process initiation  
**When triggered**: When booking confirmation page loads  
**Business value**: Measures checkout funnel entry  
**Parameters**:
- `checkout_type`: "appointment_booking"
- `center_id`: Healthcare center
- `patient_id`: Patient identifier
- `amount`: Booking amount

```javascript
// Example trigger
fbq('trackCustom', 'CheckoutStart', {
  checkout_type: 'appointment_booking',
  center_id: 'center_456',
  patient_id: 'pat_123',
  amount: 100
});
```

---

### **8. PaymentMethodSelected**
**What it does**: Tracks payment method selection  
**When triggered**: When patient selects UPI, card, or other payment method  
**Business value**: Measures payment preference and method performance  
**Parameters**:
- `payment_category`: "online_payment"
- `payment_method`: Selected method (upi, card, etc.)
- `amount`: Payment amount
- `patient_id`: Patient identifier

```javascript
// Example trigger
fbq('trackCustom', 'PaymentMethodSelected', {
  payment_category: 'online_payment',
  payment_method: 'upi',
  amount: 100,
  patient_id: 'pat_123'
});
```

---

### **9. RazorpayLoaded**
**What it does**: Tracks Razorpay payment gateway loading  
**When triggered**: When "Proceed to Pay" button is clicked  
**Business value**: Measures payment gateway performance  
**Parameters**:
- `payment_gateway`: "razorpay"
- `amount`: Payment amount
- `patient_id`: Patient identifier
- `center_id`: Healthcare center

```javascript
// Example trigger
fbq('trackCustom', 'RazorpayLoaded', {
  payment_gateway: 'razorpay',
  amount: 100,
  patient_id: 'pat_123',
  center_id: 'center_456'
});
```

---

### **10. PaymentProcessing**
**What it does**: Tracks active payment processing  
**When triggered**: When payment gateway starts processing  
**Business value**: Measures payment success rates  
**Parameters**:
- `processing_stage`: "payment_gateway"
- `order_id`: Payment order ID
- `amount`: Payment amount
- `patient_id`: Patient identifier

```javascript
// Example trigger
fbq('trackCustom', 'PaymentProcessing', {
  processing_stage: 'payment_gateway',
  order_id: 'order_456',
  amount: 100,
  patient_id: 'pat_123'
});
```

---

### **11. EmailDetailsRequest**
**What it does**: Tracks appointment details email requests  
**When triggered**: When patient enters email for appointment confirmation  
**Business value**: Measures communication preferences  
**Parameters**:
- `request_type`: "appointment_confirmation"
- `email_provided`: Boolean flag
- `patient_id`: Patient identifier
- `center_id`: Healthcare center

```javascript
// Example trigger
fbq('trackCustom', 'EmailDetailsRequest', {
  request_type: 'appointment_confirmation',
  email_provided: true,
  patient_id: 'pat_123',
  center_id: 'center_456'
});
```

---

### **12. BookingSuccess**
**What it does**: Tracks successful booking completion  
**When triggered**: When appointment is successfully created and confirmed  
**Business value**: Measures end-to-end conversion success  
**Parameters**:
- `success_type`: "appointment_confirmed"
- `appointment_id`: Final appointment ID
- `patient_id`: Patient identifier
- `center_id`: Healthcare center
- `amount`: Final payment amount

```javascript
// Example trigger
fbq('trackCustom', 'BookingSuccess', {
  success_type: 'appointment_confirmed',
  appointment_id: 'apt_789',
  patient_id: 'pat_123',
  center_id: 'center_456',
  amount: 100
});
```

---

### **13. FormAbandonment**
**What it does**: Tracks when users abandon forms  
**When triggered**: When user leaves page without completing form  
**Business value**: Identifies friction points in user journey  
**Parameters**:
- `abandonment_stage`: Form step where user left
- `completion_percentage`: How much of form was completed
- `form_step`: Specific form section
- `time_spent`: Time spent on form

```javascript
// Example trigger
fbq('trackCustom', 'FormAbandonment', {
  abandonment_stage: 'patient_details',
  completion_percentage: 60,
  form_step: 'personal_info',
  time_spent: 45000
});
```

---

### **14. SupportRequest**
**What it does**: Tracks support and help requests  
**When triggered**: When patient clicks WhatsApp, call, or help buttons  
**Business value**: Measures support needs and user confusion points  
**Parameters**:
- `support_type`: "customer_service"
- `support_method`: "whatsapp", "call", "chat", "email"
- `context`: Where support was requested
- `patient_id`: Patient identifier

```javascript
// Example trigger
fbq('trackCustom', 'SupportRequest', {
  support_type: 'customer_service',
  support_method: 'whatsapp',
  context: 'booking_help',
  patient_id: 'pat_123'
});
```

---

### **15. BookingIntent**
**What it does**: Tracks strong booking signals  
**When triggered**: When user shows high engagement (form completion, time spent)  
**Business value**: Identifies high-intent users for retargeting  
**Parameters**:
- `intent_strength`: "low", "medium", "high"
- `trigger_action`: What triggered the intent signal
- `patient_id`: Patient identifier
- `center_id`: Healthcare center

```javascript
// Example trigger
fbq('trackCustom', 'BookingIntent', {
  intent_strength: 'high',
  trigger_action: 'form_engagement',
  patient_id: 'pat_123',
  center_id: 'center_456'
});
```

---

### **16. PaymentHesitation**
**What it does**: Tracks payment delays and hesitation  
**When triggered**: When user spends excessive time on payment page  
**Business value**: Identifies pricing or trust issues  
**Parameters**:
- `hesitation_reason`: Reason for delay
- `time_spent`: Time spent hesitating
- `amount`: Payment amount
- `patient_id`: Patient identifier

```javascript
// Example trigger
fbq('trackCustom', 'PaymentHesitation', {
  hesitation_reason: 'decision_time',
  time_spent: 60000,
  amount: 100,
  patient_id: 'pat_123'
});
```

---

### **17. ReferralSource**
**What it does**: Tracks how users found the service  
**When triggered**: On page load with UTM parameters  
**Business value**: Measures marketing channel effectiveness  
**Parameters**:
- `referral_type`: Traffic source
- `source`: UTM source
- `campaign`: UTM campaign
- `medium`: UTM medium

```javascript
// Example trigger
fbq('trackCustom', 'ReferralSource', {
  referral_type: 'google_ads',
  source: 'google',
  campaign: 'physiotherapy_booking',
  medium: 'cpc'
});
```

---

### **18. MobileOptimization**
**What it does**: Tracks mobile experience quality  
**When triggered**: On mobile app initialization  
**Business value**: Measures mobile UX performance  
**Parameters**:
- `device_type`: "mobile" or "desktop"
- `optimization_score`: Performance score (0-100)
- `screen_size`: Device screen dimensions

```javascript
// Example trigger
fbq('trackCustom', 'MobileOptimization', {
  device_type: 'mobile',
  optimization_score: 85,
  screen_size: '375x812'
});
```

---

### **19. StepProgression**
**What it does**: Tracks user progression through booking steps  
**When triggered**: When user moves between booking steps  
**Business value**: Measures funnel flow and step timing  
**Parameters**:
- `flow_type`: "mobile_booking"
- `current_step`: Current booking step
- `previous_step`: Previous step
- `time_spent`: Time spent on previous step

```javascript
// Example trigger
fbq('trackCustom', 'StepProgression', {
  flow_type: 'mobile_booking',
  current_step: 'center_selection',
  previous_step: 'patient_onboarding',
  time_spent: 30000
});
```

---

### **20. ReturnVisit**
**What it does**: Tracks returning user behavior  
**When triggered**: When returning users visit the site  
**Business value**: Measures user retention and loyalty  
**Parameters**:
- `visit_frequency`: "first_time", "returning", "frequent"
- `days_since_last_visit`: Days since last visit
- `patient_id`: Patient identifier

```javascript
// Example trigger
fbq('trackCustom', 'ReturnVisit', {
  visit_frequency: 'returning',
  days_since_last_visit: 7,
  patient_id: 'pat_123'
});
```

---

## 📊 **EVENT FLOW SEQUENCE**

### **Complete Mobile Booking Journey:**

1. **Entry**: `ViewContent` (Mobile Booking Flow)
2. **Registration**: `PatientDetailsStart` → `PhoneVerification` → `Lead` → `CompleteRegistration` → `PatientProfileComplete`
3. **Center Selection**: `CenterSearch` → `FindLocation`
4. **Scheduling**: `SlotSearch` → `Schedule` → `AppointmentScheduled`
5. **Checkout**: `CheckoutStart` → `InitiateCheckout` → `PaymentMethodSelected` → `AddPaymentInfo`
6. **Payment**: `RazorpayLoaded` → `PaymentProcessing` → `Contact` → `Purchase`
7. **Completion**: `BookingSuccess` → `EmailDetailsRequest`

### **Support Events** (Can trigger at any step):
- `SupportRequest`
- `FormAbandonment`
- `BookingIntent`
- `PaymentHesitation`

---

## 🎯 **BUSINESS APPLICATIONS**

### **Custom Audiences for Retargeting:**
1. **High Intent**: Users with `BookingIntent` + `SlotSearch`
2. **Checkout Abandoners**: `CheckoutStart` but no `Purchase`
3. **Payment Issues**: `RazorpayLoaded` but no `PaymentProcessing`
4. **Form Abandoners**: `PatientDetailsStart` + `FormAbandonment`
5. **Support Seekers**: Multiple `SupportRequest` events

### **Lookalike Audiences:**
- Based on `BookingSuccess` completers
- Based on `Purchase` converters
- Based on high `MobileOptimization` scores

### **Campaign Optimization:**
- Target `SlotSearch` users with availability messaging
- Target `PaymentHesitation` users with security/trust messaging
- Target `FormAbandonment` users with simplified registration ads

This comprehensive tracking provides 360° visibility into your mobile booking funnel and enables highly targeted advertising campaigns! 🚀