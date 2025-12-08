import { User, Advance, Patient, UserType, AdvanceWithItemBalance, AdvanceItemWithBalance, AssociatedPatientWithBalance } from '@/gql/graphql';

export const transformPatientData = (patient: Partial<User>): User => ({
  _id: patient._id!,
  phone: patient.phone || '',
  seqNo: patient.seqNo || '',
  email: patient.email || undefined,
  userType: patient.userType || UserType.Patient,
  createdAt: patient.createdAt || 0,
  updatedAt: patient.updatedAt || 0,
  version: patient.version || 1,
  isActive: patient.isActive !== undefined ? patient.isActive : true,
  profileData: patient.profileData || undefined
});

export const transformAdvanceForDrawer = (advance: Partial<AdvanceWithItemBalance> & { itemsWithBalance?: AdvanceItemWithBalance[] }) => ({
  _id: advance._id,
  total: advance.total,
  createdAt: typeof advance.createdAt === 'string' ? parseInt(advance.createdAt) : advance.createdAt,
  updatedAt: advance.updatedAt || advance.createdAt,
  version: advance.version || 1,
  isActive: advance.isActive !== undefined ? advance.isActive : true,
  pdfUrl: advance.pdfUrl,
  footer: advance.footer,
  notes: advance.notes,
  center: advance.center || { _id: '', name: '', phone: '', location: '', seqNo: '', address: { street: '', city: '', state: '', country: '', zip: '' }, organization: { _id: '' }, createdAt: 0, updatedAt: 0, version: 1, isActive: true },
  organization: advance.organization || { _id: '', brandName: '', companyName: '', gstNumber: '', panNumber: '', socialLinks: [], address: { street: '', city: '', state: '', country: '', zip: '' }, createdAt: 0, updatedAt: 0, version: 1, isActive: true },
  patient: advance.patient ? {
    _id: advance.patient._id,
    phone: advance.patient.phone || undefined,
    seqNo: advance.patient.seqNo,
    email: advance.patient.email || undefined,
    userType: advance.patient.userType || UserType.Patient,
    createdAt: advance.patient.createdAt || 0,
    updatedAt: advance.patient.updatedAt || 0,
    version: advance.patient.version || 1,
    isActive: advance.patient.isActive !== undefined ? advance.patient.isActive : true,
    profileData: advance.patient.profileData || undefined
  } : { _id: '', phone: '', seqNo: '', email: undefined, userType: UserType.Patient, createdAt: 0, updatedAt: 0, version: 1, isActive: true, profileData: undefined },
  receipt: advance.receipt ? {
    _id: advance.receipt._id || '',
    seqNo: advance.receipt.seqNo,
    createdAt: typeof advance.receipt.createdAt === 'string' ? parseInt(advance.receipt.createdAt) : advance.receipt.createdAt,
    updatedAt: advance.receipt.updatedAt || advance.receipt.createdAt,
    version: advance.receipt.version || 1,
    isActive: advance.receipt.isActive !== undefined ? advance.receipt.isActive : true,
    center: advance.receipt.center || advance.center || { _id: '', name: '', phone: '', location: '', seqNo: '', address: { street: '', city: '', state: '', country: '', zip: '' }, organization: { _id: '' }, createdAt: 0, updatedAt: 0, version: 1, isActive: true },
    patient: advance.patient,
    payment: advance.receipt.payment
  } : undefined,
  itemsWithBalance: advance.itemsWithBalance?.filter((item: AdvanceItemWithBalance) => item.advanceItem != null).map((item: AdvanceItemWithBalance) => ({
    currentBalance: item.currentBalance || 0,
    advanceItem: {
      type: item.advanceItem?.type,
      amount: item.advanceItem?.amount || 0,
      validTill: item.advanceItem?.validTill,
      description: item.advanceItem?.description,
      item: item.advanceItem?.item,
      associatedPatients: item.advanceItem?.associatedPatients?.map((ap: AssociatedPatientWithBalance) => ({
        amount: ap.amount || 0,
        currentBalance: ap.currentBalance || 0,
        patient: {
          ...ap.patient,
          email: ap.patient.email || undefined,
          userType: ap.patient.userType || UserType.Patient,
          createdAt: ap.patient.createdAt || 0,
          updatedAt: ap.patient.updatedAt || 0,
          version: ap.patient.version || 1,
          isActive: ap.patient.isActive !== undefined ? ap.patient.isActive : true,
          profileData: ap.patient.profileData || undefined
        }
      })) || undefined
    }
  }))
});

export const transformPatientsData = (patientsData: { users?: User[] | { data: User[] } }) => {
  if (!patientsData) return undefined;
  
  return {
    users: (Array.isArray(patientsData.users) ? patientsData.users : (patientsData.users as { data: User[] })?.data)?.map((patient: User) => ({
      ...patient,
      email: patient.email || undefined
    }))
  };
};

export const transformInvoiceForDrawer = (invoice: { patient?: User }) => ({
  ...invoice,
  patient: invoice.patient ? {
    ...invoice.patient,
    email: invoice.patient.email || undefined
  } : undefined
});