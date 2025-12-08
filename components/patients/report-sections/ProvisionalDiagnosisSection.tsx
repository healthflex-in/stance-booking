import React from 'react';
import {Card, CardHeader, CardContent} from '@/components/ui-atoms/Card';
import {Input} from '@/components/ui-atoms/Input';
import {ProvisionalRecord} from '@/gql/graphql';

interface ProvisionalDiagnosisSectionProps {
    value?: ProvisionalRecord;
    onChange?: (value: ProvisionalRecord) => void;
    isCollapsed?: boolean
    onToggle?: () => void
}

const defaultProvisionalDiagnosis: ProvisionalRecord = {
    diagnosis: ''
};

export const ProvisionalDiagnosisSection: React.FC<ProvisionalDiagnosisSectionProps> = ({
                                                                                            value = defaultProvisionalDiagnosis,
                                                                                            onChange,
                                                                                            isCollapsed = false,
                                                                                            onToggle,
                                                                                        }) => {
    const handleChange = (newValue: ProvisionalRecord) => {
        onChange?.(newValue);
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader
                className="bg-gray-50"
                isCollapsed={isCollapsed}
                onToggle={onToggle}
            >
                <h2 className="text-lg font-semibold">Provisional Diagnosis</h2>
            </CardHeader>
            <CardContent isCollapsed={isCollapsed} className="px-4 py-3">
                <Input
                    label="Diagnosis"
                    multiline={true}
                    className="min-h-[100px]"
                    value={value.diagnosis || ''}
                    onChange={(e) => handleChange({
                        diagnosis: e.target.value
                    })}
                />
            </CardContent>
        </Card>
    );
};