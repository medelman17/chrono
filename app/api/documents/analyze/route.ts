import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(req: NextRequest) {
  console.log('[DEBUG] Document analyze API called');
  
  try {
    const { 
      content, 
      filename, 
      caseContext,
      keyParties,
      instructions,
      userContext,
      existingEntries 
    } = await req.json();
    
    console.log('[DEBUG] Analysis request:', {
      contentLength: content?.length || 0,
      filename,
      hasCaseContext: !!caseContext,
      hasKeyParties: !!keyParties,
      hasInstructions: !!instructions,
      existingEntriesCount: existingEntries?.length || 0,
    });

    if (!content) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
    }

    // Build case context section
    const caseContextSection = caseContext || keyParties || instructions
      ? `
CASE CONTEXT:
${caseContext ? `Case Overview: ${caseContext}` : ""}
${keyParties ? `\nKey Parties: ${keyParties}` : ""}
${instructions ? `\nSpecial Instructions: ${instructions}` : ""}`
      : "";

    // Build existing chronology context
    const existingChronologyContext = existingEntries && existingEntries.length > 0
      ? `\n\nEXISTING CHRONOLOGY CONTEXT:\n${existingEntries
          .map((entry: { date: string; time?: string; title: string; summary: string }) => 
            `${entry.date} ${entry.time || ""} - ${entry.title}: ${entry.summary.substring(0, 100)}...`
          )
          .join("\n")}`
      : "";

    const systemPrompt = `You are assisting with litigation chronology development. Please analyze the following document/information and create a chronology entry.
${caseContextSection}

DOCUMENT/INFORMATION TO ANALYZE:
${content}

${filename ? `FILENAME: ${filename}` : ""}
${userContext ? `USER CONTEXT: ${userContext}` : ""}
${existingChronologyContext}

INSTRUCTIONS:
- Use the case context above to better understand the legal significance of events
- Consider how this document/event relates to the key legal issues and parties mentioned
- If analyzing email files (.eml), extract sender, recipient, date, subject, and body content
- For PDF files noted as binary, acknowledge the limitation and ask for specific details
- For images, note that visual analysis would be needed and ask for description of content
- For multiple files, create separate entries or identify if they relate to a single event
- Pay attention to timestamps, metadata, and document headers
- Consider the document source (email, legal filing, public record, etc.) in your analysis
- Follow any special instructions provided in the case context

Please provide a JSON response with the following structure:
{
  "entries": [
    {
      "date": "YYYY-MM-DD format",
      "time": "HH:MM format if available, otherwise empty string",
      "parties": "comma-separated list of parties involved",
      "title": "Event title in format: [Document Type] from [Party] to [Party] re: [Subject] or similar",
      "summary": "Factual summary of what occurred - be precise and objective",
      "category": "Choose from: Communication, Financial Transaction, Legal Filing, Contract, Meeting/Conference, Document Creation, Property/Real Estate, Investigation, Compliance, Other",
      "legalSignificance": "Analysis of potential legal significance in context of litigation",
      "source": "Document name or reference",
      "questions": ["Array of clarifying questions if context is unclear or if you need more information"],
      "relatedEntries": "Suggested connections to existing chronology entries if applicable",
      "sourceInfo": "Details about the document source, file type, and any metadata"
    }
  ]
}

IMPORTANT: 
- If you need clarification about dates, parties, context, relevance, or if files cannot be fully processed, include specific questions in the "questions" array
- Be thorough but concise in your analysis
- You may create multiple entries if the document contains multiple distinct events
- Respond ONLY with valid JSON. Do not include any text outside the JSON structure`;

    console.log('[DEBUG] Sending request to Claude API');
    
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: systemPrompt,
        },
      ],
    });
    
    console.log('[DEBUG] Claude API response received');

    // Parse the response
    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('[DEBUG] Successfully parsed response:', {
          hasEntries: !!parsed.entries,
          entriesCount: parsed.entries?.length || 0,
        });
        return NextResponse.json(parsed);
      }
    } catch (parseError) {
      console.error("[DEBUG] Error parsing Claude response:", parseError);
      console.error("[DEBUG] Raw response:", responseText.substring(0, 500));
    }

    // If parsing fails, return the raw response
    return NextResponse.json({
      entries: [],
      rawResponse: responseText,
      error: "Failed to parse response into structured format",
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" }, 
      { status: 500 }
    );
  }
}