# Cross-Organization Booking - Implementation Summary

## ✅ What's Already Implemented

### Backend (stance_dashboard)
1. **Patient Model** - Supports multi-org:
   - `organization` (primary org)
   - `additionalOrganizations` array with centers per org

2. **GraphQL APIs**:
   - `checkPatientByPhone(phone, organizationId)` - Returns patient and org info
   - `addPatientToOrganization(patientId, organizationId, centerIds)` - Adds patient to new org

3. **Error Handling**:
   - Backend throws `PATIENT_EXISTS_IN_DIFFERENT_ORG` error with patient metadata
   - Error includes: patientId, phone, email, firstName, lastName

### Dashboard Frontend (stance-dashboard-frontend)
1. **GraphQL Queries** (`src/gql/queries.ts`):
   ```graphql
   CHECK_PATIENT_BY_PHONE
   ADD_PATIENT_TO_ORGANIZATION
   ```

2. **Cross-Org Modal** (`src/components/patients/CrossOrgPatientModal.tsx`):
   - Shows patient details (name, phone, email, gender, age)
   - Asks: "Add this patient to your organization?"
   - Has "Cancel" and "Yes, Add" buttons

3. **NewPatientForm** (`src/components/patients/NewPatientForm.tsx`):
   - Catches `PATIENT_EXISTS_IN_DIFFERENT_ORG` error on patient creation
   - Extracts patient metadata from error
   - Shows CrossOrgPatientModal
   - Calls `addPatientToOrganization` mutation on confirm

## ❌ What's Missing in Booking Frontend (stance-booking)

The booking frontend does NOT have cross-org support yet. It needs:

1. **Add GraphQL queries** to `gql/queries.ts`
2. **Create CrossOrgModal component**
3. **Update MobilePatientOnboarding** to:
   - Check patient after phone verification (not on error)
   - Use `checkPatientByPhone` query proactively
   - Show modal if `isInDifferentOrg: true`

## Key Difference: Dashboard vs Booking

### Dashboard Approach (Reactive):
- Creates patient first
- Backend throws error if patient exists in different org
- Frontend catches error and shows modal
- **Issue**: Patient creation attempt fails first

### Booking Approach (Proactive - Better):
- Check patient BEFORE creating
- Call `checkPatientByPhone` after phone verification
- Show modal if patient exists in different org
- Only create if patient doesn't exist
- **Benefit**: No failed creation attempts

## Implementation for stance-booking

### Step 1: Add to `gql/queries.ts`
```typescript
export const CHECK_PATIENT_BY_PHONE = gql`
  query CheckPatientByPhone($phone: String!, $organizationId: ObjectID!) {
    checkPatientByPhone(phone: $phone, organizationId: $organizationId) {
      exists
      isInDifferentOrg
      currentOrgId
      patient {
        _id
        phone
        email
        profileData {
          ... on Patient {
            firstName
            lastName
            gender
            dob
          }
        }
      }
    }
  }
`;

export const ADD_PATIENT_TO_ORGANIZATION = gql`
  mutation AddPatientToOrganization(
    $patientId: ObjectID!
    $organizationId: ObjectID!
    $centerIds: [ObjectID!]!
  ) {
    addPatientToOrganization(
      patientId: $patientId
      organizationId: $organizationId
      centerIds: $centerIds
    ) {
      _id
      phone
      profileData {
        ... on Patient {
          firstName
          lastName
          centers {
            _id
            name
          }
        }
      }
    }
  }
`;
```

### Step 2: Copy CrossOrgModal
Copy `stance-dashboard-frontend/src/components/patients/CrossOrgPatientModal.tsx` to:
`stance-booking/components/onboarding/shared/CrossOrgModal.tsx`

Adapt it for booking UI (use booking styles, no Modal component dependency).

### Step 3: Update MobilePatientOnboarding
After phone verification success, add:

```typescript
import { CHECK_PATIENT_BY_PHONE, ADD_PATIENT_TO_ORGANIZATION } from '@/gql/queries';

const [checkPatient] = useLazyQuery(CHECK_PATIENT_BY_PHONE);
const [addToOrg] = useMutation(ADD_PATIENT_TO_ORGANIZATION);
const [showCrossOrgModal, setShowCrossOrgModal] = useState(false);
const [crossOrgPatient, setCrossOrgPatient] = useState<any>(null);

// After OTP verification:
const handlePhoneVerified = async () => {
  const cookies = getBookingCookies();
  
  const result = await checkPatient({
    variables: {
      phone: `+91${formData.phone}`,
      organizationId: cookies.organizationId,
    },
  });

  const { exists, patient, isInDifferentOrg } = result.data.checkPatientByPhone;

  if (exists && isInDifferentOrg) {
    // Show cross-org modal
    setCrossOrgPatient(patient);
    setShowCrossOrgModal(true);
  } else if (exists && !isInDifferentOrg) {
    // Patient already in this org - proceed as repeat user
    onPatientCreated?.(patient._id, false, sessionType);
  } else {
    // New patient - show form
    setIsPhoneVerified(true);
  }
};

const handleCrossOrgConfirm = async () => {
  const cookies = getBookingCookies();
  
  await addToOrg({
    variables: {
      patientId: crossOrgPatient._id,
      organizationId: cookies.organizationId,
      centerIds: [cookies.centerId],
    },
  });
  
  toast.success('Added to organization!');
  setShowCrossOrgModal(false);
  onPatientCreated?.(crossOrgPatient._id, false, sessionType);
};
```

## Testing Flow

1. Create patient in `org1` (stance-health)
2. Visit `domain/org2` (another-org)
3. Enter same phone number
4. Verify OTP
5. **Expected**: Modal appears asking to add to org2
6. Click "Yes, Add"
7. **Expected**: Patient added, proceeds to booking as repeat user
8. **Verify**: Patient can now book in both orgs

## Benefits

✅ Single patient record across orgs
✅ No duplicate patients
✅ Seamless cross-org experience
✅ Proactive check (better UX than error-based)
✅ User consent before adding to new org

