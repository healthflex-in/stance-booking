import React, {useEffect, useState} from 'react';
import {Card, CardHeader, CardContent} from '@/components/ui-atoms/Card';
import {Input} from '@/components/ui-atoms/Input';
import {Button} from '@/components/ui-atoms/Button';
import {ObjectiveAssessmentRecord} from '@/gql/graphql';

interface ObjectiveAssessmentSectionProps {
    value?: ObjectiveAssessmentRecord;
    onChange?: (value: ObjectiveAssessmentRecord) => void;
    isCollapsed?: boolean
    onToggle?: () => void
}

const defaultTest = {
    testName: '',
    unitName: '',
    value: '',
    right: '',
    left: '',
    comments: '',
};

export const ObjectiveAssessmentSection: React.FC<ObjectiveAssessmentSectionProps> = ({
                                                                                          value = {tests: []},
                                                                                          onChange,
                                                                                          isCollapsed = false,
                                                                                          onToggle
                                                                                      }) => {
    const [tests, setTests] = useState(() => {
        if (value.tests?.length > 0) {
            return value.tests.map(t => ({
                testName: t?.testName ?? '',
                unitName: t?.unitName ?? '',
                value: t?.value?.toString() ?? '',
                right: t?.right?.toString() ?? '',
                left: t?.left?.toString() ?? '',
                comments: t?.comments ?? '',
            }));
        }
        return [{...defaultTest}];
    });

    useEffect(() => {
        if (value.tests?.length > 0) {
            setTests(value.tests.map(t => ({
                testName: t?.testName ?? '',
                unitName: t?.unitName ?? '',
                value: t?.value?.toString() ?? '',
                right: t?.right?.toString() ?? '',
                left: t?.left?.toString() ?? '',
                comments: t?.comments ?? '',
            })));
        }
    }, [value]);

    const updateTests = (newTests: typeof tests) => {
        const testsCopy = newTests.map(test => ({
            ...test,
            value: test.value === '' ? '' : test.value,
            right: test.right === '' ? '' : test.right,
            left: test.left === '' ? '' : test.left,
        }));
        setTests(testsCopy);

        // Convert to proper format before sending to parent
        onChange?.({
            tests: testsCopy.map(test => ({
                testName: test.testName,
                unitName: test.unitName,
                value: test.value === '' ? '' : test.value,
                right: test.right === '' ? '' : test.right,
                left: test.left === '' ? '' : test.left,
                comments: test.comments
            }))
        });
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader
                className="bg-gray-50"
                isCollapsed={isCollapsed}
                onToggle={onToggle}
            >
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Objective Assessments</h2>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent event bubbling to header
                            updateTests([...tests, {...defaultTest}]);
                        }}
                    >
                        Add New
                    </Button>
                </div>
            </CardHeader>
            <CardContent isCollapsed={isCollapsed} className="px-4 py-3">
                {tests.map((test, index) => (
                    <div key={index} className="mb-4 relative border rounded-lg p-4">
                        <div className="grid grid-cols-5 gap-4">
                            <Input
                                className="col-span-3"
                                label="Test Name"
                                multiline={true}
                                value={test.testName}
                                onChange={(e) => {
                                    const newTests = [...tests];
                                    newTests[index] = {...newTests[index], testName: e.target.value};
                                    updateTests(newTests);
                                }}
                            />
                            <Input
                                className="col-span-3"
                                label="Unit"
                                multiline={true}
                                value={test.unitName}
                                onChange={(e) => {
                                    const newTests = [...tests];
                                    newTests[index] = {...newTests[index], unitName: e.target.value};
                                    updateTests(newTests);
                                }}
                            />
                            <Input
                                className="col-span-2"
                                label="Value"
                                type="number"
                                placeholder="0"
                                value={test.value}
                                onChange={(e) => {
                                    const newTests = [...tests];
                                    newTests[index] = {...newTests[index], value: e.target.value};
                                    updateTests(newTests);
                                }}
                            />
                            <Input
                                className="col-span-2"
                                label="Right"
                                type="number"
                                placeholder="0"
                                value={test.right}
                                onChange={(e) => {
                                    const newTests = [...tests];
                                    newTests[index] = {...newTests[index], right: e.target.value};
                                    updateTests(newTests);
                                }}
                            />
                            <Input
                                className="col-span-2"
                                label="Left"
                                type="number"
                                placeholder="0"
                                value={test.left}
                                onChange={(e) => {
                                    const newTests = [...tests];
                                    newTests[index] = {...newTests[index], left: e.target.value};
                                    updateTests(newTests);
                                }}
                            />
                        </div>

                        <div className="mt-2">
                            <Input
                                className="w-full"
                                label="Comments"
                                multiline={true}
                                value={test.comments}
                                onChange={(e) => {
                                    const newTests = [...tests];
                                    newTests[index] = {...newTests[index], comments: e.target.value};
                                    updateTests(newTests);
                                }}
                            />
                        </div>

                        {tests.length > 1 && (
                            <Button
                                variant="ghost"
                                size="xs"
                                type="button"
                                className="absolute -top-2 -right-2 bg-white rounded-full shadow-sm hover:bg-gray-50"
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent event bubbling
                                    const newTests = tests.filter((_, i) => i !== index);
                                    updateTests(newTests);
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
