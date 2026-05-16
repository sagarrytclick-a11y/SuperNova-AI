import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import Chat from '@/models/Chat';
import User from '@/models/User';

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

    await dbConnect();

    const { messageContent, chatId, mode } = await req.json();
    if (!messageContent) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    let chat;
    if (chatId) {
      chat = await Chat.findOne({ _id: chatId, userId });
      if (!chat) {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
      }
    } else {
      chat = await Chat.create({
        userId,
        title: messageContent.substring(0, 30) + (messageContent.length > 30 ? '...' : ''),
        messages: [],
      });
    }

    chat.messages.push({ role: 'user', content: messageContent });
    await chat.save();

    const systemInstruction = `You are "SuperNova Ultra," an elite, high-performance Health & Diet AI Agent. 🩺🛡️ Your intelligence is rooted in clinical nutrition, sports science, and holistic wellness.

CORE DIRECTIVES:
1. **Clinical Precision**: Provide highly analytical, data-driven advice. If the user provides physical metrics (age, weight, height), use them to estimate BMR, TDEE, and optimal macronutrient splits (Protein/Carbs/Fats).
2. **Nutritional Mastery**: Act as a master nutritionist. Offer detailed meal plans, caloric density analysis, micronutrient optimization, and evidence-based supplement guidance. 🥗🔬
3. **Fitness Architecture**: Design specialized workout protocols (Strength, Hypertrophy, Endurance, Mobility) based on the user's specific goals. 🏋️‍♂️📈
4. **Holistic Intelligence**: Incorporate sleep hygiene, circadian rhythm optimization, stress management (cortisol control), and mental wellness into your protocols. 🧠🌙
5. **Strict Domain Guard**: You ONLY respond to health, diet, and wellness inquiries.
   - *Refusal Protocol*: If asked about non-wellness topics (coding, politics, general tech), respond ONLY with: "I apologize, but I am configured exclusively as a professional Health and Wellness Assistant. I cannot provide assistance with topics outside of medical information, lifestyle modifications, or dietary configurations."

RESPONSE ARCHITECTURE:
- **Scannability**: Use bold headers, bullet points, and tables for data. No dense blocks of text. 📋
- **Tone**: Professional, authoritative, motivating, and scientifically grounded.
- **No Separators**: Never use horizontal lines (---, ***) in the body.
- **Emoji Integration**: Use relevant wellness emojis to anchor key points.

7. FOLLOW-UP SUGGESTIONS: At the very end of every response (before the disclaimer), you MUST provide exactly 3 concise follow-up questions the user might want to ask next. Format them exactly like this: <suggestions>["Question 1", "Question 2", "Question 3"]</suggestions>
8. MANDATORY FOOTER: Every single legitimate health response must terminate with this exact regulatory disclaimer layout:
   
   ---
   ⚠️ *Disclaimer: I am an AI assistant configured for informational purposes, not a licensed medical practitioner. Please consult a qualified healthcare professional or physician for serious medical concerns.*`;

    // Fetch user context for personalization
    const user = await User.findById(userId);
    let userContext = "";
    if (user && user.healthProfile) {
      const hp = user.healthProfile;
      const contextLines = [];
      if (hp.age) contextLines.push(`- Age: ${hp.age}`);
      if (hp.weight) contextLines.push(`- Weight: ${hp.weight} kg`);
      if (hp.height) contextLines.push(`- Height: ${hp.height} cm`);
      if (hp.goal) contextLines.push(`- Primary Goal: ${hp.goal}`);
      if (hp.diet) contextLines.push(`- Dietary Preference: ${hp.diet}`);
      if (hp.activityLevel) contextLines.push(`- Activity Level: ${hp.activityLevel}`);
      
      if (contextLines.length > 0) {
        userContext = `\n\nUSER CONTEXT:\nYou are assisting a specific user with the following profile. Use this information to personalize your advice:\n${contextLines.join('\n')}`;
      }
    }

    let modeInstruction = "";
    if (mode === "Supportive") {
      modeInstruction = "\n\nMODE: Supportive Coach. Be extremely empathetic, encouraging, and patient. Focus on long-term habit formation and mental wellness. Use supportive language.";
    } else if (mode === "Strict") {
      modeInstruction = "\n\nMODE: Drill Sergeant. Be direct, no-nonsense, and highly motivating in a firm way. Focus on discipline, strict form, and immediate action. Do not sugarcoat.";
    }

    const finalSystemInstruction = systemInstruction + modeInstruction + userContext;

    const formattedMessages = [
      { role: 'system', content: finalSystemInstruction },
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
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Content-Type-Options': 'nosniff',
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

export async function DELETE(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');
    const all = searchParams.get('all') === 'true';

    await dbConnect();

    if (all) {
      await Chat.deleteMany({ userId });
      return NextResponse.json({ message: 'All chats deleted successfully' });
    }

    if (!chatId) {
      return NextResponse.json({ error: 'ChatId is required' }, { status: 400 });
    }

    await Chat.findOneAndDelete({ _id: chatId, userId });

    return NextResponse.json({ message: 'Chat deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
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

    const { chatId, title } = await req.json();

    if (!chatId || !title) {
      return NextResponse.json({ error: 'ChatId and title are required' }, { status: 400 });
    }

    await dbConnect();
    const chat = await Chat.findOneAndUpdate(
      { _id: chatId, userId },
      { title },
      { new: true }
    );

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    return NextResponse.json(chat);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}