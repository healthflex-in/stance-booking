import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

import { AppointmentEvent, AppointmentStatus } from '@/gql/graphql';
import { StatusTags } from './components/StatusTags';
import { Button } from '@/components/ui-atoms/Button';
import { Drawer } from '@/components/ui-atoms/Drawer';
import CancelAppointmentModal from './CancelAppointmentModal';
import {
	NotesSection,
	CenterInfoSection,
	PatientInfoSection,
	TreatmentInfoSection,
	ConsultantInfoSection
} from './components/AppointmentDetailsComponents';

interface AppointmentDetailsDrawerProps {
	isOpen: boolean;
	onClose: () => void;
	appointment: AppointmentEvent;
	onEdit?: () => void;
	onCancel?: (cancellationReason: string, cancellationNote: string) => void;
	onReschedule?: () => void;
	onDuplicate?: () => void;
	editable?: boolean;
	isCancelling?: boolean;
}

/**
 * Drawer to display appointment details
 * Uses modular components to separate UI concerns
 */
export default function AppointmentDetailsDrawer({
													 isOpen,
													 onClose,
													 appointment,
													 onEdit,
													 onCancel,
													 onReschedule,
													 onDuplicate,
													 editable,
													 isCancelling = false,
												 }: AppointmentDetailsDrawerProps) {
	const [showCancelModal, setShowCancelModal] = useState(false);

	const handleCancelConfirm = (cancellationReason: string, cancellationNote: string) => {
		if (onCancel) {
			onCancel(cancellationReason, cancellationNote);
		}
		setShowCancelModal(false);
	};

	const isCancelled = appointment?.appointment?.status === AppointmentStatus.Cancelled;
	return (
		<>
		<Drawer
			isOpen={isOpen}
			onClose={onClose}
			title={`${appointment?.seqNo || 'Appointment Details'}`}
			titleIcon={<Calendar className="w-6 h-6" />}
			width="w-[480px]"
			footerAction={
				editable && !isCancelled && onEdit ? (
					<Button
						onClick={onEdit}
						type="button"
						variant="glow"
						className='w-full'
					>
						Edit
					</Button>
				) : null
			}
		>
			{appointment ? (
				<div className="space-y-4">
					{/* Status tags section */}
					<StatusTags appointment={appointment} />

					{/* Center Information */}
					<CenterInfoSection center={appointment.appointment.center} />

					{/* Patient Information */}
					<PatientInfoSection patient={appointment.appointment?.patient} />

					{/* Consultant Information */}
					<ConsultantInfoSection consultant={appointment.appointment?.consultant} />

					{/* Treatment Information */}
					<TreatmentInfoSection treatment={appointment.appointment?.treatment} />

					{/* Appointment Notes */}
					<NotesSection notes={appointment.appointment?.notes || ''} />

					{/* Cancellation Note */}
					{isCancelled && (appointment.appointment?.cancellationReason || appointment.appointment?.cancellationNote) && (
						<div className="p-4 bg-red-50 border border-red-200 rounded-lg">
							<h3 className="text-sm font-semibold text-red-900 mb-2">Cancellation Details</h3>
							{appointment.appointment.cancellationReason && (
								<p className="text-sm text-red-700 mb-2">Reason: {appointment.appointment.cancellationReason}</p>
							)}
							{appointment.appointment.cancellationNote && (
								<p className="text-sm text-red-700 mb-2">Note: {appointment.appointment.cancellationNote}</p>
							)}
							{appointment.appointment?.cancelledAt && (
								<p className="text-xs text-red-600">
									Cancelled on: {new Date(appointment.appointment.cancelledAt).toLocaleString()}
								</p>
							)}
							{appointment.appointment?.cancelledBy && (
								<p className="text-xs text-red-600">
									Cancelled by: {appointment.appointment.cancelledBy.profileData?.firstName} {appointment.appointment.cancelledBy.profileData?.lastName}
								</p>
							)}
							{appointment.appointment?.rescheduledTo && (
								<p className="text-xs text-red-600 mt-2">
									Rescheduled to: {appointment.appointment.rescheduledTo.seqNo}
								</p>
							)}
						</div>
					)}

					{/* Reschedule History */}
					{appointment.appointment?.rescheduledFrom && appointment.appointment.rescheduledFrom.length > 0 && (
						<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
							<h3 className="text-sm font-semibold text-blue-900 mb-2">Reschedule History</h3>
							<p className="text-sm text-blue-700">
								This appointment was rescheduled from: <span className="font-semibold">#{appointment.appointment.rescheduledFrom.map((a: any) => a.seqNo).join(' → #')}</span>
							</p>
						</div>
					)}
				</div>
			) : (
				<div className="flex items-center justify-center h-full">
					<p className="text-gray-500">No appointment selected</p>
				</div>
			)}
		</Drawer>

		<CancelAppointmentModal
			isOpen={showCancelModal}
			onClose={() => setShowCancelModal(false)}
			onConfirm={handleCancelConfirm}
			isLoading={isCancelling}
		/>
	</>
	);
}
