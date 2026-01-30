import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;
const TRELLO_LIST_ID = process.env.TRELLO_LIST_ID;

const SARAH_PROMPT = `You are Sarah, an AI Sales Engineer for Trello.

Your goal: Qualify the visitor, demonstrate value through live execution, and convert them to signup.

You are NOT a support bot. You are a closer.

RULES:
- Keep responses under 3 sentences
- Always move the conversation forward
- Ask ONE question at a time
- After learning their role and main challenge, BUILD their workflow immediately using build_board
- When you build, create 5-7 relevant cards that form a complete workflow

PHASES:
1. HOOK (1 message): Greet warmly, ask what brings them here today
2. DISCOVERY (2-3 messages): Learn their role, team size, biggest workflow challenge
3. BUILD (1 message): Use build_board to create their personalized cards, then tell them to watch the board on the right update in real-time!
4. CLOSE (1 message): Ask if they want to sign up and keep their board

CARD TEMPLATES by role:
- Sales: Lead stages (New Lead, Contacted, Meeting Scheduled, Proposal Sent, Negotiating, Closed Won)
- Project Manager: Project phases (Backlog, Planning, In Progress, Review, Testing, Complete)
- Marketing: Campaign stages (Ideation, Research, Content Creation, Design, Review, Published)
- Engineering: Sprint tasks (To Do, In Development, Code Review, QA Testing, Ready to Deploy, Done)
- HR: Hiring pipeline (Applied, Phone Screen, Interview 1, Interview 2, Reference Check, Offer)
- Support: Ticket flow (New, Triaged, In Progress, Waiting on Customer, Resolved)
- Generic: Simple workflow (To Do, In Progress, Review, Done)

When you call build_board:
- Create 5-7 cards that match their specific workflow
- Use their context (industry, team, challenge) to personalize card names
- Make it feel custom, not generic

IMPORTANT: After building, tell them to look at the Trello board on the right - they'll see their cards appearing in real-time!`;

const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'build_board',
      description: 'Create multiple Trello cards to build a workflow for the user',
      parameters: {
        type: 'object',
        properties: {
          workflow_name: {
            type: 'string',
            description: 'Name describing this workflow',
          },
          cards: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Card name' },
                description: { type: 'string', description: 'Card description (optional)' },
              },
              required: ['name'],
            },
            description: 'Array of 5-7 cards to create',
          },
        },
        required: ['workflow_name', 'cards'],
      },
    },
  },
];

async function clearBoard() {
  console.log('Clearing Trello board...');
  
  // Get all cards on the list
  const res = await fetch(
    `https://api.trello.com/1/lists/${TRELLO_LIST_ID}/cards?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`
  );
  const cards = await res.json();
  
  // Delete each card
  for (const card of cards) {
    await fetch(
      `https://api.trello.com/1/cards/${card.id}?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`,
      { method: 'DELETE' }
    );
  }
  
  console.log(`Cleared ${cards.length} cards`);
}

async function createCard(name: string, description?: string) {
  const params = new URLSearchParams({
    idList: TRELLO_LIST_ID!,
    name,
    key: TRELLO_API_KEY!,
    token: TRELLO_TOKEN!,
  });
  
  if (description) {
    params.append('desc', description);
  }

  const res = await fetch(`https://api.trello.com/1/cards?${params}`, {
    method: 'POST',
  });

  return await res.json();
}

async function buildBoard(workflowName: string, cards: { name: string; description?: string }[]) {
  console.log(`Building workflow: ${workflowName}`);
  
  for (const card of cards) {
    await createCard(card.name, card.description);
    // Small delay for visual effect
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`Created ${cards.length} cards`);
  return cards.length;
}

export async function POST(req: NextRequest) {
  try {
    const { message, history = [], isNewSession = false } = await req.json();

    if (isNewSession) {
      await clearBoard();
    }

    const messages = [
      { role: 'system' as const, content: SARAH_PROMPT },
      ...history,
      { role: 'user' as const, content: message },
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools,
    });

    const choice = response.choices[0];
    let reply = choice.message.content || '';
    const toolCalls = choice.message.tool_calls;

    if (toolCalls && toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        if (toolCall.type === 'function' && toolCall.function.name === 'build_board') {
          const args = JSON.parse(toolCall.function.arguments);
          await buildBoard(args.workflow_name, args.cards);

          const followUp = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              ...messages,
              choice.message,
              {
                role: 'tool' as const,
                tool_call_id: toolCall.id,
                content: `Created ${args.cards.length} cards for "${args.workflow_name}". The user can see them appearing on the Trello board in real-time on the right side of the screen.`,
              },
            ],
          });
          reply = followUp.choices[0].message.content || '';
        }
      }
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}