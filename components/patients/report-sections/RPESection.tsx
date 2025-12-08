import React from 'react'
import {RpeInput, RpeRecord} from '@/gql/graphql'
import {Input} from '@/components/ui-atoms/Input'
import {Card, CardHeader, CardContent} from '@/components/ui-atoms/Card'

interface RPRSectionProps {
    value?: RpeRecord
    onChange?: (value: RpeInput) => void
    isCollapsed?: boolean
    onToggle?: () => void
}

const defaultRPE: RpeRecord = {
    value: 0,
}

export const RPESection: React.FC<RPRSectionProps> = ({
                                                          value = defaultRPE,
                                                          onChange,
                                                          isCollapsed = false,
                                                          onToggle,
                                                      }) => {
    // Convert the number to string for display in the input
    const displayValue = value?.value?.toString() || '0'

    return (
        <Card className="overflow-hidden">
            <CardHeader
                className="bg-gray-50"
                isCollapsed={isCollapsed}
                onToggle={onToggle}
            >
                <h2 className="text-lg font-semibold">RPE</h2>
            </CardHeader>
            <CardContent isCollapsed={isCollapsed} className="px-4 py-3">
                <Input
                    type="text"
                    value={displayValue}
                    onChange={(e) => {
                        const newValue = e.target.value

                        // If empty or not a number, set to 0
                        if (newValue === '' || isNaN(Number(newValue))) {
                            onChange?.({
                                value: 0,
                            })
                            return
                        }

                        // Convert string to number to ensure correct type
                        onChange?.({
                            value: Number(newValue),
                        })
                    }}
                    min="0"
                    max="10"
                />
            </CardContent>
        </Card>
    )
}