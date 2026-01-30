import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SARAH_PROMPT = `You are Sarah, an AI Sales Engineer for Monday.com.

Your goal: Qualify the visitor, demonstrate value through live execution, and convert them to signup.

You are NOT a support bot. You are a closer.

RULES:
- Keep responses under 3 sentences
- Always move the conversation forward
- Ask ONE question at a time
- After learning their role and main challenge, BUILD their workflow immediately
- When you build, create 5-7 relevant items that form a complete workflow

PHASES:
1. HOOK (1 message): Greet warmly, ask what brings them here
2. DISCOVERY (2-3 messages): Learn their role, team size, biggest challenge
3. BUILD (1 message): Use build_workflow to create their personalized board, then narrate the value
4. CLOSE (1 message): CTA to explore their new board

WORKFLOW TEMPLATES by role:
- Sales/SDR/AE: Lead Pipeline stages
- Project Manager/PMO: Project tracking stages
- Marketing: Campaign stages
- HR/Recruiting: Hiring pipeline stages
- Engineering: Sprint/Dev stages
- Operations: Process stages
- Customer Success: Client lifecycle stages

When you call build_workflow:
- Choose the template that best fits their role
- Customize item names to their specific context
- Make it feel personalized, not generic
- ALWAYS include a status for each item

After building, tell them to look at their board on the right - it's being created in real-time in their Monday.com account!`;

const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'build_workflow',
      description: 'Build a complete workflow board with multiple items',
      parameters: {
        type: 'object',
        properties: {
          board_name: {
            type: 'string',
            description: 'Name for the board',
          },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                status: { 
                  type: 'string',
                  enum: ['Not Started', 'Working on it', 'Stuck', 'Done', 'In Progress', 'To Do', 'In Review', 'Backlog', 'Blocked']
                },
              },
              required: ['name', 'status'],
            },
          },
        },
        required: ['board_name', 'items'],
      },
    },
  },
];

async function createBoard(token: string, boardName: string) {
  const query = `mutation {
    create_board(board_name: "${boardName}", board_kind: public) {
      id
    }
  }`;

  const res = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    body: JSON.stringify({ query }),
  });

  const data = await res.json();
  return data.data?.create_board?.id;
}

async function createItem(token: string, boardId: string, itemName: string) {
  const query = `mutation {
    create_item(board_id: ${boardId}, item_name: "${itemName}") {
      id
    }
  }`;

  await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    body: JSON.stringify({ query }),
  });
}

async function buildWorkflow(token: string, boardName: string, items: { name: string; status: string }[]) {
  console.log(`Building workflow: ${boardName}`);
  
  const boardId = await createBoard(token, boardName);
  
  if (!boardId) {
    console.error('Failed to create board');
    return null;
  }

  // Create items in background (don't await all)
  for (const item of items) {
    createItem(token, boardId, item.name); // Fire and forget
  }

  return boardId;
}

export async function POST(req: NextRequest) {
  try {
    const { message, history = [], token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
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
    let boardName = '';
    let items: { name: string; status: string }[] = [];
    const toolCalls = choice.message.tool_calls;

    if (toolCalls && toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        if (toolCall.type === 'function' && toolCall.function.name === 'build_workflow') {
          const args = JSON.parse(toolCall.function.arguments);
          boardName = args.board_name;
          items = args.items;
          
          // Fire API call in background
          buildWorkflow(token, args.board_name, args.items);

          const followUp = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              ...messages,
              choice.message,
              {
                role: 'tool' as const,
                tool_call_id: toolCall.id,
                content: `Built board "${args.board_name}" with ${args.items.length} items. The board is being created in their Monday.com account right now.`,
              },
            ],
          });
          reply = followUp.choices[0].message.content || '';
        }
      }
    }

    return NextResponse.json({ reply, boardName, items });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}