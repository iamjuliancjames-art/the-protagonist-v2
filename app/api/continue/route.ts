import { NextResponse } from 'next/server';

// NOTE: Replace this function with a real fetch call to your GGUF server or OpenAI API
// to get actual generations. Currently, it mocks the response.
async function generateStory(authorPrompt: string, context: string, userAction: string, authorName: string): Promise<string> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Mock Logic for demo purposes
  if (authorName.includes("Hemingway")) {
    return `The protagonist did as told. ${userAction} The drink was cold. The room was quiet. It was good.`;
  } else if (authorName.includes("Lovecraft")) {
    return `With a trembling hand, the protagonist committed to this fate: ${userAction} The shadows seemed to lengthen, twisting into geometries hurtful to the eye. A gibbering sound echoed from the walls.`;
  } else if (authorName.includes("Gibson")) {
    return `${userAction} The neon flickered in the rain-slicked alley. A drone buzzed overhead, recording everything. The protagonist felt the static in their teeth.`;
  } else {
    return `And so, ${userAction} The world seemed to shift around them, full of magic and possibility.`;
  }
}

export async function POST(req: Request) {
  try {
    const { authorId, context, userAction, mode, authorName, systemPrompt } = await req.json();

    if (!authorId) return NextResponse.json({ error: 'Author not found' }, { status: 400 });

    let prompt = "";
    let responseText = "";

    if (mode === 'collaborative') {
      // In collaborative mode, we accept the user's writing directly.
      responseText = ""; // No AI generation needed, just saving the user input
    } else {
      // Standard Adventure Mode
      prompt = `${systemPrompt}\n\nContext:\n${context}\n\nThe Protagonist chooses to: ${userAction}\n\nWrite the next passage (approx 100 words):`;
      responseText = await generateStory(systemPrompt, context, userAction, authorName);
    }

    return NextResponse.json({ 
      text: responseText,
      authorName: authorName 
    });

  } catch (error) {
    console.error('Story Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate story' }, { status: 500 });
  }
}