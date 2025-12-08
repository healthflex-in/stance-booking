import React from 'react';
import {Input} from '@/components/ui-atoms/Input';
import {SubjectiveGoalRecord} from '@/gql/graphql';
import {Button} from '@/components/ui-atoms/Button';
import {Card, CardHeader, CardContent} from '@/components/ui-atoms/Card';


interface GoalsSectionProps {
    value?: { subjectiveGoals: SubjectiveGoalRecord[] };
    onChange?: (value: { subjectiveGoals: SubjectiveGoalRecord[] }) => void;
    isCollapsed?: boolean
    onToggle?: () => void
}

const defaultGoals: { subjectiveGoals: SubjectiveGoalRecord[] } = {
    subjectiveGoals: [{goal: '', targetDate: new Date().toISOString()}]
};

export const SubjectiveGoalsSection: React.FC<GoalsSectionProps> = ({
                                                                        value = defaultGoals,
                                                                        onChange,
                                                                        isCollapsed = false,
                                                                        onToggle,
                                                                    }) => {
    const handleChange = (newValue: { subjectiveGoals: SubjectiveGoalRecord[] }) => {
        onChange?.(newValue);
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader
                className="bg-gray-50"
                isCollapsed={isCollapsed}
                onToggle={onToggle}
            >
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Subjective Goals</h2>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent collapse
                            handleChange({
                                subjectiveGoals: [...(value.subjectiveGoals || []), {
                                    goal: '',
                                    targetDate: new Date().toISOString()
                                }]
                            })
                        }}
                    >
                        Add New
                    </Button>
                </div>
            </CardHeader>
            <CardContent isCollapsed={isCollapsed} className="px-4 py-3">
                {value.subjectiveGoals?.map((goal, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 mb-4 relative">
                        <Input
                            className="col-span-2"
                            label="Goal Name"
                            multiline={true}
                            value={goal?.goal || ''}
                            onChange={(e) => {
                                const newGoals = [...(value.subjectiveGoals || [])];
                                newGoals[index] = {...newGoals[index], goal: e.target.value};
                                handleChange({
                                    subjectiveGoals: newGoals
                                });
                            }}
                        />
                        <Input
                            label="Target Date"
                            type="date"
                            value={new Date(goal?.targetDate || new Date()).toISOString().split('T')[0]}
                            onChange={(e) => {
                                const newGoals = [...(value.subjectiveGoals || [])];
                                newGoals[index] = {
                                    ...newGoals[index],
                                    targetDate: new Date(e.target.value).toISOString()
                                };
                                handleChange({
                                    subjectiveGoals: newGoals
                                });
                            }}

                        />
                        {(value.subjectiveGoals || []).length > 0 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute -right-2"
                                onClick={() => {
                                    const newGoals = (value.subjectiveGoals || []).filter((_, i) => i !== index);
                                    handleChange({
                                        subjectiveGoals: newGoals
                                    });
                                }}
                            >
                                x
                            </Button>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

