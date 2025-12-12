import { gql } from '@apollo/client';

export const GET_SAMPLE_DATA = gql`
  query GetSampleData {
    __typename
  }
`;

export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      refreshToken
      user {
        _id
        seqNo
        phone
        email
        isActive
        userType
        profileData {
          ... on Patient {
            firstName
            lastName
            bio
            gender
            dob
            category
            profilePicture
            organization {
              _id
            }
          }
          ... on Staff {
            firstName
            lastName
            profilePicture
            organization {
              _id
            }
          }
          ... on Consultant {
            firstName
            lastName
            bio
            dob
            gender
            profilePicture
            designation
            specialization
            organization {
              _id
            }
          }
        }
      }
    }
  }
`;

export const GET_PATIENTS = gql`
  query Users(
    $userType: UserType!
    $centerId: [ObjectID!]!
    $search: String
    $filter: UserFilterInput
    $pagination: CursorPaginationInput
    $sort: UserSortInput
  ) {
    users(
      userType: $userType
      centerId: $centerId
      search: $search
      filter: $filter
      pagination: $pagination
      sort: $sort
    ) {
      data {
        _id
        seqNo
        phone
        email
        isActive
        userType
        profileData {
          ... on Patient {
            firstName
            lastName
            dob
            bio
            gender
            profilePicture
            status
            category
            cohort
            patientType
            __typename
          }
          __typename
        }
        __typename
      }
      pagination {
        nextCursor
        prevCursor
        hasNext
        hasPrevious
        limit
      }
    }
  }
`;

export const GET_CONSULTANTS = gql`
  query GetUsers(
    $userType: UserType!
    $centerId: [ObjectID!]!
    $search: String
    $filter: UserFilterInput
    $pagination: CursorPaginationInput
    $sort: UserSortInput
  ) {
    users(
      userType: $userType
      centerId: $centerId
      search: $search
      filter: $filter
      pagination: $pagination
      sort: $sort
    ) {
      data {
        _id
        seqNo
        createdAt
        updatedAt
        phone
        email
        isActive
        userType
        profileData {
          ... on Consultant {
            firstName
            lastName
            bio
            dob
            gender
            profilePicture
            designation
            specialization
            allowOnlineBooking
            allowOnlineDelivery
            location {
              street
              city
              state
              country
              zip
            }
            centers {
              _id
              version
              createdAt
              updatedAt
              isActive
              seqNo
              name
              phone
              location
            }
            services {
              _id
            }
          }
          ... on Staff {
            firstName
            lastName
            profilePicture
            centers {
              _id
              seqNo
              name
              phone
              location
            }
          }
        }
      }
      pagination {
        nextCursor
        prevCursor
        hasNext
        hasPrevious
        limit
      }
    }
  }
`;

export const CREATE_PATIENT = gql`
  mutation CreatePatient($input: CreatePatientInput!) {
    createPatient(input: $input) {
      _id
      seqNo
      phone
      email
      isActive
      userType
      profileData {
        ... on Patient {
          firstName
          lastName
          bio
          gender
          dob
          category
          organization {
            _id
            logo
            gstNumber
            panNumber
            brandName
            companyName
            socialLinks
          }
          centers {
            _id
            seqNo
            name
            phone
            location
          }
        }
      }
    }
  }
`;

export const REFRESH_TOKEN = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(token: $refreshToken)
  }
`;

export const LOGOUT = gql`
  mutation Logout {
    logout {
      _id
      isActive
    }
  }
`;

export const CREATE_STAFF = gql`
  mutation CreateStaff($input: CreateStaffInput!) {
    createStaff(input: $input) {
      _id
      email
      phone
      seqNo
      isActive
      userType
      profileData {
        ... on Staff {
          firstName
          lastName
          profilePicture
          organization {
            _id
            logo
            gstNumber
            panNumber
            brandName
            companyName
            socialLinks
          }
          centers {
            _id
            seqNo
            name
            phone
            location
          }
        }
      }
    }
  }
`;

export const CREATE_CONSULTANT = gql`
  mutation CreateConsultant($input: CreateConsultantInput!) {
    createConsultant(input: $input) {
      _id
      seqNo
      phone
      email
      isActive
      userType
      profileData {
        ... on Consultant {
          firstName
          lastName
          bio
          dob
          gender
          profilePicture
          designation
          specialization
          allowOnlineBooking
          allowOnlineDelivery
          centers {
            _id
            seqNo
            name
            phone
            location
          }
          organization {
            _id
            logo
            gstNumber
            panNumber
            brandName
            companyName
            socialLinks
          }
        }
      }
    }
  }
`;

export const GET_SERVICES = gql`
  query Services($centerId: [ObjectID!], $advanceId: ObjectID) {
    services(centerId: $centerId, advanceId: $advanceId) {
      _id
      seqNo
      name
      internalName
      price
      duration
      description
      allowOnlineBooking
      allowOnlineDelivery
      isNewUserService
      isPrePaid
      centers {
        _id
        seqNo
        name
        phone
        location
      }
    }
  }
`;

export const CREATE_SERVICE = gql`
  mutation CreateService($input: CreateServiceInput!) {
    createService(input: $input) {
      _id
      seqNo
      name
      internalName
      price
      duration
      description
      allowOnlineBooking
      allowOnlineDelivery
      isNewUserService
      isPrePaid
    }
  }
`;

export const UPDATE_SERVICE = gql`
  mutation UpdateService($id: ObjectID!, $input: UpdateServiceInput!) {
    updateService(id: $id, input: $input) {
      _id
      seqNo
      name
      internalName
      price
      duration
      description
      allowOnlineBooking
      allowOnlineDelivery
      isNewUserService
      isPrePaid
    }
  }
`;

export const DELETE_SERVICE = gql`
  mutation DeleteService($serviceId: ObjectID!) {
    deleteService(id: $serviceId) {
      _id
      seqNo
      name
      internalName
      price
      duration
      description
    }
  }
`;

export const UPDATE_PASSWORD = gql`
  mutation UpdatePassword($input: UpdatePasswordInput!) {
    updatePassword(input: $input)
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input)
  }
`;

export const GET_PACKAGES = gql`
  query Packages($centerId: [ObjectID!]!) {
    packages(centerId: $centerId) {
      _id
      seqNo
      name
      internalName
      price
      validity
      isMultiUser
      maxUsers
      description
      services {
        _id
        version
        createdAt
        updatedAt
        isActive
        seqNo
        name
        internalName
        price
        duration
        description
      }
      centers {
        _id
        version
        createdAt
        updatedAt
        isActive
        seqNo
        name
        phone
        location
      }
    }
  }
`;

export const CREATE_PACKAGE = gql`
  mutation CreatePackage($input: CreatePackageInput!) {
    createPackage(input: $input) {
      _id
      seqNo
      name
      internalName
      price
      validity
      isMultiUser
      maxUsers
      description
    }
  }
`;

export const UPDATE_PACKAGE = gql`
  mutation UpdatePackage($id: ObjectID!, $input: UpdatePackageInput!) {
    updatePackage(id: $id, input: $input) {
      _id
      seqNo
      name
      internalName
      price
      validity
      isMultiUser
      maxUsers
      description
    }
  }
`;

export const DELETE_PACKAGE = gql`
  mutation DeletePackage($packageId: ObjectID!) {
    deletePackage(id: $packageId) {
      _id
      seqNo
      name
      internalName
      price
      validity
      isMultiUser
      maxUsers
      description
      services {
        _id
        seqNo
        name
        internalName
        price
      }
    }
  }
`;

export const GET_USER = gql`
  query User($userId: ObjectID!) {
    user(userId: $userId) {
      _id
      seqNo
      phone
      email
      isActive
      userType
      profileData {
        ... on Patient {
          firstName
          lastName
          bio
          gender
          dob
          category
          profilePicture
          cohort
          status
          patientType
          referral {
            type
            user
            name
          }
          consultant {
            _id
            seqNo
            phone
            email
            isActive
            userType
            profileData {
              ... on Consultant {
                firstName
                lastName
                bio
                dob
                gender
                profilePicture
                designation
                specialization
              }
            }
          }
          centers {
            _id
            seqNo
            name
            phone
            location
            organization {
              _id
              logo
              gstNumber
              panNumber
              brandName
              companyName
              socialLinks
            }
          }
        }
      }
    }
  }
`;

export const CREATE_GOAL_SET = gql`
  mutation CreateGoalSet($input: CreateGoalSetInput!) {
    createGoalSet(input: $input) {
      _id
      name
      isActive
      patient {
        _id
        seqNo
        phone
        email
        isActive
        userType
        profileData {
          ... on Patient {
            firstName
            lastName
            bio
            gender
            dob
            category
            profilePicture
            centers {
              _id
              seqNo
              name
              phone
              location
              organization {
                _id
                logo
                gstNumber
                panNumber
                brandName
                companyName
                socialLinks
              }
            }
          }
        }
      }
      goals {
        _id
        name
        isActive
        category
        unit
        isReverseProgress
        customExerciseName
        exercise {
          _id
          name
          media {
            image
          }
        }
        maxTarget
        minTarget
        targetDate
        priority
        notes
      }
    }
  }
`;

export const GET_GOAL_SET = gql`
  query GetGoalSet($id: ObjectID!) {
    goalSet(id: $id) {
      _id
      name
      isActive
      status
      createdAt
      updatedAt
      version
      patient {
        _id
        profileData {
          ... on Patient {
              firstName
              lastName
          }
        }
      }
      goals {
        _id
        name
        category
        unit
        isReverseProgress
        customExerciseName
        exercise {
          _id
          name
          media {
            image
          }
        }
        maxTarget
        minTarget
        targetDate
        status
        achievements {
          achievement
          notes
          updatedDate
        }
        priority
        createdAt
        updatedAt
        version
        isActive
        notes
      }
    }
  }
`;

export const GET_GOAL_SETS = gql`
    query GoalSets($patientId: ObjectID!) {
        goalSets(patientId: $patientId) {
            _id
            name
            isActive
            goals {
                _id
                name
                isActive
                category
                unit
                isReverseProgress
                customExerciseName
                exercise {
                    _id
                    name
                    media {
                        image
                        video
                        previewGif
                        startPositionImage
                        media_hash
                    }
                    groupId
                    exerciseId
                    description
                    joints
                    muscleGroups
                    exerciseTypes
                    exerciseResistanceLevel
                    numberOfReps
                    numberOfSets
                    exerciseConfig
                    majorAxis
                    sensorMovement
                    sensorsRequired
                    sensorsBodyType
                    exerciseStabilityFactor
                    exerciseDiffLevel
                    startPosition
                    exerciseTimePerRep
                }
                maxTarget
                minTarget
                targetDate
                achievements {
                    achievement
                    notes
                    updatedDate
                }
                priority
                status
                needsAdjustment
                suggestedMaxTarget
                suggestedMinTarget
                adjustmentReason
                notes
            }
            patient {
                _id
                seqNo
                phone
                email
                isActive
                userType
                profileData {
                    ... on Patient {
                        firstName
                        lastName
                        bio
                        gender
                        dob
                        category
                        profilePicture
                        centers {
                            _id
                            seqNo
                            name
                            phone
                            location
                        }
                        consultant {
                            _id
                            seqNo
                            phone
                            email
                            isActive
                            userType
                        }
                        organization {
                            _id
                            logo
                            gstNumber
                            panNumber
                            brandName
                            companyName
                            socialLinks
                        }
                    }
                }
            }
            status
            createdAt
            updatedAt
        }
    }
`;

export const CREATE_APPOINTMENT = gql`
  mutation CreateAppointment($input: CreateAppointmentInput!) {
    createAppointment(input: $input) {
      _id
      seqNo
      patient {
        _id
        phone
      }
    }
  }
`;

export const CREATE_APPOINTMENT_WITH_PACKAGE = gql`
  mutation CreateAppointmentWithPackage($input: CreateAppointmentWithPackageInput!) {
    createAppointmentWithPackage(input: $input) {
      _id
      seqNo
      status
      patient {
        _id
        phone
      }
    }
  }
`;
export const GET_APPOINTMENTS_SAFE = gql`
  query EventsSafe(
    $filter: EventFilter!
    $search: String
    $pagination: CursorPaginationInput
    $sort: EventSortInput
  ) {
    events(
      filter: $filter
      search: $search
      pagination: $pagination
      sort: $sort
    ) {
      data {
        ... on AppointmentEvent {
          seqNo
          title
          startTime
          endTime
          isWaitlisted
          hostType
          _id
          createdAt
          isActive
          updatedAt
          description
          eventType
          attendees {
            _id
          }
        }
      }
      pagination {
        nextCursor
        prevCursor
        hasNext
        hasPrevious
        limit
      }
    }
  }
`;

export const GET_APPOINTMENTS = gql`
  query Events(
    $filter: EventFilter!
    $search: String
    $pagination: CursorPaginationInput
    $sort: EventSortInput
  ) {
    events(
      filter: $filter
      search: $search
      pagination: $pagination
      sort: $sort
    ) {
      data {
        ... on AppointmentEvent {
          seqNo
          title
          startTime
          endTime
          isWaitlisted
          hostType
          appointment {
            status
            medium
            visitType
            seqNo
            _id
            createdAt
            updatedAt
            isActive
            category
            event{
              startTime
            }
            patient {
              version
              _id
              createdAt
              updatedAt
              isActive
              seqNo
              phone
              email
              userType
              profileData {
                ... on Patient {
                  firstName
                  lastName
                  bio
                  gender
                  dob
                  patientType
                  category
                  profilePicture
                  status
                  cohort
                }
              }
            }
            consultant {
              version
              _id
              createdAt
              updatedAt
              isActive
              seqNo
              phone
              email
              userType
              profileData {
                ... on Consultant {
                  firstName
                  lastName
                  bio
                  dob
                  gender
                  profilePicture
                  designation
                  specialization
                }
              }
            }
            center {
              _id
              seqNo
              name
              phone
              location
              address {
                street
                city
                state
                country
                zip
              }
            }
            treatment {
              _id
              version
              createdAt
              updatedAt
              isActive
              seqNo
              name
              internalName
              price
              duration
              description
            }
            notes
            cancellationReason
            cancellationNote
            cancelledAt
            cancelledBy {
              _id
              seqNo
              phone
              email
              profileData {
                ... on Staff {
                  firstName
                  lastName
                }
                ... on Consultant {
                  firstName
                  lastName
                }
              }
            }
            rescheduledTo {
              _id
              seqNo
            }
            rescheduledFrom {
              _id
              seqNo
            }
          }
          _id
          createdAt
          isActive
          updatedAt
          description
          eventType
        }
      }
      pagination {
        nextCursor
        prevCursor
        hasNext
        hasPrevious
        limit
      }
    }
  }
`;

export const GET_AVAILABILITY_EVENTS = gql`
  query GetAvailabilityEvents(
    $filter: EventFilter!
    $search: String
    $pagination: CursorPaginationInput
  ) {
    events(filter: $filter, search: $search, pagination: $pagination) {
      data {
        ... on AvailabilityEvent {
          version
          _id
          createdAt
          updatedAt
          isActive
          seqNo
          title
          description
          eventType
          startTime
          endTime
          attendees {
            _id
          }
          recurrenceRule {
            rrule
            startDate
            endDate
          }
          hostType
          isAvailable
          availabilityStatus
          host {
            ... on User {
              _id
              seqNo
              phone
              email
              isActive
              userType
              profileData {
                ... on Consultant {
                  firstName
                  lastName
                  designation
                  specialization
                  profilePicture
                  centers {
                    _id
                  }
                }
              }
            }
            ... on Center {
              _id
              seqNo
              name
              phone
              location
            }
          }
          center {
            _id
            name
          }
        }
      }
      pagination {
        nextCursor
        prevCursor
        hasNext
        hasPrevious
        limit
      }
    }
  }
`;

export const ALL_REPORTS_QUERY = gql`
  query Reports($patientId: ObjectID!) {
    reports(patientId: $patientId) {
      _id
      createdAt
      updatedAt
      version
      isActive
      seqNo
      pdf
      isFirstAssessment
      appointment {
        _id
        status
        updatedAt
        event {
          startTime
          endTime
        }
        consultant {
          email
          profileData {
            ... on Consultant {
              bio
              designation
              firstName
              lastName
              profilePicture
              specialization
            }
          }
        }

        isActive
        medium
        notes
      }
      agentReport {
        _id
        isAccepted
      }
      records {
        plan {
          advice
          plans {
            exercise
            set {
              repetitions
              load
              unit
            }
            duration {
              value
              unit
            }
            comments
          }
        }
        doctorsNote
      }
    }
  }
`;

export const GET_REPORT_QUERY = gql`
  query Report($id: ObjectID!) {
    report(id: $id) {
      _id
      createdAt
      updatedAt
      version
      isActive
      seqNo
      pdf
      isFirstAssessment
      records {
        objectiveGoals {
          goalName
          unitName
          value
          goalCategory
          targetDate
        }
        subjectiveGoals {
          goal
          targetDate
        }
        objectiveAssessment {
          tests {
            testName
            unitName
            value
            left
            right
            comments
          }
        }
        clinicalDetails {
          bodyChart
          duration
          clientHistory
          chiefComplaints
        }
        advice {
          advice
        }
        document {
          documentName
          details
          document
        }
        subjectiveAssessment {
          assessment
        }
        provisionalDiagnosis {
          diagnosis
        }
        recommendations {
          sessionType
          frequency
          sessionCount
          plans
        }
        plan {
          advice
          plans {
            exercise
            set {
              repetitions
              load
              unit
            }
            duration {
              value
              unit
            }
            comments
          }
        }
        rpe {
          value
        }
        doctorsNote
      }
    }
  }
`;

export const ADD_RECORDS = gql`
  mutation AddRecords($reportId: ObjectID!, $input: RecordsInput!) {
    addRecords(reportId: $reportId, input: $input) {
      _id
      createdAt
      isActive
      seqNo
    }
  }
`;

export const GET_ASSESSMENT_AGENT_REPORT = gql`
  query GetAgentReport($id: ObjectID!) {
    agentReport(id: $id) {
      _id
      assessment {
        plan {
          advice
          record
          plans {
            exercise
            comments
            set {
              repetitions
              load
              unit
            }
            duration {
              value
              unit
            }
          }
        }
        subjectiveAssessment {
          assessment
          record
        }
        objectiveAssessment {
          record
          tests {
            testName
            unitName
            value
            left
            right
            comments
          }
        }
        rpe {
          value
          record
        }
      }
    }
  }
`;

export const GET_CENTERS = gql`
  query Centers {
    centers {
      name
      phone
      location
      _id
      seqNo
      isOnline
      address {
        street
        city
        state
        country
        zip
      }
      organization {
        _id
        logo
        gstNumber
        panNumber
        brandName
        companyName
        socialLinks
      }
    }
  }
`;

export const UPDATE_GOAL_SET = gql`
  mutation UpdateGoalSet($goalSetId: ObjectID!, $input: UpdateGoalSetInput!) {
    updateGoalSet(goalSetId: $goalSetId, input: $input) {
      _id
      name
      isActive
      goals {
        _id
        name
        isActive
        category
        isReverseProgress
        customExerciseName
        unit
        exercise {
          _id
          name
          media {
            image
          }
        }
        priority
        maxTarget
        minTarget
        targetDate
        achievements {
          updatedDate
          achievement
          notes
        }
        needsAdjustment
        suggestedMaxTarget
        suggestedMinTarget
        adjustmentReason
        notes
      }
    }
  }
`;

export const GET_ME = gql`
  query Me {
    me {
      _id
      phone
      email
      userType
      seqNo
      isActive
      profileData {
        ... on Patient {
          firstName
          lastName
          bio
          gender
          dob
          category
          profilePicture
        }
        ... on Staff {
          firstName
          lastName
          profilePicture
        }
        ... on Consultant {
          firstName
          lastName
          bio
          dob
          gender
          profilePicture
          designation
          specialization
          location {
            street
            city
            state
            country
            zip
          }
        }
      }
    }
  }
`;

export const GET_ORGANIZATION = gql`
  query Organization($organizationId: ObjectID!) {
    organization(id: $organizationId) {
      _id
      logo
      gstNumber
      panNumber
      brandName
      companyName
      socialLinks
      address {
        street
        city
        state
        country
        zip
      }
    }
  }
`;

export const UPDATE_ORGANIZATION = gql`
  mutation UpdateOrganization(
    $organizationId: ObjectID!
    $input: UpdateOrganizationInput!
  ) {
    updateOrganization(id: $organizationId, input: $input) {
      _id
      logo
      gstNumber
      panNumber
      brandName
      companyName
      socialLinks
      address {
        street
        city
        state
        country
        zip
      }
    }
  }
`;

export const UPDATE_CENTER = gql`
  mutation UpdateCenter($centerId: ObjectID!, $input: UpdateCenterInput!) {
    updateCenter(id: $centerId, input: $input) {
      _id
      seqNo
      name
      phone
      location
      isOnline
      address {
        street
        city
        state
        country
        zip
      }
    }
  }
`;

export const CREATE_INVOICE = gql`
  mutation CreateInvoice($input: CreateInvoiceInput!) {
    createInvoice(input: $input) {
      _id
      version
      isActive
      amount
      status
      dueDate
      notes
      subheading
      footer
      pdfUrl
      seqNo
    }
  }
`;

export const CREATE_ADVANCE = gql`
  mutation CreateAdvance($input: CreateAdvanceInput!) {
    createAdvance(input: $input) {
      _id
      version
      createdAt
      updatedAt
      isActive
      total
      footer
      notes
      receipt {
        seqNo
        payment {
          ... on Payment {
            mode
          }
        }
      }
      pdfUrl
    }
  }
`;

export const GET_INVOICES = gql`
  query Invoices(
    $filter: InvoiceFilter!
    $search: String
    $pagination: CursorPaginationInput
    $sort: InvoiceSortInput
  ) {
    invoices(
      filter: $filter
      search: $search
      pagination: $pagination
      sort: $sort
    ) {
      data {
        _id
        createdAt
        dueDate
        amount
        status
        seqNo
        patient {
          profileData {
            ... on Patient {
              firstName
              lastName
              gender
              bio
              dob
              category
              referral {
                type
                user
                name
              }
              profilePicture
            }
          }
          _id
          seqNo
          phone
          email
          isActive
          userType
        }
        staff {
          profileData {
            ... on Staff {
              firstName
              lastName
              profilePicture
            }
          }
          _id
          seqNo
          phone
          email
          isActive
          userType
        }
        updatedAt
        items {
          description
          quantity
          price
          discount
          amount
        }
        appointment {
          _id
          seqNo
          createdAt
          updatedAt
          medium
          status
          visitType
          notes
          isActive
          event{
            startTime
            endTime
          }
          consultant {
            _id
            seqNo
            phone
            email
            isActive
            userType
            profileData {
              ... on Consultant {
                firstName
                lastName
                bio
                dob
                gender
                profilePicture
                designation
                specialization
              }
            }
          }
          treatment {
            _id
            seqNo
            name
            internalName
            price
            duration
            description
          }
        }
        notes
        payment {
          ... on Payment {
            mode
            type
          }
        }
        subheading
        footer
        pdfUrl
      }
      pagination {
        nextCursor
        prevCursor
        hasNext
        hasPrevious
        limit
      }
    }
  }
`;

export const GET_ADVANCES = gql`
  query Advances(
    $filter: AdvanceFilter!
    $search: String
    $pagination: CursorPaginationInput
    $sort: AdvanceSortInput
  ) {
    advances(
      filter: $filter
      search: $search
      pagination: $pagination
      sort: $sort
    ) {
      data {
        currentBalance
        advance {
          _id
          version
          createdAt
          updatedAt
          isActive
          total
          footer
          notes
          pdfUrl
          patient {
            _id
            seqNo
            phone
            email
            userType
            profileData {
              ... on Patient {
                firstName
                lastName
                bio
                gender
                dob
                patientType
                category
                profilePicture
                status
                cohort
              }
            }
          }
          receipt {
            _id
            seqNo
            payment {
              ... on Payment {
                mode
                type
                razorpayPaymentId
                transactionId
              }
            }
            createdAt
          }
          itemsWithBalance {
            currentBalance
            advanceItem {
              type
              amount
              validTill
              item {
                _id
              }
              associatedPatients {
                amount
                currentBalance
                patient {
                  version
                  _id
                  phone
                  seqNo
                  email
                  profileData {
                    ... on Patient {
                      firstName
                      lastName
                      bio
                      gender
                      dob
                      status
                    }
                  }
                }
              }
            }
          }
        }
      }
      pagination {
        nextCursor
        prevCursor
        hasNext
        hasPrevious
        limit
      }
    }
  }
`;

export const GET_STATS = gql`
  query Stats($input: GetStatsInput!) {
    stats(input: $input) {
      totalPatients
      newPatients
      revenue
      pendingPayments
      pendingPaymentsCount
      overduePayments
      overduePaymentsCount
    }
  }
`;

export const UPDATE_RECORDS = gql`
  mutation UpdateRecords($reportId: ObjectID!, $input: RecordsInput!) {
    updateRecords(reportId: $reportId, input: $input) {
      _id
      createdAt
      updatedAt
      version
      isActive
      seqNo
      pdf
      isFirstAssessment
      records {
        clinicalDetails {
          bodyChart
          duration
          clientHistory
          chiefComplaints
        }
        advice {
          advice
        }
        document {
          documentName
          details
          document
        }
        objectiveAssessment {
          tests {
            testName
            unitName
            value
            left
            right
            comments
          }
        }
        subjectiveAssessment {
          assessment
        }
        objectiveGoals {
          goalName
          unitName
          value
          goalCategory
          targetDate
        }
        subjectiveGoals {
          goal
          targetDate
        }
        plan {
          advice
          plans {
            exercise
            set {
              repetitions
              load
              unit
            }
            duration {
              value
              unit
            }
            comments
          }
        }
        recommendations {
          sessionType
          frequency
        }
      }
    }
  }
`;

export const UPDATE_APPOINTMENT = gql`
  mutation UpdateAppointment($input: UpdateAppointmentInput!, $id: ObjectID!) {
    updateAppointment(input: $input, id: $id) {
      _id
      version
      createdAt
      updatedAt
      patient {
        _id
        seqNo
        phone
        email
        isActive
        userType
      }
      consultant {
        _id
        seqNo
        phone
        email
        isActive
        userType
      }
      center {
        _id
        seqNo
        name
        phone
        location
      }
      treatment {
        _id
        seqNo
        name
        internalName
        price
        duration
        description
      }
      event {
        startTime
        endTime
      }
      medium
      status
      visitType
      notes
      cancellationReason
      cancellationNote
      cancelledAt
      cancelledBy {
        _id
        seqNo
        phone
        email
        profileData {
          ... on Staff {
            firstName
            lastName
          }
          ... on Consultant {
            firstName
            lastName
          }
        }
      }
      rescheduledTo {
        _id
        seqNo
      }
      rescheduledFrom {
        _id
        seqNo
      }
      isActive
    }
  }
`;

export const UPDATE_PATIENT = gql`
  mutation UpdatePatient($patientId: ObjectID!, $input: UpdatePatient!) {
    updatePatient(id: $patientId, input: $input) {
      _id
      profileData {
        ... on Patient {
          firstName
          lastName
          bio
          gender
          dob
          category
          patientType
          cohort
          status
          consultant {
            _id
          }
        }
      }
      seqNo
      phone
      email
      isActive
      userType
    }
  }
`;

export const UPLOAD_DOCUMENT = gql`
  mutation UploadFile($input: FileUploadInput!) {
    uploadFile(input: $input) {
      filename
      mimetype
      encoding
      url
      size
      createdAt
      name
      details
    }
  }
`;

export const GET_EXERCISES = gql`
  query Exercises($filter: ExerciseFilter) {
    exercises(filter: $filter) {
      _id
      name
      groupId
      exerciseId
      description
      joints
      muscleGroups
      exerciseTypes
      exerciseConfig
      exerciseResistanceLevel
      numberOfReps
      numberOfSets
      exerciseTimePerRep
      startPosition
      exerciseDiffLevel
      exerciseStabilityFactor
      sensorsBodyType
      sensorsRequired
      sensorMovement
      majorAxis
    }
  }
`;

export const UPDATE_STAFF = gql`
  mutation UpdateStaff($id: ObjectID!, $input: UpdateStaffInput!) {
    updateStaff(id: $id, input: $input) {
      _id
      seqNo
      phone
      email
      isActive
      userType
      profileData {
        ... on Staff {
          firstName
          lastName
          profilePicture
          centers {
            _id
            seqNo
            name
            phone
            location
          }
        }
      }
    }
  }
`;

export const UPDATE_CONSULTANT = gql`
  mutation UpdateConsultant($id: ObjectID!, $input: UpdateConsultantInput!) {
    updateConsultant(id: $id, input: $input) {
      _id
      seqNo
      phone
      email
      isActive
      userType
      profileData {
        ... on Consultant {
          firstName
          lastName
          bio
          dob
          gender
          profilePicture
          designation
          specialization
          allowOnlineBooking
          allowOnlineDelivery
          centers {
            _id
            seqNo
            name
            phone
            location
          }
          services {
            _id
          }
          location {
            street
            city
            state
            country
            zip
          }
        }
      }
    }
  }
`;

export const CREATE_CENTER = gql`
  mutation CreateCenter($input: CreateCenterInput!) {
    createCenter(input: $input) {
      _id
      seqNo
      createdAt
      updatedAt
      name
      phone
      location
      isOnline
      address {
        street
        city
        state
        country
        zip
      }
      organization {
        _id
        brandName
        companyName
      }
    }
  }
`;

export const CREATE_AVAILABILITY_EVENT = gql`
  mutation CreateAvailabilityEvent(
    $event: CreateEventInput!
    $availability: CreateAvailabilityEventInput!
  ) {
    createAvailabilityEvent(event: $event, availability: $availability) {
      _id
      createdAt
      updatedAt
      isActive
      seqNo
      title
      description
      eventType
      startTime
      endTime
      recurrenceRule {
        rrule
        startDate
        endDate
      }
      hostType
      availabilityStatus
      isAvailable
    }
  }
`;

export const UPDATE_AVAILABILITY_EVENT = gql`
  mutation UpdateAvailabilityEvent(
    $id: ObjectID!
    $event: UpdateEventInput
    $availability: UpdateAvailabilityEventInput
  ) {
    updateAvailabilityEvent(id: $id, event: $event, availability: $availability) {
      version
      _id
      createdAt
      updatedAt
      isActive
      seqNo
      title
      description
      eventType
      startTime
      endTime
      attendees {
        _id
      }
      recurrenceRule {
        rrule
        startDate
        endDate
      }
      hostType
      isAvailable
      availabilityStatus
      host {
        ... on User {
          _id
          seqNo
          phone
          email
          isActive
          userType
          profileData {
            ... on Consultant {
              firstName
              lastName
              centers {
                _id
              }
            }
          }
        }
        ... on Center {
          _id
          seqNo
          name
          phone
          location
        }
      }
    }
  }
`;

export const DELETE_AVAILABILITY_EVENT = gql`
  mutation DeleteAvailabilityEvent($id: ObjectID!) {
    deleteAvailabilityEvent(id: $id)
  }
`;

export const EXPORT_INVOICES = gql`
  mutation ExportInvoices($invoiceIds: [ObjectID!]!) {
    exportInvoicesAsPDF(invoiceIds: $invoiceIds) {
      pdfUrl
      errors
    }
  }
`;

export const GENERATE_INVOICE_PDF_ON_DEMAND = gql`
  query GenerateInvoicePDFOnDemand($invoiceId: ObjectID!) {
    generateInvoicePDFOnDemand(invoiceId: $invoiceId)
  }
`;

export const EXPORT_ADVANCES = gql`
  mutation ExportAdvances($advanceIds: [ObjectID!]!) {
    exportAdvancesAsPDF(advanceIds: $advanceIds) {
      pdfUrl
      errors
    }
  }
`;

export const UPDATE_INVOICE = gql`
  mutation UpdateInvoice($id: ObjectID!, $input: UpdateInvoiceInput!) {
    updateInvoice(id: $id, input: $input) {
      _id
      version
      seqNo
      amount
      status
      dueDate
      notes
      payment {
        ... on Payment {
          mode
        }
      }
      subheading
      footer
    }
  }
`;

export const UPDATE_ADVANCE = gql`
  mutation UpdateAdvance($id: ObjectID!, $input: UpdateAdvanceInput!) {
    updateAdvance(id: $id, input: $input) {
      _id
      version
      createdAt
      updatedAt
      isActive
      total
      footer
      notes
    }
  }
`;

export const GET_FILES = gql`
  query Files($filter: FileFilterInput!) {
    files(filter: $filter) {
      version
      _id
      createdAt
      updatedAt
      isActive
      filename
      mimetype
      encoding
      url
      size
      ownerType
      documentType
      name
      details
    }
  }
`;

export const PATIENT_EXISTS = gql`
  query PatientExists($phone: String!) {
    patientExists(phone: $phone)
  }
`

export const PATIENT_BY_PHONE = gql`
  query PatientByPhone($phone: String!) {
    patientByPhone(phone: $phone) {
      _id
      seqNo
      phone
      email
      isActive
      userType
      profileData {
        ... on Patient {
          firstName
          lastName
          bio
          gender
          dob
          category
          profilePicture
          status
          cohort
          patientType
          centers {
            _id
            name
          }
        }
      }
    }
  }
`

export const PATIENT_APPOINTMENT_COUNT = gql`
  query PatientAppointmentCount($patientId: ObjectID!) {
    patientAppointmentCount(patientId: $patientId)
  }
`

export const GET_APPOINTMENT_BY_ID = gql`
  query GetAppointmentById($id: ID!) {
    appointment(id: $id) {
      _id
      createdAt
      updatedAt
      isActive
      status
      medium
      seqNo
      notes

      patient {
        _id
        email
        phone
        profileData {
          ... on Patient {
            firstName
            lastName
            gender
            dob
            profilePicture
          }
        }
      }

      consultant {
        _id
        email
        phone
        profileData {
          ... on Consultant {
            firstName
            lastName
            designation
            specialization
            profilePicture
          }
        }
      }

      center {
        name
        phone
        address {
          street
          city
          state
          country
          zip
        }
      }

      treatment {
        name
        internalName
        description
        price
        duration
      }
    }
  }
`;

export const SEND_APPOINTMENT_EMAIL = gql`
  mutation SendAppointmentEmail($input: SendAppointmentEmailInput!) {
    sendAppointmentEmail(input: $input) {
      success
      message
    }
  }
`;

export const SEND_CONSULTANT_MEET_INVITE = gql`
  mutation SendConsultantMeetInvite($input: SendConsultantMeetInviteInput!) {
    sendConsultantMeetInvite(input: $input) {
      success
      message
    }
  }
`;

export const UPDATE_APPOINTMENT_STATUS = gql`
  mutation UpdateAppointmentStatus($id: ObjectID!, $status: AppointmentStatus!) {
    updateAppointment(id: $id, input: { status: $status }) {
      _id
      status
    }
  }
`;

export const GENERATE_ONBOARDING_LINK = gql`
  mutation GenerateOnboardingLink($input: GenerateOnboardingLinkInput!) {
    generateOnboardingLink(input: $input) {
      url
      token
      expiresAt
    }
  }
`;

export const VALIDATE_ONBOARDING_TOKEN = gql`
  query ValidateOnboardingToken($token: String!) {
    validateOnboardingToken(token: $token) {
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
            bio
          }
        }
      }
      centerId
      slotStart
      slotEnd
      consultantId
      serviceId
      isReturningUser
    }
  }
`;

export const GET_FILTERED_CONSULTANTS = gql`
  query GetFilteredConsultants($filter: ConsultantFilterInput!) {
    getFilteredConsultants(filter: $filter) {
      _id
      seqNo
      phone
      email
      isActive
      userType
      profileData {
        ... on Consultant {
          firstName
          lastName
          bio
          dob
          gender
          profilePicture
          designation
          specialization
          allowOnlineBooking
          allowOnlineDelivery
          centers {
            _id
          }
        }
      }
    }
  }
`;

export const VERIFY_PAYMENT = gql`
  mutation VerifyPayment($orderId: ObjectID!, $razorpayPaymentId: String!) {
    verifyPayment(orderId: $orderId, razorpayPaymentId: $razorpayPaymentId) {
      success
      message
    }
  }
`;
