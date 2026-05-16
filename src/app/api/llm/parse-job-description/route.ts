import { NextRequest, NextResponse } from 'next/server';
import type { ParseJobDescriptionRequest, ParseJobDescriptionResponse } from '@/llm/delivery/parseJobDescription';
import { handleParseJobDescription } from '@/llm/delivery/parseJobDescription';

export async function POST(request: NextRequest) {
  try {
    const body: ParseJobDescriptionRequest = await request.json();
    const result = await handleParseJobDescription(body);

    return NextResponse.json<ParseJobDescriptionResponse>(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error('Error parsing job description:', error);

    const response: ParseJobDescriptionResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred while parsing the job description.',
    };

    return NextResponse.json<ParseJobDescriptionResponse>(response, { status: 500 });
  }
}