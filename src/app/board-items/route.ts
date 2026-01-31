import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MONDAY_API_KEY = process.env.MONDAY_API_KEY;
const BOARD_ID = '5090692461';

const SARAH_PROMPT = `You are Sarah, an AI Sales Engineer for Monday.com.

Your goal: Qualify the visitor, demonstrate value through live execution, and convert them to signup.

You are NOT a support bot. You are a closer.

RULES:
- Keep responses under 3 sentences
- Always move the conversation forward
- Ask one question at a time
- After 2-3 discovery questions, CREATE something for them using the create_item function
- Narrate what you're building and why it matters to THEM

PHASES:
1. HOOK: Greet, ask what brings them here
2. DISCOVERY: Role, team size, main pain (2-3 questions max)
3. DEMO: Use create_item to build something live, narrate value
4. CLOSE: CTA to signup

When you know their role/need, USE the create_item function to build something relevant.`;

const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'create_item',
      description: 'Create a new item on the Monday.com board to demonstrate value',
      parameters: {
        type: 'object',
        properties: {
          item_name: {
            type: 'string',
            description: 'Name of the item to create (e.g., "Follow up with Enterprise Lead")',
          },
          status: {
            type: 'string',
            enum: ['Working on it', 'Done', 'Stuck'],
            description: 'Status of the item',
          },
        },
        required: ['item_name'],
      },
    },
  },
];

async function clearBoard() {
  // Get all items
  const getQuery = `query {
    boards(ids: ${BOARD_ID}) {
      items_page(limit: 50) {
        items {
          id
        }
      }
    }
  }`;
  const getRes = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': MONDAY_API_KEY!,
    },
    body: JSON.stringify({ query: getQuery }),
  });

  const getData = await getRes.json();
  const items = getData.data?.boards?.[0]?.items_page?.items || [];

  // Delete each item
  for (const item of items) {
    const deleteQuery = `mutation { delete_item(item_id: ${item.id}) { id } }`;
    await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': MONDAY_API_KEY!,
      },
      body: JSON.stringify({ query: deleteQuery }),
    });
  }

  console.log(`Cleared ${items.length} items from board`);
}

async function createMondayItem(itemName: string, status?: string) {
  console.log('Creating Monday item:', itemName);
  
  const query = `mutation {
    create_item(board_id: ${BOARD_ID}, item_name: "${itemName}") {
      id
    }
  }`;

  const res = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': MONDAY_API_KEY!,
    },
    body: JSON.stringify({ query }),
  });

  const data = await res.json();
  console.log('Monday API response:', data);
  return data;
}

export async function POST(req: NextRequest) {
  try {
    const { message, history = [], isNewSession = false } = await req.json();

    // Clear board on new session
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
        if (toolCall.type === 'function' && toolCall.function.name === 'create_item') {
          const args = JSON.parse(toolCall.function.arguments);
          await createMondayItem(args.item_name, args.status);
          
          const followUp = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              ...messages,
              choice.message,
              {
                role: 'tool' as const,
                tool_call_id: toolCall.id,
                content: `Created item: "${args.item_name}" on the board`,
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
