"use client";

import { useState, useEffect } from "react";
import {
  Role,
  AMLRRequirement,
  TrainingPlan,
  ValidationScore,
  ReviewStatus,
  ReviewComment,
  LMSAssignment,
  ParsedJobDescription,
  JDQualityMetrics,
} from "@/types";
import { EnhancedRetrievalResult, TaskRequirementMapping, NormalizedCompetency } from "@/types/retrieval";
import { roles } from "@/data/roles";
import { retrieveRequirementsRuleBased as retrieveRequirements, retrieveRequirementsEnhanced, getCompetencyNeeds, checkCoverage, normalizeCompetencies } from "@/llm/retrieval";
import { generateTrainingPlanRuleBased as generateTrainingPlan } from "@/llm/generation";
import { calculateValidationScoreRuleBased as calculateValidationScore } from "@/llm/validation";
import type {
  RiskAnalysisResult,
  LLMValidationAnalysis,
  ReviewAssessment,
} from "@/llm";
import type { EnrichmentResult } from "@/types/rag";
import RoleSelector from "@/components/RoleSelector";
import JobDescriptionInput from "@/components/JobDescriptionInput";
import JdReviewEditor from "@/components/JdReviewEditor";
import RiskMappingReview from "@/components/RiskMappingReview";
import RequirementsReview from "@/components/RequirementsReview";
import CompetencyReview from "@/components/CompetencyReview";
import TrainingPlanComponent from "@/components/TrainingPlan";
import ValidationScoreComponent from "@/components/ValidationScore";
import HumanReviewComponent from "@/components/HumanReview";
import LMSAssignmentComponent from "@/components/LMSAssignment";

export default function Home() {
  // Pipeline state
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [extractedTasks, setExtractedTasks] = useState<string[]>([]);
  const [mappedRisks, setMappedRisks] = useState<string[]>([]);
  const [retrievedRequirements, setRetrievedRequirements] = useState<
    AMLRRequirement[]
  >([]);
  const [competencyNeeds, setCompetencyNeeds] = useState<string[]>([]);
  const [trainingPlan, setTrainingPlan] = useState<TrainingPlan | null>(null);
  const [validationScore, setValidationScore] = useState<ValidationScore | null>(
    null
  );
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus | null>(null);
  const [lmsAssignments, setLmsAssignments] = useState<LMSAssignment[]>([]);

  // RAG enrichment state
  const [enrichmentByRisk, setEnrichmentByRisk] = useState<Record<string, EnrichmentResult>>({});
  const [enrichmentError, setEnrichmentError] = useState<string | null>(null);

  // LLM-enhanced state
  const [useLLM, setUseLLM] = useState(true);
  const [isLLMProcessing, setIsLLMProcessing] = useState(false);
  const [llmStatus, setLlmStatus] = useState<string | null>(null);
  const [llmError, setLlmError] = useState<string | null>(null);
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysisResult | null>(null);
  const [llmValidationAnalysis, setLlmValidationAnalysis] = useState<LLMValidationAnalysis | null>(null);
  const [llmReviewAssessment, setLlmReviewAssessment] = useState<ReviewAssessment | null>(null);

  // Pipeline step tracking
  const [currentStep, setCurrentStep] = useState(0);

  // Input mode: 'select' for predefined roles, 'custom' for job description input
  const [inputMode, setInputMode] = useState<'select' | 'custom'>('custom');

  // JD Review state (for human-in-the-loop after JD parsing)
  const [parsedJobDescription, setParsedJobDescription] = useState<ParsedJobDescription | null>(null);
  const [jdQualityMetrics, setJdQualityMetrics] = useState<JDQualityMetrics | null>(null);
  const [originalJobDescriptionText, setOriginalJobDescriptionText] = useState<string>("");
  const [showJdReview, setShowJdReview] = useState(false);
  const [jdReviewId, setJdReviewId] = useState<string>("");

  // Risk Mapping Review state
  const [showRiskMappingReview, setShowRiskMappingReview] = useState(false);

  // Requirements Review state (after retrieval)
  const [showRequirementsReview, setShowRequirementsReview] = useState(false);
  const [retrievalResult, setRetrievalResult] = useState<EnhancedRetrievalResult | null>(null);
  const [approvedMappings, setApprovedMappings] = useState<TaskRequirementMapping[] | null>(null);

  // Competency Review state (after requirements approval)
  const [showCompetencyReview, setShowCompetencyReview] = useState(false);
  const [normalizedCompetencies, setNormalizedCompetencies] = useState<NormalizedCompetency[]>([]);

  // JSON modal state for component data viewing
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [currentJsonData, setCurrentJsonData] = useState<any>(null);
  const [currentJsonTitle, setCurrentJsonTitle] = useState<string>('');

  // Handle JD parsing complete - shows review screen
  const handleJdParsed = (role: Role, parsedData: ParsedJobDescription, quality: JDQualityMetrics, originalText: string) => {
    setSelectedRole(role);
    setParsedJobDescription(parsedData);
    setJdQualityMetrics(quality);
    setOriginalJobDescriptionText(originalText);
    setShowJdReview(true);
    setCurrentStep(1);
    setIsLLMProcessing(false);
    setLlmStatus(null);
  };

  // Handle JD review approval - shows Risk Mapping Review
  const handleJdReviewApproved = (approvedRole: ParsedJobDescription) => {
    setShowJdReview(false);
    setParsedJobDescription(approvedRole); // Keep for Risk Mapping Review
    setJdReviewId(`jd-review-${Date.now()}`);
    setShowRiskMappingReview(true);
  };

  // Handle Risk Mapping Review approval - triggers requirements retrieval
  const handleRiskMappingApproved = async (approvedMappings: any[]) => {
    setShowRiskMappingReview(false);
    setParsedJobDescription(null);
    
    if (!parsedJobDescription) return;
    
    // Convert approved ParsedJobDescription to Role for pipeline
    const role: Role = {
      id: `custom-${Date.now()}`,
      name: parsedJobDescription.roleName,
      description: parsedJobDescription.roleSummary,
      tasks: parsedJobDescription.tasks.map(t => t.description),
      riskLevel: parsedJobDescription.overallRiskLevel,
      department: parsedJobDescription.department || "Custom",
    };
    
    // Run enhanced retrieval and show Requirements Review
    const result = retrieveRequirementsEnhanced(role);
    setRetrievalResult(result);
    setShowRequirementsReview(true);
  };

  // Handle Risk Mapping Review rejection
  const handleRiskMappingRejected = () => {
    setShowRiskMappingReview(false);
    setShowJdReview(true);
  };

  // Handle Requirements Review approval - normalizes competencies and shows Competency Review
  const handleRequirementsReviewApproved = async (finalMappings: TaskRequirementMapping[]) => {
    setShowRequirementsReview(false);
    setApprovedMappings(finalMappings);
    setRetrievalResult(null);
    
    // Normalize competencies from the approved mappings
    const normalized = normalizeCompetencies(finalMappings);
    setNormalizedCompetencies(normalized);
    
    // Show Competency Review
    setShowCompetencyReview(true);
  };

  // Handle Requirements Review rejection - go back to Risk Mapping
  const handleRequirementsReviewRejected = () => {
    setShowRequirementsReview(false);
    setRetrievalResult(null);
    setShowRiskMappingReview(true);
  };

  // Handle Competency Review approval - generates training plan from approved competencies
  const handleCompetencyReviewApproved = async () => {
    setShowCompetencyReview(false);
    
    if (!parsedJobDescription || !approvedMappings || normalizedCompetencies.length === 0) return;
    
    // Convert approved ParsedJobDescription to Role for pipeline
    const role: Role = {
      id: `custom-${Date.now()}`,
      name: parsedJobDescription.roleName,
      description: parsedJobDescription.roleSummary,
      tasks: parsedJobDescription.tasks.map(t => t.description),
      riskLevel: parsedJobDescription.overallRiskLevel,
      department: parsedJobDescription.department || "Custom",
    };
    
    setSelectedRole(role);
    setExtractedTasks(role.tasks);
    
    try {
      // Use rule-based approach since we already have the mappings
      const { requirements, mappedRisks: risks } = retrieveRequirements(role);
      setMappedRisks(risks);
      setRetrievedRequirements(requirements);
      setCurrentStep(2);

      // Use the normalized competencies we already have
      setCurrentStep(3);

      // Generate training plan from the approved mappings
      const plan = generateTrainingPlan(role, requirements);
      setTrainingPlan(plan);
      setCurrentStep(4);

      // Calculate validation score
      const score = calculateValidationScore(role, requirements, plan, risks);
      setValidationScore(score);
      setCurrentStep(5);

      // Initialize review status
      setReviewStatus({
        status: "pending",
        comments: [],
        lastUpdated: new Date().toISOString(),
      });
      setCurrentStep(6);
    } catch (error) {
      console.error('Training plan generation error:', error);
      setLlmError(error instanceof Error ? error.message : 'An error occurred during training plan generation');
    }
  };

  // Handle Competency Review rejection - go back to Requirements
  const handleCompetencyReviewRejected = () => {
    setShowCompetencyReview(false);
    if (retrievalResult) {
      setShowRequirementsReview(true);
    }
  };

  // Handle JD review rejection
  const handleJdReviewRejected = () => {
    setShowJdReview(false);
    setParsedJobDescription(null);
    setParsedJobDescription(null);
    setSelectedRole(null);
    setCurrentStep(0);
  };

  // Handle re-parse JD
  const handleJdReparsed = () => {
    setShowJdReview(false);
    setParsedJobDescription(null);
    setSelectedRole(null);
    setCurrentStep(0);
  };

  // Process role through the full pipeline (after JD review approval or direct selection)
  const processRoleThroughPipeline = async (role: Role, mappings?: TaskRequirementMapping[]) => {
    setSelectedRole(role);
    setCurrentStep(1);
    setLlmError(null);

    // Step 1: Extract tasks from role description
    setExtractedTasks(role.tasks);

    try {
      if (useLLM) {
        setIsLLMProcessing(true);
        
        // Step 2: Retrieve requirements with LLM enhancement (via server API route)
        setLlmStatus('Analyzing role description and identifying risk categories...');
        const riskRes = await fetch('/api/llm/analyze-risk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role }),
        });
        const riskData = await riskRes.json();
        setMappedRisks(riskData.mappedRisks);
        setRetrievedRequirements(riskData.requirements);
        setRiskAnalysis(riskData.analysis);
        setCurrentStep(2);

        // Step 2b: Enrich each risk category with regulatory citations (RAG)
        setLlmStatus('Retrieving regulatory citations...');
        const enrichResults = await Promise.allSettled(
          (riskData.mappedRisks as string[]).map((category: string) =>
            fetch('/api/llm/enrich-risk', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ riskCategory: category }),
            }).then(r => r.json())
          )
        );
        const enrichMap: Record<string, EnrichmentResult> = {};
        const enrichErrors: string[] = [];
        enrichResults.forEach((result, i) => {
          const category = riskData.mappedRisks[i];
          if (result.status === 'fulfilled' && result.value.success) {
            enrichMap[category] = { reasoning: result.value.reasoning, citations: result.value.citations, contexts: result.value.contexts ?? [] };
          } else {
            const msg = result.status === 'rejected' ? result.reason?.message : result.value.message;
            enrichErrors.push(`${category}: ${msg}`);
          }
        });
        setEnrichmentByRisk(enrichMap);
        if (enrichErrors.length > 0) {
          setEnrichmentError(
            `Regulatory enrichment failed for ${enrichErrors.length} risk categor${enrichErrors.length === 1 ? 'y' : 'ies'}: ${enrichErrors.join('; ')}`
          );
          setTrainingPlan(null);
          setValidationScore(null);
          setReviewStatus(null);
          setLlmStatus(null);
          setIsLLMProcessing(false);
          return;
        } else {
          setEnrichmentError(null);
        }

        // Step 3: Get competency needs
        setLlmStatus('Mapping competency requirements...');
        const competencies = getCompetencyNeeds(riskData.requirements);
        setCompetencyNeeds(competencies);
        setCurrentStep(3);

        // Step 4: Generate training plan with LLM enhancement (via server API route)
        setLlmStatus('Generating personalised training plan...');
        const planRes = await fetch('/api/llm/generate-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role,
            requirements: riskData.requirements,
            riskCategories: riskData.mappedRisks,
          }),
        });
        const planData = await planRes.json();
        setTrainingPlan(planData.plan.plan);
        setCurrentStep(4);

        // Step 5: Validate with LLM enhancement (via server API route)
        setLlmStatus('Validating training plan against compliance requirements...');
        const validationRes = await fetch('/api/llm/validate-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role,
            requirements: riskData.requirements,
            trainingPlan: planData.plan.plan,
            riskCategories: riskData.mappedRisks,
          }),
        });
        const validationData = await validationRes.json();
        setValidationScore(validationData.validationScore);
        setLlmValidationAnalysis(validationData.llmAnalysis);
        setLlmReviewAssessment(validationData.reviewAssessment);
        setLlmStatus('Analysis complete.');
        setCurrentStep(5);
      } else {
        // Use rule-based approach (original logic)
        const { requirements, mappedRisks: risks } = retrieveRequirements(role);
        setMappedRisks(risks);
        setRetrievedRequirements(requirements);
        setCurrentStep(2);

        // Step 3: Get competency needs
        const competencies = getCompetencyNeeds(requirements);
        setCompetencyNeeds(competencies);
        setCurrentStep(3);

        // Step 4: Generate training plan
        const plan = generateTrainingPlan(role, requirements);
        setTrainingPlan(plan);
        setCurrentStep(4);

        // Step 5: Calculate validation score
        const score = calculateValidationScore(role, requirements, plan, risks);
        setValidationScore(score);
        setCurrentStep(5);
      }

      // Step 6: Initialize review status
      setReviewStatus({
        status: "pending",
        comments: [],
        lastUpdated: new Date().toISOString(),
      });
      setCurrentStep(6);
    } catch (error) {
      console.error('Pipeline error:', error);
      setLlmError(error instanceof Error ? error.message : 'An error occurred during processing');
      
      // Fall back to rule-based approach
      const { requirements, mappedRisks: risks } = retrieveRequirements(role);
      setMappedRisks(risks);
      setRetrievedRequirements(requirements);
      setCurrentStep(2);

      const competencies = getCompetencyNeeds(requirements);
      setCompetencyNeeds(competencies);
      setCurrentStep(3);

      const plan = generateTrainingPlan(role, requirements);
      setTrainingPlan(plan);
      setCurrentStep(4);

      const score = calculateValidationScore(role, requirements, plan, risks);
      setValidationScore(score);
      setCurrentStep(5);

      setReviewStatus({
        status: "pending",
        comments: [],
        lastUpdated: new Date().toISOString(),
      });
      setCurrentStep(6);
    } finally {
      setIsLLMProcessing(false);
      setLlmStatus(null);
    }
  };

  // Handle role selection - triggers the pipeline
  const handleRoleSelect = async (role: Role | null) => {
    if (!role) {
      // Reset everything
      setSelectedRole(null);
      setExtractedTasks([]);
      setMappedRisks([]);
      setRetrievedRequirements([]);
      setCompetencyNeeds([]);
      setTrainingPlan(null);
      setValidationScore(null);
      setReviewStatus(null);
      setRiskAnalysis(null);
      setLlmValidationAnalysis(null);
      setLlmReviewAssessment(null);
      setLlmError(null);
      setLlmStatus(null);
      setEnrichmentByRisk({});
      setEnrichmentError(null);
      setCurrentStep(0);
      return;
    }

    setSelectedRole(role);
    setCurrentStep(1);
    setLlmError(null);

    // Step 1: Extract tasks from role description
    setExtractedTasks(role.tasks);

    try {
      if (useLLM) {
        setIsLLMProcessing(true);
        
        // Step 2: Retrieve requirements with LLM enhancement (via server API route)
        setLlmStatus('Analyzing role description and identifying risk categories...');
        const riskRes = await fetch('/api/llm/analyze-risk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role }),
        });
        const riskData = await riskRes.json();
        setMappedRisks(riskData.mappedRisks);
        setRetrievedRequirements(riskData.requirements);
        setRiskAnalysis(riskData.analysis);
        setCurrentStep(2);

        // Step 2b: Enrich each risk category with regulatory citations (RAG)
        setLlmStatus('Retrieving regulatory citations...');
        const enrichResults = await Promise.allSettled(
          (riskData.mappedRisks as string[]).map((category: string) =>
            fetch('/api/llm/enrich-risk', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ riskCategory: category }),
            }).then(r => r.json())
          )
        );
        const enrichMap: Record<string, EnrichmentResult> = {};
        const enrichErrors: string[] = [];
        enrichResults.forEach((result, i) => {
          const category = riskData.mappedRisks[i];
          if (result.status === 'fulfilled' && result.value.success) {
            enrichMap[category] = { reasoning: result.value.reasoning, citations: result.value.citations, contexts: result.value.contexts ?? [] };
          } else {
            const msg = result.status === 'rejected' ? result.reason?.message : result.value.message;
            enrichErrors.push(`${category}: ${msg}`);
          }
        });
        setEnrichmentByRisk(enrichMap);
        if (enrichErrors.length > 0) {
          setEnrichmentError(
            `Regulatory enrichment failed for ${enrichErrors.length} risk categor${enrichErrors.length === 1 ? 'y' : 'ies'}: ${enrichErrors.join('; ')}`
          );
          setTrainingPlan(null);
          setValidationScore(null);
          setReviewStatus(null);
          setLlmStatus(null);
          setIsLLMProcessing(false);
          return;
        } else {
          setEnrichmentError(null);
        }

        // Step 3: Get competency needs
        setLlmStatus('Mapping competency requirements...');
        const competencies = getCompetencyNeeds(riskData.requirements);
        setCompetencyNeeds(competencies);
        setCurrentStep(3);

        // Step 4: Generate training plan with LLM enhancement (via server API route)
        setLlmStatus('Generating personalised training plan...');
        const planRes = await fetch('/api/llm/generate-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role,
            requirements: riskData.requirements,
            riskCategories: riskData.mappedRisks,
          }),
        });
        const planData = await planRes.json();
        setTrainingPlan(planData.plan.plan);
        setCurrentStep(4);

        // Step 5: Validate with LLM enhancement (via server API route)
        setLlmStatus('Validating training plan against compliance requirements...');
        const validationRes = await fetch('/api/llm/validate-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role,
            requirements: riskData.requirements,
            trainingPlan: planData.plan.plan,
            riskCategories: riskData.mappedRisks,
          }),
        });
        const validationData = await validationRes.json();
        setValidationScore(validationData.validationScore);
        setLlmValidationAnalysis(validationData.llmAnalysis);
        setLlmReviewAssessment(validationData.reviewAssessment);
        setLlmStatus('Analysis complete.');
        setCurrentStep(5);
      } else {
        // Use rule-based approach (original logic)
        const { requirements, mappedRisks: risks } = retrieveRequirements(role);
        setMappedRisks(risks);
        setRetrievedRequirements(requirements);
        setCurrentStep(2);

        // Step 3: Get competency needs
        const competencies = getCompetencyNeeds(requirements);
        setCompetencyNeeds(competencies);
        setCurrentStep(3);

        // Step 4: Generate training plan
        const plan = generateTrainingPlan(role, requirements);
        setTrainingPlan(plan);
        setCurrentStep(4);

        // Step 5: Calculate validation score
        const score = calculateValidationScore(role, requirements, plan, risks);
        setValidationScore(score);
        setCurrentStep(5);
      }

      // Step 6: Initialize review status
      setReviewStatus({
        status: "pending",
        comments: [],
        lastUpdated: new Date().toISOString(),
      });
      setCurrentStep(6);
    } catch (error) {
      console.error('Pipeline error:', error);
      setLlmError(error instanceof Error ? error.message : 'An error occurred during processing');
      
      // Fall back to rule-based approach
      const { requirements, mappedRisks: risks } = retrieveRequirements(role);
      setMappedRisks(risks);
      setRetrievedRequirements(requirements);
      setCurrentStep(2);

      const competencies = getCompetencyNeeds(requirements);
      setCompetencyNeeds(competencies);
      setCurrentStep(3);

      const plan = generateTrainingPlan(role, requirements);
      setTrainingPlan(plan);
      setCurrentStep(4);

      const score = calculateValidationScore(role, requirements, plan, risks);
      setValidationScore(score);
      setCurrentStep(5);

      setReviewStatus({
        status: "pending",
        comments: [],
        lastUpdated: new Date().toISOString(),
      });
      setCurrentStep(6);
    } finally {
      setIsLLMProcessing(false);
      setLlmStatus(null);
    }
  };

  // Handle review actions
  const handleApprove = (comment: string) => {
    if (!trainingPlan || !selectedRole) return;

    const newComment: ReviewComment = {
      id: `comment-${Date.now()}`,
      reviewerId: "reviewer-1",
      reviewerName: "Current Reviewer",
      comment: comment || "Training plan approved without comments.",
      rating: "approve",
      createdAt: new Date().toISOString(),
    };

    setReviewStatus({
      status: "approved",
      comments: [newComment],
      lastUpdated: new Date().toISOString(),
    });

    // Create LMS assignment
    const newAssignment: LMSAssignment = {
      id: `assignment-${Date.now()}`,
      trainingPlanId: `plan-${selectedRole.id}-${Date.now()}`,
      roleId: selectedRole.id,
      roleName: selectedRole.name,
      assignedTo: [`user-${Math.floor(Math.random() * 1000)}`],
      assignedBy: "Current Reviewer",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      status: "assigned",
      completionRate: 0,
      createdAt: new Date().toISOString(),
    };

    setLmsAssignments([...lmsAssignments, newAssignment]);
  };

  const handleReject = (comment: string) => {
    const newComment: ReviewComment = {
      id: `comment-${Date.now()}`,
      reviewerId: "reviewer-1",
      reviewerName: "Current Reviewer",
      comment: comment || "Training plan rejected.",
      rating: "reject",
      createdAt: new Date().toISOString(),
    };

    setReviewStatus({
      status: "rejected",
      comments: [newComment],
      lastUpdated: new Date().toISOString(),
    });
  };

  const handleNeedsRevision = (comment: string) => {
    const newComment: ReviewComment = {
      id: `comment-${Date.now()}`,
      reviewerId: "reviewer-1",
      reviewerName: "Current Reviewer",
      comment: comment || "Training plan needs revision.",
      rating: "needs_revision",
      createdAt: new Date().toISOString(),
    };

    setReviewStatus({
      status: "needs_revision",
      comments: [newComment],
      lastUpdated: new Date().toISOString(),
    });
  };

  const pipelineSteps = [
    "Select Role",
    "Extract Tasks",
    "Risk Mapping",
    "Requirements",
    "Competency",
    "Generate Plan",
    "Validate",
  ];

  // Update current step based on which review is showing
  const getCurrentStep = () => {
    if (showJdReview) return 1;
    if (showRiskMappingReview) return 2;
    if (showRequirementsReview) return 3;
    if (showCompetencyReview) return 4;
    return currentStep;
  };

  // Handle Show JSON button click for component data
  const handleShowComponentJson = (title: string, data: any) => {
    setCurrentJsonTitle(title);
    setCurrentJsonData(data);
    setShowJsonModal(true);
  };

  // Close JSON modal
  const closeJsonModal = () => {
    setShowJsonModal(false);
    setCurrentJsonData(null);
    setCurrentJsonTitle('');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Vidda Solutions
              </h1>
              <p className="text-sm text-gray-600">
                Compliance Training Generator MVP
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* LLM / Rule-based toggle */}
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${!useLLM ? 'text-gray-800' : 'text-gray-400'}`}>
                  Rule-based
                </span>
                <button
                  role="switch"
                  aria-checked={useLLM}
                  onClick={() => setUseLLM((v) => !v)}
                  disabled={isLLMProcessing}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                    useLLM ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                      useLLM ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className={`text-xs font-medium ${useLLM ? 'text-blue-700' : 'text-gray-400'}`}>
                  AI (LLM)
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Hackathon Demo v1.0
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Pipeline Progress Indicator */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {pipelineSteps.map((step, idx) => (
              <div
                key={idx}
                className={`flex items-center ${
                  idx < pipelineSteps.length - 1 ? "flex-1" : ""
                }`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                    idx <= getCurrentStep()
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {idx + 1}
                </div>
                <span
                  className={`ml-2 text-xs hidden md:inline ${
                    idx <= getCurrentStep()
                      ? "text-gray-800 font-medium"
                      : "text-gray-400"
                  }`}
                >
                  {step}
                </span>
                {idx < pipelineSteps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      idx < getCurrentStep() ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Role Input */}
          <div className="lg:col-span-1 space-y-6">
            {/* Input Mode Tabs */}
            <div className="bg-white rounded-lg shadow-md p-1">
              <div className="flex rounded-lg bg-gray-100 p-1">
                <button
                  onClick={() => {
                    setInputMode('select');
                    if (selectedRole && selectedRole.id.startsWith('custom-')) {
                      handleRoleSelect(null);
                    }
                  }}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    inputMode === 'select'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Select Role
                  </span>
                </button>
                <button
                  onClick={() => {
                    setInputMode('custom');
                    if (selectedRole && !selectedRole.id.startsWith('custom-')) {
                      handleRoleSelect(null);
                    }
                  }}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    inputMode === 'custom'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Custom Input
                  </span>
                </button>
              </div>
            </div>

            {/* Conditional rendering based on input mode */}
            {inputMode === 'select' ? (
              <RoleSelector
                roles={roles}
                selectedRole={selectedRole}
                onSelectRole={handleRoleSelect}
              />
            ) : (
              <JobDescriptionInput
                onSubmit={handleRoleSelect}
                onParsed={handleJdParsed}
                onProcessingStart={(status) => {
                  setIsLLMProcessing(true);
                  setLlmStatus(status);
                }}
                isLoading={isLLMProcessing}
              />
            )}
          </div>

          {/* Right Column - Pipeline Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* JD Review Editor (Human-in-the-loop after JD parsing) */}
            {showJdReview && parsedJobDescription && jdQualityMetrics && (
              <JdReviewEditor
                parsedRole={parsedJobDescription}
                quality={jdQualityMetrics}
                originalJobDescription={originalJobDescriptionText}
                onApprove={handleJdReviewApproved}
                onReject={handleJdReviewRejected}
                onReparsed={handleJdReparsed}
              />
            )}

            {/* Risk Mapping Review (Human-in-the-loop after JD approval) */}
            {showRiskMappingReview && parsedJobDescription && (
              <RiskMappingReview
                parsedRole={parsedJobDescription}
                jdReviewId={jdReviewId}
                onApprove={handleRiskMappingApproved}
                onReject={handleRiskMappingRejected}
              />
            )}

            {/* Requirements Review (Human-in-the-loop after retrieval) */}
            {showRequirementsReview && retrievalResult && (
              <RequirementsReview
                retrievalResult={retrievalResult}
                jdReviewId={jdReviewId}
                onApprove={handleRequirementsReviewApproved}
                onReject={handleRequirementsReviewRejected}
              />
            )}

            {/* Competency Review (Human-in-the-loop after requirements approval) */}
            {showCompetencyReview && normalizedCompetencies.length > 0 && (
              <CompetencyReview
                competencies={normalizedCompetencies}
                jdReviewId={jdReviewId}
                onApprove={handleCompetencyReviewApproved}
                onReject={handleCompetencyReviewRejected}
              />
            )}

            {/* AI Processing Status */}
            {isLLMProcessing && llmStatus && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-3">
                <svg className="w-5 h-5 text-blue-600 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-800">AI Analysis in Progress</p>
                  <p className="text-xs text-blue-600 mt-0.5">{llmStatus}</p>
                </div>
              </div>
            )}

            {/* LLM Error Banner */}
            {llmError && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-800">AI unavailable — using rule-based fallback</p>
                  <p className="text-xs text-amber-600 mt-0.5">{llmError}</p>
                </div>
              </div>
            )}

            {/* Training Plan */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Training Plan</h2>
                <button
                  onClick={() => handleShowComponentJson('Training Plan', { trainingPlan, mappedRisks, competencyNeeds, enrichmentByRisk })}
                  className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Show JSON
                </button>
              </div>
              <TrainingPlanComponent
                trainingPlan={trainingPlan}
                mappedRisks={mappedRisks}
                competencyNeeds={competencyNeeds}
                enrichmentByRisk={enrichmentByRisk}
                enrichmentError={enrichmentError}
              />
            </div>

            {/* Validation Score */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Validation Score</h2>
                <button
                  onClick={() => handleShowComponentJson('Validation Score', { validationScore, llmValidationAnalysis, llmReviewAssessment })}
                  className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Show JSON
                </button>
              </div>
              <ValidationScoreComponent score={validationScore} />
            </div>

            {/* Human Review */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Human Review</h2>
                <button
                  onClick={() => handleShowComponentJson('Human Review', { reviewStatus, lmsAssignments })}
                  className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Show JSON
                </button>
              </div>
              <HumanReviewComponent
                reviewStatus={reviewStatus}
                onApprove={handleApprove}
                onReject={handleReject}
                onNeedsRevision={handleNeedsRevision}
              />
            </div>
          </div>
        </div>

        {/* LMS Assignments - Full Width */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">LMS Assignments</h2>
            <button
              onClick={() => handleShowComponentJson('LMS Assignments', { assignments: lmsAssignments })}
              className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Show JSON
            </button>
          </div>
          <LMSAssignmentComponent
            assignments={lmsAssignments}
            onAssignTraining={() => {}}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-center text-sm text-gray-500">
            Vidda Solutions - Compliance Training Generator MVP | Built for Hackathon 2024
          </p>
        </div>
      </footer>

      {/* JSON Modal for Component Data */}
      {showJsonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeJsonModal}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{currentJsonTitle}</h3>
              <button
                onClick={closeJsonModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(80vh-60px)]">
              {currentJsonData ? (
                <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm font-mono text-gray-800 border border-gray-200">
                  {JSON.stringify(currentJsonData, null, 2)}
                </pre>
              ) : (
                <p className="text-gray-500 text-center py-8">No data available.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
