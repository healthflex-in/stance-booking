import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  AccountNumber: { input: any; output: any; }
  BigInt: { input: any; output: any; }
  Byte: { input: any; output: any; }
  CountryCode: { input: any; output: any; }
  CountryName: { input: any; output: any; }
  Cuid: { input: any; output: any; }
  Currency: { input: any; output: any; }
  DID: { input: any; output: any; }
  Date: { input: any; output: any; }
  DateTime: { input: any; output: any; }
  DateTimeISO: { input: any; output: any; }
  DeweyDecimal: { input: any; output: any; }
  Duration: { input: any; output: any; }
  EmailAddress: { input: any; output: any; }
  GUID: { input: any; output: any; }
  GeoJSON: { input: any; output: any; }
  HSL: { input: any; output: any; }
  HSLA: { input: any; output: any; }
  HexColorCode: { input: any; output: any; }
  Hexadecimal: { input: any; output: any; }
  IBAN: { input: any; output: any; }
  IP: { input: any; output: any; }
  IPCPatent: { input: any; output: any; }
  IPv4: { input: any; output: any; }
  IPv6: { input: any; output: any; }
  ISBN: { input: any; output: any; }
  ISO8601Duration: { input: any; output: any; }
  JSON: { input: any; output: any; }
  JSONObject: { input: any; output: any; }
  JWT: { input: any; output: any; }
  LCCSubclass: { input: any; output: any; }
  Latitude: { input: any; output: any; }
  LocalDate: { input: any; output: any; }
  LocalDateTime: { input: any; output: any; }
  LocalEndTime: { input: any; output: any; }
  LocalTime: { input: any; output: any; }
  Locale: { input: any; output: any; }
  Long: { input: any; output: any; }
  Longitude: { input: any; output: any; }
  MAC: { input: any; output: any; }
  NegativeFloat: { input: any; output: any; }
  NegativeInt: { input: any; output: any; }
  NonEmptyString: { input: any; output: any; }
  NonNegativeFloat: { input: any; output: any; }
  NonNegativeInt: { input: any; output: any; }
  NonPositiveFloat: { input: any; output: any; }
  NonPositiveInt: { input: any; output: any; }
  ObjectID: { input: any; output: any; }
  PhoneNumber: { input: any; output: any; }
  Port: { input: any; output: any; }
  PositiveFloat: { input: any; output: any; }
  PositiveInt: { input: any; output: any; }
  PostalCode: { input: any; output: any; }
  RGB: { input: any; output: any; }
  RGBA: { input: any; output: any; }
  RoutingNumber: { input: any; output: any; }
  SESSN: { input: any; output: any; }
  SafeInt: { input: any; output: any; }
  SemVer: { input: any; output: any; }
  Time: { input: any; output: any; }
  TimeZone: { input: any; output: any; }
  Timestamp: { input: any; output: any; }
  URL: { input: any; output: any; }
  USCurrency: { input: any; output: any; }
  UUID: { input: any; output: any; }
  UnsignedFloat: { input: any; output: any; }
  UnsignedInt: { input: any; output: any; }
  Upload: { input: any; output: any; }
  UtcOffset: { input: any; output: any; }
  Void: { input: any; output: any; }
};

export enum Action {
  Approve = 'APPROVE',
  Create = 'CREATE',
  Delete = 'DELETE',
  Edit = 'EDIT',
  Invite = 'INVITE',
  Manage = 'MANAGE',
  Reject = 'REJECT',
  View = 'VIEW'
}

/** Patient type for healthcare recipients */
export type AdditionalOrganization = {
  __typename?: 'AdditionalOrganization';
  addedAt: Scalars['Timestamp']['output'];
  centers: Array<Center>;
  organization: Organization;
};

export type Address = {
  __typename?: 'Address';
  city: Scalars['String']['output'];
  country: Scalars['String']['output'];
  state: Scalars['String']['output'];
  street: Scalars['String']['output'];
  zip: Scalars['String']['output'];
};

export type AddressInput = {
  city: Scalars['String']['input'];
  country: Scalars['String']['input'];
  state: Scalars['String']['input'];
  street: Scalars['String']['input'];
  zip: Scalars['String']['input'];
};

export type Advance = BaseAdvance & DataRow & {
  __typename?: 'Advance';
  _id: Scalars['ObjectID']['output'];
  center: Center;
  createdAt: Scalars['Timestamp']['output'];
  footer?: Maybe<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  items?: Maybe<Array<AdvanceItem>>;
  notes?: Maybe<Scalars['String']['output']>;
  organization: Organization;
  patient: User;
  pdfUrl?: Maybe<Scalars['String']['output']>;
  receipt?: Maybe<Receipt>;
  total: Scalars['Float']['output'];
  updatedAt: Scalars['Timestamp']['output'];
  version: Scalars['Int']['output'];
};

export type AdvanceFilter = {
  centers?: InputMaybe<Array<Scalars['ObjectID']['input']>>;
  organization?: InputMaybe<Scalars['ObjectID']['input']>;
  patient?: InputMaybe<Scalars['ObjectID']['input']>;
};

export type AdvanceItem = {
  __typename?: 'AdvanceItem';
  amount: Scalars['Float']['output'];
  associatedPatients?: Maybe<Array<AssociatedPatients>>;
  description?: Maybe<Scalars['String']['output']>;
  item?: Maybe<Package>;
  type: AdvanceType;
  validTill: Scalars['Timestamp']['output'];
};

export type AdvanceItemBalance = {
  __typename?: 'AdvanceItemBalance';
  amount: Scalars['Float']['output'];
  associatedPatients?: Maybe<Array<AssociatedPatientWithBalance>>;
  description?: Maybe<Scalars['String']['output']>;
  item?: Maybe<Package>;
  type: AdvanceType;
  validTill: Scalars['Timestamp']['output'];
};

export type AdvanceItemWithBalance = {
  __typename?: 'AdvanceItemWithBalance';
  advanceItem?: Maybe<AdvanceItemBalance>;
  currentBalance: Scalars['Float']['output'];
};

export enum AdvanceSortField {
  CreatedAt = 'CREATED_AT',
  SeqNo = 'SEQ_NO',
  Total = 'TOTAL',
  UpdatedAt = 'UPDATED_AT'
}

export type AdvanceSortInput = {
  field: AdvanceSortField;
  order?: InputMaybe<SortOrder>;
};

export enum AdvanceType {
  Package = 'PACKAGE',
  Referral = 'REFERRAL',
  Refund = 'REFUND'
}

export type AdvanceWithBalance = {
  __typename?: 'AdvanceWithBalance';
  advance?: Maybe<AdvanceWithItemBalance>;
  currentBalance: Scalars['Float']['output'];
};

export type AdvanceWithItemBalance = BaseAdvance & DataRow & {
  __typename?: 'AdvanceWithItemBalance';
  _id: Scalars['ObjectID']['output'];
  center: Center;
  createdAt: Scalars['Timestamp']['output'];
  footer?: Maybe<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  itemsWithBalance?: Maybe<Array<AdvanceItemWithBalance>>;
  notes?: Maybe<Scalars['String']['output']>;
  organization: Organization;
  patient: User;
  pdfUrl?: Maybe<Scalars['String']['output']>;
  receipt?: Maybe<Receipt>;
  total: Scalars['Float']['output'];
  updatedAt: Scalars['Timestamp']['output'];
  version: Scalars['Int']['output'];
};

export type AdviceRecord = {
  __typename?: 'AdviceRecord';
  advice?: Maybe<Scalars['String']['output']>;
};

export type AdviceRecordInput = {
  advice?: InputMaybe<Scalars['String']['input']>;
};

/** Follow-up or ongoing assessment for Agent Reports */
export type AgentAssessment = {
  __typename?: 'AgentAssessment';
  objectiveAssessment?: Maybe<Array<Maybe<AgentPhysio>>>;
  plan?: Maybe<AgentSnc>;
  rpe?: Maybe<AgentRpe>;
  subjectiveAssessment?: Maybe<AgentSubjective>;
};

export type AgentAssessmentInput = {
  objectiveAssessment?: InputMaybe<Array<InputMaybe<AgentPhysioInput>>>;
  plan?: InputMaybe<AgentSncInput>;
  rpe?: InputMaybe<AgentRepInput>;
  subjectiveAssessment?: InputMaybe<AgentSubjectiveInput>;
};

/** Detailed clinical history */
export type AgentClinicalDetails = {
  __typename?: 'AgentClinicalDetails';
  chiefComplaint?: Maybe<Scalars['String']['output']>;
  clinicalHistory?: Maybe<Scalars['String']['output']>;
  duration?: Maybe<Scalars['String']['output']>;
};

export type AgentClinicalDetailsInput = {
  chiefComplaint?: InputMaybe<Scalars['String']['input']>;
  clinicalHistory?: InputMaybe<Scalars['String']['input']>;
  duration?: InputMaybe<Scalars['String']['input']>;
};

/** First-time assessment details for Agent Reports */
export type AgentFirstAssessment = {
  __typename?: 'AgentFirstAssessment';
  clinicalDetails?: Maybe<AgentClinicalDetails>;
  objectiveAssessments?: Maybe<Array<Maybe<AgentPhysio>>>;
  objectiveGoals?: Maybe<Array<Maybe<AgentObjectiveGoal>>>;
  patientAdvice?: Maybe<AgentPatientAdvice>;
  recommendation?: Maybe<Array<Maybe<AgentRecommendationEntry>>>;
  subjectiveAssessments?: Maybe<Array<Maybe<AgentSubjectiveAssessment>>>;
  subjectiveGoals?: Maybe<Array<Maybe<AgentSubjectiveGoal>>>;
};

export type AgentFirstAssessmentInput = {
  clinicalDetails?: InputMaybe<AgentClinicalDetailsInput>;
  objectiveAssessments?: InputMaybe<Array<InputMaybe<AgentPhysioInput>>>;
  objectiveGoals?: InputMaybe<Array<InputMaybe<AgentObjectiveGoalInput>>>;
  patientAdvice?: InputMaybe<AgentPatientAdviceInput>;
  recommendation?: InputMaybe<Array<InputMaybe<AgentRecommendationEntryInput>>>;
  subjectiveAssessments?: InputMaybe<Array<InputMaybe<AgentSubjectiveAssessmentInput>>>;
  subjectiveGoals?: InputMaybe<Array<InputMaybe<AgentSubjectiveGoalInput>>>;
};

/** Measurable objective goals */
export type AgentObjectiveGoal = {
  __typename?: 'AgentObjectiveGoal';
  goalCategory?: Maybe<Scalars['String']['output']>;
  goalName?: Maybe<Scalars['String']['output']>;
  targetDate?: Maybe<Scalars['String']['output']>;
  unitName?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['String']['output']>;
};

export type AgentObjectiveGoalInput = {
  goalCategory?: InputMaybe<Scalars['String']['input']>;
  goalName?: InputMaybe<Scalars['String']['input']>;
  targetDate?: InputMaybe<Scalars['String']['input']>;
  unitName?: InputMaybe<Scalars['String']['input']>;
  value?: InputMaybe<Scalars['String']['input']>;
};

/** Advice given to patient */
export type AgentPatientAdvice = {
  __typename?: 'AgentPatientAdvice';
  adviceDetails?: Maybe<Scalars['String']['output']>;
};

export type AgentPatientAdviceInput = {
  adviceDetails?: InputMaybe<Scalars['String']['input']>;
};

/** Physiotherapy Entry for Agent Reports */
export type AgentPhysio = {
  __typename?: 'AgentPhysio';
  record?: Maybe<Scalars['ObjectID']['output']>;
  tests: Array<Maybe<ObjectiveTest>>;
};

export type AgentPhysioInput = {
  record?: InputMaybe<Scalars['ObjectID']['input']>;
  tests?: InputMaybe<Array<InputMaybe<ObjectiveTestInput>>>;
};

export type AgentRepInput = {
  record?: InputMaybe<Scalars['ObjectID']['input']>;
  value?: InputMaybe<Scalars['Int']['input']>;
};

export type AgentRpe = {
  __typename?: 'AgentRPE';
  record?: Maybe<Scalars['ObjectID']['output']>;
  value?: Maybe<Scalars['Int']['output']>;
};

/** Therapy recommendations */
export type AgentRecommendationEntry = {
  __typename?: 'AgentRecommendationEntry';
  sessionFrequency?: Maybe<Scalars['String']['output']>;
  sessionType?: Maybe<Scalars['String']['output']>;
};

export type AgentRecommendationEntryInput = {
  sessionFrequency?: InputMaybe<Scalars['String']['input']>;
  sessionType?: InputMaybe<Scalars['String']['input']>;
};

/** Main Agent Report Type */
export type AgentReport = DataRow & {
  __typename?: 'AgentReport';
  _id: Scalars['ObjectID']['output'];
  /** Reference to appointment */
  appointment: Appointment;
  /** Follow-up or ongoing assessment */
  assessment?: Maybe<AgentAssessment>;
  /** Reference to center */
  center?: Maybe<Center>;
  /** Reference to doctor */
  consultant?: Maybe<User>;
  createdAt: Scalars['Timestamp']['output'];
  /** Initial assessment details */
  firstAssessment?: Maybe<AgentFirstAssessment>;
  isAccepted?: Maybe<Scalars['Boolean']['output']>;
  isActive: Scalars['Boolean']['output'];
  isFilledCompletely?: Maybe<Scalars['Boolean']['output']>;
  /** Reference to organization */
  organization?: Maybe<Organization>;
  /** Reference to patient */
  patient: User;
  /** Physiotherapy assessment */
  physio?: Maybe<Array<Maybe<AgentPhysio>>>;
  /** Reference to report */
  report?: Maybe<Scalars['ObjectID']['output']>;
  /** Strength and conditioning plan */
  snc?: Maybe<Array<Maybe<AgentSnc>>>;
  updatedAt: Scalars['Timestamp']['output'];
  version: Scalars['Int']['output'];
};

/** Strength and Conditioning Plan for Agent Reports */
export type AgentSnc = {
  __typename?: 'AgentSNC';
  advice?: Maybe<Scalars['String']['output']>;
  plans?: Maybe<Array<Maybe<Plan>>>;
  record?: Maybe<Scalars['ObjectID']['output']>;
};

export type AgentSncInput = {
  advice?: InputMaybe<Scalars['String']['input']>;
  plans?: InputMaybe<Array<InputMaybe<PlanInput>>>;
  record?: InputMaybe<Scalars['ObjectID']['input']>;
};

/** Subjective inputs from patient */
export type AgentSubjective = {
  __typename?: 'AgentSubjective';
  assessment?: Maybe<Scalars['String']['output']>;
  record?: Maybe<Scalars['ObjectID']['output']>;
};

/** Results of subjective assessments */
export type AgentSubjectiveAssessment = {
  __typename?: 'AgentSubjectiveAssessment';
  conclusion?: Maybe<Scalars['String']['output']>;
  testName?: Maybe<Scalars['String']['output']>;
};

export type AgentSubjectiveAssessmentInput = {
  conclusion?: InputMaybe<Scalars['String']['input']>;
  testName?: InputMaybe<Scalars['String']['input']>;
};

/** Goals reported by patient */
export type AgentSubjectiveGoal = {
  __typename?: 'AgentSubjectiveGoal';
  goalDetails?: Maybe<Scalars['String']['output']>;
  targetDate?: Maybe<Scalars['String']['output']>;
};

export type AgentSubjectiveGoalInput = {
  goalDetails?: InputMaybe<Scalars['String']['input']>;
  targetDate?: InputMaybe<Scalars['String']['input']>;
};

export type AgentSubjectiveInput = {
  assessment?: InputMaybe<Scalars['String']['input']>;
  record?: InputMaybe<Scalars['ObjectID']['input']>;
};

export type ApiKey = DataRow & {
  __typename?: 'ApiKey';
  _id: Scalars['ObjectID']['output'];
  createdAt: Scalars['Timestamp']['output'];
  isActive: Scalars['Boolean']['output'];
  keyHash?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  permissions?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  seqNo?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['Timestamp']['output'];
  version: Scalars['Int']['output'];
};

export type ApiKeyResponse = {
  __typename?: 'ApiKeyResponse';
  key: Scalars['String']['output'];
  name: Scalars['String']['output'];
  permissions: Array<Scalars['String']['output']>;
};

/** Appointment */
export type Appointment = DataRow & {
  __typename?: 'Appointment';
  _id: Scalars['ObjectID']['output'];
  cancellationNote?: Maybe<Scalars['String']['output']>;
  cancellationReason?: Maybe<CancellationReason>;
  cancelledAt?: Maybe<Scalars['Timestamp']['output']>;
  cancelledBy?: Maybe<User>;
  category?: Maybe<PatientCategory>;
  center: Center;
  consultant?: Maybe<User>;
  createdAt: Scalars['Timestamp']['output'];
  event: AppointmentEvent;
  invoice?: Maybe<Invoice>;
  isActive: Scalars['Boolean']['output'];
  isPrepaid?: Maybe<Scalars['Boolean']['output']>;
  isWaitlisted: Scalars['Boolean']['output'];
  medium: AppointmentMedium;
  meetingLink?: Maybe<Scalars['String']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  patient: User;
  report?: Maybe<Report>;
  rescheduledFrom?: Maybe<Array<Appointment>>;
  rescheduledTo?: Maybe<Appointment>;
  seqNo: Scalars['String']['output'];
  status: AppointmentStatus;
  treatment?: Maybe<Service>;
  updatedAt: Scalars['Timestamp']['output'];
  version: Scalars['Int']['output'];
  visitType: AppointmentVisitType;
};

export type AppointmentEvent = BaseEvent & DataRow & {
  __typename?: 'AppointmentEvent';
  _id: Scalars['ObjectID']['output'];
  appointment: Appointment;
  attendees: Array<User>;
  center?: Maybe<Center>;
  createdAt: Scalars['Timestamp']['output'];
  description?: Maybe<Scalars['String']['output']>;
  endTime: Scalars['Timestamp']['output'];
  eventId?: Maybe<Scalars['String']['output']>;
  eventType: EventType;
  host: EventHost;
  hostType: EventHostType;
  isActive: Scalars['Boolean']['output'];
  isWaitlisted: Scalars['Boolean']['output'];
  meetingLink?: Maybe<Scalars['String']['output']>;
  organization: Organization;
  recurrenceRule?: Maybe<Recurrence>;
  seqNo: Scalars['String']['output'];
  startTime: Scalars['Timestamp']['output'];
  title: Scalars['String']['output'];
  updatedAt: Scalars['Timestamp']['output'];
  version: Scalars['Int']['output'];
};

export type AppointmentFilter = {
  category?: InputMaybe<PatientCategory>;
  center?: InputMaybe<Array<Scalars['ObjectID']['input']>>;
  consultant?: InputMaybe<Scalars['ObjectID']['input']>;
  medium?: InputMaybe<AppointmentMedium>;
  notAssigned?: InputMaybe<Scalars['Boolean']['input']>;
  patient?: InputMaybe<Scalars['ObjectID']['input']>;
  status?: InputMaybe<AppointmentStatus>;
  treatment?: InputMaybe<Scalars['ObjectID']['input']>;
  visitType?: InputMaybe<AppointmentVisitType>;
};

export enum AppointmentMedium {
  InPerson = 'IN_PERSON',
  Online = 'ONLINE'
}

export enum AppointmentStatus {
  Booked = 'BOOKED',
  Cancelled = 'CANCELLED',
  InvoiceGenerated = 'INVOICE_GENERATED',
  Paid = 'PAID',
  PrePaid = 'PRE_PAID',
  TokenPaid = 'TOKEN_PAID',
  TokenPending = 'TOKEN_PENDING',
  Visited = 'VISITED',
  Waitlisted = 'WAITLISTED'
}

export enum AppointmentVisitType {
  FirstVisit = 'FIRST_VISIT',
  FollowUp = 'FOLLOW_UP'
}

export enum AssessmentGoalType {
  Objective = 'OBJECTIVE',
  Subjective = 'SUBJECTIVE'
}

export type AssignPermissionInput = {
  permissions: Array<PermissionInput>;
  scope: Scalars['ObjectID']['input'];
  scopeType: ScopeType;
  user: Scalars['ObjectID']['input'];
};

export type AssignUserRoleInput = {
  role: Scalars['ObjectID']['input'];
  scope: Scalars['ObjectID']['input'];
  scopeType: ScopeType;
  user: Scalars['ObjectID']['input'];
};

export type AssociatedPatientWithBalance = {
  __typename?: 'AssociatedPatientWithBalance';
  amount: Scalars['Float']['output'];
  currentBalance: Scalars['Float']['output'];
  patient: User;
};

export type AssociatedPatients = {
  __typename?: 'AssociatedPatients';
  amount: Scalars['Float']['output'];
  patient: User;
};

export type AssociatedPatientsInput = {
  amount: Scalars['Float']['input'];
  patient: Scalars['ObjectID']['input'];
};

export type AuthenticatedSession = {
  __typename?: 'AuthenticatedSession';
  refreshToken: Scalars['String']['output'];
  token: Scalars['String']['output'];
  user: User;
};

export type AvailabilityEvent = BaseEvent & DataRow & {
  __typename?: 'AvailabilityEvent';
  _id: Scalars['ObjectID']['output'];
  attendees?: Maybe<Array<User>>;
  availabilityStatus: AvailabilityStatus;
  center?: Maybe<Center>;
  createdAt: Scalars['Timestamp']['output'];
  description?: Maybe<Scalars['String']['output']>;
  endTime: Scalars['Time']['output'];
  eventId?: Maybe<Scalars['String']['output']>;
  eventType: EventType;
  host: EventHost;
  hostType: EventHostType;
  isActive: Scalars['Boolean']['output'];
  isAvailable: Scalars['Boolean']['output'];
  organization: Organization;
  recurrenceRule: Recurrence;
  seqNo: Scalars['String']['output'];
  startTime: Scalars['Time']['output'];
  title: Scalars['String']['output'];
  updatedAt: Scalars['Timestamp']['output'];
  version: Scalars['Int']['output'];
};

export type AvailabilitySlot = {
  __typename?: 'AvailabilitySlot';
  centerId: Scalars['ObjectID']['output'];
  centerName: Scalars['String']['output'];
  endTime: Scalars['Time']['output'];
  startTime: Scalars['Time']['output'];
};

export enum AvailabilityStatus {
  Available = 'AVAILABLE',
  Break = 'BREAK',
  Holiday = 'HOLIDAY',
  Interview = 'INTERVIEW',
  Leave = 'LEAVE',
  Meeting = 'MEETING',
  Unavailable = 'UNAVAILABLE'
}

export type BaseAdvance = {
  _id: Scalars['ObjectID']['output'];
  center: Center;
  createdAt: Scalars['Timestamp']['output'];
  footer?: Maybe<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  organization: Organization;
  patient: User;
  pdfUrl?: Maybe<Scalars['String']['output']>;
  receipt?: Maybe<Receipt>;
  total: Scalars['Float']['output'];
  updatedAt: Scalars['Timestamp']['output'];
  version: Scalars['Int']['output'];
};

export type BaseEvent = {
  _id: Scalars['ObjectID']['output'];
  attendees?: Maybe<Array<User>>;
  center?: Maybe<Center>;
  createdAt: Scalars['Timestamp']['output'];
  description?: Maybe<Scalars['String']['output']>;
  eventId?: Maybe<Scalars['String']['output']>;
  eventType: EventType;
  host: EventHost;
  hostType: EventHostType;
  isActive: Scalars['Boolean']['output'];
  organization: Organization;
  recurrenceRule?: Maybe<Recurrence>;
  seqNo: Scalars['String']['output'];
  title: Scalars['String']['output'];
  updatedAt: Scalars['Timestamp']['output'];
  version: Scalars['Int']['output'];
};

export enum CancellationReason {
  ConsultantUnavailable = 'CONSULTANT_UNAVAILABLE',
  PatientIllness = 'PATIENT_ILLNESS',
  PatientNoShow = 'PATIENT_NO_SHOW',
  PatientRequest = 'PATIENT_REQUEST',
  ReferredElsewhere = 'REFERRED_ELSEWHERE',
  Rescheduled = 'RESCHEDULED',
  TreatmentNotNeeded = 'TREATMENT_NOT_NEEDED'
}

export type Center = DataRow & {
  __typename?: 'Center';
  _id: Scalars['ObjectID']['output'];
  address: Address;
  createdAt: Scalars['Timestamp']['output'];
  isActive: Scalars['Boolean']['output'];
  isOnline: Scalars['Boolean']['output'];
  location: Scalars['URL']['output'];
  name: Scalars['String']['output'];
  organization: Organization;
  phone: Scalars['String']['output'];
  seqNo: Scalars['String']['output'];
  updatedAt: Scalars['Timestamp']['output'];
  version: Scalars['Int']['output'];
};

export type CenterAvailabilityInput = {
  centerId: Scalars['ObjectID']['input'];
  consultantId?: InputMaybe<Scalars['ObjectID']['input']>;
  deliveryMode?: InputMaybe<Scalars['String']['input']>;
  designation?: InputMaybe<Scalars['String']['input']>;
  endDate: Scalars['Timestamp']['input'];
  serviceDuration: Scalars['Int']['input'];
  startDate: Scalars['Timestamp']['input'];
};

export type ClinicalRecord = {
  __typename?: 'ClinicalRecord';
  bodyChart?: Maybe<Scalars['URL']['output']>;
  chiefComplaints?: Maybe<Scalars['String']['output']>;
  clientHistory?: Maybe<Scalars['String']['output']>;
  duration?: Maybe<Scalars['String']['output']>;
};

export type ClinicalRecordInput = {
  bodyChart?: InputMaybe<Scalars['URL']['input']>;
  chiefComplaints?: InputMaybe<Scalars['String']['input']>;
  clientHistory?: InputMaybe<Scalars['String']['input']>;
  duration?: InputMaybe<Scalars['String']['input']>;
};

/** Consultant type definition */
export type Consultant = {
  __typename?: 'Consultant';
  allowOnlineBooking: Scalars['Boolean']['output'];
  allowOnlineDelivery: DeliveryMode;
  bio?: Maybe<Scalars['String']['output']>;
  centers: Array<Center>;
  designation: Designation;
  dob?: Maybe<Scalars['Timestamp']['output']>;
  firstName: Scalars['String']['output'];
  gender: Gender;
  lastName?: Maybe<Scalars['String']['output']>;
  location?: Maybe<Address>;
  organization: Organization;
  profilePicture?: Maybe<Scalars['String']['output']>;
  services: Array<Service>;
  specialization: Specialization;
};

export type ConsultantAvailability = {
  __typename?: 'ConsultantAvailability';
  availableSlots: Array<AvailabilitySlot>;
  consultantId: Scalars['ObjectID']['output'];
  consultantName: Scalars['String']['output'];
};

export type ConsultantFilterInput = {
  allowOnlineBooking?: InputMaybe<Scalars['Boolean']['input']>;
  allowOnlineDelivery?: InputMaybe<Array<DeliveryMode>>;
  centers?: InputMaybe<Array<Scalars['ObjectID']['input']>>;
};

export type CreateAdvanceInput = {
  center: Scalars['ObjectID']['input'];
  createdAt?: InputMaybe<Scalars['Timestamp']['input']>;
  footer?: InputMaybe<Scalars['String']['input']>;
  items?: InputMaybe<Array<CreateAdvanceItemInput>>;
  notes?: InputMaybe<Scalars['String']['input']>;
  patient: Scalars['ObjectID']['input'];
  payment: CreatePaymentInput;
  total: Scalars['Float']['input'];
};

export type CreateAdvanceItemInput = {
  amount: Scalars['Float']['input'];
  associatedPatients?: InputMaybe<Array<AssociatedPatientsInput>>;
  description?: InputMaybe<Scalars['String']['input']>;
  item?: InputMaybe<Scalars['ObjectID']['input']>;
  type: AdvanceType;
  validTill: Scalars['Timestamp']['input'];
};

/** Agent Report Input Types and Mutations */
export type CreateAgentReportInput = {
  appointment: Scalars['ObjectID']['input'];
  assessment?: InputMaybe<AgentAssessmentInput>;
  center?: InputMaybe<Scalars['ObjectID']['input']>;
  consultant?: InputMaybe<Scalars['ObjectID']['input']>;
  firstAssessment?: InputMaybe<AgentFirstAssessmentInput>;
  organization?: InputMaybe<Scalars['ObjectID']['input']>;
  patient: Scalars['ObjectID']['input'];
  physio?: InputMaybe<Array<InputMaybe<AgentPhysioInput>>>;
  snc?: InputMaybe<Array<InputMaybe<AgentSncInput>>>;
};

export type CreateApiKeyInput = {
  name: Scalars['String']['input'];
  permissions: Array<Scalars['String']['input']>;
};

export type CreateAppointmentEventInput = {
  endTime: Scalars['Timestamp']['input'];
  startTime: Scalars['Timestamp']['input'];
};

/** Input for creating a new appointment */
export type CreateAppointmentInput = {
  category?: InputMaybe<PatientCategory>;
  center: Scalars['ObjectID']['input'];
  consultant?: InputMaybe<Scalars['ObjectID']['input']>;
  event: CreateAppointmentEventInput;
  isPrepaid?: InputMaybe<Scalars['Boolean']['input']>;
  medium: AppointmentMedium;
  meetingLink?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  patient: Scalars['ObjectID']['input'];
  status?: InputMaybe<AppointmentStatus>;
  treatment?: InputMaybe<Scalars['ObjectID']['input']>;
  visitType?: InputMaybe<AppointmentVisitType>;
};

/** Input for updating an appointment */
export type CreateAppointmentWithPackageInput = {
  advanceId: Scalars['ObjectID']['input'];
  category?: InputMaybe<PatientCategory>;
  center: Scalars['ObjectID']['input'];
  consultant?: InputMaybe<Scalars['ObjectID']['input']>;
  event: CreateAppointmentEventInput;
  medium: AppointmentMedium;
  notes?: InputMaybe<Scalars['String']['input']>;
  patient: Scalars['ObjectID']['input'];
  treatment: Scalars['ObjectID']['input'];
};

export type CreateAvailabilityEventInput = {
  availabilityStatus: AvailabilityStatus;
  /** End time of the event. */
  endTime: Scalars['Time']['input'];
  isAvailable: Scalars['Boolean']['input'];
  /** Start time of the event. */
  startTime: Scalars['Time']['input'];
};

export type CreateCenterInput = {
  address: AddressInput;
  isOnline?: InputMaybe<Scalars['Boolean']['input']>;
  location: Scalars['URL']['input'];
  name: Scalars['String']['input'];
  phone: Scalars['String']['input'];
};

export type CreateConsultantInput = {
  allowOnlineBooking?: InputMaybe<Scalars['Boolean']['input']>;
  allowOnlineDelivery?: InputMaybe<DeliveryMode>;
  bio?: InputMaybe<Scalars['String']['input']>;
  centers: Array<Scalars['ObjectID']['input']>;
  designation: Designation;
  dob: Scalars['Timestamp']['input'];
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  gender: Gender;
  lastName?: InputMaybe<Scalars['String']['input']>;
  location?: InputMaybe<AddressInput>;
  password: Scalars['String']['input'];
  phone: Scalars['String']['input'];
  profilePicture?: InputMaybe<Scalars['String']['input']>;
  services: Array<Scalars['ObjectID']['input']>;
  specialization: Specialization;
};

export type CreateEventInput = {
  /** List of attendees for the event. */
  attendees?: InputMaybe<Array<Scalars['ObjectID']['input']>>;
  /** Center where the event takes place (required for consultant schedules). */
  center?: InputMaybe<Scalars['ObjectID']['input']>;
  /** Description of the event. */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Type of the event (e.g., appointment, availability, leave, holiday). */
  eventType: EventType;
  /** The host of the event (can be a center, user, or organization). */
  host: Scalars['ObjectID']['input'];
  /** Type of the host (center, user, or organization). */
  hostType: EventHostType;
  /** Recurrence rule for the event. */
  recurrenceRule?: InputMaybe<RecurrenceInput>;
  /** Title of the event. */
  title: Scalars['String']['input'];
};

export type CreateGoalAchievementInput = {
  achievement: Scalars['Float']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  updatedDate: Scalars['Timestamp']['input'];
};

export type CreateGoalSetFromAssessmentInput = {
  assessmentId: Scalars['ObjectID']['input'];
  name: Scalars['String']['input'];
  patient: Scalars['ObjectID']['input'];
  selectedObjectiveGoals: Array<ObjectiveGoalInput>;
  selectedSubjectiveGoals: Array<SubjectiveGoalInput>;
};

export type CreateGoalSetInput = {
  goals?: InputMaybe<Array<CreateGoalsInput>>;
  isFromAssessment?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  parentGoalSetId?: InputMaybe<Scalars['ObjectID']['input']>;
  patient: Scalars['ObjectID']['input'];
};

export type CreateGoalsInput = {
  assessmentGoalType?: InputMaybe<Scalars['String']['input']>;
  category: GoalCategory;
  customExerciseName?: InputMaybe<Scalars['String']['input']>;
  exercise?: InputMaybe<Scalars['ObjectID']['input']>;
  isFromAssessment?: InputMaybe<Scalars['Boolean']['input']>;
  isReverseProgress?: InputMaybe<Scalars['Boolean']['input']>;
  maxTarget?: InputMaybe<Scalars['Float']['input']>;
  minTarget?: InputMaybe<Scalars['Float']['input']>;
  name: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  parentGoalId?: InputMaybe<Scalars['ObjectID']['input']>;
  priority?: InputMaybe<Scalars['Int']['input']>;
  targetDate: Scalars['Timestamp']['input'];
  unit?: InputMaybe<Scalars['String']['input']>;
};

export type CreateInvoiceInput = {
  amount: Scalars['Float']['input'];
  appointment?: InputMaybe<Scalars['ObjectID']['input']>;
  center: Scalars['ObjectID']['input'];
  createdAt?: InputMaybe<Scalars['Timestamp']['input']>;
  dueDate: Scalars['Timestamp']['input'];
  footer?: InputMaybe<Scalars['String']['input']>;
  items?: InputMaybe<Array<CreateInvoiceItemInput>>;
  notes?: InputMaybe<Scalars['String']['input']>;
  patient?: InputMaybe<Scalars['ObjectID']['input']>;
  payment?: InputMaybe<PaymentFieldInput>;
  staff?: InputMaybe<Scalars['ObjectID']['input']>;
  subheading?: InputMaybe<Scalars['String']['input']>;
};

export type CreateInvoiceItemInput = {
  amount: Scalars['Float']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  discount?: InputMaybe<Scalars['Float']['input']>;
  item: Scalars['ObjectID']['input'];
  price: Scalars['Float']['input'];
  quantity: Scalars['Int']['input'];
};

export type CreateLedgerInput = {
  amount: Scalars['Float']['input'];
  center: Scalars['ObjectID']['input'];
  patient: Scalars['ObjectID']['input'];
  type: TransactionType;
};

/** Input for creating a new message template */
export type CreateMessageTemplateInput = {
  content: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  isDefault?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  placeholders?: InputMaybe<Array<Scalars['String']['input']>>;
  type: MessageTemplateType;
};

export type CreateOrderInput = {
  amount: Scalars['Float']['input'];
  appointment?: InputMaybe<Scalars['ObjectID']['input']>;
  center: Scalars['ObjectID']['input'];
  currency: Scalars['String']['input'];
  packageId?: InputMaybe<Scalars['ObjectID']['input']>;
  patient: Scalars['ObjectID']['input'];
  type: PaymentType;
};

export type CreateOrganizationInput = {
  address: AddressInput;
  brandName: Scalars['String']['input'];
  companyName: Scalars['String']['input'];
  gstNumber: Scalars['String']['input'];
  logo?: InputMaybe<Scalars['URL']['input']>;
  panNumber: Scalars['String']['input'];
  socialLinks: Array<Scalars['URL']['input']>;
};

export type CreatePackageInput = {
  centers: Array<Scalars['ObjectID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  internalName: Scalars['String']['input'];
  isMultiUser: Scalars['Boolean']['input'];
  maxUsers?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  price: Scalars['Float']['input'];
  services: Array<Scalars['ObjectID']['input']>;
  validity: Scalars['Int']['input'];
};

export type CreatePatientInput = {
  bio?: InputMaybe<Scalars['String']['input']>;
  category?: InputMaybe<PatientCategory>;
  centers: Array<Scalars['ObjectID']['input']>;
  cohort?: InputMaybe<PatientCohort>;
  consultant?: InputMaybe<Scalars['ObjectID']['input']>;
  dob?: InputMaybe<Scalars['Timestamp']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  firstName: Scalars['String']['input'];
  gender: Gender;
  lastName?: InputMaybe<Scalars['String']['input']>;
  patientType?: InputMaybe<PatientType>;
  phone: Scalars['String']['input'];
  profilePicture?: InputMaybe<Scalars['String']['input']>;
  referral?: InputMaybe<ReferralInput>;
};

export type CreatePaymentInput = {
  amount: Scalars['Float']['input'];
  center?: InputMaybe<Scalars['ObjectID']['input']>;
  createdAt?: InputMaybe<Scalars['Timestamp']['input']>;
  mode: PaymentMode;
  notes?: InputMaybe<Scalars['String']['input']>;
  razorpayPaymentId?: InputMaybe<Scalars['String']['input']>;
  source?: InputMaybe<Scalars['ObjectID']['input']>;
  status?: InputMaybe<PaymentStatus>;
  subSource?: InputMaybe<Scalars['ObjectID']['input']>;
  transactionId?: InputMaybe<Scalars['String']['input']>;
};

export type CreateReceiptInput = {
  center: Scalars['ObjectID']['input'];
  patient: Scalars['ObjectID']['input'];
  payment?: InputMaybe<Scalars['ObjectID']['input']>;
};

export type CreateRoleInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  permissions: Array<PermissionInput>;
  scopeId: Scalars['ObjectID']['input'];
  scopeType: ScopeType;
};

export type CreateServiceInput = {
  allowOnlineBooking?: InputMaybe<Scalars['Boolean']['input']>;
  allowOnlineDelivery?: InputMaybe<Scalars['Boolean']['input']>;
  centers?: InputMaybe<Array<Scalars['ObjectID']['input']>>;
  description?: InputMaybe<Scalars['String']['input']>;
  duration: Scalars['Int']['input'];
  internalName: Scalars['String']['input'];
  isNewUserService?: InputMaybe<Scalars['Boolean']['input']>;
  isPrePaid?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  price: Scalars['Float']['input'];
};

export type CreateStaffInput = {
  centers: Array<Scalars['ObjectID']['input']>;
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  password: Scalars['String']['input'];
  phone: Scalars['String']['input'];
  profilePicture?: InputMaybe<Scalars['String']['input']>;
};

export type CursorPaginationInfo = {
  __typename?: 'CursorPaginationInfo';
  hasNext: Scalars['Boolean']['output'];
  hasPrevious: Scalars['Boolean']['output'];
  limit: Scalars['Int']['output'];
  nextCursor?: Maybe<Scalars['String']['output']>;
  prevCursor?: Maybe<Scalars['String']['output']>;
};

export type CursorPaginationInput = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  direction?: InputMaybe<PaginationDirection>;
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type DataRow = {
  _id: Scalars['ObjectID']['output'];
  createdAt: Scalars['Timestamp']['output'];
  isActive: Scalars['Boolean']['output'];
  updatedAt: Scalars['Timestamp']['output'];
  version: Scalars['Int']['output'];
};

export enum DeliveryMode {
  Both = 'BOTH',
  Offline = 'OFFLINE',
  Online = 'ONLINE'
}

export enum Designation {
  OrthopaedicDoctor = 'Orthopaedic_Doctor',
  Physiotherapist = 'Physiotherapist',
  SncCoach = 'SNC_Coach',
  SportsMassageTherapist = 'Sports_Massage_Therapist'
}

export enum DifficultyLevel {
  Easy = 'EASY',
  Hard = 'HARD',
  Moderate = 'MODERATE',
  VeryEasy = 'VERY_EASY',
  VeryHard = 'VERY_HARD'
}

export type DocumentRecord = {
  __typename?: 'DocumentRecord';
  details?: Maybe<Scalars['String']['output']>;
  document?: Maybe<Scalars['String']['output']>;
  documentName?: Maybe<Scalars['String']['output']>;
};

export type DocumentRecordInput = {
  details?: InputMaybe<Scalars['String']['input']>;
  document?: InputMaybe<Scalars['String']['input']>;
  documentName?: InputMaybe<Scalars['String']['input']>;
};

export enum DocumentType {
  BodyChart = 'BODY_CHART',
  Logo = 'LOGO',
  Other = 'OTHER',
  PatientUpload = 'PATIENT_UPLOAD',
  ProfilePic = 'PROFILE_PIC'
}

export type DuplicateGoalModificationInput = {
  maxTarget?: InputMaybe<Scalars['Float']['input']>;
  minTarget?: InputMaybe<Scalars['Float']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  sourceGoalId: Scalars['ObjectID']['input'];
  targetDate?: InputMaybe<Scalars['Timestamp']['input']>;
};

export type DuplicateGoalSetInput = {
  goalModifications?: InputMaybe<Array<DuplicateGoalModificationInput>>;
  name: Scalars['String']['input'];
  sourceGoalSetId: Scalars['ObjectID']['input'];
};

export type EmailResponse = {
  __typename?: 'EmailResponse';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type Event = AppointmentEvent | AvailabilityEvent;

/** Filtering criteria for fetching events. */
export type EventFilter = {
  appointmentFilter?: InputMaybe<AppointmentFilter>;
  attendees?: InputMaybe<Array<Scalars['ObjectID']['input']>>;
  endDate?: InputMaybe<Scalars['Timestamp']['input']>;
  eventType?: InputMaybe<EventType>;
  host?: InputMaybe<Scalars['ObjectID']['input']>;
  hostType?: InputMaybe<EventHostType>;
  startDate?: InputMaybe<Scalars['Timestamp']['input']>;
};

export type EventHost = Center | Organization | User;

export enum EventHostType {
  Center = 'CENTER',
  Organization = 'ORGANIZATION',
  User = 'USER'
}

export type EventPagination = {
  __typename?: 'EventPagination';
  hasNext: Scalars['Boolean']['output'];
  hasPrevious: Scalars['Boolean']['output'];
  limit: Scalars['Int']['output'];
  nextCursor?: Maybe<Scalars['String']['output']>;
  prevCursor?: Maybe<Scalars['String']['output']>;
};

export enum EventSortField {
  CreatedAt = 'CREATED_AT',
  StartTime = 'START_TIME'
}

export type EventSortInput = {
  field: EventSortField;
  order?: InputMaybe<SortOrder>;
};

export enum EventType {
  Appointment = 'APPOINTMENT',
  Availability = 'AVAILABILITY'
}

export type Exercise = DataRow & {
  __typename?: 'Exercise';
  _id: Scalars['ObjectID']['output'];
  createdAt: Scalars['Timestamp']['output'];
  description: Scalars['String']['output'];
  exerciseConfig: Array<ExerciseConfig>;
  exerciseDiffLevel?: Maybe<DifficultyLevel>;
  exerciseId: Scalars['Int']['output'];
  exerciseResistanceLevel?: Maybe<ResistanceLevel>;
  exerciseStabilityFactor?: Maybe<StabilityFactor>;
  exerciseTimePerRep: Scalars['Int']['output'];
  exerciseTypes: Array<ExerciseType>;
  groupId: Scalars['String']['output'];
  isActive: Scalars['Boolean']['output'];
  joints: Array<JointMovement>;
  majorAxis?: Maybe<Scalars['String']['output']>;
  media: Media;
  muscleGroups: Array<MuscleGroup>;
  name: Scalars['String']['output'];
  numberOfReps: Scalars['Int']['output'];
  numberOfSets: Scalars['Int']['output'];
  sensorMovement: Array<SensorBodyTag>;
  sensorsBodyType?: Maybe<SensorBodyType>;
  sensorsRequired: Array<SensorBodyTag>;
  startPosition?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['Timestamp']['output'];
  version: Scalars['Int']['output'];
};

export enum ExerciseConfig {
  Altering = 'ALTERING',
  Lag = 'LAG',
  Lower = 'LOWER',
  Measurable = 'MEASURABLE',
  NonMeasurable = 'NON_MEASURABLE',
  Upper = 'UPPER'
}

export type ExerciseFilter = {
  exerciseConfig?: InputMaybe<Array<ExerciseConfig>>;
  exerciseDiffLevel?: InputMaybe<DifficultyLevel>;
  exerciseResistanceLevel?: InputMaybe<ResistanceLevel>;
  exerciseStabilityFactor?: InputMaybe<StabilityFactor>;
  exerciseTypes?: InputMaybe<Array<ExerciseType>>;
  groupId?: InputMaybe<Scalars['String']['input']>;
  joints?: InputMaybe<Array<JointMovement>>;
  muscleGroups?: InputMaybe<Array<MuscleGroup>>;
  sensorMovement?: InputMaybe<Array<SensorBodyTag>>;
  sensorsBodyType?: InputMaybe<SensorBodyType>;
  sensorsRequired?: InputMaybe<Array<SensorBodyTag>>;
  startPosition?: InputMaybe<Scalars['String']['input']>;
};

export type ExerciseSets = {
  __typename?: 'ExerciseSets';
  load?: Maybe<Scalars['String']['output']>;
  repetitions?: Maybe<Scalars['Int']['output']>;
  unit?: Maybe<Scalars['String']['output']>;
};

export type ExerciseSetsInput = {
  load?: InputMaybe<Scalars['String']['input']>;
  repetitions?: InputMaybe<Scalars['Int']['input']>;
  unit?: InputMaybe<Scalars['String']['input']>;
};

export enum ExerciseType {
  Agility = 'AGILITY',
  Balance = 'BALANCE',
  Coordination = 'COORDINATION',
  Strength = 'STRENGTH',
  Stretch = 'STRETCH'
}

export type ExportAdvancesAsPdfResponse = {
  __typename?: 'ExportAdvancesAsPDFResponse';
  errors?: Maybe<Array<Scalars['String']['output']>>;
  pdfUrl: Scalars['String']['output'];
};

export type ExportInvoicesAsPdfResponse = {
  __typename?: 'ExportInvoicesAsPDFResponse';
  errors?: Maybe<Array<Scalars['String']['output']>>;
  pdfUrl: Scalars['String']['output'];
};

export type File = DataRow & {
  __typename?: 'File';
  _id: Scalars['ObjectID']['output'];
  createdAt: Scalars['Timestamp']['output'];
  details?: Maybe<Scalars['String']['output']>;
  documentType: DocumentType;
  encoding: Scalars['String']['output'];
  filename: Scalars['String']['output'];
  isActive: Scalars['Boolean']['output'];
  mimetype: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
  owner: FileOwner;
  ownerType: FileOwnerType;
  size: Scalars['Int']['output'];
  updatedAt: Scalars['Timestamp']['output'];
  url: Scalars['String']['output'];
  version: Scalars['Int']['output'];
};

export type FileFilterInput = {
  documentType?: InputMaybe<DocumentType>;
  ownerId?: InputMaybe<Scalars['ObjectID']['input']>;
  ownerType?: InputMaybe<FileOwnerType>;
};

export type FileOwner = Center | Organization | User;

export enum FileOwnerType {
  Center = 'CENTER',
  Organization = 'ORGANIZATION',
  User = 'USER'
}

export type FileUploadInput = {
  details?: InputMaybe<Scalars['String']['input']>;
  documentType: DocumentType;
  file: Scalars['Upload']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  ownerId: Scalars['ObjectID']['input'];
  ownerType: FileOwnerType;
};

export enum Gender {
  Female = 'FEMALE',
  Male = 'MALE'
}

export type GenerateOnboardingLinkInput = {
  centerId: Scalars['ObjectID']['input'];
  consultantId?: InputMaybe<Scalars['ObjectID']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  phone: Scalars['String']['input'];
  serviceId: Scalars['ObjectID']['input'];
  slotEnd: Scalars['Timestamp']['input'];
  slotStart: Scalars['Timestamp']['input'];
};

export type GetAvailableSlotsInput = {
  center: Scalars['ObjectID']['input'];
  date: Scalars['Timestamp']['input'];
  duration: Scalars['Int']['input'];
  host: Scalars['ObjectID']['input'];
  hostType: EventHostType;
};

export type GetStatsInput = {
  centers: Array<Scalars['ObjectID']['input']>;
};

export type Goal = DataRow & {
  __typename?: 'Goal';
  _id: Scalars['ObjectID']['output'];
  achievements?: Maybe<Array<GoalAchievement>>;
  adjustmentReason?: Maybe<Scalars['String']['output']>;
  assessmentGoalType?: Maybe<AssessmentGoalType>;
  category: GoalCategory;
  createdAt: Scalars['Timestamp']['output'];
  customExerciseName?: Maybe<Scalars['String']['output']>;
  exercise?: Maybe<Exercise>;
  isActive: Scalars['Boolean']['output'];
  isFromAssessment: Scalars['Boolean']['output'];
  isReverseProgress?: Maybe<Scalars['Boolean']['output']>;
  maxTarget?: Maybe<Scalars['Float']['output']>;
  minTarget?: Maybe<Scalars['Float']['output']>;
  name: Scalars['String']['output'];
  needsAdjustment?: Maybe<Scalars['Boolean']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  parentGoalId?: Maybe<Scalars['ObjectID']['output']>;
  priority?: Maybe<Scalars['Int']['output']>;
  progress?: Maybe<Scalars['Float']['output']>;
  status: GoalStatus;
  suggestedMaxTarget?: Maybe<Scalars['Float']['output']>;
  suggestedMinTarget?: Maybe<Scalars['Float']['output']>;
  targetDate: Scalars['Timestamp']['output'];
  unit?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['Timestamp']['output'];
  version: Scalars['Int']['output'];
};

export type GoalAchievement = {
  __typename?: 'GoalAchievement';
  achievement: Scalars['Float']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  updatedDate: Scalars['Timestamp']['output'];
};

export type GoalAchievementWithSource = {
  __typename?: 'GoalAchievementWithSource';
  achievement: GoalAchievement;
  isFromCurrentGoal: Scalars['Boolean']['output'];
  sourceGoalId: Scalars['ObjectID']['output'];
  sourceGoalName: Scalars['String']['output'];
};

export enum GoalCategory {
  Endurance = 'ENDURANCE',
  Functional = 'FUNCTIONAL',
  Hold = 'HOLD',
  Pain = 'PAIN',
  Rom = 'ROM',
  Snc = 'SNC',
  Stability = 'STABILITY'
}

export type GoalSet = DataRow & {
  __typename?: 'GoalSet';
  _id: Scalars['ObjectID']['output'];
  createdAt: Scalars['Timestamp']['output'];
  goals: Array<Goal>;
  isActive: Scalars['Boolean']['output'];
  isFromAssessment: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  parentGoalSetId?: Maybe<Scalars['ObjectID']['output']>;
  patient: User;
  sourceAssessmentId?: Maybe<Scalars['ObjectID']['output']>;
  status: GoalStatus;
  updatedAt: Scalars['Timestamp']['output'];
  version: Scalars['Int']['output'];
};

export enum GoalStatus {
  Completed = 'COMPLETED',
  InProgress = 'IN_PROGRESS',
  NotStarted = 'NOT_STARTED'
}

export enum GoalUnit {
  Degree = 'DEGREE',
  Pain = 'PAIN',
  Percentage = 'PERCENTAGE',
  Seconds = 'SECONDS',
  Sessions = 'SESSIONS'
}

export type GoalWithHistory = {
  __typename?: 'GoalWithHistory';
  goal: Goal;
  lineageAchievements: Array<GoalAchievementWithSource>;
  ownAchievements: Array<GoalAchievement>;
};

export type Invoice = DataRow & {
  __typename?: 'Invoice';
  _id: Scalars['ObjectID']['output'];
  amount: Scalars['Float']['output'];
  appointment?: Maybe<Appointment>;
  center: Center;
  createdAt: Scalars['Timestamp']['output'];
  dueDate: Scalars['Timestamp']['output'];
  footer?: Maybe<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  items: Array<InvoiceItem>;
  notes?: Maybe<Scalars['String']['output']>;
  organization: Organization;
  patient: User;
  payment?: Maybe<PaymentField>;
  pdfUrl?: Maybe<Scalars['String']['output']>;
  seqNo?: Maybe<Scalars['String']['output']>;
  staff?: Maybe<User>;
  status: InvoiceStatus;
  subheading?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['Timestamp']['output'];
  version: Scalars['Int']['output'];
};

export type InvoiceFilter = {
  center?: InputMaybe<Array<Scalars['ObjectID']['input']>>;
  createdAt?: InputMaybe<Scalars['Timestamp']['input']>;
  organization?: InputMaybe<Scalars['ObjectID']['input']>;
  patient?: InputMaybe<Scalars['ObjectID']['input']>;
  staff?: InputMaybe<Scalars['ObjectID']['input']>;
  status?: InputMaybe<InvoiceStatus>;
};

export type InvoiceItem = {
  __typename?: 'InvoiceItem';
  amount: Scalars['Float']['output'];
  description?: Maybe<Scalars['String']['output']>;
  discount?: Maybe<Scalars['Float']['output']>;
  item: Service;
  price: Scalars['Float']['output'];
  quantity: Scalars['Int']['output'];
};

export enum InvoiceSortField {
  CreatedAt = 'CREATED_AT',
  SeqNo = 'SEQ_NO',
  UpdatedAt = 'UPDATED_AT'
}

export type InvoiceSortInput = {
  field: InvoiceSortField;
  order?: InputMaybe<SortOrder>;
};

export enum InvoiceStatus {
  Paid = 'PAID',
  Pending = 'PENDING'
}

export type ItemsInput = {
  associatedPatients?: InputMaybe<Array<InputMaybe<AssociatedPatientsInput>>>;
  item?: InputMaybe<Scalars['ObjectID']['input']>;
};

export enum JointMovement {
  AnkleDorsiflexion = 'ANKLE_DORSIFLEXION',
  AnkleEversion = 'ANKLE_EVERSION',
  AnkleExtensionFlexion = 'ANKLE_EXTENSION_FLEXION',
  AnkleInversion = 'ANKLE_INVERSION',
  AnklePlantarflexion = 'ANKLE_PLANTARFLEXION',
  AnklePlantarDorsiflexion = 'ANKLE_PLANTAR_DORSIFLEXION',
  AnkleStability = 'ANKLE_STABILITY',
  BackAbductionAdduction = 'BACK_ABDUCTION_ADDUCTION',
  BackExtensionFlexion = 'BACK_EXTENSION_FLEXION',
  BackRoation = 'BACK_ROATION',
  CervicalFlexion = 'CERVICAL_FLEXION',
  CervicalLateralFlexion = 'CERVICAL_LATERAL_FLEXION',
  CervicalRotation = 'CERVICAL_ROTATION',
  CervicalSpineExtension = 'CERVICAL_SPINE_EXTENSION',
  CervicalSpineFlexion = 'CERVICAL_SPINE_FLEXION',
  CervicalSpineLateralFlexion = 'CERVICAL_SPINE_LATERAL_FLEXION',
  CervicalStabilization = 'CERVICAL_STABILIZATION',
  CoreBackExtensionFlexion = 'CORE_BACK_EXTENSION_FLEXION',
  CoreFlexion = 'CORE_FLEXION',
  CoreRotation = 'CORE_ROTATION',
  CoreStability = 'CORE_STABILITY',
  CoreStabilization = 'CORE_STABILIZATION',
  ElbowExtension = 'ELBOW_EXTENSION',
  ElbowFlexion = 'ELBOW_FLEXION',
  ElbowFlexionExtension = 'ELBOW_FLEXION_EXTENSION',
  ElbowStabilization = 'ELBOW_STABILIZATION',
  FingerAbduction = 'FINGER_ABDUCTION',
  FingerExtension = 'FINGER_EXTENSION',
  FingerFlexion = 'FINGER_FLEXION',
  ForearmFlexibility = 'FOREARM_FLEXIBILITY',
  ForearmPronation = 'FOREARM_PRONATION',
  ForearmSupination = 'FOREARM_SUPINATION',
  Gluteals = 'GLUTEALS',
  GripStrength = 'GRIP_STRENGTH',
  Hands = 'HANDS',
  HipAbduction = 'HIP_ABDUCTION',
  HipAdduction = 'HIP_ADDUCTION',
  HipAdductionAbduction = 'HIP_ADDUCTION_ABDUCTION',
  HipExtension = 'HIP_EXTENSION',
  HipExtensionFlexion = 'HIP_EXTENSION_FLEXION',
  HipExternalRotation = 'HIP_EXTERNAL_ROTATION',
  HipFlexion = 'HIP_FLEXION',
  HipFlexionExtension = 'HIP_FLEXION_EXTENSION',
  HipInternalExternalRotation = 'HIP_INTERNAL_EXTERNAL_ROTATION',
  HipInternalRotation = 'HIP_INTERNAL_ROTATION',
  HipRotation = 'HIP_ROTATION',
  HipStabilization = 'HIP_STABILIZATION',
  KneeExtension = 'KNEE_EXTENSION',
  KneeExtensionFlexion = 'KNEE_EXTENSION_FLEXION',
  KneeFlexion = 'KNEE_FLEXION',
  KneeFlexionExtension = 'KNEE_FLEXION_EXTENSION',
  KneeStabilization = 'KNEE_STABILIZATION',
  NeckAbductionAdduction = 'NECK_ABDUCTION_ADDUCTION',
  NeckExtensionFlexion = 'NECK_EXTENSION_FLEXION',
  NeckRotation = 'NECK_ROTATION',
  PelvicStabilization = 'PELVIC_STABILIZATION',
  RibCageStabilization = 'RIB_CAGE_STABILIZATION',
  ScapularElevation = 'SCAPULAR_ELEVATION',
  ScapularProtraction = 'SCAPULAR_PROTRACTION',
  ScapularRetraction = 'SCAPULAR_RETRACTION',
  ScapulaDepression = 'SCAPULA_DEPRESSION',
  ScapulaElevation = 'SCAPULA_ELEVATION',
  ScapulaRetraction = 'SCAPULA_RETRACTION',
  ScapulaUpwardRotation = 'SCAPULA_UPWARD_ROTATION',
  ShoulderAbduction = 'SHOULDER_ABDUCTION',
  ShoulderAbductionAdduction = 'SHOULDER_ABDUCTION_ADDUCTION',
  ShoulderAdduction = 'SHOULDER_ADDUCTION',
  ShoulderElevation = 'SHOULDER_ELEVATION',
  ShoulderExtension = 'SHOULDER_EXTENSION',
  ShoulderExternal = 'SHOULDER_EXTERNAL',
  ShoulderExternalRotation = 'SHOULDER_EXTERNAL_ROTATION',
  ShoulderFlexion = 'SHOULDER_FLEXION',
  ShoulderFlexionExtension = 'SHOULDER_FLEXION_EXTENSION',
  ShoulderHorizontal = 'SHOULDER_HORIZONTAL',
  ShoulderHorizontalAbduction = 'SHOULDER_HORIZONTAL_ABDUCTION',
  ShoulderHorizontalAdduction = 'SHOULDER_HORIZONTAL_ADDUCTION',
  ShoulderInternal = 'SHOULDER_INTERNAL',
  ShoulderInternalRotation = 'SHOULDER_INTERNAL_ROTATION',
  ShoulderMobilization = 'SHOULDER_MOBILIZATION',
  ShoulderProtraction = 'SHOULDER_PROTRACTION',
  ShoulderRetraction = 'SHOULDER_RETRACTION',
  ShoulderRotation = 'SHOULDER_ROTATION',
  ShoulderStabilization = 'SHOULDER_STABILIZATION',
  SpineExtension = 'SPINE_EXTENSION',
  SpineFlexion = 'SPINE_FLEXION',
  SpineLateral = 'SPINE_LATERAL',
  SpineLateralFlexion = 'SPINE_LATERAL_FLEXION',
  SpineRotation = 'SPINE_ROTATION',
  SpineStabilization = 'SPINE_STABILIZATION',
  ThumbOpposition = 'THUMB_OPPOSITION',
  ToeAbduction = 'TOE_ABDUCTION',
  ToeExtension = 'TOE_EXTENSION',
  ToeFlexion = 'TOE_FLEXION',
  ToeStabilization = 'TOE_STABILIZATION',
  TrunkExtensionFlexion = 'TRUNK_EXTENSION_FLEXION',
  TrunkFlexion = 'TRUNK_FLEXION',
  TrunkRotation = 'TRUNK_ROTATION',
  WristExtension = 'WRIST_EXTENSION',
  WristFlexibility = 'WRIST_FLEXIBILITY',
  WristFlexion = 'WRIST_FLEXION',
  WristPronation = 'WRIST_PRONATION',
  WristRadial = 'WRIST_RADIAL',
  WristRadialDeviation = 'WRIST_RADIAL_DEVIATION',
  WristRotation = 'WRIST_ROTATION',
  WristStabilization = 'WRIST_STABILIZATION',
  WristSupination = 'WRIST_SUPINATION',
  WristUlnar = 'WRIST_ULNAR',
  WristUlnarDeviation = 'WRIST_ULNAR_DEVIATION'
}

export type Ledger = DataRow & {
  __typename?: 'Ledger';
  _id: Scalars['ObjectID']['output'];
  amount: Scalars['Float']['output'];
  balance: Scalars['Float']['output'];
  center: Center;
  createdAt: Scalars['Timestamp']['output'];
  isActive: Scalars['Boolean']['output'];
  organization: Organization;
  patient: User;
  source: Source;
  sourceType: Scalars['String']['output'];
  subSource?: Maybe<SubSource>;
  type: TransactionType;
  updatedAt: Scalars['Timestamp']['output'];
  version: Scalars['Int']['output'];
};

export type LoginInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type Match = {
  __typename?: 'Match';
  _id: Scalars['ObjectID']['output'];
  associatedOutputId: Array<Scalars['String']['output']>;
  associatedRunscribeId: Array<Scalars['String']['output']>;
  associatedValdId: Array<Scalars['String']['output']>;
  createdAt: Scalars['Timestamp']['output'];
  dateOfBirth?: Maybe<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  lastRecordedUtc?: Maybe<Scalars['Timestamp']['output']>;
  outputFullName?: Maybe<Scalars['String']['output']>;
  runscribeFullName?: Maybe<Scalars['String']['output']>;
  savedResponse?: Maybe<MatchResponse>;
  sex?: Maybe<Scalars['String']['output']>;
  stanceFullName?: Maybe<Scalars['String']['output']>;
  stanceId: Scalars['String']['output'];
  updatedAt: Scalars['Timestamp']['output'];
  valdFullName?: Maybe<Scalars['String']['output']>;
  valdSyncId?: Maybe<Scalars['String']['output']>;
  version: Scalars['Int']['output'];
};

export type MatchFilter = {
  outputFullName?: InputMaybe<Scalars['String']['input']>;
  runscribeFullName?: InputMaybe<Scalars['String']['input']>;
  stanceId?: InputMaybe<Scalars['String']['input']>;
  valdFullName?: InputMaybe<Scalars['String']['input']>;
};

export type MatchResponse = {
  __typename?: 'MatchResponse';
  data?: Maybe<Scalars['JSON']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  success?: Maybe<Scalars['String']['output']>;
};

export type MatchResponseInput = {
  data?: InputMaybe<Scalars['JSON']['input']>;
  message?: InputMaybe<Scalars['String']['input']>;
  success?: InputMaybe<Scalars['String']['input']>;
};

export type Media = {
  __typename?: 'Media';
  image: Scalars['String']['output'];
  media_hash: Scalars['String']['output'];
  previewGif: Scalars['String']['output'];
  startPositionImage: Scalars['String']['output'];
  video: Scalars['String']['output'];
};

/** Message Template for WhatsApp/SMS */
export type MessageTemplate = DataRow & {
  __typename?: 'MessageTemplate';
  _id: Scalars['ObjectID']['output'];
  content: Scalars['String']['output'];
  createdAt: Scalars['Timestamp']['output'];
  description?: Maybe<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  isDefault: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  organization: Organization;
  placeholders?: Maybe<Array<Scalars['String']['output']>>;
  seqNo: Scalars['String']['output'];
  type: MessageTemplateType;
  updatedAt: Scalars['Timestamp']['output'];
  version: Scalars['Int']['output'];
};

export type MessageTemplateFilter = {
  isDefault?: InputMaybe<Scalars['Boolean']['input']>;
  organization?: InputMaybe<Scalars['ObjectID']['input']>;
  type?: InputMaybe<MessageTemplateType>;
};

export enum MessageTemplateType {
  AdvanceReceipt = 'ADVANCE_RECEIPT',
  AppointmentConfirmation = 'APPOINTMENT_CONFIRMATION',
  Invoice = 'INVOICE'
}

export enum MuscleGroup {
  Adductors = 'ADDUCTORS',
  BicepsBrachii = 'BICEPS_BRACHII',
  Clavicle = 'CLAVICLE',
  Coracobrachialis = 'CORACOBRACHIALIS',
  Deltoid = 'DELTOID',
  Extensors = 'EXTENSORS',
  Flexors = 'FLEXORS',
  Gluteals = 'GLUTEALS',
  Hamstrings = 'HAMSTRINGS',
  Infraspinatus = 'INFRASPINATUS',
  LatissimusDorsi = 'LATISSIMUS_DORSI',
  LevatorScapula = 'LEVATOR_SCAPULA',
  PectoralisMajor = 'PECTORALIS_MAJOR',
  Quadriceps = 'QUADRICEPS',
  Rhomboid = 'RHOMBOID',
  Sartorius = 'SARTORIUS',
  SceratusAnterior = 'SCERATUS_ANTERIOR',
  Subclavius = 'SUBCLAVIUS',
  Subscapularis = 'SUBSCAPULARIS',
  Supraspinatus = 'SUPRASPINATUS',
  TeresMajor = 'TERES_MAJOR',
  TeresMinor = 'TERES_MINOR',
  Trapezius = 'TRAPEZIUS',
  Upperbody = 'UPPERBODY'
}

export type Mutation = {
  __typename?: 'Mutation';
  _empty?: Maybe<Scalars['String']['output']>;
  addDocumentRecord?: Maybe<Array<DocumentRecord>>;
  addObjectiveAssessmentRecord: ObjectiveAssessmentRecord;
  /** Add patient to additional organization */
  addPatientToOrganization: User;
  addPlanRecord: PlanRecord;
  addProvisionalRecord: ProvisionalRecord;
  addRPERecord: RpeRecord;
  addRecommendationRecord?: Maybe<Array<RecommendationRecord>>;
  /** Add records to a report */
  addRecords: Report;
  addSubjectiveRecord: SubjectiveRecord;
  /** Create or update permissions for a user in a specific scope */
  assignPermissions: UserPermissions;
  /** Create or update permissions for a user in a specific scope */
  assignRole: UserPermissions;
  /** clear consultant and center caches (temporary fix for center tagging revert) */
  clearConsultantCaches: Scalars['Boolean']['output'];
  createAdvance: Advance;
  createAgentReport: AgentReport;
  createApiKey: ApiKeyResponse;
  /** Create a new appointment */
  createAppointment: Appointment;
  /** Create appointment with package payment */
  createAppointmentWithPackage: Appointment;
  /** Create a new availability event. */
  createAvailabilityEvent: AvailabilityEvent;
  /** Create a new center */
  createCenter: Center;
  createConsultant: User;
  /** create a goal-set */
  createGoalSet: GoalSet;
  /** Create goalset from assessment data with selected goals */
  createGoalSetFromAssessment: GoalSet;
  /** create a goal */
  createGoals: Array<Goal>;
  createInvoice: Invoice;
  createLedger: Ledger;
  /** Create a new message template */
  createMessageTemplate: MessageTemplate;
  createOrder: Order;
  /** Create a new organization */
  createOrganization: Organization;
  /** Create a package */
  createPackage: Package;
  /** Create a new patient */
  createPatient: User;
  createPayment: Payment;
  createReceipt: Receipt;
  /** Create a new role */
  createRole: Role;
  /** Create a service */
  createService: Service;
  /** Create a new staff */
  createStaff: User;
  deleteAdvance: Advance;
  /** Delete an appointment */
  deleteAppointment: Appointment;
  /** Delete an availability event. */
  deleteAvailabilityEvent: Scalars['Boolean']['output'];
  /** Delete a center */
  deleteCenter: Center;
  /** Delete an event (soft delete or remove permanently). */
  deleteEvent: Scalars['Boolean']['output'];
  deleteInvoice: Invoice;
  /** Delete a match record */
  deleteMatch: Scalars['Boolean']['output'];
  /** Delete a message template */
  deleteMessageTemplate: MessageTemplate;
  /** Delete an organization */
  deleteOrganization: Organization;
  /** Delete a package */
  deletePackage: Package;
  /** Delete a role */
  deleteRole: Role;
  /** Delete a service */
  deleteService: Service;
  /** delete a user by id */
  deleteUser: Scalars['Boolean']['output'];
  /** Duplicate entire goalset with all goals */
  duplicateGoalSet: GoalSet;
  exportAdvancesAsPDF: ExportAdvancesAsPdfResponse;
  exportInvoicesAsPDF: ExportInvoicesAsPdfResponse;
  generateOnboardingLink: OnboardingLink;
  /** Get a list of available slots for a given host. */
  getAvailableSlots: Array<Maybe<TimeSlot>>;
  handleRazorpayWebhook: WebhookResponse;
  login: AuthenticatedSession;
  logout: Session;
  pong: Ping;
  refreshToken: Scalars['String']['output'];
  /** Reset a user's password (sends OTP and resets password) */
  resetPassword: Scalars['Boolean']['output'];
  /** Log out from all sessions except the current one */
  revokeAllOtherSessions: Scalars['Int']['output'];
  /** Log out from a specific session */
  revokeSession: Scalars['Boolean']['output'];
  sendAppointmentEmail: EmailResponse;
  sendConsultantMeetInvite: EmailResponse;
  /** Send OTP to the given Email and Returns a token as Response */
  sendEmailOTP: Scalars['String']['output'];
  /** Send OTP to the given Phone Number and Returns a token as Response */
  sendOTP: Scalars['String']['output'];
  triggerPaymentReconciliation: ReconciliationResponse;
  updateAdvance: Advance;
  updateAgentReport: AgentReport;
  /** Update an appointment */
  updateAppointment: Appointment;
  /** Update an availability event. */
  updateAvailabilityEvent: AvailabilityEvent;
  /** Update a center */
  updateCenter: Center;
  updateConsultant: User;
  /** update a goal-set */
  updateGoalSet: GoalSet;
  updateInvoice: Invoice;
  /** Update a message template */
  updateMessageTemplate: MessageTemplate;
  updateOrder: Order;
  /** Update an organization */
  updateOrganization: Organization;
  /** Update a package */
  updatePackage: Package;
  /** Update a user's password (requires current password) */
  updatePassword: Scalars['Boolean']['output'];
  /** Update an existing patient */
  updatePatient: User;
  /** Update records of a report */
  updateRecords: Report;
  /** Update a role */
  updateRole: Role;
  /** Update a service */
  updateService: Service;
  /** Update staff */
  updateStaff: User;
  uploadFile: File;
  /** Create or update a match record */
  upsertMatch: Match;
  verifyEmailOTP: AuthenticatedSession;
  verifyOTP: AuthenticatedSession;
  verifyPayment: WebhookResponse;
};


export type MutationAddDocumentRecordArgs = {
  input?: InputMaybe<Array<DocumentRecordInput>>;
};


export type MutationAddObjectiveAssessmentRecordArgs = {
  input: ObjectiveAssessmentInput;
};


export type MutationAddPatientToOrganizationArgs = {
  centerIds: Array<Scalars['ObjectID']['input']>;
  organizationId: Scalars['ObjectID']['input'];
  patientId: Scalars['ObjectID']['input'];
};


export type MutationAddPlanRecordArgs = {
  input: PlanRecordInput;
};


export type MutationAddProvisionalRecordArgs = {
  input: ProvisionalInput;
};


export type MutationAddRpeRecordArgs = {
  input: RpeInput;
};


export type MutationAddRecommendationRecordArgs = {
  input?: InputMaybe<Array<RecommendationRecordInput>>;
};


export type MutationAddRecordsArgs = {
  input: RecordsInput;
  reportId: Scalars['ObjectID']['input'];
};


export type MutationAddSubjectiveRecordArgs = {
  input: SubjectiveInput;
};


export type MutationAssignPermissionsArgs = {
  input: AssignPermissionInput;
};


export type MutationAssignRoleArgs = {
  input: AssignUserRoleInput;
};


export type MutationCreateAdvanceArgs = {
  input: CreateAdvanceInput;
};


export type MutationCreateAgentReportArgs = {
  input: CreateAgentReportInput;
};


export type MutationCreateApiKeyArgs = {
  input: CreateApiKeyInput;
};


export type MutationCreateAppointmentArgs = {
  input: CreateAppointmentInput;
};


export type MutationCreateAppointmentWithPackageArgs = {
  input: CreateAppointmentWithPackageInput;
};


export type MutationCreateAvailabilityEventArgs = {
  availability: CreateAvailabilityEventInput;
  event: CreateEventInput;
};


export type MutationCreateCenterArgs = {
  input: CreateCenterInput;
};


export type MutationCreateConsultantArgs = {
  input: CreateConsultantInput;
};


export type MutationCreateGoalSetArgs = {
  input: CreateGoalSetInput;
};


export type MutationCreateGoalSetFromAssessmentArgs = {
  input: CreateGoalSetFromAssessmentInput;
};


export type MutationCreateGoalsArgs = {
  goalSetId: Scalars['ObjectID']['input'];
  input: Array<CreateGoalsInput>;
};


export type MutationCreateInvoiceArgs = {
  input: CreateInvoiceInput;
};


export type MutationCreateLedgerArgs = {
  input: CreateLedgerInput;
};


export type MutationCreateMessageTemplateArgs = {
  input: CreateMessageTemplateInput;
};


export type MutationCreateOrderArgs = {
  input: CreateOrderInput;
};


export type MutationCreateOrganizationArgs = {
  input: CreateOrganizationInput;
};


export type MutationCreatePackageArgs = {
  input: CreatePackageInput;
};


export type MutationCreatePatientArgs = {
  input: CreatePatientInput;
};


export type MutationCreatePaymentArgs = {
  input: CreatePaymentInput;
};


export type MutationCreateReceiptArgs = {
  input: CreateReceiptInput;
};


export type MutationCreateRoleArgs = {
  input: CreateRoleInput;
};


export type MutationCreateServiceArgs = {
  input: CreateServiceInput;
};


export type MutationCreateStaffArgs = {
  input: CreateStaffInput;
};


export type MutationDeleteAdvanceArgs = {
  id: Scalars['ObjectID']['input'];
};


export type MutationDeleteAppointmentArgs = {
  id: Scalars['ObjectID']['input'];
};


export type MutationDeleteAvailabilityEventArgs = {
  id: Scalars['ObjectID']['input'];
};


export type MutationDeleteCenterArgs = {
  id: Scalars['ObjectID']['input'];
};


export type MutationDeleteEventArgs = {
  id: Scalars['ObjectID']['input'];
};


export type MutationDeleteInvoiceArgs = {
  id: Scalars['ObjectID']['input'];
};


export type MutationDeleteMatchArgs = {
  id: Scalars['ObjectID']['input'];
};


export type MutationDeleteMessageTemplateArgs = {
  id: Scalars['ObjectID']['input'];
};


export type MutationDeleteOrganizationArgs = {
  id: Scalars['ObjectID']['input'];
};


export type MutationDeletePackageArgs = {
  id: Scalars['ObjectID']['input'];
};


export type MutationDeleteRoleArgs = {
  id: Scalars['ObjectID']['input'];
};


export type MutationDeleteServiceArgs = {
  id: Scalars['ObjectID']['input'];
};


export type MutationDeleteUserArgs = {
  userId: Scalars['ObjectID']['input'];
};


export type MutationDuplicateGoalSetArgs = {
  input: DuplicateGoalSetInput;
};


export type MutationExportAdvancesAsPdfArgs = {
  advanceIds: Array<Scalars['ObjectID']['input']>;
};


export type MutationExportInvoicesAsPdfArgs = {
  invoiceIds: Array<Scalars['ObjectID']['input']>;
};


export type MutationGenerateOnboardingLinkArgs = {
  input: GenerateOnboardingLinkInput;
};


export type MutationGetAvailableSlotsArgs = {
  input: GetAvailableSlotsInput;
};


export type MutationHandleRazorpayWebhookArgs = {
  payload: Scalars['JSON']['input'];
  signature: Scalars['String']['input'];
};


export type MutationLoginArgs = {
  input: LoginInput;
};


export type MutationPongArgs = {
  input: PongInput;
};


export type MutationRefreshTokenArgs = {
  token: Scalars['String']['input'];
};


export type MutationResetPasswordArgs = {
  input: ResetPasswordInput;
};


export type MutationRevokeSessionArgs = {
  sessionId: Scalars['ObjectID']['input'];
};


export type MutationSendAppointmentEmailArgs = {
  input: SendAppointmentEmailInput;
};


export type MutationSendConsultantMeetInviteArgs = {
  input: SendConsultantMeetInviteInput;
};


export type MutationSendEmailOtpArgs = {
  email: Scalars['String']['input'];
};


export type MutationSendOtpArgs = {
  phone: Scalars['String']['input'];
};


export type MutationUpdateAdvanceArgs = {
  id: Scalars['ObjectID']['input'];
  input: UpdateAdvanceInput;
};


export type MutationUpdateAgentReportArgs = {
  appointmentId: Scalars['ObjectID']['input'];
  input: UpdateAgentReportInput;
};


export type MutationUpdateAppointmentArgs = {
  id: Scalars['ObjectID']['input'];
  input: UpdateAppointmentInput;
};


export type MutationUpdateAvailabilityEventArgs = {
  availability?: InputMaybe<UpdateAvailabilityEventInput>;
  event?: InputMaybe<UpdateEventInput>;
  id: Scalars['ObjectID']['input'];
};


export type MutationUpdateCenterArgs = {
  id: Scalars['ObjectID']['input'];
  input: UpdateCenterInput;
};


export type MutationUpdateConsultantArgs = {
  id: Scalars['ObjectID']['input'];
  input: UpdateConsultantInput;
};


export type MutationUpdateGoalSetArgs = {
  goalSetId: Scalars['ObjectID']['input'];
  input: UpdateGoalSetInput;
};


export type MutationUpdateInvoiceArgs = {
  id: Scalars['ObjectID']['input'];
  input: UpdateInvoiceInput;
};


export type MutationUpdateMessageTemplateArgs = {
  id: Scalars['ObjectID']['input'];
  input: UpdateMessageTemplateInput;
};


export type MutationUpdateOrderArgs = {
  orderId: Scalars['ObjectID']['input'];
};


export type MutationUpdateOrganizationArgs = {
  id: Scalars['ObjectID']['input'];
  input: UpdateOrganizationInput;
};


export type MutationUpdatePackageArgs = {
  id: Scalars['ObjectID']['input'];
  input: UpdatePackageInput;
};


export type MutationUpdatePasswordArgs = {
  input: UpdatePasswordInput;
};


export type MutationUpdatePatientArgs = {
  id: Scalars['ObjectID']['input'];
  input: UpdatePatient;
};


export type MutationUpdateRecordsArgs = {
  input: RecordsInput;
  reportId: Scalars['ObjectID']['input'];
};


export type MutationUpdateRoleArgs = {
  id: Scalars['ObjectID']['input'];
  input: UpdateRoleInput;
};


export type MutationUpdateServiceArgs = {
  id: Scalars['ObjectID']['input'];
  input: UpdateServiceInput;
};


export type MutationUpdateStaffArgs = {
  id: Scalars['ObjectID']['input'];
  input: UpdateStaffInput;
};


export type MutationUploadFileArgs = {
  input: FileUploadInput;
};


export type MutationUpsertMatchArgs = {
  input: UpsertMatchInput;
};


export type MutationVerifyEmailOtpArgs = {
  input: VerifyEmailOtpInput;
};


export type MutationVerifyOtpArgs = {
  input: VerifyOtpInput;
};


export type MutationVerifyPaymentArgs = {
  orderId: Scalars['ObjectID']['input'];
  razorpayPaymentId: Scalars['String']['input'];
};

export type ObjectiveAssessmentInput = {
  tests: Array<InputMaybe<ObjectiveTestInput>>;
};

export type ObjectiveAssessmentRecord = {
  __typename?: 'ObjectiveAssessmentRecord';
  tests: Array<Maybe<ObjectiveTest>>;
};

export type ObjectiveGoalInput = {
  goalCategory: Scalars['String']['input'];
  goalName: Scalars['String']['input'];
  priority: Scalars['Int']['input'];
  targetDate: Scalars['Timestamp']['input'];
  unitName: Scalars['String']['input'];
  value: Scalars['Float']['input'];
};

export type ObjectiveGoalRecord = {
  __typename?: 'ObjectiveGoalRecord';
  goalCategory?: Maybe<Scalars['String']['output']>;
  goalName?: Maybe<Scalars['String']['output']>;
  targetDate?: Maybe<Scalars['Timestamp']['output']>;
  unitName?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['Float']['output']>;
};

export type ObjectiveGoalRecordInput = {
  goalCategory?: InputMaybe<Scalars['String']['input']>;
  goalName?: InputMaybe<Scalars['String']['input']>;
  targetDate?: InputMaybe<Scalars['Timestamp']['input']>;
  unitName?: InputMaybe<Scalars['String']['input']>;
  value?: InputMaybe<Scalars['Float']['input']>;
};

export type ObjectiveTest = {
  __typename?: 'ObjectiveTest';
  comments?: Maybe<Scalars['String']['output']>;
  left?: Maybe<Scalars['String']['output']>;
  right?: Maybe<Scalars['String']['output']>;
  testName?: Maybe<Scalars['String']['output']>;
  unitName?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['String']['output']>;
};

export type ObjectiveTestInput = {
  comments?: InputMaybe<Scalars['String']['input']>;
  left?: InputMaybe<Scalars['Float']['input']>;
  right?: InputMaybe<Scalars['Float']['input']>;
  testName?: InputMaybe<Scalars['String']['input']>;
  unitName?: InputMaybe<Scalars['String']['input']>;
  value?: InputMaybe<Scalars['Float']['input']>;
};

export type OnboardingData = {
  __typename?: 'OnboardingData';
  centerId: Scalars['String']['output'];
  consultantId?: Maybe<Scalars['String']['output']>;
  isReturningUser: Scalars['Boolean']['output'];
  patient?: Maybe<User>;
  serviceId?: Maybe<Scalars['String']['output']>;
  slotEnd: Scalars['Timestamp']['output'];
  slotStart: Scalars['Timestamp']['output'];
};

export type OnboardingLink = {
  __typename?: 'OnboardingLink';
  expiresAt: Scalars['Timestamp']['output'];
  token: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type Order = DataRow & {
  __typename?: 'Order';
  _id: Scalars['ObjectID']['output'];
  advance?: Maybe<Advance>;
  amount: Scalars['Float']['output'];
  center: Center;
  createdAt: Scalars['Timestamp']['output'];
  currency: Scalars['String']['output'];
  invoice: Invoice;
  isActive: Scalars['Boolean']['output'];
  organization: Organization;
  package?: Maybe<Package>;
  patient: User;
  payment?: Maybe<Payment>;
  razorpayOrderId: Scalars['String']['output'];
  status: OrderStatus;
  type: PaymentType;
  updatedAt: Scalars['Timestamp']['output'];
  version: Scalars['Int']['output'];
};

export enum OrderStatus {
  Attempted = 'ATTEMPTED',
  Created = 'CREATED',
  Paid = 'PAID'
}

export type Organization = DataRow & {
  __typename?: 'Organization';
  _id: Scalars['ObjectID']['output'];
  address: Address;
  brandName: Scalars['String']['output'];
  companyName: Scalars['String']['output'];
  createdAt: Scalars['Timestamp']['output'];
  gstNumber: Scalars['String']['output'];
  isActive: Scalars['Boolean']['output'];
  logo?: Maybe<Scalars['URL']['output']>;
  panNumber: Scalars['String']['output'];
  socialLinks: Array<Scalars['URL']['output']>;
  updatedAt: Scalars['Timestamp']['output'];
  version: Scalars['Int']['output'];
};

export type OrganizationAvailabilityInput = {
  designation?: InputMaybe<Scalars['String']['input']>;
  endDate: Scalars['Timestamp']['input'];
  organizationId: Scalars['ObjectID']['input'];
  serviceDuration: Scalars['Int']['input'];
  startDate: Scalars['Timestamp']['input'];
};

export type Package = DataRow & {
  __typename?: 'Package';
  _id: Scalars['ObjectID']['output'];
  centers: Array<Center>;
  createdAt: Scalars['Timestamp']['output'];
  description?: Maybe<Scalars['String']['output']>;
  internalName: Scalars['String']['output'];
  isActive: Scalars['Boolean']['output'];
  isMultiUser: Scalars['Boolean']['output'];
  maxUsers?: Maybe<Scalars['Int']['output']>;
  name: Scalars['String']['output'];
  organization: Organization;
  price: Scalars['Float']['output'];
  seqNo: Scalars['String']['output'];
  services: Array<Service>;
  updatedAt: Scalars['Timestamp']['output'];
  validity: Scalars['Int']['output'];
  version: Scalars['Int']['output'];
};

export type PaginatedAdvances = {
  __typename?: 'PaginatedAdvances';
  data: Array<AdvanceWithBalance>;
  pagination: CursorPaginationInfo;
};

export type PaginatedEvents = {
  __typename?: 'PaginatedEvents';
  data: Array<Event>;
  pagination: EventPagination;
};

export type PaginatedInvoices = PaginatedResponse & {
  __typename?: 'PaginatedInvoices';
  data: Array<Invoice>;
  pagination: CursorPaginationInfo;
};

export type PaginatedResponse = {
  data: Array<DataRow>;
  pagination: CursorPaginationInfo;
};

export type PaginatedUsers = PaginatedResponse & {
  __typename?: 'PaginatedUsers';
  data: Array<User>;
  pagination: CursorPaginationInfo;
};

export enum PaginationDirection {
  Backward = 'BACKWARD',
  Forward = 'FORWARD'
}

export type Patient = {
  __typename?: 'Patient';
  additionalOrganizations?: Maybe<Array<AdditionalOrganization>>;
  bio?: Maybe<Scalars['String']['output']>;
  category?: Maybe<PatientCategory>;
  centers: Array<Center>;
  cohort?: Maybe<PatientCohort>;
  consultant?: Maybe<User>;
  dob?: Maybe<Scalars['Timestamp']['output']>;
  firstName: Scalars['String']['output'];
  gender: Gender;
  lastName?: Maybe<Scalars['String']['output']>;
  organization: Organization;
  patientType?: Maybe<PatientType>;
  profilePicture?: Maybe<Scalars['String']['output']>;
  referral?: Maybe<Referral>;
  status?: Maybe<PatientStatus>;
};

export enum PatientCategory {
  Advocate = 'ADVOCATE',
  Advertisement = 'Advertisement',
  Doctor = 'DOCTOR',
  Organic = 'ORGANIC',
  Referral = 'REFERRAL',
  Website = 'WEBSITE'
}

export enum PatientCohort {
  Acute = 'ACUTE',
  Anxious = 'ANXIOUS',
  Chronic = 'CHRONIC',
  FitnessEnthusiasts = 'FITNESS_ENTHUSIASTS',
  Performer = 'PERFORMER',
  Preventive = 'PREVENTIVE',
  ProfessionalAthlete = 'PROFESSIONAL_ATHLETE',
  Surgical = 'SURGICAL'
}

export type PatientExistsResult = {
  __typename?: 'PatientExistsResult';
  currentOrgId?: Maybe<Scalars['ObjectID']['output']>;
  exists: Scalars['Boolean']['output'];
  isInDifferentOrg: Scalars['Boolean']['output'];
  patient?: Maybe<User>;
};

export enum PatientStatus {
  Active = 'ACTIVE',
  Lead = 'LEAD',
  Package = 'PACKAGE'
}

export enum PatientType {
  HomePatient = 'Home_Patient',
  OpPatient = 'OP_Patient'
}

export type Payment = DataRow & {
  __typename?: 'Payment';
  _id: Scalars['ObjectID']['output'];
  amount: Scalars['Float']['output'];
  center: Center;
  createdAt: Scalars['Timestamp']['output'];
  isActive: Scalars['Boolean']['output'];
  mode: PaymentMode;
  notes?: Maybe<Scalars['String']['output']>;
  organization: Organization;
  patient: User;
  razorpayPaymentId?: Maybe<Scalars['String']['output']>;
  source: Source;
  status: PaymentStatus;
  subSource?: Maybe<SubSource>;
  transactionId?: Maybe<Scalars['String']['output']>;
  type: PaymentType;
  updatedAt: Scalars['Timestamp']['output'];
  version: Scalars['Int']['output'];
};

export type PaymentField = Payment | Payments;

export type PaymentFieldInput = {
  payment?: InputMaybe<CreatePaymentInput>;
  payments?: InputMaybe<Array<CreatePaymentInput>>;
};

export enum PaymentMode {
  BankTransfer = 'BANK_TRANSFER',
  Card = 'CARD',
  CardlessEmi = 'CARDLESS_EMI',
  Cash = 'CASH',
  Cod = 'COD',
  Emi = 'EMI',
  Nach = 'NACH',
  Netbanking = 'NETBANKING',
  Offline = 'OFFLINE',
  Package = 'PACKAGE',
  Paylater = 'PAYLATER',
  Paypal = 'PAYPAL',
  Razorpay = 'RAZORPAY',
  Upi = 'UPI',
  UpiQr = 'UPI_QR',
  Wallet = 'WALLET'
}

export enum PaymentStatus {
  Authorized = 'AUTHORIZED',
  Captured = 'CAPTURED',
  Failed = 'FAILED'
}

export enum PaymentType {
  Advance = 'ADVANCE',
  Invoice = 'INVOICE'
}

export type Payments = {
  __typename?: 'Payments';
  payments: Array<Payment>;
};

/** Permission definition associating actions with a resource */
export type Permission = {
  __typename?: 'Permission';
  action: Array<Action>;
  resource: Resource;
};

export type PermissionInput = {
  action: Array<Action>;
  resource: Resource;
};

export type Ping = {
  __typename?: 'Ping';
  environment: Scalars['String']['output'];
  message: Scalars['String']['output'];
  timestamp: Scalars['Int']['output'];
  uptime: Scalars['Float']['output'];
};

export type Plan = {
  __typename?: 'Plan';
  comments?: Maybe<Scalars['String']['output']>;
  duration?: Maybe<PlanDuration>;
  exercise: Scalars['String']['output'];
  set?: Maybe<Array<Maybe<ExerciseSets>>>;
};

export type PlanDuration = {
  __typename?: 'PlanDuration';
  unit?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['Int']['output']>;
};

export type PlanDurationInput = {
  unit?: InputMaybe<Scalars['String']['input']>;
  value?: InputMaybe<Scalars['Int']['input']>;
};

export type PlanInput = {
  comments?: InputMaybe<Scalars['String']['input']>;
  duration?: InputMaybe<PlanDurationInput>;
  exercise: Scalars['String']['input'];
  set?: InputMaybe<Array<InputMaybe<ExerciseSetsInput>>>;
};

export type PlanRecord = {
  __typename?: 'PlanRecord';
  advice?: Maybe<Scalars['String']['output']>;
  plans?: Maybe<Array<Maybe<Plan>>>;
};

export type PlanRecordInput = {
  advice?: InputMaybe<Scalars['String']['input']>;
  plans?: InputMaybe<Array<InputMaybe<PlanInput>>>;
};

export type PongInput = {
  message: Scalars['String']['input'];
};

export type ProfileData = Consultant | Patient | Staff;

export type ProvisionalInput = {
  diagnosis?: InputMaybe<Scalars['String']['input']>;
};

export type ProvisionalRecord = {
  __typename?: 'ProvisionalRecord';
  diagnosis?: Maybe<Scalars['String']['output']>;
};

export type Query = {
  __typename?: 'Query';
  _empty?: Maybe<Scalars['String']['output']>;
  /** Get all active sessions for the current user */
  activeSessions: Array<Session>;
  advance: Advance;
  advances: PaginatedAdvances;
  agentReport: AgentReport;
  /** Get all matches with optional filtering */
  allMatches: Array<Match>;
  /** Get appointment by id */
  appointment: Appointment;
  /** Get appointments by patient id */
  appointments: Array<Appointment>;
  /** Get centre by id */
  center: Center;
  /** Get centres */
  centers: Array<Center>;
  checkPatientByPhone: PatientExistsResult;
  /** get current session */
  currentSession: AuthenticatedSession;
  /** Get a specific event by ID. */
  event: Event;
  /** Get a list of events dynamically using filters. */
  events: PaginatedEvents;
  /** Get an exercise using its id */
  exercise: Exercise;
  /** Get list of all exercises */
  exercises: Array<Exercise>;
  /** Get a file by id */
  file: File;
  /** Get all files */
  files: Array<File>;
  generateInvoicePDFOnDemand: Scalars['String']['output'];
  /** Get center-level availability for consultants */
  getCenterAvailability: Array<ConsultantAvailability>;
  getFilteredConsultants: Array<User>;
  /** Get organization-level availability for online consultants */
  getOrganizationAvailability: Array<ConsultantAvailability>;
  /** get a goal */
  goal: Goal;
  /** Get all goals in a goal lineage (parent chain) */
  goalLineage: Array<Goal>;
  /** get a goal-set */
  goalSet: GoalSet;
  /** get all goal-sets for a patient */
  goalSets: Array<GoalSet>;
  /** Get goal with full achievement history (includes parent/child goals) */
  goalWithHistory: GoalWithHistory;
  invoice: Invoice;
  invoices: PaginatedInvoices;
  /** Get a specific match by ID */
  match: Match;
  /** Get matches by stance ID or by ID */
  matches: Array<Match>;
  /** get current user */
  me: User;
  /** Get message template by id */
  messageTemplate: MessageTemplate;
  /** Get message template by type (returns default or organization-specific) */
  messageTemplateByType?: Maybe<MessageTemplate>;
  /** Get all message templates */
  messageTemplates: Array<MessageTemplate>;
  /** Get organization by id */
  organization: Organization;
  /** Get list of packages */
  packages: Array<Package>;
  patientAppointmentCount: Scalars['Int']['output'];
  patientByPhone?: Maybe<User>;
  patientExists: Scalars['Boolean']['output'];
  /** Get all permissions of the logged in user */
  permissions: Array<Maybe<UserPermissions>>;
  ping: Ping;
  /** Get a report */
  report: Report;
  /** Get list of reports */
  reports: Array<Report>;
  /** Get a role by id */
  role: Role;
  /** Get all roles */
  roles: Array<Role>;
  /** Search user-timeline reports by service/treatment name, consultant name, or exercise name under plans */
  searchReports: Array<Report>;
  /** Get a service */
  service: Service;
  /** Get a single package */
  servicePackage: Package;
  /** Get list of services */
  services: Array<Service>;
  stats: Stats;
  /** get user by id */
  user: User;
  /** Get permissions for a user in a specific scope */
  userPermissions: Array<Maybe<UserPermissions>>;
  /** get all users */
  users: PaginatedUsers;
  validateOnboardingToken: OnboardingData;
};


export type QueryAdvanceArgs = {
  id: Scalars['ObjectID']['input'];
};


export type QueryAdvancesArgs = {
  filter: AdvanceFilter;
  pagination?: InputMaybe<CursorPaginationInput>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<AdvanceSortInput>;
};


export type QueryAgentReportArgs = {
  id: Scalars['ObjectID']['input'];
};


export type QueryAllMatchesArgs = {
  filter?: InputMaybe<MatchFilter>;
};


export type QueryAppointmentArgs = {
  id: Scalars['ID']['input'];
};


export type QueryAppointmentsArgs = {
  filter: AppointmentFilter;
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryCenterArgs = {
  id: Scalars['ObjectID']['input'];
};


export type QueryCheckPatientByPhoneArgs = {
  organizationId: Scalars['ObjectID']['input'];
  phone: Scalars['String']['input'];
};


export type QueryEventArgs = {
  id: Scalars['ObjectID']['input'];
};


export type QueryEventsArgs = {
  filter: EventFilter;
  pagination?: InputMaybe<CursorPaginationInput>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<EventSortInput>;
};


export type QueryExerciseArgs = {
  id: Scalars['ObjectID']['input'];
};


export type QueryExercisesArgs = {
  filter?: InputMaybe<ExerciseFilter>;
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryFileArgs = {
  fileId: Scalars['ObjectID']['input'];
};


export type QueryFilesArgs = {
  filter: FileFilterInput;
};


export type QueryGenerateInvoicePdfOnDemandArgs = {
  invoiceId: Scalars['ObjectID']['input'];
};


export type QueryGetCenterAvailabilityArgs = {
  input: CenterAvailabilityInput;
};


export type QueryGetFilteredConsultantsArgs = {
  filter: ConsultantFilterInput;
};


export type QueryGetOrganizationAvailabilityArgs = {
  input: OrganizationAvailabilityInput;
};


export type QueryGoalArgs = {
  goalSetId: Scalars['ObjectID']['input'];
  id: Scalars['ObjectID']['input'];
};


export type QueryGoalLineageArgs = {
  goalId: Scalars['ObjectID']['input'];
};


export type QueryGoalSetArgs = {
  id: Scalars['ObjectID']['input'];
};


export type QueryGoalSetsArgs = {
  patientId: Scalars['ObjectID']['input'];
};


export type QueryGoalWithHistoryArgs = {
  goalId: Scalars['ObjectID']['input'];
};


export type QueryInvoiceArgs = {
  id: Scalars['ObjectID']['input'];
};


export type QueryInvoicesArgs = {
  filter: InvoiceFilter;
  pagination?: InputMaybe<CursorPaginationInput>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<InvoiceSortInput>;
};


export type QueryMatchArgs = {
  id: Scalars['ObjectID']['input'];
};


export type QueryMatchesArgs = {
  id?: InputMaybe<Scalars['ObjectID']['input']>;
  stanceId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryMessageTemplateArgs = {
  id: Scalars['ObjectID']['input'];
};


export type QueryMessageTemplateByTypeArgs = {
  type: MessageTemplateType;
};


export type QueryMessageTemplatesArgs = {
  filter?: InputMaybe<MessageTemplateFilter>;
};


export type QueryOrganizationArgs = {
  id: Scalars['ObjectID']['input'];
};


export type QueryPackagesArgs = {
  centerId?: InputMaybe<Array<Scalars['ObjectID']['input']>>;
};


export type QueryPatientAppointmentCountArgs = {
  patientId: Scalars['ObjectID']['input'];
};


export type QueryPatientByPhoneArgs = {
  phone: Scalars['String']['input'];
};


export type QueryPatientExistsArgs = {
  phone: Scalars['String']['input'];
};


export type QueryReportArgs = {
  id: Scalars['ObjectID']['input'];
};


export type QueryReportsArgs = {
  patientId: Scalars['ObjectID']['input'];
};


export type QueryRoleArgs = {
  id: Scalars['ObjectID']['input'];
};


export type QuerySearchReportsArgs = {
  patientId: Scalars['ObjectID']['input'];
  query: Scalars['String']['input'];
};


export type QueryServiceArgs = {
  id: Scalars['ObjectID']['input'];
};


export type QueryServicePackageArgs = {
  id: Scalars['ObjectID']['input'];
};


export type QueryServicesArgs = {
  advanceId?: InputMaybe<Scalars['ObjectID']['input']>;
  centerId?: InputMaybe<Array<Scalars['ObjectID']['input']>>;
};


export type QueryStatsArgs = {
  input: GetStatsInput;
};


export type QueryUserArgs = {
  userId: Scalars['ObjectID']['input'];
};


export type QueryUserPermissionsArgs = {
  scopeId?: InputMaybe<Scalars['ObjectID']['input']>;
  userId: Scalars['ObjectID']['input'];
};


export type QueryUsersArgs = {
  centerId: Array<Scalars['ObjectID']['input']>;
  filter?: InputMaybe<UserFilterInput>;
  pagination?: InputMaybe<CursorPaginationInput>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<UserSortInput>;
  userType?: InputMaybe<UserType>;
};


export type QueryValidateOnboardingTokenArgs = {
  token: Scalars['String']['input'];
};

export type RpeInput = {
  value?: InputMaybe<Scalars['Int']['input']>;
};

export type RpeRecord = {
  __typename?: 'RPERecord';
  value?: Maybe<Scalars['Int']['output']>;
};

export type Receipt = DataRow & {
  __typename?: 'Receipt';
  _id: Scalars['ObjectID']['output'];
  center: Center;
  createdAt: Scalars['Timestamp']['output'];
  isActive: Scalars['Boolean']['output'];
  patient: User;
  payment?: Maybe<Payment>;
  seqNo: Scalars['String']['output'];
  updatedAt: Scalars['Timestamp']['output'];
  version: Scalars['Int']['output'];
};

export type RecommendationRecord = {
  __typename?: 'RecommendationRecord';
  frequency: SessionFrequency;
  plans?: Maybe<Scalars['String']['output']>;
  sessionCount?: Maybe<Scalars['Int']['output']>;
  sessionType: SessionType;
};

export type RecommendationRecordInput = {
  frequency?: InputMaybe<SessionFrequency>;
  plans?: InputMaybe<Scalars['String']['input']>;
  sessionCount?: InputMaybe<Scalars['Int']['input']>;
  sessionType?: InputMaybe<SessionType>;
};

export type ReconciliationResponse = {
  __typename?: 'ReconciliationResponse';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export enum RecordType {
  BodyChart = 'BODY_CHART',
  ClinicalDetails = 'CLINICAL_DETAILS',
  Document = 'DOCUMENT',
  Goals = 'GOALS',
  ObjectiveAssessment = 'OBJECTIVE_ASSESSMENT',
  ObjectiveGoals = 'OBJECTIVE_GOALS',
  PatientAdvice = 'PATIENT_ADVICE',
  Plan = 'PLAN',
  ProvisionalDiagnosis = 'PROVISIONAL_DIAGNOSIS',
  Recommendation = 'RECOMMENDATION',
  SubjectiveAssessment = 'SUBJECTIVE_ASSESSMENT'
}

export type Records = {
  __typename?: 'Records';
  advice?: Maybe<AdviceRecord>;
  clinicalDetails?: Maybe<ClinicalRecord>;
  doctorsNote?: Maybe<Scalars['String']['output']>;
  document?: Maybe<Array<Maybe<DocumentRecord>>>;
  objectiveAssessment?: Maybe<ObjectiveAssessmentRecord>;
  objectiveGoals?: Maybe<Array<Maybe<ObjectiveGoalRecord>>>;
  plan?: Maybe<PlanRecord>;
  provisionalDiagnosis?: Maybe<ProvisionalRecord>;
  recommendations?: Maybe<Array<Maybe<RecommendationRecord>>>;
  rpe?: Maybe<RpeRecord>;
  subjectiveAssessment?: Maybe<SubjectiveRecord>;
  subjectiveGoals?: Maybe<Array<Maybe<SubjectiveGoalRecord>>>;
};

export type RecordsInput = {
  advice?: InputMaybe<AdviceRecordInput>;
  clinicalDetails?: InputMaybe<ClinicalRecordInput>;
  doctorsNote?: InputMaybe<Scalars['String']['input']>;
  document?: InputMaybe<Array<InputMaybe<DocumentRecordInput>>>;
  isAccepted?: InputMaybe<Scalars['Boolean']['input']>;
  objectiveAssessment?: InputMaybe<ObjectiveAssessmentInput>;
  objectiveGoals?: InputMaybe<Array<InputMaybe<ObjectiveGoalRecordInput>>>;
  plan?: InputMaybe<PlanRecordInput>;
  provisionalDiagnosis?: InputMaybe<ProvisionalInput>;
  recommendations?: InputMaybe<Array<InputMaybe<RecommendationRecordInput>>>;
  rpe?: InputMaybe<RpeInput>;
  subjectiveAssessment?: InputMaybe<SubjectiveInput>;
  subjectiveGoals?: InputMaybe<Array<InputMaybe<SubjectiveGoalRecordInput>>>;
};

export type Recurrence = {
  __typename?: 'Recurrence';
  endDate: Scalars['Timestamp']['output'];
  rrule: Scalars['String']['output'];
  startDate: Scalars['Timestamp']['output'];
};

/** Recurrence rule for scheduling events. */
export type RecurrenceInput = {
  endDate: Scalars['Timestamp']['input'];
  rrule: Scalars['String']['input'];
  startDate: Scalars['Timestamp']['input'];
};

export type Referral = {
  __typename?: 'Referral';
  name?: Maybe<Scalars['String']['output']>;
  type: ReferralType;
  user?: Maybe<Scalars['ObjectID']['output']>;
};

export type ReferralInput = {
  name?: InputMaybe<Scalars['String']['input']>;
  type: ReferralType;
  user?: InputMaybe<Scalars['ObjectID']['input']>;
};

export enum ReferralType {
  Consultant = 'CONSULTANT',
  Doctor = 'DOCTOR',
  Other = 'OTHER',
  Patient = 'PATIENT'
}

export type Report = DataRow & {
  __typename?: 'Report';
  _id: Scalars['ObjectID']['output'];
  agentReport?: Maybe<AgentReport>;
  appointment?: Maybe<Appointment>;
  createdAt: Scalars['Timestamp']['output'];
  isActive: Scalars['Boolean']['output'];
  isFirstAssessment: Scalars['Boolean']['output'];
  patient: User;
  pdf?: Maybe<Scalars['String']['output']>;
  records: Records;
  seqNo: Scalars['String']['output'];
  updatedAt: Scalars['Timestamp']['output'];
  version: Scalars['Int']['output'];
};

export type ResetPasswordInput = {
  newPassword: Scalars['String']['input'];
  phone: Scalars['String']['input'];
  resetCode: Scalars['String']['input'];
  token: Scalars['String']['input'];
};

export enum ResistanceLevel {
  Heavy = 'HEAVY',
  Light = 'LIGHT',
  Moderate = 'MODERATE'
}

export enum Resource {
  Appointment = 'APPOINTMENT',
  Dashboard = 'DASHBOARD',
  Inventory = 'INVENTORY',
  Patient = 'PATIENT',
  Payment = 'PAYMENT',
  Prescription = 'PRESCRIPTION',
  Report = 'REPORT',
  Settings = 'SETTINGS',
  Staff = 'STAFF'
}

/** Role based access control types */
export type Role = DataRow & {
  __typename?: 'Role';
  _id: Scalars['ObjectID']['output'];
  createdAt: Scalars['Timestamp']['output'];
  description?: Maybe<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  isSystemRole: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  permissions: Array<Permission>;
  scope: Scope;
  scopeType: ScopeType;
  updatedAt: Scalars['Timestamp']['output'];
  version: Scalars['Int']['output'];
};

export type Scope = Center | Organization;

export enum ScopeType {
  Center = 'Center',
  Organization = 'Organization'
}

export type SendAppointmentEmailInput = {
  amount: Scalars['Float']['input'];
  centerAddress: Scalars['String']['input'];
  centerLocation?: InputMaybe<Scalars['String']['input']>;
  centerName: Scalars['String']['input'];
  centerPhone: Scalars['String']['input'];
  date: Scalars['String']['input'];
  email: Scalars['String']['input'];
  endDateTime?: InputMaybe<Scalars['String']['input']>;
  isOnlineAssessment?: InputMaybe<Scalars['Boolean']['input']>;
  meetingLink?: InputMaybe<Scalars['String']['input']>;
  patientName: Scalars['String']['input'];
  startDateTime?: InputMaybe<Scalars['String']['input']>;
  time: Scalars['String']['input'];
  treatmentName: Scalars['String']['input'];
};

export type SendConsultantMeetInviteInput = {
  consultantEmail: Scalars['String']['input'];
  consultantName: Scalars['String']['input'];
  date: Scalars['String']['input'];
  endDateTime: Scalars['String']['input'];
  meetingLink?: InputMaybe<Scalars['String']['input']>;
  patientName: Scalars['String']['input'];
  startDateTime: Scalars['String']['input'];
  time: Scalars['String']['input'];
  treatmentName: Scalars['String']['input'];
};

export enum SensorBodyTag {
  Biceps = 'BICEPS',
  Central = 'CENTRAL',
  Forearm = 'FOREARM',
  Shin = 'SHIN',
  Thigh = 'THIGH'
}

export enum SensorBodyType {
  LowerPartSensors = 'LOWER_PART_SENSORS',
  UpperPartSensors = 'UPPER_PART_SENSORS'
}

export type Service = DataRow & {
  __typename?: 'Service';
  _id: Scalars['ObjectID']['output'];
  allowOnlineBooking: Scalars['Boolean']['output'];
  allowOnlineDelivery: Scalars['Boolean']['output'];
  centers: Array<Center>;
  createdAt: Scalars['Timestamp']['output'];
  description?: Maybe<Scalars['String']['output']>;
  duration: Scalars['Int']['output'];
  internalName: Scalars['String']['output'];
  isActive: Scalars['Boolean']['output'];
  isNewUserService: Scalars['Boolean']['output'];
  isPrePaid: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  organization: Organization;
  price: Scalars['Float']['output'];
  seqNo: Scalars['String']['output'];
  updatedAt: Scalars['Timestamp']['output'];
  version: Scalars['Int']['output'];
};

export type Session = DataRow & {
  __typename?: 'Session';
  _id: Scalars['ObjectID']['output'];
  createdAt: Scalars['Timestamp']['output'];
  isActive: Scalars['Boolean']['output'];
  isCurrentSession: Scalars['Boolean']['output'];
  lastActive: Scalars['Timestamp']['output'];
  refreshToken: Scalars['String']['output'];
  updatedAt: Scalars['Timestamp']['output'];
  user: User;
  version: Scalars['Int']['output'];
};

export enum SessionFrequency {
  Daily = 'DAILY',
  Monthly = 'MONTHLY',
  OneTime = 'ONE_TIME',
  Weekly = 'WEEKLY'
}

export enum SessionType {
  GroupFormats = 'GROUP_FORMATS',
  HomeExercisePlan = 'HOME_EXERCISE_PLAN',
  InCenterPhysiotherapy = 'IN_CENTER_PHYSIOTHERAPY',
  InCenterSnc = 'IN_CENTER_SNC',
  OnlineOneOnOnePhysiotherapy = 'ONLINE_ONE_ON_ONE_PHYSIOTHERAPY',
  OnlineOneOnOneSnc = 'ONLINE_ONE_ON_ONE_SNC',
  Physiotherapy = 'PHYSIOTHERAPY',
  SportsMassageTherapy = 'SPORTS_MASSAGE_THERAPY',
  StrengthAndConditioning = 'STRENGTH_AND_CONDITIONING'
}

export type SignUpInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  userType: UserType;
};

export type SortInput = {
  field: Scalars['String']['input'];
  order?: InputMaybe<SortOrder>;
};

export enum SortOrder {
  Asc = 'ASC',
  Desc = 'DESC'
}

export type Source = Advance | Invoice | Payment;

export enum Specialization {
  Acute = 'Acute',
  Athlete = 'Athlete',
  Chronic = 'Chronic',
  Fitness = 'Fitness',
  Physiotherapy = 'Physiotherapy',
  Surgical = 'Surgical'
}

export enum StabilityFactor {
  Moderate = 'MODERATE',
  Stable = 'STABLE',
  Unstable = 'UNSTABLE',
  VeryStable = 'VERY_STABLE',
  VeryUnstable = 'VERY_UNSTABLE'
}

/** Staff type definition */
export type Staff = {
  __typename?: 'Staff';
  centers: Array<Center>;
  firstName: Scalars['String']['output'];
  lastName?: Maybe<Scalars['String']['output']>;
  organization: Organization;
  profilePicture?: Maybe<Scalars['String']['output']>;
};

export type Stats = {
  __typename?: 'Stats';
  newPatients: Scalars['Int']['output'];
  overduePayments: Scalars['Float']['output'];
  overduePaymentsCount: Scalars['Int']['output'];
  pendingPayments: Scalars['Float']['output'];
  pendingPaymentsCount: Scalars['Int']['output'];
  revenue: Scalars['Float']['output'];
  totalPatients: Scalars['Int']['output'];
};

export type SubSource = Package;

export type SubjectiveGoalInput = {
  goal: Scalars['String']['input'];
  priority: Scalars['Int']['input'];
  targetDate: Scalars['Timestamp']['input'];
};

export type SubjectiveGoalRecord = {
  __typename?: 'SubjectiveGoalRecord';
  goal?: Maybe<Scalars['String']['output']>;
  targetDate?: Maybe<Scalars['Timestamp']['output']>;
};

export type SubjectiveGoalRecordInput = {
  goal?: InputMaybe<Scalars['String']['input']>;
  targetDate?: InputMaybe<Scalars['Timestamp']['input']>;
};

export type SubjectiveInput = {
  assessment?: InputMaybe<Scalars['String']['input']>;
};

export type SubjectiveRecord = {
  __typename?: 'SubjectiveRecord';
  assessment?: Maybe<Scalars['String']['output']>;
};

export type TimeSlot = {
  __typename?: 'TimeSlot';
  endTime: Scalars['Time']['output'];
  startTime: Scalars['Time']['output'];
};

export enum TransactionType {
  Credit = 'CREDIT',
  Debit = 'DEBIT'
}

export type UpdateAdvanceInput = {
  /** Items that need to be updated */
  items?: InputMaybe<Array<ItemsInput>>;
};

export type UpdateAgentReportInput = {
  assessment?: InputMaybe<AgentAssessmentInput>;
  firstAssessment?: InputMaybe<AgentFirstAssessmentInput>;
  physio?: InputMaybe<Array<InputMaybe<AgentPhysioInput>>>;
  snc?: InputMaybe<Array<InputMaybe<AgentSncInput>>>;
};

export type UpdateAppointmentEventInput = {
  endTime?: InputMaybe<Scalars['Timestamp']['input']>;
  startTime?: InputMaybe<Scalars['Timestamp']['input']>;
};

export type UpdateAppointmentInput = {
  cancellationNote?: InputMaybe<Scalars['String']['input']>;
  cancellationReason?: InputMaybe<CancellationReason>;
  cancelledBy?: InputMaybe<Scalars['ObjectID']['input']>;
  consultant?: InputMaybe<Scalars['ObjectID']['input']>;
  event?: InputMaybe<UpdateAppointmentEventInput>;
  eventAttendees?: InputMaybe<Array<InputMaybe<Scalars['ObjectID']['input']>>>;
  medium?: InputMaybe<AppointmentMedium>;
  meetingLink?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  rescheduledFrom?: InputMaybe<Array<Scalars['ObjectID']['input']>>;
  rescheduledTo?: InputMaybe<Scalars['ObjectID']['input']>;
  status?: InputMaybe<AppointmentStatus>;
  treatment?: InputMaybe<Scalars['ObjectID']['input']>;
  visitType?: InputMaybe<AppointmentVisitType>;
};

export type UpdateAvailabilityEventInput = {
  availabilityStatus?: InputMaybe<AvailabilityStatus>;
  endTime?: InputMaybe<Scalars['Time']['input']>;
  isAvailable?: InputMaybe<Scalars['Boolean']['input']>;
  startTime?: InputMaybe<Scalars['Time']['input']>;
};

export type UpdateCenterInput = {
  address?: InputMaybe<AddressInput>;
  isOnline?: InputMaybe<Scalars['Boolean']['input']>;
  location?: InputMaybe<Scalars['URL']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateConsultantInput = {
  allowOnlineBooking?: InputMaybe<Scalars['Boolean']['input']>;
  allowOnlineDelivery?: InputMaybe<DeliveryMode>;
  bio?: InputMaybe<Scalars['String']['input']>;
  centers?: InputMaybe<Array<Scalars['ObjectID']['input']>>;
  designation?: InputMaybe<Designation>;
  dob?: InputMaybe<Scalars['Timestamp']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  gender?: InputMaybe<Gender>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  location?: InputMaybe<AddressInput>;
  phone?: InputMaybe<Scalars['String']['input']>;
  profilePicture?: InputMaybe<Scalars['String']['input']>;
  services?: InputMaybe<Array<Scalars['ObjectID']['input']>>;
  specialization?: InputMaybe<Specialization>;
};

export type UpdateEventInput = {
  /** Description of the event. */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Recurrence rule for the event. */
  recurrenceRule?: InputMaybe<RecurrenceInput>;
  /** Title of the event. */
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateGoalInput = {
  achievements?: InputMaybe<Array<CreateGoalAchievementInput>>;
  category?: InputMaybe<GoalCategory>;
  customExerciseName?: InputMaybe<Scalars['String']['input']>;
  exercise?: InputMaybe<Scalars['ObjectID']['input']>;
  goalId?: InputMaybe<Scalars['ObjectID']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  isReverseProgress?: InputMaybe<Scalars['Boolean']['input']>;
  maxTarget?: InputMaybe<Scalars['Float']['input']>;
  minTarget?: InputMaybe<Scalars['Float']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  priority?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<GoalStatus>;
  targetDate?: InputMaybe<Scalars['Timestamp']['input']>;
  unit?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateGoalSetInput = {
  goals?: InputMaybe<Array<UpdateGoalInput>>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<GoalStatus>;
};

export type UpdateInvoiceInput = {
  appointment?: InputMaybe<Scalars['ObjectID']['input']>;
  items?: InputMaybe<Array<CreateInvoiceItemInput>>;
  payment?: InputMaybe<PaymentFieldInput>;
};

/** Input for updating a message template */
export type UpdateMessageTemplateInput = {
  content?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  isDefault?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  placeholders?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type UpdateOrganizationInput = {
  address?: InputMaybe<AddressInput>;
  brandName?: InputMaybe<Scalars['String']['input']>;
  companyName?: InputMaybe<Scalars['String']['input']>;
  gstNumber?: InputMaybe<Scalars['String']['input']>;
  logo?: InputMaybe<Scalars['URL']['input']>;
  panNumber?: InputMaybe<Scalars['String']['input']>;
  socialLinks?: InputMaybe<Array<InputMaybe<Scalars['URL']['input']>>>;
};

export type UpdatePackageInput = {
  centers?: InputMaybe<Array<InputMaybe<Scalars['ObjectID']['input']>>>;
  description?: InputMaybe<Scalars['String']['input']>;
  internalName?: InputMaybe<Scalars['String']['input']>;
  isMultiUser?: InputMaybe<Scalars['Boolean']['input']>;
  maxUsers?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  organization?: InputMaybe<Scalars['ObjectID']['input']>;
  price?: InputMaybe<Scalars['Float']['input']>;
  services?: InputMaybe<Array<InputMaybe<Scalars['ObjectID']['input']>>>;
  validity?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdatePasswordInput = {
  currentPassword: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
  userId: Scalars['ObjectID']['input'];
};

export type UpdatePatient = {
  bio?: InputMaybe<Scalars['String']['input']>;
  category?: InputMaybe<PatientCategory>;
  centers?: InputMaybe<Array<Scalars['ObjectID']['input']>>;
  cohort?: InputMaybe<PatientCohort>;
  consultant?: InputMaybe<Scalars['ObjectID']['input']>;
  dob?: InputMaybe<Scalars['Timestamp']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  gender?: InputMaybe<Gender>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  organization?: InputMaybe<Scalars['ObjectID']['input']>;
  patientType?: InputMaybe<PatientType>;
  profilePicture?: InputMaybe<Scalars['String']['input']>;
  referral?: InputMaybe<ReferralInput>;
  status?: InputMaybe<PatientStatus>;
};

export type UpdateRoleInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  permissions?: InputMaybe<Array<Scalars['ObjectID']['input']>>;
  scope: Scalars['ObjectID']['input'];
  scopeType: ScopeType;
};

export type UpdateServiceInput = {
  allowOnlineBooking?: InputMaybe<Scalars['Boolean']['input']>;
  allowOnlineDelivery?: InputMaybe<Scalars['Boolean']['input']>;
  centers?: InputMaybe<Array<Scalars['ObjectID']['input']>>;
  description?: InputMaybe<Scalars['String']['input']>;
  duration?: InputMaybe<Scalars['Int']['input']>;
  internalName?: InputMaybe<Scalars['String']['input']>;
  isNewUserService?: InputMaybe<Scalars['Boolean']['input']>;
  isPrePaid?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  price?: InputMaybe<Scalars['Float']['input']>;
};

export type UpdateStaffInput = {
  centers?: InputMaybe<Array<Scalars['ObjectID']['input']>>;
  email?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  profilePicture?: InputMaybe<Scalars['String']['input']>;
};

export type UpsertMatchInput = {
  associatedOutputId?: InputMaybe<Array<Scalars['String']['input']>>;
  associatedRunscribeId?: InputMaybe<Array<Scalars['String']['input']>>;
  associatedValdId?: InputMaybe<Array<Scalars['String']['input']>>;
  dateOfBirth?: InputMaybe<Scalars['String']['input']>;
  lastRecordedUtc?: InputMaybe<Scalars['Timestamp']['input']>;
  outputFullName?: InputMaybe<Scalars['String']['input']>;
  runscribeFullName?: InputMaybe<Scalars['String']['input']>;
  savedResponse?: InputMaybe<MatchResponseInput>;
  sex?: InputMaybe<Scalars['String']['input']>;
  stanceFullName?: InputMaybe<Scalars['String']['input']>;
  stanceId: Scalars['String']['input'];
  valdFullName?: InputMaybe<Scalars['String']['input']>;
  valdSyncId?: InputMaybe<Scalars['String']['input']>;
};

export type User = DataRow & {
  __typename?: 'User';
  _id: Scalars['ObjectID']['output'];
  createdAt: Scalars['Timestamp']['output'];
  email?: Maybe<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  phone: Scalars['String']['output'];
  profileData?: Maybe<ProfileData>;
  seqNo: Scalars['String']['output'];
  updatedAt: Scalars['Timestamp']['output'];
  userType: UserType;
  version: Scalars['Int']['output'];
};

export type UserFilterInput = {
  designation?: InputMaybe<Scalars['String']['input']>;
  referralType?: InputMaybe<ReferralType>;
  status?: InputMaybe<PatientStatus>;
};

/** User permissions bound to a specific scope */
export type UserPermissions = DataRow & {
  __typename?: 'UserPermissions';
  _id: Scalars['ObjectID']['output'];
  createdAt: Scalars['Timestamp']['output'];
  isActive: Scalars['Boolean']['output'];
  permissions: Array<Permission>;
  scope: Scope;
  scopeType: ScopeType;
  updatedAt: Scalars['Timestamp']['output'];
  user: User;
  version: Scalars['Int']['output'];
};

export enum UserSortField {
  CreatedAt = 'CREATED_AT',
  FirstName = 'FIRST_NAME',
  LastName = 'LAST_NAME',
  SeqNo = 'SEQ_NO',
  UpdatedAt = 'UPDATED_AT'
}

export type UserSortInput = {
  field: UserSortField;
  order?: InputMaybe<SortOrder>;
};

/** Available user types in the system */
export enum UserType {
  Admin = 'ADMIN',
  Consultant = 'CONSULTANT',
  Patient = 'PATIENT',
  Staff = 'STAFF'
}

export type VerifyEmailOtpInput = {
  email: Scalars['String']['input'];
  otp: Scalars['String']['input'];
  token: Scalars['String']['input'];
};

export type VerifyOtpInput = {
  otp: Scalars['String']['input'];
  phone: Scalars['String']['input'];
  token: Scalars['String']['input'];
};

export type WebhookResponse = {
  __typename?: 'WebhookResponse';
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type CreateOrderMutationVariables = Exact<{
  input: CreateOrderInput;
}>;


export type CreateOrderMutation = { __typename?: 'Mutation', createOrder: { __typename?: 'Order', _id: any, razorpayOrderId: string } };

export type UpdateOrderNewUserOfflineMutationVariables = Exact<{
  orderId: Scalars['ObjectID']['input'];
}>;


export type UpdateOrderNewUserOfflineMutation = { __typename?: 'Mutation', updateOrder: { __typename?: 'Order', _id: any, status: OrderStatus, invoice: { __typename?: 'Invoice', _id: any }, payment?: { __typename?: 'Payment', razorpayPaymentId?: string | null } | null } };

export type VerifyPaymentMutationVariables = Exact<{
  orderId: Scalars['ObjectID']['input'];
  razorpayPaymentId: Scalars['String']['input'];
}>;


export type VerifyPaymentMutation = { __typename?: 'Mutation', verifyPayment: { __typename?: 'WebhookResponse', success: boolean, message?: string | null } };

export type UpdatePatientMutationVariables = Exact<{
  patientId: Scalars['ObjectID']['input'];
  input: UpdatePatient;
}>;


export type UpdatePatientMutation = { __typename?: 'Mutation', updatePatient: { __typename?: 'User', _id: any, profileData?: { __typename?: 'Consultant' } | { __typename?: 'Patient', centers: Array<{ __typename?: 'Center', _id: any, name: string }> } | { __typename?: 'Staff' } | null } };

export type GetCentersQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCentersQuery = { __typename?: 'Query', centers: Array<{ __typename?: 'Center', _id: any, name: string }> };

export type UpdateOrderNewUserOnlineMutationVariables = Exact<{
  orderId: Scalars['ObjectID']['input'];
}>;


export type UpdateOrderNewUserOnlineMutation = { __typename?: 'Mutation', updateOrder: { __typename?: 'Order', _id: any, status: OrderStatus, invoice: { __typename?: 'Invoice', _id: any }, payment?: { __typename?: 'Payment', razorpayPaymentId?: string | null } | null } };

export type UpdateOrderRepeatUserOnlineMutationVariables = Exact<{
  orderId: Scalars['ObjectID']['input'];
}>;


export type UpdateOrderRepeatUserOnlineMutation = { __typename?: 'Mutation', updateOrder: { __typename?: 'Order', _id: any, status: OrderStatus, invoice: { __typename?: 'Invoice', _id: any }, payment?: { __typename?: 'Payment', razorpayPaymentId?: string | null } | null } };

export type UpdateOrderMutationVariables = Exact<{
  orderId: Scalars['ObjectID']['input'];
}>;


export type UpdateOrderMutation = { __typename?: 'Mutation', updateOrder: { __typename?: 'Order', _id: any, status: OrderStatus, razorpayOrderId: string, payment?: { __typename?: 'Payment', razorpayPaymentId?: string | null } | null } };


export const CreateOrderDocument = gql`
    mutation CreateOrder($input: CreateOrderInput!) {
  createOrder(input: $input) {
    _id
    razorpayOrderId
  }
}
    `;
export type CreateOrderMutationFn = Apollo.MutationFunction<CreateOrderMutation, CreateOrderMutationVariables>;

/**
 * __useCreateOrderMutation__
 *
 * To run a mutation, you first call `useCreateOrderMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateOrderMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createOrderMutation, { data, loading, error }] = useCreateOrderMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateOrderMutation(baseOptions?: Apollo.MutationHookOptions<CreateOrderMutation, CreateOrderMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateOrderMutation, CreateOrderMutationVariables>(CreateOrderDocument, options);
      }
export type CreateOrderMutationHookResult = ReturnType<typeof useCreateOrderMutation>;
export type CreateOrderMutationResult = Apollo.MutationResult<CreateOrderMutation>;
export type CreateOrderMutationOptions = Apollo.BaseMutationOptions<CreateOrderMutation, CreateOrderMutationVariables>;
export const UpdateOrderNewUserOfflineDocument = gql`
    mutation UpdateOrderNewUserOffline($orderId: ObjectID!) {
  updateOrder(orderId: $orderId) {
    _id
    status
    invoice {
      _id
    }
    payment {
      razorpayPaymentId
    }
  }
}
    `;
export type UpdateOrderNewUserOfflineMutationFn = Apollo.MutationFunction<UpdateOrderNewUserOfflineMutation, UpdateOrderNewUserOfflineMutationVariables>;

/**
 * __useUpdateOrderNewUserOfflineMutation__
 *
 * To run a mutation, you first call `useUpdateOrderNewUserOfflineMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateOrderNewUserOfflineMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateOrderNewUserOfflineMutation, { data, loading, error }] = useUpdateOrderNewUserOfflineMutation({
 *   variables: {
 *      orderId: // value for 'orderId'
 *   },
 * });
 */
export function useUpdateOrderNewUserOfflineMutation(baseOptions?: Apollo.MutationHookOptions<UpdateOrderNewUserOfflineMutation, UpdateOrderNewUserOfflineMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateOrderNewUserOfflineMutation, UpdateOrderNewUserOfflineMutationVariables>(UpdateOrderNewUserOfflineDocument, options);
      }
export type UpdateOrderNewUserOfflineMutationHookResult = ReturnType<typeof useUpdateOrderNewUserOfflineMutation>;
export type UpdateOrderNewUserOfflineMutationResult = Apollo.MutationResult<UpdateOrderNewUserOfflineMutation>;
export type UpdateOrderNewUserOfflineMutationOptions = Apollo.BaseMutationOptions<UpdateOrderNewUserOfflineMutation, UpdateOrderNewUserOfflineMutationVariables>;
export const VerifyPaymentDocument = gql`
    mutation VerifyPayment($orderId: ObjectID!, $razorpayPaymentId: String!) {
  verifyPayment(orderId: $orderId, razorpayPaymentId: $razorpayPaymentId) {
    success
    message
  }
}
    `;
export type VerifyPaymentMutationFn = Apollo.MutationFunction<VerifyPaymentMutation, VerifyPaymentMutationVariables>;

/**
 * __useVerifyPaymentMutation__
 *
 * To run a mutation, you first call `useVerifyPaymentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useVerifyPaymentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [verifyPaymentMutation, { data, loading, error }] = useVerifyPaymentMutation({
 *   variables: {
 *      orderId: // value for 'orderId'
 *      razorpayPaymentId: // value for 'razorpayPaymentId'
 *   },
 * });
 */
export function useVerifyPaymentMutation(baseOptions?: Apollo.MutationHookOptions<VerifyPaymentMutation, VerifyPaymentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<VerifyPaymentMutation, VerifyPaymentMutationVariables>(VerifyPaymentDocument, options);
      }
export type VerifyPaymentMutationHookResult = ReturnType<typeof useVerifyPaymentMutation>;
export type VerifyPaymentMutationResult = Apollo.MutationResult<VerifyPaymentMutation>;
export type VerifyPaymentMutationOptions = Apollo.BaseMutationOptions<VerifyPaymentMutation, VerifyPaymentMutationVariables>;
export const UpdatePatientDocument = gql`
    mutation UpdatePatient($patientId: ObjectID!, $input: UpdatePatient!) {
  updatePatient(id: $patientId, input: $input) {
    _id
    profileData {
      ... on Patient {
        centers {
          _id
          name
        }
      }
    }
  }
}
    `;
export type UpdatePatientMutationFn = Apollo.MutationFunction<UpdatePatientMutation, UpdatePatientMutationVariables>;

/**
 * __useUpdatePatientMutation__
 *
 * To run a mutation, you first call `useUpdatePatientMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdatePatientMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updatePatientMutation, { data, loading, error }] = useUpdatePatientMutation({
 *   variables: {
 *      patientId: // value for 'patientId'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdatePatientMutation(baseOptions?: Apollo.MutationHookOptions<UpdatePatientMutation, UpdatePatientMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdatePatientMutation, UpdatePatientMutationVariables>(UpdatePatientDocument, options);
      }
export type UpdatePatientMutationHookResult = ReturnType<typeof useUpdatePatientMutation>;
export type UpdatePatientMutationResult = Apollo.MutationResult<UpdatePatientMutation>;
export type UpdatePatientMutationOptions = Apollo.BaseMutationOptions<UpdatePatientMutation, UpdatePatientMutationVariables>;
export const GetCentersDocument = gql`
    query GetCenters {
  centers {
    _id
    name
  }
}
    `;

/**
 * __useGetCentersQuery__
 *
 * To run a query within a React component, call `useGetCentersQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCentersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCentersQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetCentersQuery(baseOptions?: Apollo.QueryHookOptions<GetCentersQuery, GetCentersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetCentersQuery, GetCentersQueryVariables>(GetCentersDocument, options);
      }
export function useGetCentersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetCentersQuery, GetCentersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetCentersQuery, GetCentersQueryVariables>(GetCentersDocument, options);
        }
export function useGetCentersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetCentersQuery, GetCentersQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetCentersQuery, GetCentersQueryVariables>(GetCentersDocument, options);
        }
export type GetCentersQueryHookResult = ReturnType<typeof useGetCentersQuery>;
export type GetCentersLazyQueryHookResult = ReturnType<typeof useGetCentersLazyQuery>;
export type GetCentersSuspenseQueryHookResult = ReturnType<typeof useGetCentersSuspenseQuery>;
export type GetCentersQueryResult = Apollo.QueryResult<GetCentersQuery, GetCentersQueryVariables>;
export const UpdateOrderNewUserOnlineDocument = gql`
    mutation UpdateOrderNewUserOnline($orderId: ObjectID!) {
  updateOrder(orderId: $orderId) {
    _id
    status
    invoice {
      _id
    }
    payment {
      razorpayPaymentId
    }
  }
}
    `;
export type UpdateOrderNewUserOnlineMutationFn = Apollo.MutationFunction<UpdateOrderNewUserOnlineMutation, UpdateOrderNewUserOnlineMutationVariables>;

/**
 * __useUpdateOrderNewUserOnlineMutation__
 *
 * To run a mutation, you first call `useUpdateOrderNewUserOnlineMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateOrderNewUserOnlineMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateOrderNewUserOnlineMutation, { data, loading, error }] = useUpdateOrderNewUserOnlineMutation({
 *   variables: {
 *      orderId: // value for 'orderId'
 *   },
 * });
 */
export function useUpdateOrderNewUserOnlineMutation(baseOptions?: Apollo.MutationHookOptions<UpdateOrderNewUserOnlineMutation, UpdateOrderNewUserOnlineMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateOrderNewUserOnlineMutation, UpdateOrderNewUserOnlineMutationVariables>(UpdateOrderNewUserOnlineDocument, options);
      }
export type UpdateOrderNewUserOnlineMutationHookResult = ReturnType<typeof useUpdateOrderNewUserOnlineMutation>;
export type UpdateOrderNewUserOnlineMutationResult = Apollo.MutationResult<UpdateOrderNewUserOnlineMutation>;
export type UpdateOrderNewUserOnlineMutationOptions = Apollo.BaseMutationOptions<UpdateOrderNewUserOnlineMutation, UpdateOrderNewUserOnlineMutationVariables>;
export const UpdateOrderRepeatUserOnlineDocument = gql`
    mutation UpdateOrderRepeatUserOnline($orderId: ObjectID!) {
  updateOrder(orderId: $orderId) {
    _id
    status
    invoice {
      _id
    }
    payment {
      razorpayPaymentId
    }
  }
}
    `;
export type UpdateOrderRepeatUserOnlineMutationFn = Apollo.MutationFunction<UpdateOrderRepeatUserOnlineMutation, UpdateOrderRepeatUserOnlineMutationVariables>;

/**
 * __useUpdateOrderRepeatUserOnlineMutation__
 *
 * To run a mutation, you first call `useUpdateOrderRepeatUserOnlineMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateOrderRepeatUserOnlineMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateOrderRepeatUserOnlineMutation, { data, loading, error }] = useUpdateOrderRepeatUserOnlineMutation({
 *   variables: {
 *      orderId: // value for 'orderId'
 *   },
 * });
 */
export function useUpdateOrderRepeatUserOnlineMutation(baseOptions?: Apollo.MutationHookOptions<UpdateOrderRepeatUserOnlineMutation, UpdateOrderRepeatUserOnlineMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateOrderRepeatUserOnlineMutation, UpdateOrderRepeatUserOnlineMutationVariables>(UpdateOrderRepeatUserOnlineDocument, options);
      }
export type UpdateOrderRepeatUserOnlineMutationHookResult = ReturnType<typeof useUpdateOrderRepeatUserOnlineMutation>;
export type UpdateOrderRepeatUserOnlineMutationResult = Apollo.MutationResult<UpdateOrderRepeatUserOnlineMutation>;
export type UpdateOrderRepeatUserOnlineMutationOptions = Apollo.BaseMutationOptions<UpdateOrderRepeatUserOnlineMutation, UpdateOrderRepeatUserOnlineMutationVariables>;
export const UpdateOrderDocument = gql`
    mutation UpdateOrder($orderId: ObjectID!) {
  updateOrder(orderId: $orderId) {
    _id
    status
    razorpayOrderId
    payment {
      razorpayPaymentId
    }
  }
}
    `;
export type UpdateOrderMutationFn = Apollo.MutationFunction<UpdateOrderMutation, UpdateOrderMutationVariables>;

/**
 * __useUpdateOrderMutation__
 *
 * To run a mutation, you first call `useUpdateOrderMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateOrderMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateOrderMutation, { data, loading, error }] = useUpdateOrderMutation({
 *   variables: {
 *      orderId: // value for 'orderId'
 *   },
 * });
 */
export function useUpdateOrderMutation(baseOptions?: Apollo.MutationHookOptions<UpdateOrderMutation, UpdateOrderMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateOrderMutation, UpdateOrderMutationVariables>(UpdateOrderDocument, options);
      }
export type UpdateOrderMutationHookResult = ReturnType<typeof useUpdateOrderMutation>;
export type UpdateOrderMutationResult = Apollo.MutationResult<UpdateOrderMutation>;
export type UpdateOrderMutationOptions = Apollo.BaseMutationOptions<UpdateOrderMutation, UpdateOrderMutationVariables>;