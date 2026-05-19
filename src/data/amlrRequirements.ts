import { AMLRRequirement, TrainingModule } from "@/types";

export const amlrRequirements: AMLRRequirement[] = [
  {
    id: "amlr-001",
    title: "Customer Due Diligence (CDD)",
    description:
      "Requirement to identify and verify the identity of customers and beneficial owners, understand the nature of the business relationship, and conduct ongoing monitoring.",
    article: "AMLR Article 12",
    paragraph: "Article 12(1)",
    sourceExcerpt:
      "Obliged entities shall apply customer due diligence measures when establishing a business relationship, when carrying out occasional transactions, when there is a suspicion of money laundering or terrorist financing, or when there are doubts about the veracity or adequacy of previously obtained customer identification data.",
    riskCategories: ["customer-identification", "beneficial-ownership", "ongoing-monitoring"],
    appliesToTaskTypes: ["onboarding", "customer-verification", "periodic-review"],
    competencyRequirements: [
      "Knowledge of CDD procedures",
      "Ability to verify identity documents",
      "Understanding of beneficial ownership concepts",
      "Risk-based approach application",
    ],
    trainingModuleIds: ["mod-001", "mod-002", "mod-003"],
    relevanceReason:
      "Core AMLR requirement applicable to all customer-facing roles that handle onboarding or ongoing customer relationships.",
    confidence: 0.95,
  },
  {
    id: "amlr-002",
    title: "Enhanced Due Diligence (EDD)",
    description:
      "Additional measures required for high-risk customers, including PEPs, high-risk third countries, and complex unusual transactions.",
    article: "AMLR Article 12",
    paragraph: "Article 12(4)",
    sourceExcerpt:
      "For higher-risk situations, obliged entities shall apply enhanced customer due diligence measures. This includes relationships with politically exposed persons, high-risk third countries, and complex or unusually large transactions.",
    riskCategories: ["pep", "high-risk-country", "complex-transactions"],
    appliesToTaskTypes: ["high-risk-assessment", "pep-screening", "enhanced-monitoring"],
    competencyRequirements: [
      "PEP identification and handling",
      "High-risk country assessment",
      "Source of wealth verification",
      "Enhanced monitoring techniques",
    ],
    trainingModuleIds: ["mod-004", "mod-005"],
    relevanceReason:
      "Required for roles that assess customer risk levels or handle high-risk customer relationships.",
    confidence: 0.90,
  },
  {
    id: "amlr-003",
    title: "Suspicious Activity Reporting",
    description:
      "Obligation to detect, report, and handle suspicious transactions through internal procedures and external reporting to FIU.",
    article: "AMLR Article 9",
    paragraph: "Article 9(1)",
    sourceExcerpt:
      "Obliged entities and their directors and employees shall cooperate fully with the Financial Intelligence Unit in preventing, detecting and combating money laundering and terrorist financing. This includes promptly reporting any fact which might be an indication of money laundering or terrorist financing.",
    riskCategories: ["suspicious-activity", "reporting", "tipping-off"],
    appliesToTaskTypes: ["transaction-monitoring", "escalation", "sar-filing"],
    competencyRequirements: [
      "Red flag identification",
      "SAR filing procedures",
      "Internal escalation protocols",
      "Tipping-off prevention",
    ],
    trainingModuleIds: ["mod-006", "mod-007"],
    relevanceReason:
      "Essential for roles involved in transaction monitoring, compliance, or any position with responsibility to identify and report suspicious activity.",
    confidence: 0.92,
  },
  {
    id: "amlr-004",
    title: "Sanctions Compliance",
    description:
      "Requirement to screen customers and transactions against applicable sanctions lists and freeze assets of designated persons.",
    article: "AMLR Article 9",
    paragraph: "Article 9(3)",
    sourceExcerpt:
      "Obliged entities shall take appropriate measures to ensure that their foreign branches and majority-owned subsidiaries comply with the measures required in accordance with this Directive. This includes screening against applicable sanctions lists and asset freezing requirements.",
    riskCategories: ["sanctions", "asset-freezing", "screening"],
    appliesToTaskTypes: ["sanctions-screening", "transaction-blocking", "asset-freezing"],
    competencyRequirements: [
      "Sanctions list screening",
      "False positive analysis",
      "Asset freezing procedures",
      "License application process",
    ],
    trainingModuleIds: ["mod-008", "mod-009"],
    relevanceReason:
      "Critical for roles that process transactions, onboard customers, or operate in jurisdictions with sanctions obligations.",
    confidence: 0.88,
  },
  {
    id: "amlr-005",
    title: "Record Keeping",
    description:
      "Requirement to maintain adequate records of customer due diligence, transactions, and risk assessments for the prescribed retention period.",
    article: "AMLR Article 13",
    paragraph: "Article 13(1)",
    sourceExcerpt:
      "Obliged entities shall keep the following documents and information for the purposes of preventing, detecting and investigating potential money laundering or terrorist financing: copies of documents and information obtained through customer due diligence, supporting records and documents for transactions, and risk assessments.",
    riskCategories: ["documentation", "record-keeping", "audit-trail"],
    appliesToTaskTypes: ["documentation", "audit-preparation", "data-retention"],
    competencyRequirements: [
      "Documentation standards",
      "Record retention requirements",
      "Retrieval procedures",
      "Audit preparation",
    ],
    trainingModuleIds: ["mod-010"],
    relevanceReason:
      "Applicable to all roles that handle customer data, process transactions, or maintain compliance records.",
    confidence: 0.94,
  },
  {
    id: "amlr-006",
    title: "Risk Assessment",
    description:
      "Requirement to conduct comprehensive money laundering/terrorist financing risk assessments at business, customer, and transaction levels.",
    article: "AMLR Article 13",
    paragraph: "Article 13(2)",
    sourceExcerpt:
      "Obliged entities shall take appropriate measures so that their relevant employees are aware of the provisions of this Directive and of the internal policies, procedures and controls adopted by the entity in accordance with this Directive. This includes understanding and applying risk assessment methodologies.",
    riskCategories: ["risk-assessment", "ml-tf-risk", "inherent-risk"],
    appliesToTaskTypes: ["risk-scoring", "customer-rating", "periodic-assessment"],
    competencyRequirements: [
      "Risk assessment methodologies",
      "Risk scoring techniques",
      "Control effectiveness evaluation",
      "Risk reporting",
    ],
    trainingModuleIds: ["mod-011", "mod-012"],
    relevanceReason:
      "Essential for roles responsible for assessing customer risk, conducting periodic reviews, or making risk-based decisions.",
    confidence: 0.91,
  },
  {
    id: "amlr-007",
    title: "Internal Controls and Governance",
    description:
      "Requirement to establish adequate internal policies, procedures, and controls to mitigate ML/TF risks, including senior management oversight.",
    article: "AMLR Article 9",
    paragraph: "Article 9(1)",
    sourceExcerpt:
      "Obliged entities shall establish and maintain adequate internal policies, procedures and controls to mitigate and manage effectively the risks of money laundering and terrorist financing identified at Union level by the risk assessment referred to in Article 5(1) and at national level by the risk assessments referred to in Article 5(2) as well as any relevant sectoral risk assessments carried out at Union or national level, and risks associated with individual customers.",
    riskCategories: ["internal-controls", "governance", "policies"],
    appliesToTaskTypes: ["policy-development", "control-design", "governance-oversight"],
    competencyRequirements: [
      "Policy development",
      "Control design and implementation",
      "Governance frameworks",
      "Compliance monitoring",
    ],
    trainingModuleIds: ["mod-013", "mod-014"],
    relevanceReason:
      "Primarily applicable to management and compliance roles responsible for establishing and maintaining AML/CFT frameworks.",
    confidence: 0.87,
  },
  {
    id: "amlr-008",
    title: "Role-specific AML Awareness and Training",
    description:
      "Requirement for ongoing, specific training appropriate to the employee's function and risk exposure, as mandated by AMLR Article 12.",
    article: "AMLR Article 12",
    paragraph: "Article 12(3)",
    sourceExcerpt:
      "Obliged entities shall ensure that their relevant employees receive regular training on the provisions of this Directive, the entity's internal policies and procedures, and the latest typologies and trends in money laundering and terrorist financing. The training shall be specific to the employee's function and risk exposure, and records of training shall be maintained.",
    riskCategories: ["AML", "KYC", "fraud", "sanctions", "data-protection"],
    appliesToTaskTypes: ["onboarding", "monitoring", "escalation", "reporting", "customer-verification"],
    competencyRequirements: [
      "Recognise suspicious activity",
      "Know how to escalate",
      "Understand role-specific AML controls",
      "Apply risk-based approach to daily tasks",
    ],
    trainingModuleIds: ["mod-001", "mod-006", "mod-011"],
    relevanceReason:
      "Universal requirement for all employees whose work is relevant for compliance with AMLR. Training must be specific to the employee's function/activity and their risk exposure.",
    confidence: 0.96,
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