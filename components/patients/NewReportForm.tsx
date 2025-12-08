import { DownloadIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation, useLazyQuery } from "@apollo/client";
import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";

import { toast } from "sonner";
import { useAuth } from "@/contexts";
import { Button } from "@/components/ui-atoms/Button";
import { RPESection } from "./report-sections/RPESection";
import { useHealthFlexAnalytics } from "@/services/analytics";
import { useAutoSave, AutoSaveStatus } from "@/hooks/useAutoSave";
import { PlansSection } from "./report-sections/PlansSection";
import { DocumentSection } from "./report-sections/DocumentSection";
import { CardHeader, CardContent } from "@/components/ui-atoms/Card";
import { BodyChartSection } from "./report-sections/BodyChartSection";
import { SubjectiveGoalsSection } from "./report-sections/GoalsSection";
import { DoctorsNoteSection } from "./report-sections/DoctorsNoteSection";
import { ObjectiveGoalsSection } from "./report-sections/ObjectiveGoalsSection";
import { RecommendationsSection } from "./report-sections/RecommendationsSection";
import { ClinicalDetailsSection } from "./report-sections/ClinicalDetailsSection";
import { ObjectiveAssessmentSection } from "./report-sections/ObjectiveAssessmentSection";
import { SubjectiveAssessmentSection } from "./report-sections/SubjectiveAssessmentSection";
import { ProvisionalDiagnosisSection } from "./report-sections/ProvisionalDiagnosisSection";
import {
  ADD_RECORDS,
  GET_REPORT_QUERY,
  ALL_REPORTS_QUERY,
  GET_ASSESSMENT_AGENT_REPORT,
} from "@/gql/queries";
import {
  Report,
  Records,
  RpeRecord,
  GoalCategory,
  ExerciseSets,
  RecordsInput,
  ClinicalRecord,
  SubjectiveRecord,
  ProvisionalRecord,
  ObjectiveGoalRecord,
  DocumentRecordInput,
  RecommendationRecord,
  RecommendationRecordInput,
  ObjectiveAssessmentRecord,
  SessionFrequency,
  SessionType,
  ObjectiveTest,
  ObjectiveTestInput,
  SubjectiveGoalRecord,
  SubjectiveGoalRecordInput,
  ObjectiveGoalRecordInput,
  PlanRecord as GraphQLPlanRecord,
  PlanRecordInput,
  PlanInput,
  ExerciseSetsInput,
  PlanDurationInput,
} from "@/gql/graphql";

// Remove custom types and use GraphQL types directly

type Document = {
  documentName?: string;
  details?: string;
  document?: string;
};

type FormSource = "first-appointment" | "timeline";

interface NewReportFormProps {
  patientId: string;
  reportId: string;
  formSource?: FormSource;
  appointmentId?: string;
  onPdfGenerated?: () => void;
  patientName?: string;
  agentReportData?: {
    assessment?: {
      plan?: {
        advice?: string;
        plans?: Array<{
          exercise?: string;
          comments?: string;
          set?: Array<{
            repetitions?: number;
            load?: string;
            unit?: string;
          }>;
          duration?: {
            value?: number;
            unit?: string;
          };
        }>;
      };
      subjectiveAssessment?: {
        assessment?: string;
      };
      objectiveAssessment?:
        | Array<{
            tests?: Array<{
              testName?: string;
              unitName?: string;
              value?: number;
              left?: number;
              right?: number;
              comments?: string;
            }>;
          }>
        | {
            tests?: Array<{
              testName?: string;
              unitName?: string;
              value?: number;
              left?: number;
              right?: number;
              comments?: string;
            }>;
          };
      rpe?: {
        value?: number;
      };
    };
  };
}

export interface NewReportFormRef {
  fetchAgentReportData: (appointmentId: string) => Promise<void>;
}

const createDefaultFormState = (): RecordsInput => ({
  clinicalDetails: {},
  subjectiveAssessment: {},
  objectiveAssessment: { tests: [] },
  subjectiveGoals: [
    {
      goal: "",
      targetDate: new Date().toISOString(),
    },
  ],
  objectiveGoals: [
    {
      goalName: "",
      unitName: "",
      value: 0,
      goalCategory: GoalCategory.Stability,
      targetDate: new Date().toISOString(),
    },
  ],
  recommendations: [],
  plan: {
    advice: "",
    plans: Array.from({ length: 3 }, () => ({
      exercise: "",
      set: [
        { repetitions: 0, load: "", unit: "" },
        { repetitions: 0, load: "", unit: "" },
        { repetitions: 0, load: "", unit: "" },
      ],
      duration: { value: 0, unit: "" },
      comments: "",
    })),
  },
  advice: {},
  document: [],
  provisionalDiagnosis: { diagnosis: "" },
  doctorsNote: "",
});

export const NewReportForm = forwardRef<NewReportFormRef, NewReportFormProps>(
  (
    {
      patientId,
      reportId,
      formSource = "first-appointment",
      appointmentId,
      onPdfGenerated,
      patientName,
      agentReportData,
    },
    ref
  ) => {
    const router = useRouter();
    const analytics = useHealthFlexAnalytics();
    const { user } = useAuth();
    const [formData, setFormData] = useState<RecordsInput>(
      createDefaultFormState()
    );
    const [getReport, { loading: reportLoading }] =
      useLazyQuery(GET_REPORT_QUERY);
    const [getAgentReport, { loading: agentReportLoading }] = useLazyQuery(
      GET_ASSESSMENT_AGENT_REPORT
    );
    const [getAllReports] = useLazyQuery(ALL_REPORTS_QUERY);
    const [activeReport, setActiveReport] = useState<Partial<Report> | null>(
      null
    );
    const [addRecords, { loading: saving }] = useMutation(ADD_RECORDS, {
      onCompleted: async (data) => {
        toast.success("Report saved successfully");
        analytics.trackReportSave(
          reportId,
          formSource === "first-appointment" ? "first_assessment" : "timeline",
          patientId,
          user?._id || "unknown"
        );

        // Refetch report data to get updated PDF URL
        try {
          const { data: updatedReportData } = await getReport({
            variables: { id: reportId },
            fetchPolicy: "network-only",
          });

          if (updatedReportData?.report) {
            setActiveReport({
              _id: updatedReportData.report._id,
              isActive: updatedReportData.report.isActive,
              createdAt: updatedReportData.report.createdAt,
              updatedAt: updatedReportData.report.updatedAt,
              seqNo: updatedReportData.report.seqNo,
              pdf: updatedReportData.report.pdf,
            });
          }

          // Refetch all reports to update timeline
          await getAllReports({
            variables: { patientId },
            fetchPolicy: "network-only",
          });
        } catch (error) {
          console.error("Error refetching report data:", error);
        }

        // Call the callback when PDF is generated/updated
        if (onPdfGenerated) {
          onPdfGenerated();
        }
      },
      onError: (error) => {
        console.error("Error adding records:", error);
        toast.error(`Failed to save report: ${error.message}`);
      },
    });

    const [copyingFromSecondLastReport, setCopyingFromSecondLastReport] =
      useState(false);
    const [isAIFilled, setIsAIFilled] = useState(false);
    const [formKey, setFormKey] = useState(0);

    // Initialize sections based on formSource
    const [collapsedSections, setCollapsedSections] = useState<
      Record<string, boolean>
    >(() => {
      const sections = {
        clinicalDetails: true,
        bodyChart: true,
        subjectiveAssessment: true,
        objectiveAssessment: true,
        subjectiveGoals: true,
        objectiveGoals: true,
        recommendations: true,
        provisionalDiagnosis: true,
        plans: true,
        document: true,
        rpe: true,
        doctorsNote: true,
      };

      // If it's a first appointment, set all sections to be expanded
      if (formSource === "first-appointment") {
        Object.keys(sections).forEach((key) => {
          sections[key as keyof typeof sections] = false;
        });
      }

      return sections;
    });

    // Auto-save functionality
    const autoSaveKey = `report-autosave-${reportId}`;
    const [hasCheckedForDraft, setHasCheckedForDraft] = useState(false);
    const [dataLoadedFromServer, setDataLoadedFromServer] = useState(false);

    const { status: autoSaveStatus, clearSavedData, getSavedData } = useAutoSave({
      key: autoSaveKey,
      data: formData,
      delay: 2000,
      enabled: dataLoadedFromServer, // Only enable auto-save after server data is loaded
    });

    // Restore data from localStorage after server data is loaded
    useEffect(() => {
      if (!dataLoadedFromServer || hasCheckedForDraft) return;

      const savedData = getSavedData();
      if (savedData) {
        // Compare saved data with current form data to see if there are differences
        const currentDataString = JSON.stringify(formData);
        const savedDataString = JSON.stringify(savedData);

        if (currentDataString !== savedDataString) {
          const shouldRestore = window.confirm(
            'We found unsaved changes from your previous session. Would you like to restore them?'
          );

          if (shouldRestore) {
            setFormData(savedData);
            toast.success('Draft restored successfully');
          } else {
            clearSavedData();
          }
        } else {
          // If data is the same, just clear the saved draft
          clearSavedData();
        }
      }

      setHasCheckedForDraft(true);
    }, [dataLoadedFromServer, hasCheckedForDraft]);

    const toggleSection = (sectionName: string) => {
      setCollapsedSections((prev) => ({
        ...prev,
        [sectionName]: !prev[sectionName],
      }));
    };

    const toggleAllSections = (expand: boolean) => {
      setCollapsedSections((prev) =>
        Object.keys(prev).reduce((acc, key) => {
          acc[key] = !expand; // Set all sections to expanded or collapsed
          return acc;
        }, {} as Record<string, boolean>)
      );
    };

    const handleCreateGoalSet = () => {
      const allGoals = [
        ...(formData.subjectiveGoals || []),
        ...(formData.objectiveGoals || []),
      ];

      (window as unknown as Record<string, unknown>).reportGoals = allGoals;
      router.push(`/patients/${patientId}/goals/new?from=report`);
    };

    // Check if there are any goals available for goal set creation
    const hasGoalsForGoalSet = () => {
      const hasSubjectiveGoals = formData.subjectiveGoals?.some((goal) =>
        goal?.goal?.trim()
      );
      const hasObjectiveGoals = formData.objectiveGoals?.some((goal) =>
        goal?.goalName?.trim()
      );
      return hasSubjectiveGoals || hasObjectiveGoals;
    };

    useEffect(() => {
      // Track form start
      analytics.trackFormStart(`report_${formSource}`, {
        patient_id: patientId,
        report_id: reportId,
        appointment_id: appointmentId,
      });

      const fetchReportData = async () => {
        try {
          const { data: reportData } = await getReport({
            variables: {
              id: reportId,
            },
            fetchPolicy: "network-only",
          });

          if (reportData?.report) {
            setActiveReport({
              _id: reportData.report._id,
              isActive: reportData.report.isActive,
              createdAt: reportData.report.createdAt,
              updatedAt: reportData.report.updatedAt,
              seqNo: reportData.report.seqNo,
              pdf: reportData.report.pdf,
            });
          }

          if (reportData?.report?.records) {
            const records: Records = reportData.report.records as Records;

            const recordInput = RecordToRecordInput(records);
            setFormData(recordInput);
          }

          // Mark that data has been loaded from server
          setDataLoadedFromServer(true);
        } catch (error) {
          console.error("Error fetching report data:", error);
          toast.error("Failed to fetch report data");
          // Still mark as loaded even on error so auto-save can work
          setDataLoadedFromServer(true);
        }
      };

      if (reportId) {
        fetchReportData();
      }
    }, [reportId, getReport]);

    // Watch for agentReportData prop changes and update form
    useEffect(() => {
      if (agentReportData?.assessment) {
        const assessment = agentReportData.assessment;

        setFormData((prevFormData) => {
          const updatedData = { ...prevFormData };

          // Transform plan data
          if (assessment.plan) {
            updatedData.plan = {
              advice: assessment.plan.advice || "",
              plans:
                assessment.plan.plans && Array.isArray(assessment.plan.plans)
                  ? assessment.plan.plans.map((plan: any) => ({
                      exercise: plan.exercise || "",
                      comments: plan.comments || "",
                      set: plan.set
                        ? plan.set.map((setItem: any) => ({
                            repetitions: setItem.repetitions || 0,
                            load: setItem.load || "",
                            unit: setItem.unit || "",
                          }))
                        : [{ repetitions: 0, load: "", unit: "" }],
                      duration: plan.duration
                        ? {
                            value: plan.duration.value || 0,
                            unit: plan.duration.unit || "",
                          }
                        : { value: 0, unit: "" },
                    }))
                  : [],
            };
          }

          // Transform subjective assessment
          if (assessment.subjectiveAssessment?.assessment) {
            updatedData.subjectiveAssessment = {
              assessment: assessment.subjectiveAssessment.assessment,
            };
          }

          // Transform objective assessment
          if (assessment.objectiveAssessment) {
            const tests = Array.isArray(assessment.objectiveAssessment)
              ? assessment.objectiveAssessment.flatMap(
                  (obj: any) => obj.tests || []
                )
              : assessment.objectiveAssessment.tests || [];

            updatedData.objectiveAssessment = {
              tests: tests.map((test: any) => ({
                testName: test.testName || "",
                unitName: test.unitName || "",
                value:
                  typeof test.value === "string"
                    ? parseFloat(test.value)
                    : test.value || 0,
                left:
                  typeof test.left === "string"
                    ? parseFloat(test.left)
                    : test.left || 0,
                right:
                  typeof test.right === "string"
                    ? parseFloat(test.right)
                    : test.right || 0,
                comments: test.comments || "",
              })),
            };
          }

          // Transform RPE if it exists
          if (assessment.rpe?.value) {
            updatedData.rpe = {
              value: assessment.rpe.value,
            };
          }

          return updatedData;
        });

        setIsAIFilled(true);

        // Force component re-render by updating key
        setTimeout(() => {
          setFormKey((prev) => prev + 1);
        }, 100);

        // Auto-expand sections with data
        setCollapsedSections((prevSections) => {
          const newCollapsedSections = { ...prevSections };
          if (assessment.subjectiveAssessment?.assessment)
            newCollapsedSections.subjectiveAssessment = false;
          if (assessment.objectiveAssessment)
            newCollapsedSections.objectiveAssessment = false;
          if (assessment.plan) newCollapsedSections.plans = false;
          if (assessment.rpe?.value) newCollapsedSections.rpe = false;
          return newCollapsedSections;
        });
      }
    }, [agentReportData]);

    // NEW FUNCTION: Fetch agent report data manually (called from parent component)
    const fetchAgentReportData = async (appointmentIdToFetch: string) => {
      try {
        const { data } = await getAgentReport({
          variables: {
            id: appointmentIdToFetch,
          },
        });

        if (data?.agentReport?.assessment) {
          const assessment = data.agentReport.assessment;

          // Update form data by merging with existing data
          setFormData((prevFormData) => {
            const updatedData = { ...prevFormData };

            // Transform plan data
            if (assessment.plan) {
              updatedData.plan = {
                advice: assessment.plan.advice || "",
                plans: assessment.plan.plans
                  ? assessment.plan.plans.map((plan: any) => ({
                      exercise: plan.exercise || "",
                      comments: plan.comments || "",
                      set: plan.set
                        ? plan.set.map((setItem: any) => ({
                            repetitions: setItem.repetitions || 0,
                            load: setItem.load || "",
                            unit: setItem.unit || "",
                          }))
                        : [{ repetitions: 0, load: "", unit: "" }],
                      duration: plan.duration
                        ? {
                            value: plan.duration.value || 0,
                            unit: plan.duration.unit || "",
                          }
                        : { value: 0, unit: "" },
                    }))
                  : [],
              };
            }

            // Transform subjective assessment
            if (assessment.subjectiveAssessment?.assessment) {
              updatedData.subjectiveAssessment = {
                assessment: assessment.subjectiveAssessment.assessment,
              };
            }

            // Transform objective assessment if it exists
            if (assessment.objectiveAssessment) {
              const tests = Array.isArray(assessment.objectiveAssessment)
                ? assessment.objectiveAssessment.flatMap(
                    (obj: any) => obj.tests || []
                  )
                : assessment.objectiveAssessment.tests || [];

              updatedData.objectiveAssessment = {
                tests: tests.map((test: any) => ({
                  testName: test.testName || "",
                  unitName: test.unitName || "",
                  value:
                    typeof test.value === "string"
                      ? parseFloat(test.value)
                      : test.value || 0,
                  left:
                    typeof test.left === "string"
                      ? parseFloat(test.left)
                      : test.left || 0,
                  right:
                    typeof test.right === "string"
                      ? parseFloat(test.right)
                      : test.right || 0,
                  comments: test.comments || "",
                })),
              };
            }

            // Transform RPE if it exists
            if (assessment.rpe?.value) {
              updatedData.rpe = {
                value: assessment.rpe.value,
              };
            }

            return updatedData;
          });

          setIsAIFilled(true);
          toast.success("AI data loaded successfully");

          // Auto-expand sections with data
          setCollapsedSections((prevSections) => {
            const newCollapsedSections = { ...prevSections };
            if (assessment.subjectiveAssessment?.assessment)
              newCollapsedSections.subjectiveAssessment = false;
            if (assessment.objectiveAssessment)
              newCollapsedSections.objectiveAssessment = false;
            if (assessment.plan) newCollapsedSections.plans = false;
            if (assessment.rpe?.value) newCollapsedSections.rpe = false;
            return newCollapsedSections;
          });
        } else {
          toast.info("No AI data found for this report");
        }
      } catch (error) {
        console.error("Error fetching agent report data:", error);
        toast.error("Failed to fetch AI data");
      }
    };

    // Handler to copy plans from the most recent previous report that actually has plans
    const handleCopyFromPreviousReportWithPlans = async () => {
      if (!patientId || !reportId) {
        toast.error("Patient ID or report ID not found");
        return;
      }
      setCopyingFromSecondLastReport(true);
      try {
        // Fetch all reports for the patient
        const { data: reportsData } = await getAllReports({
          variables: { patientId },
          fetchPolicy: "network-only",
        });
        if (!reportsData?.reports || reportsData.reports.length < 2) {
          toast.error("Not enough previous reports to copy from.");
          setCopyingFromSecondLastReport(false);
          return;
        }
        // Sort reports by appointment date (latest first)
        const sortedReports = [...reportsData.reports]
          .filter((r) => r.appointment?.event?.startTime)
          .sort(
            (a, b) =>
              new Date(b.appointment.event.startTime).getTime() -
              new Date(a.appointment.event.startTime).getTime()
          );
        // Find the current report in the sorted list
        const currentIdx = sortedReports.findIndex((r) => r._id === reportId);
        if (currentIdx === -1) {
          toast.error("Current report not found in reports list.");
          setCopyingFromSecondLastReport(false);
          return;
        }
        // Search for the most recent previous report with non-empty plans
        let previousReportWithPlans = null;
        for (let i = currentIdx + 1; i < sortedReports.length; i++) {
          const rep = sortedReports[i];
          // Defensive: skip if records/plan/plans are missing or empty
          if (
            rep.records &&
            rep.records.plan &&
            Array.isArray(rep.records.plan.plans) &&
            rep.records.plan.plans.length > 0
          ) {
            previousReportWithPlans = rep;
            break;
          }
        }
        if (!previousReportWithPlans?._id) {
          toast.error("No previous report with plans found to copy from.");
          setCopyingFromSecondLastReport(false);
          return;
        }
        // Fetch the full previous report to get its plans (in case the summary is stale)
        const { data: prevReportData } = await getReport({
          variables: { id: previousReportWithPlans._id },
          fetchPolicy: "network-only",
        });
        const prevPlans = prevReportData?.report?.records?.plan?.plans || [];
        if (!prevPlans.length) {
          toast.error("No plans found in the previous report.");
          setCopyingFromSecondLastReport(false);
          return;
        }
        // Replace the current plans with the copied plans from the previous report
        setFormData((prev) => ({
          ...prev,
          plan: {
            ...prev.plan,
            plans: [...prevPlans],
            advice: prevReportData?.report?.records?.plan?.advice || "",
          },
        }));
        // Automatically open the plans dropdown if it is currently collapsed
        if (collapsedSections?.plans) {
          toggleSection("plans");
        }
        toast.success(
          "Plans copied from the most recent previous report with plans!"
        );
      } catch (err) {
        console.error("Error copying plans:", err);
        toast.error("Failed to copy plans from the previous report.");
      } finally {
        setCopyingFromSecondLastReport(false);
      }
    };

    const hasData = (section: unknown): boolean => {
      if (!section) return false;

      if (Array.isArray(section)) {
        return section.length > 0;
      }

      if (typeof section === "object") {
        // Check if any property has a non-empty value
        return Object.values(section).some((value) => {
          if (value === null || value === undefined) return false;
          if (typeof value === "string") return value.trim() !== "";
          if (typeof value === "number") return value !== 0;
          if (Array.isArray(value)) return value.length > 0;
          if (typeof value === "object") return hasData(value);
          return true;
        });
      }

      return false;
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        const filteredData: RecordsInput = {};

        // Only include clinical details if it has data
        if (hasData(formData.clinicalDetails)) {
          const clinicalDetails = { ...formData.clinicalDetails };
          if (
            clinicalDetails.bodyChart === "" ||
            clinicalDetails.bodyChart === undefined
          ) {
            clinicalDetails.bodyChart = null;
          }
          filteredData.clinicalDetails = clinicalDetails;
        }

        // Only include subjective assessment if it has data
        if (hasData(formData.subjectiveAssessment)) {
          filteredData.subjectiveAssessment = formData.subjectiveAssessment;
        }

        // Enhanced filtering for objective assessment - only include if tests have meaningful data
        if (
          formData.objectiveAssessment?.tests &&
          formData.objectiveAssessment.tests.length > 0
        ) {
          const filteredTests = formData.objectiveAssessment.tests
            .filter((test) => {
              if (!test) return false;

              // Check if any field has meaningful data (not empty string, not 0, not null/undefined)
              const hasTestName = test.testName && test.testName.trim() !== "";
              const hasUnitName = test.unitName && test.unitName.trim() !== "";
              const hasValue =
                test.value !== null &&
                test.value !== undefined &&
                test.value !== 0;
              const hasLeft =
                test.left !== null &&
                test.left !== undefined &&
                test.left !== 0;
              const hasRight =
                test.right !== null &&
                test.right !== undefined &&
                test.right !== 0;
              const hasComments = test.comments && test.comments.trim() !== "";

              // Only include test if at least one field has meaningful data
              return (
                hasTestName ||
                hasUnitName ||
                hasValue ||
                hasLeft ||
                hasRight ||
                hasComments
              );
            })
            .map((test) => {
              // Build the test object dynamically, only including fields with meaningful data
              const cleanTest: Record<string, string | number> = {};

              if (test?.testName && test.testName.trim() !== "") {
                cleanTest.testName = test.testName.trim();
              }

              if (test?.unitName && test.unitName.trim() !== "") {
                cleanTest.unitName = test.unitName.trim();
              }

              if (
                test?.value !== null &&
                test?.value !== undefined &&
                test?.value !== 0
              ) {
                const parsedValue =
                  typeof test.value === "string"
                    ? parseFloat(test.value)
                    : test.value;
                if (parsedValue && parsedValue !== 0) {
                  cleanTest.value = parsedValue;
                }
              }

              if (
                test?.left !== null &&
                test?.left !== undefined &&
                test?.left !== 0
              ) {
                const parsedLeft =
                  typeof test.left === "string"
                    ? parseFloat(test.left)
                    : test.left;
                if (parsedLeft && parsedLeft !== 0) {
                  cleanTest.left = parsedLeft;
                }
              }

              if (
                test?.right !== null &&
                test?.right !== undefined &&
                test?.right !== 0
              ) {
                const parsedRight =
                  typeof test.right === "string"
                    ? parseFloat(test.right)
                    : test.right;
                if (parsedRight && parsedRight !== 0) {
                  cleanTest.right = parsedRight;
                }
              }

              if (test?.comments && test.comments.trim() !== "") {
                cleanTest.comments = test.comments.trim();
              }

              return cleanTest;
            });

          // Only include objectiveAssessment if there are filtered tests with meaningful data
          if (filteredTests.length > 0) {
            filteredData.objectiveAssessment = {
              tests: filteredTests,
            };
          }
        }

        // Only include subjective goals if array has non-empty goals
        if (formData.subjectiveGoals?.some((goal) => goal?.goal?.trim())) {
          filteredData.subjectiveGoals = formData.subjectiveGoals.filter(
            (goal) => goal?.goal?.trim()
          );
        }

        // Only include objective goals if array has non-empty goals
        if (formData.objectiveGoals?.some((goal) => goal?.goalName?.trim())) {
          filteredData.objectiveGoals = formData.objectiveGoals.filter((goal) =>
            goal?.goalName?.trim()
          );
        }

        // Only include recommendations if array has data
        if (hasData(formData.recommendations)) {
          filteredData.recommendations = formData.recommendations;
        }

        // Enhanced plan data handling for new schema with strict filtering
        if (formData.plan) {
          if (formData.plan) {
            // Filter out empty plans and clean up sets
            const cleanedPlans = (formData.plan.plans || [])
              .filter((plan) => {
                // Check if the plan has any non-empty data
                const hasExercise = !!plan?.exercise?.trim();
                const hasComments = !!plan?.comments?.trim();
                const hasDuration = plan?.duration?.value ?? 0 > 0;

                // Check if any sets have meaningful data
                const hasValidSets = (plan?.set || []).some(
                  (setItem) =>
                    (setItem?.repetitions ?? 0) > 0 ||
                    (!!setItem?.load?.trim() && setItem?.load?.trim() !== "") ||
                    (!!setItem?.unit?.trim() && setItem?.unit?.trim() !== "")
                );

                return (
                  hasExercise || hasComments || hasDuration || hasValidSets
                );
              })
              .map((plan) => {
                // For each valid plan, clean up its sets and build object dynamically
                const cleanedSets = (plan?.set || [])
                  .filter(
                    (setItem) =>
                      (setItem?.repetitions ?? 0) > 0 ||
                      (!!setItem?.load?.trim() &&
                        setItem?.load?.trim() !== "") ||
                      (!!setItem?.unit?.trim() && setItem?.unit?.trim() !== "")
                  )
                  .map((setItem) => {
                    // Build set object dynamically, only including non-empty fields
                    const cleanSet: Record<string, string | number> = {};

                    if (setItem?.repetitions && setItem.repetitions > 0) {
                      cleanSet.repetitions = setItem.repetitions;
                    }

                    if (setItem?.load && setItem.load.trim() !== "") {
                      cleanSet.load = setItem.load.trim();
                    }

                    if (setItem?.unit && setItem.unit.trim() !== "") {
                      cleanSet.unit = setItem.unit.trim();
                    }

                    return cleanSet;
                  });

                // Build the plan object dynamically, only including non-empty fields
                const cleanedPlan: Record<string, any> = {};

                if (plan?.exercise && plan.exercise.trim() !== "") {
                  cleanedPlan.exercise = plan.exercise.trim();
                }

                // Only include sets if there are valid ones
                if (cleanedSets.length > 0) {
                  cleanedPlan.set = cleanedSets;
                }

                if (plan?.comments && plan.comments.trim() !== "") {
                  cleanedPlan.comments = plan.comments.trim();
                }

                // Only include duration if it has meaningful values
                const durationValue = plan?.duration?.value ?? 0;
                const durationUnit = plan?.duration?.unit?.trim();

                if (
                  durationValue > 0 ||
                  (durationUnit &&
                    durationUnit !== "" &&
                    durationUnit !== "minutes")
                ) {
                  const cleanDuration: Record<string, string | number> = {};

                  if (durationValue > 0) {
                    cleanDuration.value = durationValue;
                  }

                  if (
                    durationUnit &&
                    durationUnit !== "" &&
                    durationUnit !== "minutes"
                  ) {
                    cleanDuration.unit = durationUnit;
                  } else if (durationValue > 0) {
                    // No default unit - let user specify
                  }

                  if (Object.keys(cleanDuration).length > 0) {
                    cleanedPlan.duration = cleanDuration;
                  }
                }

                return cleanedPlan;
              });

            const hasNonEmptyPlans = cleanedPlans.length > 0;
            const hasAdvice = !!formData.plan?.advice?.trim();

            if (hasNonEmptyPlans || hasAdvice) {
              const cleanPlan: Record<string, unknown> = {};

              if (hasAdvice) {
                cleanPlan.advice = formData.plan.advice?.trim();
              }

              if (hasNonEmptyPlans) {
                cleanPlan.plans = cleanedPlans;
              }

              filteredData.plan = cleanPlan as PlanRecordInput;
            }
          }
        }

        // Only include document if it has data
        if (hasData(formData.document)) {
          const cleanedDocuments = formData.document
            ?.filter(
              (doc) =>
                doc &&
                (doc.documentName?.trim() ||
                  doc.details?.trim() ||
                  doc.document?.trim())
            )
            .map((doc): DocumentRecordInput => {
              const cleanDoc: DocumentRecordInput = {};

              if (doc?.documentName && doc.documentName.trim() !== "") {
                cleanDoc.documentName = doc.documentName.trim();
              }

              if (doc?.details && doc.details.trim() !== "") {
                cleanDoc.details = doc.details.trim();
              }

              if (doc?.document && doc.document.trim() !== "") {
                cleanDoc.document = doc.document.trim();
              }

              return cleanDoc;
            });

          if (cleanedDocuments && cleanedDocuments.length > 0) {
            filteredData.document = cleanedDocuments;
          }
        }

        // Only include RPE if it has a meaningful value (greater than 0)
        if (formData.rpe?.value && formData.rpe.value > 0) {
          filteredData.rpe = {
            value: formData.rpe.value,
          };
        }

        if (hasData(formData.provisionalDiagnosis)) {
          filteredData.provisionalDiagnosis = formData.provisionalDiagnosis;
        }

        // Only include doctorsNote if it has content
        if (formData.doctorsNote && formData.doctorsNote.trim() !== "") {
          filteredData.doctorsNote = formData.doctorsNote.trim();
        }

        if (isAIFilled) {
          (filteredData as RecordsInput & { isAccepted: boolean }).isAccepted =
            true;
        }

        await addRecords({
          variables: {
            reportId,
            input: filteredData,
          },
        });

        // Clear auto-saved data after successful submission
        clearSavedData();
      } catch (error: unknown) {
        console.error("Error adding records:", error);
        toast.error(`Failed to save report: ${(error as Error).message}`);
      }
    };

    const handleObjectiveAssessmentChange = (
      data: ObjectiveAssessmentRecord
    ) => {
      setFormData((prev) => ({
        ...prev,
        objectiveAssessment: {
          tests: data.tests.map((test): ObjectiveTestInput | null =>
            test
              ? {
                  testName: test.testName || undefined,
                  unitName: test.unitName || undefined,
                  value: test.value ? Number(test.value) : undefined,
                  left: test.left ? Number(test.left) : undefined,
                  right: test.right ? Number(test.right) : undefined,
                  comments: test.comments || undefined,
                }
              : null
          ),
        },
      }));
    };

    const handleObjectiveGoalsChange = (data: {
      goals: ObjectiveGoalRecord[];
    }) => {
      setFormData((prev) => ({
        ...prev,
        objectiveGoals: data.goals.map(
          (goal): ObjectiveGoalRecordInput => ({
            goalName: goal?.goalName || "",
            unitName: goal?.unitName || "",
            goalCategory:
              goal?.goalCategory || GoalCategory.Stability.toString(),
            targetDate: goal?.targetDate || new Date().toISOString(),
            value: typeof goal?.value === "number" ? goal.value : 0,
          })
        ),
      }));
    };

    const handleRecommendationsChange = (value: {
      recommendations: RecommendationRecordInput[];
    }) => {
      setFormData((prev) => ({
        ...prev,
        recommendations: value.recommendations.map((rec) => ({
          ...rec,
          frequency: rec.frequency as SessionFrequency,
          sessionType: rec.sessionType as SessionType,
        })),
      }));
    };

    const handleDocumentChange = (data: DocumentRecordInput[]) => {
      setFormData((prev) => ({
        ...prev,
        document: data,
      }));
    };

    // Expose fetchAgentReportData to parent components
    useImperativeHandle(ref, () => ({
      fetchAgentReportData,
    }));

    if (reportLoading) {
      return <div>Loading report data...</div>;
    }

    return (
      <form key={formKey} onSubmit={handleSubmit} className="space-y-4">
        <CardHeader className="flex flex-row justify-between items-center">
          <h2 className="text-xl font-semibold py-2">
            {formSource === "first-appointment"
              ? `First Appointment Report${
                  patientName ? ` - ${patientName}` : ""
                }`
              : `Report Details${patientName ? ` - ${patientName}` : ""}: ${
                  activeReport?.seqNo ? activeReport.seqNo : "Not yet generated"
                }`}
          </h2>
          <div className="flex items-center gap-2">
            {/* Auto-save status indicator */}
            {autoSaveStatus === 'saving' && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving draft...
              </span>
            )}
            {autoSaveStatus === 'saved' && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Draft saved
              </span>
            )}
            {autoSaveStatus === 'error' && (
              <span className="text-xs text-red-600 flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                Draft save failed
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => toggleAllSections(true)}
            >
              Expand All
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => toggleAllSections(false)}
            >
              Collapse All
            </Button>
            {/* NEW: Create Goal Set Button - only show for first appointment and when goals exist */}
            {formSource === "first-appointment" && hasGoalsForGoalSet() && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCreateGoalSet}
                className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
              >
                Create Goal Set
              </Button>
            )}
            {formSource === "first-appointment" && activeReport?.pdf && (
              <a
                href={`${activeReport?.pdf}?t=${Date.now()}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <DownloadIcon className="h-4 w-4 text-gray-500" />
              </a>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-4 py-0 space-y-4">
          {formSource === "first-appointment" ? (
            <>
              <ClinicalDetailsSection
                value={formData.clinicalDetails as ClinicalRecord}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, clinicalDetails: value }))
                }
                isCollapsed={collapsedSections.clinicalDetails}
                onToggle={() => toggleSection("clinicalDetails")}
              />
              <BodyChartSection
                value={formData.clinicalDetails as ClinicalRecord}
                onChange={(value) => {
                  setFormData((prev) => ({ ...prev, clinicalDetails: value }));
                }}
                isCollapsed={collapsedSections.bodyChart}
                onToggle={() => toggleSection("bodyChart")}
              />
              <SubjectiveAssessmentSection
                value={formData.subjectiveAssessment as SubjectiveRecord}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    subjectiveAssessment: value,
                  }))
                }
                isCollapsed={collapsedSections.subjectiveAssessment}
                onToggle={() => toggleSection("subjectiveAssessment")}
              />
              <ObjectiveAssessmentSection
                value={
                  formData.objectiveAssessment as ObjectiveAssessmentRecord
                }
                onChange={handleObjectiveAssessmentChange}
                isCollapsed={collapsedSections.objectiveAssessment}
                onToggle={() => toggleSection("objectiveAssessment")}
              />
              <ProvisionalDiagnosisSection
                value={formData.provisionalDiagnosis as ProvisionalRecord}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    provisionalDiagnosis: value,
                  }))
                }
                isCollapsed={collapsedSections.provisionalDiagnosis}
                onToggle={() => toggleSection("provisionalDiagnosis")}
              />
              <SubjectiveGoalsSection
                value={{
                  subjectiveGoals: (formData.subjectiveGoals || [{}]).map(
                    (goal): SubjectiveGoalRecord => ({
                      goal: goal?.goal || "",
                      targetDate: goal?.targetDate || new Date().toISOString(),
                    })
                  ),
                }}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    subjectiveGoals: value.subjectiveGoals.map(
                      (goal): SubjectiveGoalRecordInput => ({
                        goal: goal?.goal || "",
                        targetDate:
                          goal?.targetDate || new Date().toISOString(),
                      })
                    ),
                  }))
                }
                isCollapsed={collapsedSections.subjectiveGoals}
                onToggle={() => toggleSection("subjectiveGoals")}
              />
              <ObjectiveGoalsSection
                value={{
                  goals: (formData.objectiveGoals || [{}]).map((goal) => ({
                    goalName: goal?.goalName || "",
                    unitName: goal?.unitName || "",
                    value: goal?.value?.toString() || "0",
                    goalCategory:
                      (goal?.goalCategory as GoalCategory) ||
                      GoalCategory.Stability,
                    targetDate: goal?.targetDate || new Date().toISOString(),
                  })),
                }}
                onChange={handleObjectiveGoalsChange}
                isCollapsed={collapsedSections.objectiveGoals}
                onToggle={() => toggleSection("objectiveGoals")}
              />
              <RecommendationsSection
                value={{
                  recommendations:
                    formData.recommendations as RecommendationRecordInput[],
                }}
                onChange={handleRecommendationsChange}
                isCollapsed={collapsedSections.recommendations}
                onToggle={() => toggleSection("recommendations")}
              />
              <DocumentSection
                value={{
                  documents: (formData.document || []).map((doc) => ({
                    documentName: doc?.documentName || "",
                    details: doc?.details || "",
                    document: doc?.document || "",
                  })),
                }}
                onChange={(value) => handleDocumentChange(value.documents)}
                isCollapsed={collapsedSections.document}
                onToggle={() => toggleSection("document")}
                onPdfUpload={() => {
                  if (appointmentId) {
                    fetchAgentReportData(appointmentId);
                  }
                }}
              />
              <DoctorsNoteSection
                value={formData.doctorsNote || ""}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, doctorsNote: value }))
                }
                isCollapsed={collapsedSections.doctorsNote}
                onToggle={() => toggleSection("doctorsNote")}
              />
            </>
          ) : (
            <>
              <PlansSection
                value={{
                  advice: formData?.plan?.advice || "",
                  plans: (formData?.plan?.plans || [])
                    .filter(
                      (plan): plan is NonNullable<typeof plan> => plan !== null
                    )
                    .map((plan) => ({
                      exercise: plan.exercise || "",
                      comments: plan.comments || "",
                      duration: {
                        value: plan.duration?.value || 0,
                        unit: plan.duration?.unit || "",
                      },
                      set: (plan.set || [])
                        .filter(
                          (setItem): setItem is NonNullable<typeof setItem> =>
                            setItem !== null
                        )
                        .map((setItem) => ({
                          repetitions: setItem.repetitions || 0,
                          load: setItem.load || "",
                          unit: setItem.unit || "",
                        })),
                    })),
                }}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, plan: value }))
                }
                isCollapsed={collapsedSections.plans}
                onToggle={() => toggleSection("plans")}
                onCopyFromSecondLastReport={
                  formSource === "timeline"
                    ? handleCopyFromPreviousReportWithPlans
                    : undefined
                }
                copyingFromSecondLastReport={copyingFromSecondLastReport}
              />
              <ObjectiveAssessmentSection
                value={
                  formData.objectiveAssessment as ObjectiveAssessmentRecord
                }
                onChange={handleObjectiveAssessmentChange}
                isCollapsed={collapsedSections.objectiveAssessment}
                onToggle={() => toggleSection("objectiveAssessment")}
              />
              <SubjectiveAssessmentSection
                value={formData.subjectiveAssessment as SubjectiveRecord}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    subjectiveAssessment: value,
                  }))
                }
                isCollapsed={collapsedSections.subjectiveAssessment}
                onToggle={() => toggleSection("subjectiveAssessment")}
              />
              <BodyChartSection
                value={formData.clinicalDetails as ClinicalRecord}
                onChange={(value) => {
                  setFormData((prev) => ({ ...prev, clinicalDetails: value }));
                }}
                isCollapsed={collapsedSections.bodyChart}
                onToggle={() => toggleSection("bodyChart")}
              />
              <DocumentSection
                value={{
                  documents: (formData.document || []).map((doc) => ({
                    documentName: doc?.documentName || "",
                    details: doc?.details || "",
                    document: doc?.document || "",
                  })),
                }}
                onChange={(value) => handleDocumentChange(value.documents)}
                isCollapsed={collapsedSections.document}
                onToggle={() => toggleSection("document")}
                onPdfUpload={() => {
                  if (appointmentId) {
                    fetchAgentReportData(appointmentId);
                  }
                }}
              />
              <RPESection
                value={formData.rpe as RpeRecord}
                onChange={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    rpe: value,
                  }));
                }}
                isCollapsed={collapsedSections.rpe}
                onToggle={() => toggleSection("rpe")}
              />
            </>
          )}
        </CardContent>

        <div className="flex justify-end space-x-4 p-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Report"}
          </Button>
        </div>
      </form>
    );
  }
);

NewReportForm.displayName = "NewReportForm";

const RecordToRecordInput = (record: Records): RecordsInput => {
  const recordInput: RecordsInput = {};
  if (record.clinicalDetails) {
    recordInput.clinicalDetails = {
      bodyChart: record.clinicalDetails.bodyChart || null,
      duration: record.clinicalDetails.duration || "",
      clientHistory: record.clinicalDetails.clientHistory || "",
      chiefComplaints: record.clinicalDetails.chiefComplaints || "",
    };
  }
  if (record.subjectiveAssessment) {
    recordInput.subjectiveAssessment = {
      assessment: record.subjectiveAssessment.assessment || "",
    };
  }
  if (record.objectiveAssessment) {
    recordInput.objectiveAssessment = {
      tests: record.objectiveAssessment.tests.map(
        (test): ObjectiveTestInput | null => {
          if (!test) {
            return null;
          }
          return {
            testName: test.testName || "",
            unitName: test.unitName || "",
            value: test.value ? Number(test.value) : 0,
            left: test.left ? Number(test.left) : 0,
            right: test.right ? Number(test.right) : 0,
            comments: test.comments || "",
          };
        }
      ),
    };
  }
  if (record.subjectiveGoals && record.subjectiveGoals.length > 0) {
    recordInput.subjectiveGoals = record.subjectiveGoals.map(
      (goal): SubjectiveGoalRecordInput => {
        if (!goal) {
          return { goal: "", targetDate: new Date().toISOString() };
        }
        return {
          goal: goal.goal || "",
          targetDate: goal.targetDate || new Date().toISOString(),
        };
      }
    );
  }
  if (record.objectiveGoals && record.objectiveGoals.length > 0) {
    recordInput.objectiveGoals = record.objectiveGoals.map(
      (goal): ObjectiveGoalRecordInput => {
        if (!goal) {
          return {
            goalName: "",
            unitName: "",
            value: 0,
            goalCategory: GoalCategory.Stability.toString(),
            targetDate: new Date().toISOString(),
          };
        }
        return {
          goalName: goal.goalName || "",
          unitName: goal.unitName || "",
          value: goal.value ? Number(goal.value) : 0,
          goalCategory: goal.goalCategory || GoalCategory.Stability.toString(),
          targetDate: goal.targetDate || new Date().toISOString(),
        };
      }
    );
  }
  if (record.recommendations && record.recommendations.length > 0) {
    recordInput.recommendations = record.recommendations
      .filter((rec): rec is RecommendationRecord => !!rec)
      .map((rec): RecommendationRecordInput => {
        return {
          sessionType: rec.sessionType as SessionType,
          frequency: rec.frequency as SessionFrequency,
          sessionCount: rec.sessionCount || 0,
          plans: rec.plans || "",
        };
      });
  }

  // Updated logic for the new plan schema
  if (record.plan) {
    const convertedPlans: PlanInput[] = [];

    if (Array.isArray(record.plan.plans)) {
      record.plan.plans.forEach((oldPlan) => {
        if (!oldPlan) return;

        if (Array.isArray(oldPlan.set)) {
          // Plan is already in new format
          const newPlan: PlanInput = {
            exercise: oldPlan.exercise || "",
            set: oldPlan.set.map(
              (setItem): ExerciseSetsInput => ({
                repetitions: setItem?.repetitions || 0,
                load: setItem?.load || "",
                unit: setItem?.unit || "",
              })
            ),
            duration: {
              value: oldPlan.duration?.value || 0,
              unit: oldPlan.duration?.unit || "",
            } as PlanDurationInput,
            comments: oldPlan.comments || "",
          };
          convertedPlans.push(newPlan);
        } else {
          // Plan is in old format
          const newPlan: PlanInput = {
            exercise: oldPlan.exercise || "",
            set: [
              {
                repetitions: (oldPlan as ExerciseSets).repetitions || 0,
                load: (oldPlan as ExerciseSets).load || "",
                unit: (oldPlan as ExerciseSets).unit || "",
              },
            ],
            duration: {
              value: 0,
              unit: "minutes",
            } as PlanDurationInput,
            comments: "",
          };
          convertedPlans.push(newPlan);
        }
      });
    }

    // Fallback: 3 empty plans each with 3 sets
    const fallbackPlans: PlanInput[] = Array.from({ length: 3 }, () => ({
      exercise: "",
      set: [
        { repetitions: 0, load: "", unit: "" },
        { repetitions: 0, load: "", unit: "" },
        { repetitions: 0, load: "", unit: "" },
      ],
      duration: { value: 0, unit: "" } as PlanDurationInput,
      comments: "",
    }));

    recordInput.plan = {
      advice: record.plan.advice || "",
      plans: convertedPlans.length > 0 ? convertedPlans : fallbackPlans,
    } as PlanRecordInput;
  }

  if (record.advice) {
    recordInput.advice = {
      advice: record.advice.advice || "",
    };
  }
  if (record.document) {
    recordInput.document = Array.isArray(record.document)
      ? record.document.map((doc): DocumentRecordInput => {
          if (!doc) {
            return { documentName: "", details: "", document: "" };
          }
          return {
            details: doc.details || "",
            document: doc.document || "",
            documentName: doc.documentName || "",
          };
        })
      : [];
  }
  if (record.rpe) {
    recordInput.rpe = {
      value: record.rpe.value || 0,
    };
  }
  if (record.provisionalDiagnosis) {
    recordInput.provisionalDiagnosis = {
      diagnosis: record.provisionalDiagnosis.diagnosis || "",
    };
  }
  if (record.doctorsNote) {
    recordInput.doctorsNote = record.doctorsNote;
  }
  return recordInput;
};
