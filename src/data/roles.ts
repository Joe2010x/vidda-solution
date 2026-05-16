import { Role } from "@/types";

export const roles: Role[] = [
  {
    id: "compliance-officer",
    name: "Compliance Officer",
    description:
      "Responsible for ensuring the organization adheres to regulatory requirements and internal policies. Manages compliance programs, conducts risk assessments, and reports to senior management and regulators.",
    tasks: [
      "Monitor regulatory changes and assess impact",
      "Conduct compliance risk assessments",
      "Develop and implement compliance policies",
      "Review and approve high-risk transactions",
      "File suspicious activity reports (SARs)",
      "Conduct employee training on compliance matters",
      "Liaise with regulators during examinations",
      "Investigate compliance breaches",
    ],
    riskLevel: "high",
    department: "Compliance",
  },
  {
    id: "risk-manager",
    name: "Risk Manager",
    description:
      "Identifies, assesses, and mitigates financial and operational risks. Develops risk management frameworks and ensures appropriate controls are in place to manage exposure.",
    tasks: [
      "Identify and assess money laundering risks",
      "Develop risk assessment methodologies",
      "Monitor risk indicators and key risk metrics",
      "Review customer risk ratings",
      "Assess third-party relationships for risk",
      "Report risk exposure to senior management",
      "Implement risk mitigation strategies",
      "Conduct periodic risk reviews",
    ],
    riskLevel: "high",
    department: "Risk Management",
  },
  {
    id: "front-line-staff",
    name: "Front-line Staff",
    description:
      "Customer-facing employees who handle transactions, account openings, and initial customer interactions. First line of defense in detecting suspicious activities.",
    tasks: [
      "Verify customer identification documents",
      "Process customer transactions",
      "Open new customer accounts",
      "Identify unusual transaction patterns",
      "Escalate suspicious activities to compliance",
      "Maintain accurate customer records",
      "Follow KYC procedures during onboarding",
      "Answer customer inquiries about account requirements",
    ],
    riskLevel: "medium",
    department: "Operations",
  },
  {
    id: "senior-management",
    name: "Senior Management",
    description:
      "Executive leadership responsible for setting strategic direction, approving major decisions, and ensuring adequate resources for compliance and risk management functions.",
    tasks: [
      "Approve compliance and risk policies",
      "Allocate resources for AML/CFT programs",
      "Review and approve high-risk relationships",
      "Oversee regulatory examination responses",
      "Set risk appetite and tolerance levels",
      "Review periodic compliance reports",
      "Ensure adequate staffing for compliance function",
      "Make final decisions on regulatory matters",
    ],
    riskLevel: "high",
    department: "Executive",
  },
  {
    id: "kyc-analyst",
    name: "KYC Analyst",
    description:
      "Specialist responsible for conducting Know Your Customer due diligence, verifying customer information, and assessing customer risk profiles for onboarding and periodic reviews.",
    tasks: [
      "Conduct customer due diligence (CDD)",
      "Perform enhanced due diligence (EDD) for high-risk customers",
      "Verify beneficial ownership information",
      "Screen customers against sanctions lists",
      "Review and update customer risk ratings",
      "Conduct periodic KYC reviews",
      "Document KYC findings and decisions",
      "Escalate high-risk findings to compliance",
    ],
    riskLevel: "medium",
    department: "Compliance",
  },
];