"use client";

import { useState } from "react";
import { Role, ParsedJobDescription, JDQualityMetrics } from "@/types";
import { jdTemplates, JDTemplate } from "@/data/jdTemplates";

interface JobDescriptionInputProps {
  onSubmit: (role: Role) => void;
  onParsed?: (role: Role, parsedData: ParsedJobDescription, quality: JDQualityMetrics, originalText: string) => void;
  onProcessingStart?: (status: string) => void;
  isLoading?: boolean;
}

export default function JobDescriptionInput({
  onSubmit,
  onParsed,
  onProcessingStart,
  isLoading = false,
}: JobDescriptionInputProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoadTemplate = (template: JDTemplate) => {
    setJobDescription(template.description);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!jobDescription.trim()) {
      setError("Please enter a job description");
      return;
    }

    if (jobDescription.trim().length < 50) {
      setError("Please provide a more detailed job description (at least 50 characters)");
      return;
    }

    try {
      setIsParsing(true);
      onProcessingStart?.('Parsing job description with AI...');
      const response = await fetch("/api/llm/parse-job-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobDescription }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse job description");
      }

      if (data.success) {
        // Check if we have enhanced parsed data (new format)
        if (data.parsedRole && data.quality) {
          // Create a Role object for backward compatibility
          const role: Role = {
            id: `custom-${Date.now()}`,
            name: data.parsedRole.roleName,
            description: data.parsedRole.roleSummary,
            tasks: data.parsedRole.tasks.map((t: { description: string }) => t.description),
            riskLevel: data.parsedRole.overallRiskLevel,
            department: data.parsedRole.department || "Custom",
          };
          
          // If onParsed callback is provided, use the new review flow
          if (onParsed) {
            onParsed(role, data.parsedRole, data.quality, jobDescription);
          } else {
            // Fallback to direct submit
            onSubmit(role);
          }
        } else if (data.role) {
          // Legacy format
          const role: Role = {
            id: `custom-${Date.now()}`,
            name: data.role.name,
            description: data.role.description,
            tasks: data.role.tasks,
            riskLevel: data.role.riskLevel,
            department: data.role.department,
          };
          onSubmit(role);
        }
      }
    } catch (err) {
      console.error("Error parsing job description:", err);
      setError(err instanceof Error ? err.message : "An error occurred while parsing the job description");
    } finally {
      setIsParsing(false);
    }
  };

  const handleClear = () => {
    setJobDescription("");
    setError(null);
    setIsParsing(false);
  };

  const loadSampleDescription = () => {
    setJobDescription(`Senior Financial Analyst - Transaction Monitoring

We are seeking an experienced Senior Financial Analyst to join our Transaction Monitoring team. The successful candidate will be responsible for analyzing complex financial transactions, identifying suspicious activity patterns, and ensuring compliance with Anti-Money Laundering (AML) and Counter-Terrorist Financing (CTF) regulations.

Key Responsibilities:
- Monitor and analyze high-value financial transactions for potential money laundering or terrorist financing indicators
- Conduct enhanced due diligence on high-risk customers and transactions
- Prepare Suspicious Activity Reports (SARs) and file them with relevant authorities
- Collaborate with compliance officers to develop and implement AML policies and procedures
- Review customer onboarding documentation and verify source of funds
- Conduct periodic risk assessments of existing customer relationships
- Provide training and guidance to junior analysts on AML detection techniques
- Liaise with law enforcement agencies and regulatory bodies during investigations
- Maintain detailed records of all monitoring activities and decisions
- Stay current with evolving AML regulations and industry best practices

Requirements:
- Bachelor's degree in Finance, Accounting, or related field
- 5+ years of experience in financial analysis or AML compliance
- Strong knowledge of AML/CFT regulations and typologies
- Experience with transaction monitoring systems and tools
- Excellent analytical and problem-solving skills
- Professional certification (CAMS, CFE) preferred`);
    setError(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Custom Job Description
        </h2>
        <button
          onClick={loadSampleDescription}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
          type="button"
        >
          Load sample
        </button>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Paste or type a job description below. The AI will analyze it to extract
        tasks, identify risks, and generate a compliance training plan.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="job-description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Job Description
          </label>
          <textarea
            id="job-description"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
            placeholder="Paste the full job description here..."
            disabled={isParsing || isLoading}
          />
          <div className="mt-1 flex justify-between items-center">
            <span className="text-xs text-gray-500">
              {jobDescription.length} characters
            </span>
            {jobDescription.length > 0 && jobDescription.length < 50 && (
              <span className="text-xs text-yellow-600">
                Minimum 50 characters recommended
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {isParsing && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
            <svg className="w-4 h-4 text-blue-600 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <p className="text-sm text-blue-700">Parsing job description with AI… this may take a moment.</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isParsing || isLoading || !jobDescription.trim()}
            className={`flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors ${
              isParsing || isLoading || !jobDescription.trim()
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isParsing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Parsing with AI...
              </span>
            ) : isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analyzing...
              </span>
            ) : (
              "Generate Training Plan"
            )}
          </button>
          
          <button
            type="button"
            onClick={handleClear}
            disabled={isParsing || isLoading || !jobDescription}
            className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear
          </button>
        </div>
      </form>

      {/* JD Templates Quick Load */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Quick Load Templates
        </h4>
        <p className="text-xs text-gray-500 mb-3">
          Click to load a pre-configured job description template:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {jdTemplates.templates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleLoadTemplate(template)}
              className="px-3 py-2 text-left text-sm border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors bg-white"
            >
              <div className="font-medium text-gray-800">{template.name}</div>
              <div className="text-xs text-gray-500">{template.category}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          What the AI will extract:
        </h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            Job title and department
          </li>
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            Key tasks and responsibilities
          </li>
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            AML/CFT risk level assessment
          </li>
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            Relevant compliance training requirements
          </li>
        </ul>
      </div>
    </div>
  );
}