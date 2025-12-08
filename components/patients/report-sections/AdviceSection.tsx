import React from 'react';
import {AdviceRecord} from '@/gql/graphql';
import {Input} from '@/components/ui-atoms/Input';
import {Card, CardHeader, CardContent} from '@/components/ui-atoms/Card';

interface AdviceSectionProps {
    value?: AdviceRecord;
    onChange?: (value: AdviceRecord) => void;
    isCollapsed?: boolean
    onToggle?: () => void
}

const defaultAdvice: AdviceRecord = {
    advice: ''
};

export const AdviceSection: React.FC<AdviceSectionProps> = ({
                                                                value = defaultAdvice,
                                                                onChange,
                                                                isCollapsed = false,
                                                                onToggle,
                                                            }) => {
    const handleChange = (newValue: AdviceRecord) => {
        onChange?.(newValue);
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader
                className="bg-gray-50"
                isCollapsed={isCollapsed}
                onToggle={onToggle}
            >
                <h2 className="text-lg font-semibold">Advice</h2>
            </CardHeader>
            <CardContent isCollapsed={isCollapsed} className="px-4 py-3">
                <Input
                    label="Advice"
                    multiline={true}
                    className="min-h-[100px]"
                    value={value.advice || ''}
                    onChange={(e) => handleChange({
                        advice: e.target.value
                    })}
                />
            </CardContent>
        </Card>
    );
}; 