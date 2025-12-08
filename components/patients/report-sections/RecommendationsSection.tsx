import React from 'react'
import {Input} from '@/components/ui-atoms/Input'
import {Select} from '@/components/ui-atoms/Select'
import {Button} from '@/components/ui-atoms/Button'
import {
    SessionType,
    SessionFrequency,
    RecommendationRecordInput,
} from '@/gql/graphql'
import {Card, CardHeader, CardContent} from '@/components/ui-atoms/Card'

interface RecommendationsSectionProps {
    value?: { recommendations: RecommendationRecordInput[] }
    onChange?: (value: { recommendations: RecommendationRecordInput[] }) => void
    isCollapsed?: boolean
    onToggle?: () => void
}

const defaultRecommendations: { recommendations: RecommendationRecordInput[] } =
    {
        recommendations: [
            {
                sessionType: SessionType.Physiotherapy,
                frequency: SessionFrequency.Weekly,
                sessionCount: 0,
                plans: '',
            },
        ],
    }

export const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({
                                                                                  value = defaultRecommendations,
                                                                                  onChange,
                                                                                  isCollapsed = false,
                                                                                  onToggle,
                                                                              }) => {
    const handleChange = (newValue: {
        recommendations: RecommendationRecordInput[]
    }) => {
        onChange?.(newValue)
    }

    React.useEffect(() => {
        if (!value.recommendations || value.recommendations.length === 0) {
            handleChange(defaultRecommendations)
        }
    }, [value.recommendations])

    return (
        <Card className="overflow-hidden">
            <CardHeader
                className="bg-gray-50"
                isCollapsed={isCollapsed}
                onToggle={onToggle}
            >
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Recommendations</h2>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent collapse
                            handleChange({
                                recommendations: [
                                    ...(value.recommendations || []),
                                    {
                                        sessionType: SessionType.Physiotherapy,
                                        frequency: SessionFrequency.Weekly,
                                        sessionCount: 0,
                                        plans: '',
                                    },
                                ],
                            })
                        }}
                    >
                        Add New
                    </Button>
                </div>
            </CardHeader>
            <CardContent isCollapsed={isCollapsed} className="px-4 py-3">
                {value.recommendations?.map((rec, index) => (
                    <div key={index} className="relative mb-3">
                        <div className="grid md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.5fr)_minmax(0,0.5fr)_minmax(250px,2fr)_auto] gap-4 items-center">
                        <Select
                                label="Session Type"
                                value={rec?.sessionType || SessionType.Physiotherapy}
                                options={[
                                    {value: SessionType.Physiotherapy, label: 'Physiotherapy'},
                                    {value: SessionType.StrengthAndConditioning, label: 'Strength and Conditioning'},
                                    {value: SessionType.SportsMassageTherapy, label: 'Sports Massage Therapy'},
                                ]}
                                onChange={(e) => {
                                    const selectedValue = typeof e === 'string' ? e : e.target.value
                                    const newRecs = [...(value.recommendations || [])]
                                    newRecs[index] = {
                                        ...newRecs[index],
                                        sessionType: selectedValue as SessionType,
                                        frequency:
                                            newRecs[index]?.frequency || SessionFrequency.Weekly,
                                        sessionCount: newRecs[index]?.sessionCount || 0,
                                        plans: newRecs[index]?.plans || '',
                                    }
                                    handleChange({
                                        recommendations: newRecs,
                                    })
                                }}
                            />
                            <Select
                                label="Frequency"
                                value={rec?.frequency || SessionFrequency.Weekly}
                                options={[
                                    {value: SessionFrequency.Daily, label: 'Daily'},
                                    {value: SessionFrequency.Weekly, label: 'Weekly'},
                                    {value: SessionFrequency.Monthly, label: 'Monthly'},
                                ]}
                                onChange={(e) => {
                                    const selectedValue = typeof e === 'string' ? e : e.target.value
                                    const newRecs = [...(value.recommendations || [])]
                                    newRecs[index] = {
                                        ...newRecs[index],
                                        frequency: selectedValue as SessionFrequency,
                                        sessionType:
                                            newRecs[index]?.sessionType || SessionType.Physiotherapy,
                                        sessionCount: newRecs[index]?.sessionCount || 0,
                                        plans: newRecs[index]?.plans || '',
                                    }
                                    handleChange({
                                        recommendations: newRecs,
                                    })
                                }}
                            />
                            <Input
                                label="Count"
                                type="string"
                                value={rec?.sessionCount?.toString() || '0'}
                                maxLength={2}
                                onChange={(e) => {
                                    const selectedValue = Number(e.target.value)
                                    const newRecs = [...(value.recommendations || [])]
                                    newRecs[index] = {
                                        ...newRecs[index],
                                        sessionCount: selectedValue,
                                        frequency: newRecs[index]?.frequency || SessionFrequency.Weekly,
                                        sessionType:
                                            newRecs[index]?.sessionType || SessionType.Physiotherapy,
                                        plans: newRecs[index]?.plans || '',
                                    }
                                    handleChange({
                                        recommendations: newRecs,
                                    })
                                }}
                            />
                            <Input
                                label="Plans"
                                type="text"
                                value={rec?.plans || ' '}
                                placeholder="Enter treatment plans or notes..."
                                onChange={(e) => {
                                    const selectedValue = e.target.value
                                    const newRecs = [...(value.recommendations || [])]
                                    newRecs[index] = {
                                        ...newRecs[index],
                                        plans: selectedValue,
                                        frequency: newRecs[index]?.frequency || SessionFrequency.Weekly,
                                        sessionType:
                                            newRecs[index]?.sessionType || SessionType.Physiotherapy,
                                        sessionCount: newRecs[index]?.sessionCount || 0,
                                    }
                                    handleChange({
                                        recommendations: newRecs,
                                    })
                                }}
                            />
                            {(value.recommendations || []).length > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="-right-2 -top-2"
                                    onClick={() => {
                                        const newRecs = (value.recommendations || []).filter(
                                            (_, i) => i !== index,
                                        )
                                        handleChange({
                                            recommendations: newRecs,
                                        })
                                    }}
                                >
                                    ✕
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
