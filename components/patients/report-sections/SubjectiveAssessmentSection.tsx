import React from 'react';
import {Card, CardHeader, CardContent} from '@/components/ui-atoms/Card';
import {Input} from '@/components/ui-atoms/Input';
import {SubjectiveRecord} from '@/gql/graphql';

interface SubjectiveAssessmentSectionProps {
    value?: SubjectiveRecord;
    onChange?: (value: SubjectiveRecord) => void;
    isCollapsed?: boolean
    onToggle?: () => void
}

const defaultSubjectiveAssessment: SubjectiveRecord = {
    assessment: ''
};

export const SubjectiveAssessmentSection: React.FC<SubjectiveAssessmentSectionProps> = ({
                                                                                            value = defaultSubjectiveAssessment,
                                                                                            onChange,
                                                                                            isCollapsed = false,
                                                                                            onToggle,
                                                                                        }) => {
    const handleChange = (newValue: SubjectiveRecord) => {
        onChange?.(newValue);
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader
                className="bg-gray-50"
                isCollapsed={isCollapsed}
                onToggle={onToggle}
            >
                <h2 className="text-lg font-semibold">Subjective Assessment</h2>
            </CardHeader>
            <CardContent isCollapsed={isCollapsed} className="px-4 py-3">
                <Input
                    label="Assessment"
                    multiline={true}
                    className="min-h-[100px]"
                    value={value.assessment || ''}
                    onChange={(e) => handleChange({
                        assessment: e.target.value
                    })}
                />
            </CardContent>
        </Card>
    );
}; 