import React, { useEffect, useState, ChangeEvent } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui-atoms/Card';
import { Input } from '@/components/ui-atoms/Input';
import { Button } from '@/components/ui-atoms/Button';
import { GoalCategory, ObjectiveGoalRecord } from '@/gql/graphql';
import { Select } from '@/components/ui-atoms/Select';

interface Goal {
    goalName: string;
    unitName: string;
    value: string;
    goalCategory: GoalCategory;
    targetDate: string;
}

interface ObjectiveGoalsSectionProps {
    value?: { goals: Goal[] };
    onChange?: (value: { goals: ObjectiveGoalRecord[] }) => void;
    isCollapsed?: boolean;
    onToggle?: () => void;
}

const defaultGoal: Goal = {
    goalName: '',
    unitName: '',
    value: '',
    goalCategory: GoalCategory.Functional,
    targetDate: new Date().toISOString(),
};

const goalCategoryOptions = [
    { value: GoalCategory.Endurance, label: 'Endurance' },
    { value: GoalCategory.Functional, label: 'Functional' },
    { value: GoalCategory.Hold, label: 'Hold' },
    { value: GoalCategory.Pain, label: 'Pain' },
    { value: GoalCategory.Rom, label: 'ROM' },
    { value: GoalCategory.Stability, label: 'Stability' },
];

export const ObjectiveGoalsSection: React.FC<ObjectiveGoalsSectionProps> = ({
    value = { goals: [defaultGoal] },
    onChange,
    isCollapsed = false,
    onToggle,
}) => {
    const [goals, setGoals] = useState<Goal[]>(() =>
        value.goals?.length > 0
            ? value.goals.map(g => ({
                ...g,
                value: g?.value?.toString() ?? '',
            }))
            : [{ ...defaultGoal }]
    );

    useEffect(() => {
        if (value.goals?.length > 0) {
            setGoals(
                value.goals.map(g => ({
                    ...g,
                    value: g?.value?.toString() ?? '',
                }))
            );
        }
    }, [value]);

    const updateGoals = (newGoals: Goal[]) => {
        setGoals(newGoals);

        // Convert string values to ObjectiveGoalRecord format with proper types
        if (onChange) {
            onChange({
                goals: newGoals.map(goal => ({
                    goalName: goal.goalName,
                    unitName: goal.unitName,
                    value: goal.value === '' || goal.value === '-' ? 0 : parseFloat(goal.value) || 0,
                    goalCategory: goal.goalCategory,
                    targetDate: goal.targetDate,
                })),
            });
        }
    };

    const handleFieldChange = (index: number, field: keyof Goal, value: string | GoalCategory) => {
        const newGoals = [...goals];
        newGoals[index] = { ...newGoals[index], [field]: value };

        // For most fields, update immediately to ensure data isn't lost
        if (field !== 'value') {
            updateGoals(newGoals);
        } else {
            // For value field, just update local state
            setGoals(newGoals);
        }
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader
                className="bg-gray-50"
                isCollapsed={isCollapsed}
                onToggle={onToggle}
            >
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Objective Goals</h2>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={e => {
                            e.stopPropagation();
                            updateGoals([...goals, { ...defaultGoal }]);
                        }}
                    >
                        Add New
                    </Button>
                </div>
            </CardHeader>
            <CardContent isCollapsed={isCollapsed} className="px-4 py-3">
                {goals.map((goal, index) => (
                    <div key={index} className="grid grid-cols-6 gap-4 mb-4 relative">
                        <Input
                            className="col-span-2"
                            label="Goal Name"
                            multiline={true}
                            value={goal.goalName}
                            onChange={e => {
                                handleFieldChange(index, 'goalName', e.target.value);
                            }}
                        />
                        <Select
                            label="Goal Category"
                            value={goal.goalCategory}
                            options={goalCategoryOptions}
                            onChange={(e) => {
                                const selectedValue = typeof e === 'string' ? e : (e.target as HTMLSelectElement).value;
                                handleFieldChange(index, 'goalCategory', selectedValue as GoalCategory);
                            }}
                            placeholder="Select Category"
                        />
                        <Input
                            label="Unit"
                            multiline={true}
                            value={goal.unitName}
                            onChange={e => {
                                handleFieldChange(index, 'unitName', e.target.value);
                            }}
                        />
                        <Input
                            label="Value"
                            type="text"
                            inputMode="numeric"
                            value={goal.value}
                            onChange={e => {
                                const newGoals = [...goals];
                                newGoals[index] = { ...newGoals[index], value: e.target.value };
                                setGoals(newGoals);
                            }}
                            onBlur={e => {
                                const newGoals = [...goals];
                                const val = e.target.value;
                                newGoals[index] = {
                                    ...newGoals[index],
                                    value: val,
                                };
                                updateGoals(newGoals);
                            }}
                            onKeyDown={e => {
                                const allowedKeys = [
                                    'Backspace',
                                    'Delete',
                                    'ArrowLeft',
                                    'ArrowRight',
                                    'Tab',
                                    'Enter',
                                ];
                                const isNumber = /^[0-9]$/.test(e.key);
                                const isMinus = e.key === '-';
                                const isDecimal =
                                    e.key === '.' && !(e.target as HTMLInputElement).value.includes('.');

                                if (!isNumber && !isMinus && !isDecimal && !allowedKeys.includes(e.key)) {
                                    e.preventDefault();
                                    return;
                                }

                                const currentValue = (e.target as HTMLInputElement).value;
                                const selectionStart = (e.target as HTMLInputElement).selectionStart || 0;
                                const selectionEnd = (e.target as HTMLInputElement).selectionEnd || 0;
                                const isAllSelected = selectionStart === 0 && selectionEnd === currentValue.length;

                                if ((currentValue === '0' || isAllSelected) && (isNumber || isMinus)) {
                                    e.preventDefault();
                                    const newGoals = [...goals];
                                    newGoals[index] = { ...newGoals[index], value: e.key };
                                    setGoals(newGoals);
                                    return;
                                }

                                if (isMinus && selectionStart !== 0 && !isAllSelected) {
                                    e.preventDefault();
                                }
                            }}
                        />
                        <Input
                            label="Target Date"
                            type="date"
                            value={new Date(goal.targetDate || new Date()).toISOString().split('T')[0]}
                            onChange={e => {
                                handleFieldChange(index, 'targetDate', new Date(e.target.value).toISOString());
                            }}
                        />
                        {goals.length > 1 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute -right-2 top-0"
                                onClick={e => {
                                    e.stopPropagation();
                                    const newGoals = goals.filter((_, i) => i !== index);
                                    updateGoals(newGoals);
                                }}
                            >
                                ✕
                            </Button>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};
