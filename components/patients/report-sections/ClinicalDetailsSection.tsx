import React from 'react'
import { ClinicalRecord } from '@/gql/graphql'
import { Input } from '@/components/ui-atoms/Input'
import { Card, CardHeader, CardContent } from '@/components/ui-atoms/Card'

interface ClinicalDetailsSectionProps {
	value?: ClinicalRecord
	onChange?: (value: ClinicalRecord) => void
	isCollapsed?: boolean
	onToggle?: () => void
}

const defaultClinicalDetails: ClinicalRecord = {
	bodyChart: null,
	chiefComplaints: '',
	clientHistory: '',
	duration: '',
}

export const ClinicalDetailsSection: React.FC<ClinicalDetailsSectionProps> = ({
																				  value = defaultClinicalDetails,
																				  onChange,
																				  isCollapsed = false,
																				  onToggle,
																			  }) => {
	const handleChange = (newValue: ClinicalRecord) => {
		onChange?.(newValue)
	}

	return (
		<Card className="overflow-hidden">
			<CardHeader
				className="bg-gray-50"
				isCollapsed={isCollapsed}
				onToggle={onToggle}
			>
				<h2 className="text-lg font-semibold">Clinical Details</h2>
			</CardHeader>
			<CardContent isCollapsed={isCollapsed} className="px-4 py-3 space-y-4">
				<div>
					<Input
						label="Chief Complaints"
						multiline={true}
						className="min-h-[100px]"
						value={value.chiefComplaints || ''}
						onChange={(e) =>
							handleChange({
								...value,
								chiefComplaints: e.target.value,
							})
						}
					/>
				</div>
				<div>
					<Input
						label="Clinical History"
						multiline={true}
						className="min-h-[100px]"
						value={value.clientHistory || ''}
						onChange={(e) =>
							handleChange({
								...value,
								clientHistory: e.target.value,
							})
						}
					/>
				</div>
				<div>
					<Input
						label="Duration"
						multiline={true}
						value={value.duration || ''}
						onChange={(e) =>
							handleChange({
								...value,
								duration: e.target.value,
							})
						}
					/>
				</div>
			</CardContent>
		</Card>
	)
}
