'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { CREATE_APPOINTMENT } from '@/gql/queries';

import { PrepaidPatientOnboarding } from '@/components/onboarding/shared';

type BookingStep = 'patient-onboarding';

interface BookingData {
  sessionType: 'in-person' | 'online' | null;
  location: string;
  selectedDate: string;
  selectedTimeSlot: string | { startTime: string; endTime: string; displayTime: string };
  selectedFullDate?: Date;
  consultantId: string;
  treatmentId: string;
  treatmentPrice: number;
  treatmentDuration: number;
  patientId: string;
  centerId: string;
  assessmentType?: 'in-person' | 'online';
  isNewUser: boolean;
  appointmentId?: string;
  designation?: string;
}

export default function BookPrepaidPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<BookingStep>('patient-onboarding');
  const [createAppointment] = useMutation(CREATE_APPOINTMENT);
  const [bookingData, setBookingData] = useState<BookingData>({
    sessionType: 'online',
    location: '',
    selectedDate: '',
    selectedTimeSlot: '',
    consultantId: '',
    treatmentId: '',
    treatmentPrice: 0,
    treatmentDuration: 20,
    patientId: '',
    centerId: '',
    assessmentType: 'online',
    isNewUser: true,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const centerIdFromUrl = urlParams.get('centerId');
    const centerIdFromStorage = localStorage.getItem('centerId');
    const centerId = centerIdFromUrl || centerIdFromStorage || process.env.NEXT_PUBLIC_DEFAULT_CENTER_ID || '67fe36545e42152fb5185a6c';
    
    setBookingData(prev => ({ ...prev, centerId }));
  }, [mounted]);

  const handlePatientOnboardingComplete = (patientId: string, isNewUser: boolean) => {
    sessionStorage.setItem('patientId', patientId);
    sessionStorage.setItem('centerId', bookingData.centerId || '');
    sessionStorage.setItem('isNewUser', isNewUser.toString());
    
    if (isNewUser) {
      router.replace('/book-prepaid/new');
    } else {
      router.replace('/book-prepaid/repeat');
    }
  };

  const getStepTitle = () => {
    return 'Stance Health';
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const BookingContent = () => (
    <>
      <div className="h-full bg-gray-50 flex flex-col">
        <div className="flex-1 overflow-hidden">
          {currentStep === 'patient-onboarding' && (
            <PrepaidPatientOnboarding
              centerId={bookingData.centerId || process.env.NEXT_PUBLIC_DEFAULT_CENTER_ID || '67fe36545e42152fb5185a6c'}
              onComplete={handlePatientOnboardingComplete}
              onBack={() => router.push('/book')}
            />
          )}
        </div>
      </div>
    </>
  );

  if (typeof window !== 'undefined' && window.innerWidth >= 768) {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50" />
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
        
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-sm mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden relative" style={{ height: '90vh' }}>
            <div className="h-full overflow-y-auto">
              <BookingContent />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <BookingContent />;
}
