import { AMLRRequirement, TrainingModule } from "@/types";

export const amirRequirements: AMLRRequirement[] = [
  {
    id: "amir-001",
    title: "Customer Due Diligence (CDD)",
    description:
      "Requirement to identify and verify the identity of customers and beneficial owners, understand the nature of the business relationship, and conduct ongoing monitoring.",
    riskCategories: ["customer-identification", "beneficial-ownership", "ongoing-monitoring"],
    competencyRequirements: [
      "Knowledge of CDD procedures",
      "Ability to verify identity documents",
      "Understanding of beneficial ownership concepts",
      "Risk-based approach application",
    ],
    trainingModuleIds: ["mod-001", "mod-002", "mod-003"],
  },
  {
    id: "amir-002",
    title: "Enhanced Due Diligence (EDD)",
    description:
      "Additional measures required for high-risk customers, including PEPs, high-risk third countries, and complex unusual transactions.",
    riskCategories: ["pep", "high-risk-country", "complex-transactions"],
    competencyRequirements: [
      "PEP identification and handling",
      "High-risk country assessment",
      "Source of wealth verification",
      "Enhanced monitoring techniques",
    ],
    trainingModuleIds: ["mod-004", "mod-005"],
  },
  {
    id: "amir-003",
    title: "Suspicious Activity Reporting",
    description:
      "Obligation to detect, report, and handle suspicious transactions through internal procedures and external reporting to FIU.",
    riskCategories: ["suspicious-activity", "reporting", "tipping-off"],
    competencyRequirements: [
      "Red flag identification",
      "SAR filing procedures",
      "Internal escalation protocols",
      "Tipping-off prevention",
    ],
    trainingModuleIds: ["mod-006", "mod-007"],
  },
  {
    id: "amir-004",
    title: "Sanctions Compliance",
    description:
      "Requirement to screen customers and transactions against applicable sanctions lists and freeze assets of designated persons.",
    riskCategories: ["sanctions", "asset-freezing", "screening"],
    competencyRequirements: [
      "Sanctions list screening",
      "False positive analysis",
      "Asset freezing procedures",
      "License application process",
    ],
    trainingModuleIds: ["mod-008", "mod-009"],
  },
  {
    id: "amir-005",
    title: "Record Keeping",
    description:
      "Requirement to maintain adequate records of customer due diligence, transactions, and risk assessments for the prescribed retention period.",
    riskCategories: ["documentation", "record-keeping", "audit-trail"],
    competencyRequirements: [
      "Documentation standards",
      "Record retention requirements",
      "Retrieval procedures",
      "Audit preparation",
    ],
    trainingModuleIds: ["mod-010"],
  },
  {
    id: "amir-006",
    title: "Risk Assessment",
    description:
      "Requirement to conduct comprehensive money laundering/terrorist financing risk assessments at business, customer, and transaction levels.",
    riskCategories: ["risk-assessment", "ml-tf-risk", "inherent-risk"],
    competencyRequirements: [
      "Risk assessment methodologies",
      "Risk scoring techniques",
      "Control effectiveness evaluation",
      "Risk reporting",
    ],
    trainingModuleIds: ["mod-011", "mod-012"],
  },
  {
    id: "amir-007",
    title: "Internal Controls and Governance",
    description:
      "Requirement to establish adequate internal policies, procedures, and controls to mitigate ML/TF risks, including senior management oversight.",
    riskCategories: ["internal-controls", "governance", "policies"],
    competencyRequirements: [
      "Policy development",
      "Control design and implementation",
      "Governance frameworks",
      "Compliance monitoring",
    ],
    trainingModuleIds: ["mod-013", "mod-014"],
  },
];

export const trainingModules: TrainingModule[] = [
  {
    id: "mod-001",
    title: "CDD Fundamentals",
    description:
      "Introduction to Customer Due Diligence requirements, identity verification, and the risk-based approach to customer onboarding.",
    duration: 45,
    type: "interactive",
    priority: "high",
    competencyAreas: ["customer-identification", "risk-based-approach"],
  },
  {
    id: "mod-002",
    title: "Identity Verification Techniques",
    description:
      "Practical training on verifying various types of identity documents, detecting forged documents, and using verification tools.",
    duration: 30,
    type: "video",
    priority: "high",
    competencyAreas: ["customer-identification"],
  },
  {
    id: "mod-003",
    title: "Beneficial Ownership Identification",
    description:
      "Understanding beneficial ownership concepts, identifying ultimate beneficial owners, and documenting ownership structures.",
    duration: 40,
    type: "interactive",
    priority: "high",
    competencyAreas: ["beneficial-ownership"],
  },
  {
    id: "mod-004",
    title: "PEP Identification and Handling",
    description:
      "Comprehensive training on identifying Politically Exposed Persons, understanding their risk profiles, and applying enhanced measures.",
    duration: 35,
    type: "interactive",
    priority: "high",
    competencyAreas: ["pep", "high-risk-country"],
  },
  {
    id: "mod-005",
    title: "Source of Wealth Verification",
    description:
      "Techniques for verifying and documenting source of wealth and source of funds for high-risk customers.",
    duration: 30,
    type: "document",
    priority: "medium",
    competencyAreas: ["source-of-wealth"],
  },
  {
    id: "mod-006",
    title: "Red Flags and Suspicious Activity Detection",
    description:
      "Recognizing indicators of money laundering and terrorist financing across various products, services, and customer types.",
    duration: 50,
    type: "interactive",
    priority: "high",
    competencyAreas: ["suspicious-activity"],
  },
  {
    id: "mod-007",
    title: "SAR Filing Procedures",
    description:
      "Step-by-step guidance on preparing, reviewing, and filing Suspicious Activity Reports with the Financial Intelligence Unit.",
    duration: 40,
    type: "video",
    priority: "high",
    competencyAreas: ["reporting"],
  },
  {
    id: "mod-008",
    title: "Sanctions Screening Fundamentals",
    description:
      "Understanding sanctions regimes, screening procedures, and handling potential matches against sanctions lists.",
    duration: 35,
    type: "interactive",
    priority: "high",
    competencyAreas: ["sanctions", "screening"],
  },
  {
    id: "mod-009",
    title: "Asset Freezing Procedures",
    description:
      "Legal requirements and operational procedures for freezing assets of designated persons and entities.",
    duration: 25,
    type: "document",
    priority: "medium",
    competencyAreas: ["asset-freezing"],
  },
  {
    id: "mod-010",
    title: "Record Keeping Best Practices",
    description:
      "Requirements for maintaining adequate records, retention periods, and ensuring audit readiness.",
    duration: 20,
    type: "video",
    priority: "medium",
    competencyAreas: ["documentation", "record-keeping"],
  },
  {
    id: "mod-011",
    title: "ML/TF Risk Assessment Methodologies",
    description:
      "Comprehensive training on conducting money laundering and terrorist financing risk assessments at various levels.",
    duration: 60,
    type: "interactive",
    priority: "high",
    competencyAreas: ["risk-assessment", "ml-tf-risk"],
  },
  {
    id: "mod-012",
    title: "Customer Risk Rating",
    description:
      "Techniques for assigning and reviewing customer risk ratings based on risk factors and indicators.",
    duration: 30,
    type: "interactive",
    priority: "high",
    competencyAreas: ["risk-assessment"],
  },
  {
    id: "mod-013",
    title: "AML/CFT Policy Development",
    description:
      "Guidance on developing, implementing, and maintaining effective AML/CFT policies and procedures.",
    duration: 45,
    type: "document",
    priority: "medium",
    competencyAreas: ["policies", "internal-controls"],
  },
  {
    id: "mod-014",
    title: "Governance and Senior Management Responsibilities",
    description:
      "Understanding senior management's role in AML/CFT compliance, including oversight and resource allocation.",
    duration: 40,
    type: "video",
    priority: "medium",
    competencyAreas: ["governance"],
  },
];