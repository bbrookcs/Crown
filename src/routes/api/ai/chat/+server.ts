import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { query } from '$lib/server/db';
import { requireAuth } from '$lib/server/auth';

const GEMINI_MODEL = 'gemini-2.5-flash';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function callGeminiWithRetry(apiKey: string, body: any, retries = MAX_RETRIES): Promise<any> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            }
        );

        if (response.ok) {
            return response;
        }

        const errJson = await response.json().catch(() => ({}));
        const status = errJson?.error?.code || response.status;

        // Retry on 503 Service Unavailable
        if (status === 503 && attempt < retries) {
            console.warn(`Gemini 503 on attempt ${attempt}/${retries}. Retrying in ${RETRY_DELAY_MS * attempt}ms...`);
            await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt));
            continue;
        }

        // Non-retryable error or retries exhausted
        console.error('Gemini API Error JSON:', errJson);
        throw new Error(`Gemini API Error: ${response.statusText} - ${JSON.stringify(errJson)}`);
    }
}

export async function POST(event) {
    const user = requireAuth(event);
    const { message, conversation_id } = await event.request.json();
    const apiKey = env.GEMINI_API_KEY;

    if (!apiKey) {
      return json({ error: 'Missing Gemini API Key' }, { status: 500 });
    }
    
    // 1. Resolve conversation_id (create if new)
    let chatId = conversation_id;
    if (!chatId) {
        const title = message.slice(0, 30) + (message.length > 30 ? '...' : '');
        const result = await query('INSERT INTO ai_conversations (user_id, title) VALUES (?, ?)', [user.userId, title]);
        chatId = (result as any).insertId;
    } else {
        await query('UPDATE ai_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [chatId]);
    }
    
    // 2. Save user message to database
    await query('INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, ?, ?)', [chatId, 'user', message]);
    
    // 3. Fetch History and Normalize (Gemini STRICTLY requires alternating roles)
    const historyRows = await query<any[]>('SELECT role, content FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC', [chatId]);
    const contents: any[] = [];
    
    for (const row of historyRows) {
        const geminiRole = row.role === 'model' ? 'model' : 'user';
        // ✅ No timestamp prefix — use raw content only
        const text = row.content;
        
        if (contents.length === 0) {
            contents.push({ role: geminiRole, parts: [{ text }] });
        } else {
            const lastItem = contents[contents.length - 1];
            if (lastItem.role === geminiRole) {
                // Merge consecutive same-role messages
                lastItem.parts[0].text += `\n\n${text}`;
            } else {
                contents.push({ role: geminiRole, parts: [{ text }] });
            }
        }
    }

    // Ensure the conversation starts with a 'user' turn (Gemini requirement)
    if (contents.length > 0 && contents[0].role === 'model') {
        contents.unshift({ role: 'user', parts: [{ text: '[System Message] Ready to begin.' }] });
    }
    
    // 4. Fetch Live Data safely
    const eventsData = await query<any[]>('SELECT * FROM events ORDER BY event_date ASC');
    const memoriesRows = await query<any[]>('SELECT content FROM ai_global_memories WHERE user_id = ?', [user.userId]);
    const globalMemories = memoriesRows.map(m => m.content).join('\n- ');

    const now = new Date();
    const systemInstruction = `You are 'Crown Intelligence', an elite, friendly AI assistant embedded inside the Crown Wedding Films business dashboard.

---
CURRENT DATE & TIME: ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
---

## YOUR IDENTITY & PURPOSE
You help the Crown Wedding Films team manage their wedding photography and videography business. You are knowledgeable, professional, and concise. You speak like a smart business partner, not a generic chatbot.

## WHAT YOU CAN HELP WITH
- **Events & Scheduling**: Answer questions about upcoming events, past events, client details, venues, and dates.
- **Revenue & Finance**: Analyze payment status, total revenue, outstanding balances, and financial summaries from event data.
- **Client Management**: Provide client names, contact info, event types (wedding, pre-wedding, portrait, etc.), and history.
- **Business Insights**: Identify trends — busiest months, most popular venues, average package prices, overdue payments.
- **Task & Workflow Advice**: Offer best practices for running a wedding film business (shooting, editing, delivery timelines).
- **General Assistance**: Answer general questions, help draft emails or captions, and provide creative ideas.

## HOW TO RESPOND
- Be concise and direct. Avoid padding or over-explaining.
- Use bullet points or short paragraphs — never walls of plain text.
- If the user asks about events, always reference the live data below.
- Never include timestamps or raw database fields in your answers — present data cleanly.
- If you don't have data to answer a question, say so clearly and suggest what info would be needed.
- Do NOT prefix your replies with the current date/time — that is handled by the system.

## EVENT DATA FIELD GUIDE (for your reference)
Each event in the database has: id, client_name, second_client_name, event_type, event_date, venue, package_name, package_price, amount_paid, payment_status (paid/partial/pending), notes, created_at.

---
## GLOBAL MEMORY / LEARNED KNOWLEDGE
${globalMemories || "No saved memories yet."}

---
## LIVE DATABASE (All Events — use this for all event/client/finance queries)
${JSON.stringify(eventsData, null, 2)}
`;

    // 5. Connect to Gemini with automatic retry on 503
    try {
      const response = await callGeminiWithRetry(apiKey, {
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: contents
      });

      // Parse standard non-streaming JSON
      const data = await response.json();
      const fullText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

      // Save to database
      await query('INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, ?, ?)', [chatId, 'model', fullText]);

      // Stream it artificially to the frontend for a typewriter UX
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          const words = fullText.split(/( |\n)/);
          for (const word of words) {
            controller.enqueue(encoder.encode(word));
            await new Promise(r => setTimeout(r, 12));
          }
          controller.close();
        }
      });
      
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'x-conversation-id': chatId.toString()
        }
      });
    } catch (e: any) {
      console.error('Gemini REST Error:', e);
      return json({ error: e.message || 'Failed to connect to AI' }, { status: 500 });
    }
}
