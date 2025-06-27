import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { content, filename, caseContext } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: 'No content provided' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a legal assistant analyzing documents for a litigation chronology. 
Extract key events, dates, parties involved, and legally significant information from the provided document.
${caseContext ? `Case Context: ${caseContext}` : ''}

For each significant event or fact you identify, provide:
1. Date (in YYYY-MM-DD format if available)
2. Time (if mentioned)
3. Parties involved
4. Brief title/summary of the event
5. Detailed description
6. Source reference
7. Legal significance
8. Category (Communication, Financial Transaction, Legal Filing, Contract, Meeting/Conference, Document Creation, Property/Real Estate, Investigation, Compliance, Other)

Format your response as a JSON array of objects with these fields:
{
  "entries": [
    {
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "parties": "Party A, Party B",
      "title": "Brief title",
      "summary": "Detailed description",
      "source": "Document name or reference",
      "category": "Category name",
      "legalSignificance": "Why this matters legally"
    }
  ]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Please analyze this document and extract chronology entries:\n\nFilename: ${filename}\n\nContent:\n${content}`
        }
      ]
    });

    // Parse the response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsed);
      }
    } catch (parseError) {
      console.error('Error parsing Claude response:', parseError);
    }

    // If parsing fails, return the raw response
    return NextResponse.json({
      entries: [],
      rawResponse: responseText,
      error: 'Failed to parse response into structured format'
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}