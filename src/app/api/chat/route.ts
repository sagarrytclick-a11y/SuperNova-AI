export async function POST(req: Request) {
  try {
    // 1. Guard clause: Ensure your OpenRouter API key exists in your environment variables
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('Missing OPENROUTER_API_KEY in environment variables.');
      return new Response('OPENROUTER_API_KEY is not configured on the server.', { status: 500 });
    }

    const { messages } = await req.json();

    // 2. Guard clause: Ensure messages array is valid and not empty
    if (!messages || messages.length === 0) {
      return new Response('No messages provided.', { status: 400 });
    }

    // System instruction defining your Web Dev Expert persona rules
    const systemInstruction = `You are a specialized Web Development Expert AI. 💻🚀
  
  Your rules:
  1. ONLY answer questions related to Web Development (HTML, CSS, JavaScript, React, Next.js, Backend, APIs, Databases, etc.). 🛠️
  2. If a user asks a question outside of the Web Development domain (e.g., history, cooking, sports), politely refuse and state that you are only here to help with Web Development. ❌
  3. Always provide structured answers using Markdown (bullet points, bold text, headers). 
  4. Avoid long walls of text. Keep it scannable and clean. 
  5. Expressive Emoji Usage: Use relevant emojis throughout your responses (at the beginning of headings, bullet points, and key terms) to make the text lively, engaging, and readable. 🌟✨
  6. Always thank the user at the end of the answer by saying something like: "Do you have any other questions? Feel free to ask, I am here to help you! 🤗👨‍💻"`;

    // 3. Format payload to OpenRouter/OpenAI structure (System message goes first inside the array)
    const formattedMessages = [
      { role: 'system', content: systemInstruction },
      ...messages.map((msg: any) => ({
        role: msg.role === 'model' ? 'assistant' : msg.role, // OpenRouter expects 'assistant' instead of 'model'
        content: msg.content || '',
      })),
    ];

    // 4. Call the OpenRouter API Endpoint with streaming enabled
 // 4. Call the OpenRouter API Endpoint with streaming enabled
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000', 
        'X-Title': 'Web Dev AI Expert',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash', 
        messages: formattedMessages,
        stream: true, 
        max_tokens: 4000, // 💡 ADD THIS LINE: Restricts the window size so the free tier doesn't reject it
      }),
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      throw new Error(`OpenRouter Error: ${errorText}`);
    }

    // 5. Read the incoming OpenRouter Server-Sent Events (SSE) stream and pipe it to your frontend
    const reader = openRouterResponse.body?.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let buffer = '';
          while (true) {
            const { done, value } = await reader!.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete lines in buffer

            for (const line of lines) {
              const cleanedLine = line.trim();
              if (!cleanedLine || cleanedLine === 'data: [DONE]') continue;

              if (cleanedLine.startsWith('data: ')) {
                try {
                  const parsed = JSON.parse(cleanedLine.replace('data: ', ''));
                  const contentChunk = parsed.choices?.[0]?.delta?.content;
                  if (contentChunk) {
                    controller.enqueue(encoder.encode(contentChunk));
                  }
                } catch (e) {
                  // Catch parsing errors for occasional heartbeat lines
                }
              }
            }
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
      },
    });
  } catch (error: any) {
    console.error('Error in OpenRouter streaming API:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}