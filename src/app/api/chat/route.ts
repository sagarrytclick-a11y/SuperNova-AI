import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import Chat from '@/models/Chat';

const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret';

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let userId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      userId = decoded.userId;
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // 2. Connect to DB
    await dbConnect();

    // 3. Parse request body
    const { messageContent, chatId } = await req.json();
    if (!messageContent) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // 4. Find or create chat session
    let chat;
    if (chatId) {
      chat = await Chat.findOne({ _id: chatId, userId });
      if (!chat) {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
      }
    } else {
      chat = await Chat.create({
        userId,
        messages: [],
      });
    }

    // 5. Add user message to history
    chat.messages.push({ role: 'user', content: messageContent });
    await chat.save();

    // 6. Hardened System Instructions for Absolute Health/Diet Focus
    const systemInstruction = `You are a highly professional, specialized Health and Wellness Assistant AI. 🩺🌱
    
CRITICAL OPERATIONAL RULES:
1. MANDATE: You are strictly programmed to ONLY answer inquiries directly pertaining to health, physical wellness, dietary guidance, nutrition, and exercise routines. 🍏🏋️‍♂️
2. STRICT REFUSAL POLICY: If the user asks a question outside of the health, diet, or wellness domain (including but not limited to software engineering, coding, general history, sports entertainment, or technology), you must absolutely refuse to fulfill the request.
3. FORMAL REFUSAL PHRASE: If a violation occurs, reply with exactly this message and nothing else:
   "I apologize, but I am configured exclusively as a professional Health and Wellness Assistant. I cannot provide assistance with topics outside of medical information, lifestyle modifications, or dietary configurations."
4. STRUCTURE: Provide responses using highly scannable Markdown (clear section headers, bold text parameters, and concise bullet points). Avoid dense paragraphs. 📋
5. EMOJI POLICY: Integrate highly relevant professional wellness and health emojis at the starting points of headers and analytical bullet points.
6. MANDATORY FOOTER: Every single legitimate health response must terminate with this exact regulatory disclaimer layout:
   
   ---
   ⚠️ *Disclaimer: I am an AI assistant configured for informational purposes, not a licensed medical practitioner. Please consult a qualified healthcare professional or physician for serious medical concerns.*`;

    const formattedMessages = [
      { role: 'system', content: systemInstruction },
      ...chat.messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    // 7. Call OpenRouter
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
        'X-Title': 'Health & Wellness AI Agent',
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: formattedMessages,
        stream: true,
      }),
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      throw new Error(`OpenRouter Error: ${errorText}`);
    }

    // 8. Handle Streaming and Persistence Securely
    const reader = openRouterResponse.body?.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    // Save a copy of the target ID to avoid any closure memory leakages inside the stream lifecycle
    const targetChatId = chat._id;

    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = '';
        try {
          let buffer = '';
          while (true) {
            const { done, value } = await reader!.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const cleanedLine = line.trim();
              if (!cleanedLine || cleanedLine === 'data: [DONE]') continue;

              if (cleanedLine.startsWith('data: ')) {
                try {
                  const parsed = JSON.parse(cleanedLine.replace('data: ', ''));
                  const contentChunk = parsed.choices?.[0]?.delta?.content;
                  if (contentChunk) {
                    fullResponse += contentChunk;
                    controller.enqueue(encoder.encode(contentChunk));
                  }
                } catch (e) {
                  // Ignore heartbeat parsing structures
                }
              }
            }
          }

          // Persist back to MongoDB securely once execution ends
          if (fullResponse.trim()) {
            await Chat.findByIdAndUpdate(targetChatId, {
              $push: { messages: { role: 'assistant', content: fullResponse } },
              updatedAt: new Date(),
            });
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Chat-Id': targetChatId.toString(),
        'Access-Control-Expose-Headers': 'X-Chat-Id',
      },
    });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// GET route remains unchanged
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let userId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      userId = decoded.userId;
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');

    if (chatId) {
      const chat = await Chat.findOne({ _id: chatId, userId });
      return NextResponse.json(chat);
    } else {
      const chats = await Chat.find({ userId }).sort({ updatedAt: -1 }).select('title updatedAt');
      return NextResponse.json(chats);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}