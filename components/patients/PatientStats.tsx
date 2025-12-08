'use client';

import React from 'react';
import { User } from '@/gql/graphql';
import { Card } from '@/components/ui-atoms/Card';

interface PatientStatsProps {
  patients: User[];
  loading: boolean;
}

export default function PatientStats({ patients, loading }: PatientStatsProps) {
  const totalPatients = patients?.length || 0;
  const activePatients = patients?.filter((p: User) => p.isActive).length || 0;
  const inactivePatients = totalPatients - activePatients;

  // Calculate gender distribution
  const malePatients = patients?.filter((p: User) => p.profileData && 'gender' in p.profileData && p.profileData.gender === 'MALE').length || 0;
  const femalePatients = patients?.filter((p: User) => p.profileData && 'gender' in p.profileData && p.profileData.gender === 'FEMALE').length || 0;
  const otherGenderPatients = totalPatients - malePatients - femalePatients;

  const stats = [
    { title: 'Total Patients', value: loading ? '...' : totalPatients, color: 'bg-blue-500' },
    { title: 'Active Patients', value: loading ? '...' : activePatients, color: 'bg-green-500' },
    { title: 'Male Patients', value: loading ? '...' : malePatients, color: 'bg-indigo-500' },
    { title: 'Female Patients', value: loading ? '...' : femalePatients, color: 'bg-pink-500' },
  ];

  return (
    <>
      {stats.map((stat, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-center">
            <div className={`w-12 h-12 rounded-full ${stat.color} flex items-center justify-center text-white`}>
              {stat.value}
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-primary">{stat.title}</h3>
              <p className="text-sm text-gray-500">{stat.value} patients</p>
            </div>
          </div>
        </Card>
      ))}
    </>
  );
} 