import React from 'react';
import {Input} from '@/components/ui-atoms/Input';
import {Card, CardHeader, CardContent} from '@/components/ui-atoms/Card';


interface DoctorsNoteSectionProps {
    value?: string;
    onChange?: (value: string) => void;
    isCollapsed?: boolean
    onToggle?: () => void
}

export const DoctorsNoteSection: React.FC<DoctorsNoteSectionProps> = ({
                                                                            value = '',
                                                                            onChange,
                                                                            isCollapsed = false,
                                                                            onToggle,
                                                                        }) => {
    const handleChange = (newValue: string) => {
        onChange?.(newValue);
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader
                className="bg-gray-50"
                isCollapsed={isCollapsed}
                onToggle={onToggle}
            >
                <h2 className="text-lg font-semibold">Clinical Notes</h2>
            </CardHeader>
            <CardContent isCollapsed={isCollapsed} className="px-4 py-3">
                <Input
                    label="Notes"
                    multiline={true}
                    className="min-h-[100px]"
                    value={value || ''}
                    onChange={(e) => handleChange(e.target.value)}
                    // placeholder="Enter doctor's notes here..."
                />
            </CardContent>
        </Card>
    );
};
