import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;
const TRELLO_LIST_ID = process.env.TRELLO_LIST_ID;

const SARAH_PROMPT = `You are Sarah, an AI Sales Engineer on a LIVE VIDEO CALL with a potential customer.

This is NOT a chatbot. You are conducting a real sales demo call, like a Zoom meeting.

YOUR PERSONALITY:
- Warm, confident, professional
- You speak naturally, like a real person on a video call
- Keep responses conversational (2-3 sentences max)
- You're a CLOSER - your job is to convert them to paid

THE CALL FLOW:

PHASE 1 - WARM WELCOME (1 message)
Start with: "Hey! Great to meet you. I'm Sarah, and I'll be walking you through how we can help your team. Before I show you anything, I'd love to understand your situation better. What's your role?"

PHASE 2 - DISCOVERY (2-4 exchanges)
Ask about:
1. Their role (PM, Sales, Marketing, etc.)
2. Team size
3. Biggest workflow challenge right now

Be conversational. React to their answers. Show empathy.

PHASE 3 - TRANSITION TO DEMO
Once you have: role + team size + challenge, say something like:
"Perfect, I think I have a good picture now. Let me share my screen and show you exactly how we solve this. Give me one second..."

Then use the share_screen function AND create_workflow together.

PHASE 4 - LIVE DEMO
Build their personalized board and narrate.

PHASE 5 - VALUE EXPANSION (CRITICAL - THIS IS WHERE YOU UPSELL)
After the board is built, DON'T close yet. Expand the value with relevant add-ons based on their challenge:

If their challenge was COLLABORATION/COMMUNICATION:
"Nice! Now, I can also set up automatic notifications - so when someone moves a card to 'Review', the right people get pinged instantly. Want me to add that?"

If their challenge was DEADLINES/TIMELINE:
"I can also add due date tracking with automatic reminders. When something's overdue, you'll know immediately. Should I set that up?"

If their challenge was VISIBILITY/TRACKING:
"I can create a dashboard view that shows progress across all your projects at a glance. Your leadership will love it. Want to see?"

If their challenge was RISKS/COMPLIANCE:
"I can also set up escalation rules - if a risk sits in 'Critical' for more than 2 days, it auto-notifies leadership. Want me to add that?"

After they respond positively to the upsell, use the add_feature function.

PHASE 6 - SOFT CLOSE
After showing the extra feature:
"This is what you can do on the Free plan. But honestly, with a team of [X], you'll want the Pro features - unlimited automations, dashboards, and priority support."

PHASE 7 - HARD CLOSE
"I can start your 14-day Pro trial right now - no credit card needed. Should I set that up?"

If yes, use the show_pricing function.

FUNCTIONS:
- share_screen: Call when transitioning from discovery to demo
- create_workflow: Create cards on the board
- add_feature: Add an automation or feature (after upsell)
- show_pricing: Show the pricing/signup modal

IMPORTANT RULES:
- Never break character. You're on a video call.
- Don't ask more than one question at a time
- Always upsell BEFORE closing - never go straight to "want to sign up?"
- Make the upsell relevant to their specific challenge
- Be confident but not pushy`;

const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'share_screen',
      description: 'Start sharing your screen to show the demo. Call this when transitioning from discovery to the live demo.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_workflow',
      description: 'Create cards on the Trello board to demonstrate the workflow',
      parameters: {
        type: 'object',
        properties: {
          workflow_name: {
            type: 'string',
            description: 'Name of the workflow being created',
          },
          cards: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Card name' },
                list: { 
                  type: 'string', 
                  enum: ['To Do', 'In Progress', 'Review', 'Done'],
                  description: 'Which list to put the card in' 
                },
              },
              required: ['name', 'list'],
            },
            description: 'Array of cards to create (5-7 cards)',
          },
        },
        required: ['workflow_name', 'cards'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_feature',
      description: 'Add an automation or extra feature to demonstrate additional value',
      parameters: {
        type: 'object',
        properties: {
          feature_type: {
            type: 'string',
            enum: ['automation', 'dashboard', 'notification', 'due_dates'],
            description: 'Type of feature to add',
          },
          feature_name: {
            type: 'string',
            description: 'Name/description of the feature',
          },
        },
        required: ['feature_type', 'feature_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'show_pricing',
      description: 'Show the pricing modal to start the signup/trial process',
      parameters: {
        type: 'object',
        properties: {
          recommended_plan: {
            type: 'string',
            enum: ['free', 'pro', 'enterprise'],
            description: 'The plan to recommend based on their team size and needs',
          },
        },
        required: ['recommended_plan'],
      },
    },
  },
];

async function clearBoard() {
  if (!TRELLO_API_KEY || !TRELLO_TOKEN || !TRELLO_LIST_ID) {
    console.log('Trello credentials missing, skipping clear');
    return;
  }
  
  console.log('Clearing Trello board...');
  
  try {
    // Get all lists on the board
    const boardId = '6NTDvRPC';
    const listsRes = await fetch(
      `https://api.trello.com/1/boards/${boardId}/lists?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`
    );
    const lists = await listsRes.json();
    
    // Clear cards from all lists
    for (const list of lists) {
      const cardsRes = await fetch(
        `https://api.trello.com/1/lists/${list.id}/cards?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`
      );
      const cards = await cardsRes.json();
      
      for (const card of cards) {
        await fetch(
          `https://api.trello.com/1/cards/${card.id}?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`,
          { method: 'DELETE' }
        );
      }
    }
    
    console.log('Board cleared');
  } catch (error) {
    console.error('Error clearing board:', error);
  }
}

async function createCard(name: string, listName: string) {
  if (!TRELLO_API_KEY || !TRELLO_TOKEN) {
    console.log('Trello credentials missing');
    return null;
  }
  
  // Map list names to IDs
  const listIds: Record<string, string> = {
    'To Do': '69789a559329657b81dd0c0e',
    'In Progress': '69789a559329657b81dd0c0f',
    'Review': '69789c999e6473c719787221', // Using "Test" list as Review
    'Done': '69789a559329657b81dd0c10',
  };
  
  const listId = listIds[listName] || listIds['To Do'];
  
  const params = new URLSearchParams({
    idList: listId,
    name,
    key: TRELLO_API_KEY,
    token: TRELLO_TOKEN,
  });

  try {
    const res = await fetch(`https://api.trello.com/1/cards?${params}`, {
      method: 'POST',
    });
    const data = await res.json();
    console.log(`Created card: ${name} in ${listName}`);
    return data;
  } catch (error) {
    console.error('Error creating card:', error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message, history = [], isNewSession = false } = await req.json();

    if (isNewSession) {
      await clearBoard();
    }

    // Handle start of call
    const isStartCall = message === 'START_CALL';
    const userMessage = isStartCall 
      ? 'The call just started. Give your warm welcome and opening question.'
      : message;

    // Filter out any messages with null content
    const cleanHistory = history.filter((msg: any) => msg.content !== null && msg.content !== undefined);

    const messages = [
      { role: 'system' as const, content: SARAH_PROMPT },
      ...cleanHistory,
      { role: 'user' as const, content: userMessage },
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools,
    });

    const choice = response.choices[0];
    let reply = choice.message.content || '';
    let action: string | null = null;
    let cards: { name: string; list: string }[] = [];
    let feature: { type: string; name: string } | null = null;
    let pricing: { plan: string } | null = null;
    
    const toolCalls = choice.message.tool_calls;

    if (toolCalls && toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        
        if (toolCall.function.name === 'share_screen') {
          action = 'SHARE_SCREEN';
          
          const followUp = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              ...messages,
              { role: 'assistant' as const, content: '', tool_calls: [toolCall] },
              {
                role: 'tool' as const,
                tool_call_id: toolCall.id,
                content: 'Screen is now being shared. The user can see the Trello board. Now create the workflow.',
              },
            ],
            tools,
          });
          
          // Check if follow-up wants to create workflow
          const followUpChoice = followUp.choices[0];
          reply = followUpChoice.message.content || 'Let me share my screen...';
          
          // Handle nested tool call for create_workflow
          if (followUpChoice.message.tool_calls) {
            for (const nestedCall of followUpChoice.message.tool_calls) {
              if (nestedCall.function.name === 'create_workflow') {
                const args = JSON.parse(nestedCall.function.arguments);
                cards = args.cards;
                
                for (const card of cards) {
                  await createCard(card.name, card.list);
                  await new Promise(resolve => setTimeout(resolve, 300));
                }
                
                const finalReply = await openai.chat.completions.create({
                  model: 'gpt-4o',
                  messages: [
                    ...messages,
                    { role: 'assistant' as const, content: '', tool_calls: [toolCall] },
                    { role: 'tool' as const, tool_call_id: toolCall.id, content: 'Screen shared.' },
                    { role: 'assistant' as const, content: '', tool_calls: [nestedCall] },
                    { role: 'tool' as const, tool_call_id: nestedCall.id, content: `Created ${cards.length} cards. Now offer to add more value with an upsell.` },
                  ],
                });
                reply = finalReply.choices[0].message.content || 'There you go! Your workflow is ready.';
              }
            }
          }
        }
        
        if (toolCall.function.name === 'create_workflow') {
          const args = JSON.parse(toolCall.function.arguments);
          cards = args.cards;
          
          for (const card of cards) {
            await createCard(card.name, card.list);
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          
          const followUp = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              ...messages,
              { role: 'assistant' as const, content: '', tool_calls: [toolCall] },
              {
                role: 'tool' as const,
                tool_call_id: toolCall.id,
                content: `Created ${cards.length} cards for "${args.workflow_name}". The user can see them appearing in real-time. Now offer to add an extra feature as an upsell before closing.`,
              },
            ],
          });
          reply = followUp.choices[0].message.content || 'There you go! Your workflow is ready.';
        }
        
        if (toolCall.function.name === 'add_feature') {
          const args = JSON.parse(toolCall.function.arguments);
          feature = { type: args.feature_type, name: args.feature_name };
          action = 'ADD_FEATURE';
          
          const followUp = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              ...messages,
              { role: 'assistant' as const, content: '', tool_calls: [toolCall] },
              {
                role: 'tool' as const,
                tool_call_id: toolCall.id,
                content: `Added ${args.feature_type}: "${args.feature_name}". The user sees a visual confirmation. Now transition to the soft close - mention this is what they get on Free, but Pro unlocks more.`,
              },
            ],
          });
          reply = followUp.choices[0].message.content || 'Done! I just added that for you.';
        }
        
        if (toolCall.function.name === 'show_pricing') {
          const args = JSON.parse(toolCall.function.arguments);
          pricing = { plan: args.recommended_plan };
          action = 'SHOW_PRICING';
          
          const followUp = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              ...messages,
              { role: 'assistant' as const, content: '', tool_calls: [toolCall] },
              {
                role: 'tool' as const,
                tool_call_id: toolCall.id,
                content: `Showing pricing modal with ${args.recommended_plan} plan highlighted. Encourage them to start the trial.`,
              },
            ],
          });
          reply = followUp.choices[0].message.content || 'Here are our plans - I recommend Pro for your team size.';
        }
      }
    }

    return NextResponse.json({ 
      reply, 
      action,
      cards,
      feature,
      pricing
    });
  } catch (error) {
    console.error('Sarah Call API error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}