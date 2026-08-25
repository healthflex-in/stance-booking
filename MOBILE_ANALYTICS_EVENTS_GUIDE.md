# Complete Mobile Flow Analytics Events Guide 📊

## Event Firing Order & Meanings

### **1. FLOW ENTRY (First Events)**
```
mobile_flow_start
```
**When**: User enters mobile booking flow  
**Meaning**: User has started the appointment booking process  
**Triggers**: Page load, component mount

```
session_start
```
**When**: User session begins  
**Meaning**: Analytics session tracking initiated  
**Triggers**: Flow initialization

---

### **2. PATIENT ONBOARDING PHASE**
```
patient_onboarding_start
```
**When**: Patient profile creation page loads  
**Meaning**: User has reached the profile creation step  
**Triggers**: Component mount

```
phone_number_entered
```
**When**: User starts typing phone number  
**Meaning**: User is providing their contact information  
**Triggers**: First keystroke in phone field

```
phone_verification_clicked
```
**When**: User clicks "Verify Number" button  
**Meaning**: User wants to verify their phone number  
**Triggers**: Button click

```
first_name_entered
```
**When**: User starts typing first name  
**Meaning**: User is filling personal details  
**Triggers**: First keystroke in first name field

```
last_name_entered
```
**When**: User starts typing last name  
**Meaning**: User is completing name information  
**Triggers**: First keystroke in last name field

```
email_entered
```
**When**: User starts typing email address  
**Meaning**: User is providing email for communication  
**Triggers**: First keystroke in email field

```
gender_selected
```
**When**: User selects gender option  
**Meaning**: User has chosen their gender  
**Triggers**: Gender button click

```
date_of_birth_entered
```
**When**: User selects date of birth  
**Meaning**: User is providing age information  
**Triggers**: Date picker selection

```
notes_entered
```
**When**: User starts typing in bio/notes field  
**Meaning**: User is adding additional information  
**Triggers**: First keystroke in notes field

```
patient_form_validation_error
```
**When**: Form validation fails  
**Meaning**: User has input errors that need correction  
**Triggers**: Form submission with invalid data

```
patient_created
```
**When**: Patient profile successfully created  
**Meaning**: User has completed registration (**CONVERSION**)  
**Triggers**: Successful API response

```
generate_lead
```
**When**: Patient profile created  
**Meaning**: New lead generated for business (**CONVERSION**)  
**Triggers**: Automatically after patient_created

```
call_now_clicked
```
**When**: User clicks "Call Now" button  
**Meaning**: User prefers phone communication  
**Triggers**: Call button click

```
continue_button_clicked
```
**When**: User clicks "Continue" button  
**Meaning**: User wants to proceed to next step  
**Triggers**: Continue button click

---

### **3. CENTER SELECTION PHASE**
```
center_selection_start
```
**When**: Center selection page loads  
**Meaning**: User is choosing treatment location  
**Triggers**: Component mount

```
center_viewed
```
**When**: User views center details  
**Meaning**: User is considering a specific center  
**Triggers**: Center card click/view

```
center_selected
```
**When**: User selects a center  
**Meaning**: User has chosen their preferred location  
**Triggers**: Center selection confirmation

---

### **4. SESSION DETAILS PHASE**
```
session_details_start
```
**When**: Appointment details page loads  
**Meaning**: User is scheduling their appointment  
**Triggers**: Component mount

```
date_picker_interaction
```
**When**: User interacts with date picker  
**Meaning**: User is selecting appointment date  
**Triggers**: Date picker actions

```
date_selected
```
**When**: User selects specific date  
**Meaning**: User has chosen appointment date  
**Triggers**: Date button click

```
time_slot_clicked
```
**When**: User clicks on time slot  
**Meaning**: User is viewing available times  
**Triggers**: Time slot button click

```
time_slot_selected
```
**When**: User confirms time slot  
**Meaning**: User has scheduled specific time  
**Triggers**: Time slot selection

```
add_to_cart
```
**When**: Treatment selected  
**Meaning**: Service added to booking (**E-COMMERCE**)  
**Triggers**: Automatically after treatment selection

---

### **5. BOOKING CONFIRMATION PHASE**
```
booking_confirmation_start
```
**When**: Booking review page loads  
**Meaning**: User is reviewing appointment details  
**Triggers**: Component mount

```
begin_checkout
```
**When**: Booking confirmation starts  
**Meaning**: User is starting checkout process (**E-COMMERCE**)  
**Triggers**: Automatically on page load

```
booking_details_reviewed
```
**When**: User reviews booking information  
**Meaning**: User has examined appointment details  
**Triggers**: Details review completion

```
payment_method_selected
```
**When**: User chooses payment option  
**Meaning**: User has selected how to pay  
**Triggers**: Payment method selection

```
add_payment_info
```
**When**: Payment method selected  
**Meaning**: Payment information added (**E-COMMERCE**)  
**Triggers**: Automatically after payment method selection

```
proceed_to_pay_clicked
```
**When**: User clicks "Proceed to Pay"  
**Meaning**: User is ready to make payment  
**Triggers**: Proceed button click

---

### **6. PAYMENT PROCESSING PHASE**
```
payment_initiated
```
**When**: Payment process starts  
**Meaning**: Payment gateway activated  
**Triggers**: Payment API call

```
payment_success
```
**When**: Payment completed successfully  
**Meaning**: Transaction successful (**MAJOR CONVERSION**)  
**Triggers**: Successful payment response

```
purchase
```
**When**: Payment successful  
**Meaning**: Revenue generated (**E-COMMERCE CONVERSION**)  
**Triggers**: Automatically after payment_success

```
payment_failure
```
**When**: Payment fails  
**Meaning**: Transaction unsuccessful - needs attention  
**Triggers**: Failed payment response

---

### **7. BOOKING COMPLETION PHASE**
```
booking_completed
```
**When**: Appointment fully booked  
**Meaning**: Complete booking process finished (**FINAL CONVERSION**)  
**Triggers**: Successful appointment creation

```
booking_confirmation_viewed
```
**When**: Success page loads  
**Meaning**: User sees booking confirmation  
**Triggers**: Confirmation page mount

```
appointment_email_entered
```
**When**: User enters email for appointment details  
**Meaning**: User wants email confirmation  
**Triggers**: First keystroke in email field

```
send_appointment_email_clicked
```
**When**: User clicks "Send Details" button  
**Meaning**: User requests email confirmation  
**Triggers**: Send email button click

```
appointment_email_sent_success
```
**When**: Email sent successfully  
**Meaning**: User will receive appointment details  
**Triggers**: Successful email API response

```
appointment_email_sent_failure
```
**When**: Email sending fails  
**Meaning**: User won't receive email - needs follow-up  
**Triggers**: Failed email API response

```
return_home_clicked
```
**When**: User clicks "Return Home"  
**Meaning**: User is finishing the flow  
**Triggers**: Return home button click

---

### **8. PERSISTENT EVENTS (Throughout Flow)**
```
whatsapp_clicked
```
**When**: User clicks WhatsApp button  
**Meaning**: User wants to chat for support  
**Triggers**: WhatsApp button click (any page)

```
back_button_clicked
```
**When**: User clicks back button  
**Meaning**: User wants to go to previous step  
**Triggers**: Back navigation

```
form_field_focus
```
**When**: User clicks into input field  
**Meaning**: User is engaging with form  
**Triggers**: Input field focus

```
form_field_blur
```
**When**: User leaves input field  
**Meaning**: User finished with field  
**Triggers**: Input field blur

```
mobile_flow_error
```
**When**: Any error occurs  
**Meaning**: Technical issue needs investigation  
**Triggers**: Error conditions

```
component_load_time
```
**When**: Page/component loads  
**Meaning**: Performance tracking  
**Triggers**: Component mount timing

```
exit_intent
```
**When**: User tries to leave flow  
**Meaning**: User abandoning process - needs retention  
**Triggers**: Navigation away from flow

```
session_end
```
**When**: User session ends  
**Meaning**: User has finished or left the flow  
**Triggers**: Session termination

---

## **Key Conversion Events** 🎯
1. **generate_lead** - Lead captured
2. **patient_created** - Registration complete
3. **add_to_cart** - Service selected
4. **begin_checkout** - Checkout started
5. **purchase** - Payment successful
6. **booking_completed** - Appointment booked

## **Critical Drop-off Points** ⚠️
- **phone_verification_clicked** → **patient_created**
- **begin_checkout** → **payment_initiated**
- **payment_initiated** → **payment_success**
- **booking_confirmation_start** → **booking_completed**

## **Business Intelligence** 📈
- **High exit_intent** = UX issues
- **payment_failure** spikes = Payment gateway problems
- **form_validation_error** patterns = Form UX issues
- **whatsapp_clicked** frequency = Support demand

This complete event sequence provides 360° visibility into your mobile booking funnel! 🚀