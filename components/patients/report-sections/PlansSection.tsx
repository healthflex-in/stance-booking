import React from 'react';

import { Input } from '@/components/ui-atoms/Input';
import { Button } from '@/components/ui-atoms/Button';
import { Card, CardHeader, CardContent } from '@/components/ui-atoms/Card';

interface SetItem {
  repetitions: number;
  load: string;
  unit: string;
}

interface Duration {
  value: number;
  unit: string;
}

interface PlanItem {
  exercise: string;
  set: SetItem[];
  duration: Duration;
  comments: string;
}

interface PlanRecord {
  advice: string;
  plans: PlanItem[];
}

interface PlansSectionProps {
  value?: PlanRecord;
  onChange?: (value: PlanRecord) => void;
  isCollapsed?: boolean;
  onToggle?: () => void;
  onCopyFromSecondLastReport?: () => void;
  copyingFromSecondLastReport?: boolean;
}

const defaultSetItem: SetItem = {
  repetitions: 0,
  load: '',
  unit: '',
};

const defaultDuration: Duration = {
  value: 0,
  unit: 'minutes',
};

const defaultPlanItem: PlanItem = {
  exercise: '',
  set: [defaultSetItem, defaultSetItem, defaultSetItem],
  duration: defaultDuration,
  comments: '',
};

const defaultPlans: PlanRecord = {
  advice: '',
  plans: [defaultPlanItem],
};

export const PlansSection: React.FC<PlansSectionProps> = ({
  onChange,
  onToggle,
  isCollapsed = false,
  value = defaultPlans,
  onCopyFromSecondLastReport,
  copyingFromSecondLastReport = false,
}) => {
  const handleChange = (newValue: PlanRecord) => {
    onChange?.(newValue);
  };

  React.useEffect(() => {
    if (!value || !Array.isArray(value.plans) || value.plans.length === 0) {
      handleChange({
        ...(value || {}),
        plans: [defaultPlanItem],
      });
    }
  }, []);

  const plans =
    Array.isArray(value?.plans) && value.plans.length > 0
      ? value.plans
      : [defaultPlanItem];

  const addPlan = () => {
    handleChange({
      ...(value || {}),
      plans: [...plans, defaultPlanItem],
    });
  };

  const removePlan = (planIndex: number) => {
    const newPlans = plans.filter((_, i) => i !== planIndex);
    handleChange({
      ...(value || {}),
      plans: newPlans,
    });
  };

  const addSetItem = (planIndex: number) => {
    const newPlans = [...plans];
    const currentSets = newPlans[planIndex].set || [];
  
    // Find last non-empty set
    const lastFilledSet = [...currentSets]
      .reverse()
      .find((s) => s.repetitions > 0 || s.load?.trim() || s.unit?.trim());
  
    const copiedSet: SetItem = lastFilledSet
      ? {
          repetitions: lastFilledSet.repetitions,
          load: lastFilledSet.load,
          unit: lastFilledSet.unit,
        }
      : { repetitions: 0, load: '', unit: '' };
  
    newPlans[planIndex] = {
      ...newPlans[planIndex],
      set: [...currentSets, copiedSet],
    };
  
    handleChange({
      ...(value || {}),
      plans: newPlans,
    });
  };

  const removeSetItem = (planIndex: number, setIndex: number) => {
    const newPlans = [...plans];
    newPlans[planIndex] = {
      ...newPlans[planIndex],
      set: newPlans[planIndex].set.filter((_, i) => i !== setIndex),
    };
    handleChange({
      ...(value || {}),
      plans: newPlans,
    });
  };

  const handleSetFieldBlur = (
    field: 'repetitions' | 'load' | 'unit',
    planIndex: number,
    setIndex: number,
    fieldValue: string | number
  ) => {
    const newPlans = [...plans];

    for (let i = setIndex + 1; i < newPlans[planIndex].set.length; i++) {
      newPlans[planIndex].set[i] = {
        ...newPlans[planIndex].set[i],
        [field]: fieldValue,
      };
    }

    handleChange({
      ...(value || {}),
      plans: newPlans,
    });
  };
  
    return (
        <Card className="overflow-hidden">
            <CardHeader
                onToggle={onToggle}
                isCollapsed={isCollapsed}
                className="bg-gray-50 py-2 px-4"
            >
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Plans</h2>
                    <div className="flex items-center gap-2">
                        {/* Copy from second last report button */}
                        {onCopyFromSecondLastReport && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCopyFromSecondLastReport();
                                }}
                                disabled={copyingFromSecondLastReport}
                                className="flex items-center gap-2"
                            >
                                {copyingFromSecondLastReport ? 'Copying...' : 'Copy'}
                            </Button>
                        )}
                        <Button
                            size="sm"
                            type="button"
                            variant="outline"
                            onClick={(e) => {
                                e.stopPropagation();
                                addPlan();
                            }}
                        >
                            Add New Exercise
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent isCollapsed={isCollapsed} className="px-4 py-3"> 
                <div className="mb-8">
                    <Input
                        label="Advice"
                        multiline={true}
                        className="min-h-[40px]"
                        value={value?.advice || ''}
                        onChange={(e) => handleChange({...value, advice: e.target.value})}
                    />
                </div>

                {/* Plans Section */}
                <div className="space-y-8">
                    {plans.map((plan, planIndex) => (
                        <div
                            key={planIndex}
                            className="border rounded-md p-6 space-y-6 relative"
                        >
                            <div
                                className="grid grid-cols-1 md:grid-cols-[auto_2fr_0.7fr_0.8fr_2fr_auto] gap-4 mb-4 items-center">

                                {/* Exercise Header */}
                                <div className="flex items-center">
                                    <h3 className="text-lg font-medium">
                                        Exercise {planIndex + 1}
                                    </h3>
                                </div>

                                {/* Plan Exercise Field */}
                                <div>
                                    <Input
                                        label="Exercise"
                                        multiline={true}
                                        value={plan?.exercise || ""}
                                        onChange={(e) => {
                                            const newPlans = [...plans];
                                            newPlans[planIndex] = {
                                                ...newPlans[planIndex],
                                                exercise: e.target.value,
                                            };
                                            handleChange({
                                                ...value,
                                                plans: newPlans,
                                            });
                                        }}
                                    />
                                </div>

                                {/* Duration Value Field */}
                                <div>
                                    <Input
                                        label="Duration Value"
                                        type="number"
                                        value={plan?.duration?.value?.toString() || "0"}
                                        onChange={(e) => {
                                            const newPlans = [...plans];
                                            newPlans[planIndex] = {
                                                ...newPlans[planIndex],
                                                duration: {
                                                    ...(plan?.duration || defaultDuration),
                                                    value: parseInt(e.target.value) || 0,
                                                },
                                            };
                                            handleChange({
                                                ...value,
                                                plans: newPlans,
                                            });
                                        }}
                                    />
                                </div>

                                {/* Duration Unit Field */}
                                <div>
                                    <Input
                                        label="Duration Unit"
                                        multiline={true}
                                        value={plan?.duration?.unit ?? ""}
                                        onChange={(e) => {
                                            const newPlans = [...plans];
                                            newPlans[planIndex] = {
                                                ...newPlans[planIndex],
                                                duration: {
                                                    ...(plan?.duration || defaultDuration),
                                                    unit: e.target.value,
                                                },
                                            };
                                            handleChange({
                                                ...value,
                                                plans: newPlans,
                                            });
                                        }}
                                    />
                                </div>

                                {/* Comments Field */}
                                <div>
                                    <Input
                                        label="Comments"
                                        multiline={true}
                                        value={plan?.comments || ""}
                                        onChange={(e) => {
                                            const newPlans = [...plans];
                                            newPlans[planIndex] = {
                                                ...newPlans[planIndex],
                                                comments: e.target.value,
                                            };
                                            handleChange({
                                                ...value,
                                                plans: newPlans,
                                            });
                                        }}
                                    />
                                </div>

                                {/* Remove Button - Moved to the end and made smaller */}
                                <div className="flex justify-end items-center">
                                    {plans.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="xxxs"
                                            onClick={() => removePlan(planIndex)}
                                        >
                                            ✕
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 bg-gray-50 p-4 rounded-md">
                            <div className="space-y-3">
                                    {(plan.set || []).map((setItem, setIndex) => (
                                        <div
                                            key={setIndex}
                                            className="grid grid-cols-[auto_0.7fr_0.7fr_0.7fr_auto] gap-x-3 items-center bg-white p-3 rounded-md border"

                                        >
                                            {/* Set Number */}
                                            <div className="text-sm text-gray-600 font-medium pr-2">
                                                Set {setIndex + 1}
                                            </div>

                                            {/* Repetitions Input */}
                                            <div>
                                                <Input
                                                    label="Repetitions"
                                                    type="number"
                                                    value={setItem?.repetitions?.toString() || '0'}
                                                    onChange={(e) => {
                                                        const newPlans = [...plans];
                                                        const newSets = [...(newPlans[planIndex].set || [])];
                                                        newSets[setIndex] = {
                                                            ...newSets[setIndex],
                                                            repetitions: parseInt(e.target.value) || 0,
                                                        };
                                                        newPlans[planIndex] = {
                                                            ...newPlans[planIndex],
                                                            set: newSets,
                                                        };
                                                        handleChange({
                                                            ...value,
                                                            plans: newPlans,
                                                        });
                                                    }}
                                                    onBlur={(e) =>
                                                        handleSetFieldBlur(
                                                            'repetitions',
                                                            planIndex,
                                                            setIndex,
                                                            parseInt(e.target.value) || 0
                                                        )
                                                    }
                                                />
                                            </div>

                                            {/* Load Input */}
                                            <div>
                                                <Input
                                                    label="Load"
                                                    value={setItem?.load || ''}
                                                    onChange={(e) => {
                                                        const newPlans = [...plans];
                                                        const newSets = [...(newPlans[planIndex].set || [])];
                                                        newSets[setIndex] = {
                                                            ...newSets[setIndex],
                                                            load: e.target.value,
                                                        };
                                                        newPlans[planIndex] = {
                                                            ...newPlans[planIndex],
                                                            set: newSets,
                                                        };
                                                        handleChange({
                                                            ...value,
                                                            plans: newPlans,
                                                        });
                                                    }}
                                                    onBlur={(e) =>
                                                        handleSetFieldBlur(
                                                            'load',
                                                            planIndex,
                                                            setIndex,
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </div>

                                            {/* Unit Input */}
                                            <div>
                                                <Input
                                                    label="Unit"
                                                    multiline={true}
                                                    value={setItem?.unit || ''}
                                                    onChange={(e) => {
                                                        const newPlans = [...plans];
                                                        const newSets = [...(newPlans[planIndex].set || [])];
                                                        newSets[setIndex] = {
                                                            ...newSets[setIndex],
                                                            unit: e.target.value,
                                                        };
                                                        newPlans[planIndex] = {
                                                            ...newPlans[planIndex],
                                                            set: newSets,
                                                        };
                                                        handleChange({
                                                            ...value,
                                                            plans: newPlans,
                                                        });
                                                    }}
                                                    onBlur={(e) =>
                                                        handleSetFieldBlur(
                                                            'unit',
                                                            planIndex,
                                                            setIndex,
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </div>

                                            {/* Remove Set Button */}
                                            <div className="flex justify-center items-center pl-2">
                                                {plan.set && plan.set.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="xxxs"
                                                        onClick={() => removeSetItem(planIndex, setIndex)}
                                                    >
                                                        ✕
                                                    </Button>
                                                )}
                                            </div>


                                        </div>
                                    ))}
                                    <div className="flex justify-end mt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                addSetItem(planIndex);
                                            }}
                                        >
                                            Add Set
                                        </Button>
                                    </div>

                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};