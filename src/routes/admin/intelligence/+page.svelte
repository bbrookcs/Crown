<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { page } from '$app/stores';
  let { data } = $props();

  let inputQuery = $state('');
  let sidebarOpen = $state(false);
  let isThinking = $state(false);
  let isLoadingChat = $state(false);

  // Use data from server for sidebar
  let previousChats = $state(data.conversations || []);
  let activeChatId = $state<number | null>(null);
  
  // Chat format: { role: 'user' | 'model', content: string }
  let activeMessages = $state<any[]>([]);

  let menuOpenId = $state<number | null>(null);
  let editingChatId = $state<number | null>(null);
  let editTitle = $state('');

  // Ref to chat container bottom for auto-scroll
  let chatDisplay: HTMLDivElement | null = $state(null);

  // Scroll to bottom helper
  async function scrollToBottom() {
    await tick();
    if (chatDisplay) {
      chatDisplay.scrollTop = chatDisplay.scrollHeight;
    }
  }

  // Load a chat from history
  async function loadChat(id: number) {
    sidebarOpen = false;
    activeChatId = id;
    activeMessages = [];
    isLoadingChat = true;
    isThinking = false;
    try {
      const res = await fetch(`/api/ai/chat/${id}`);
      if (res.ok) {
        const d = await res.json();
        activeMessages = d.messages;
        scrollToBottom();
      }
    } catch(e) {}
    isLoadingChat = false;
  }

  // Handle message sending
  async function sendMessage() {
    const txt = inputQuery.trim();
    if (!txt || isThinking) return;
    
    // Optimistic UI
    activeMessages = [...activeMessages, { role: 'user', content: txt }];
    inputQuery = '';
    isThinking = true;
    scrollToBottom();

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: txt, conversation_id: activeChatId })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to send network request');
      }

      // Update active ID if this was a new chat
      const returnedChatId = res.headers.get('x-conversation-id');
      if (!activeChatId && returnedChatId) {
        activeChatId = Number(returnedChatId);
        previousChats = [
            { id: activeChatId, title: txt.slice(0, 30) + '...', created_at: new Date().toISOString() }, 
            ...previousChats
        ];
      }

      // Hide sidebar automatically on mobile when sending a new msg
      if (window.innerWidth <= 768) {
         sidebarOpen = false;
      }

      // Read streaming response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      
      // Add empty message placeholder for AI
      activeMessages = [...activeMessages, { role: 'model', content: '' }];
      isThinking = false; // Stop thinking indicator once we start streaming
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          // Update the last message
          activeMessages[activeMessages.length - 1].content += chunk;
          activeMessages = [...activeMessages]; // Trigger Svelte reactivity
          scrollToBottom();
        }
      }
    } catch (e: any) {
      console.error(e);
      activeMessages = [...activeMessages, { role: 'model', content: `Sorry, I encountered an error: ${e.message}` }];
      isThinking = false;
    }
    isThinking = false;
  }

  // Parse Markdown to HTML for AI bubbles
  function parseMD(text: string) {
    if (!text) return '';
    // Process line by line for better list handling
    const lines = text.split('\n');
    let html = '';
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Headings
      if (line.startsWith('### ')) {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<h4 style="font-weight:700;margin:10px 0 4px;font-size:14px;">${line.slice(4)}</h4>`;
        continue;
      }
      if (line.startsWith('## ')) {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<h3 style="font-weight:700;margin:12px 0 4px;font-size:15px;">${line.slice(3)}</h3>`;
        continue;
      }
      if (line.startsWith('# ')) {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<h2 style="font-weight:700;margin:14px 0 6px;font-size:16px;">${line.slice(2)}</h2>`;
        continue;
      }

      // Bullet lists: lines starting with - or *
      const bulletMatch = line.match(/^[\-\*]\s+(.+)/);
      if (bulletMatch) {
        if (!inList) { html += '<ul style="margin:6px 0;padding-left:18px;">'; inList = true; }
        const content = inlineMD(bulletMatch[1]);
        html += `<li style="margin:3px 0;">${content}</li>`;
        continue;
      }

      // End of list
      if (inList) { html += '</ul>'; inList = false; }

      // Empty line = paragraph break
      if (line.trim() === '') {
        html += '<br/>';
        continue;
      }

      html += inlineMD(line) + '<br/>';
    }

    if (inList) html += '</ul>';
    return html;
  }

  // Inline markdown: bold, italic, inline code
  function inlineMD(text: string) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.08);padding:1px 5px;border-radius:4px;font-size:0.9em;">$1</code>')
      .replace(/\*([^\*]+)\*/g, '<em>$1</em>');
  }

  // --- Sidebar Chat Actions ---
  function openMenu(e: Event, id: number) {
    e.stopPropagation();
    menuOpenId = menuOpenId === id ? null : id;
  }

  function startRename(e: Event, chat: any) {
    e.stopPropagation();
    menuOpenId = null;
    editingChatId = chat.id;
    editTitle = chat.title;
  }

  async function saveRename(id: number) {
    if (!editTitle.trim()) {
      editingChatId = null;
      return;
    }
    const idx = previousChats.findIndex(c => c.id === id);
    if (idx !== -1) previousChats[idx].title = editTitle;
    editingChatId = null;

    try {
      await fetch(`/api/ai/chat/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle })
      });
    } catch(e) { console.error('Rename failed', e); }
  }

  let deletingChatId = $state<number | null>(null);

  function requestDeleteChat(e: Event, id: number) {
    e.stopPropagation();
    menuOpenId = null;
    deletingChatId = id;
  }

  async function confirmDeleteChat() {
    if (!deletingChatId) return;
    const id = deletingChatId;
    deletingChatId = null;

    // Optimistic remove
    previousChats = previousChats.filter(c => c.id !== id);
    if (activeChatId === id) {
      activeChatId = null;
      activeMessages = [];
    }

    try {
      await fetch(`/api/ai/chat/${id}`, { method: 'DELETE' });
    } catch(e) { console.error('Delete failed', e); }
  }
</script>

<svelte:head><title>Intelligence — Crown Wedding Films</title></svelte:head>

<div class="topbar">
  <div style="display:flex;align-items:center;gap:12px">
    <button class="mobile-menu-btn" onclick={() => sidebarOpen = true} title="Open history">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>
    <div class="topbar-title">Crown Intelligence</div>
  </div>
</div>

<div class="intelligence-page">
  <div class="chat-container">

    <!-- ══ LEFT SIDEBAR: Chat History ══ -->
    {#if sidebarOpen}
      <div class="sidebar-backdrop" onclick={() => sidebarOpen = false} role="presentation"></div>
    {/if}

    <aside class="chat-sidebar" class:open={sidebarOpen}>
      <div class="chat-sidebar-header">
        <button class="mobile-close-btn" onclick={() => sidebarOpen = false}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- New Chat Button -->
      <div class="sidebar-new-chat">
        <button class="new-chat-btn" onclick={() => { activeChatId = null; activeMessages = []; sidebarOpen = false; }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          New Chat
        </button>
      </div>

      <!-- Chat List -->
      <div class="chat-list-label">Recent</div>
      <div class="chat-list" onclick={() => menuOpenId = null}>
        {#each previousChats as chat}
          <div class="chat-item-wrapper" style="position:relative">
            <button
              class="chat-item"
              class:active={chat.id === activeChatId}
              onclick={() => loadChat(chat.id)}
            >
              {#if editingChatId === chat.id}
                <input 
                  type="text" 
                  class="rename-input" 
                  bind:value={editTitle}
                  onclick={e => e.stopPropagation()}
                  onblur={() => saveRename(chat.id)}
                  onkeydown={e => e.key === 'Enter' && saveRename(chat.id)}
                  autofocus
                />
              {:else}
                <span class="chat-item-title">{chat.title || 'Conversation'}</span>
                <button class="chat-menu-btn" onclick={(e) => openMenu(e, chat.id)} title="Options">
                  <svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px">
                    <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
                  </svg>
                </button>
              {/if}
            </button>

            <!-- Dropdown Menu -->
            {#if menuOpenId === chat.id}
              <div class="chat-item-dropdown">
                <button onclick={(e) => startRename(e, chat)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Rename
                </button>
                <button class="danger" onclick={(e) => requestDeleteChat(e, chat.id)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                  Delete
                </button>
              </div>
            {/if}
          </div>
        {/each}

        {#if previousChats.length === 0}
          <div class="chat-list-empty">No conversations yet</div>
        {/if}
      </div>


    </aside>

    <!-- ══ RIGHT SIDE: Active Chat ══ -->
    <main class="chat-main">
      <div class="chat-messages" bind:this={chatDisplay}>
        
        {#if isLoadingChat}
          <!-- Loading skeleton when switching chats -->
          <div class="chat-loading-skeleton">
            <div class="skeleton-msg ai">
              <div class="skeleton-avatar"></div>
              <div class="skeleton-lines">
                <div class="skeleton-line" style="width:70%"></div>
                <div class="skeleton-line" style="width:50%"></div>
              </div>
            </div>
            <div class="skeleton-msg user">
              <div class="skeleton-lines right">
                <div class="skeleton-line" style="width:40%"></div>
              </div>
            </div>
            <div class="skeleton-msg ai">
              <div class="skeleton-avatar"></div>
              <div class="skeleton-lines">
                <div class="skeleton-line" style="width:80%"></div>
                <div class="skeleton-line" style="width:60%"></div>
                <div class="skeleton-line" style="width:35%"></div>
              </div>
            </div>
          </div>
        {:else}

          {#if activeMessages.length === 0}
            <!-- Welcome Screen -->
            <div class="welcome-screen">
              <div class="welcome-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                </svg>
              </div>
              <h2 class="welcome-title">Hello, {$page.data.user?.name?.split(' ')[0] || 'there'} 👋</h2>
              <p class="welcome-subtitle">How can Crown Intelligence help you today?</p>
              <div class="welcome-suggestions">
                <button class="suggestion-chip" onclick={() => { inputQuery = "What upcoming events do we have this month?"; sendMessage(); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Upcoming events
                </button>
                <button class="suggestion-chip" onclick={() => { inputQuery = "Give me a full revenue summary and any outstanding balances."; sendMessage(); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  Revenue summary
                </button>
                <button class="suggestion-chip" onclick={() => { inputQuery = "Which events are currently in editing or file selection?"; sendMessage(); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                  Production pipeline
                </button>
              </div>
            </div>
          {/if}

          {#each activeMessages as msg}
            {#if msg.role === 'user'}
              <div class="message user-message">
                <div class="message-bubble user-bubble">
                  <p>{msg.content}</p>
                </div>
              </div>
            {:else}
              <!-- AI Message -->
              <div class="message ai-message">
                <div class="message-avatar ai-avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px">
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                  </svg>
                </div>
                <div class="message-bubble ai-bubble" style="white-space: pre-wrap; line-height:1.6;">
                  {@html parseMD(msg.content)}
                </div>
              </div>
            {/if}
          {/each}

          <!-- Pro Thinking Indicator -->
          {#if isThinking}
            <div class="message ai-message">
              <div class="message-avatar ai-avatar thinking-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                </svg>
              </div>
              <div class="thinking-bubble">
                <div class="thinking-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          {/if}
        {/if}

      </div>

      <!-- Input Bar -->
      <div class="chat-input-wrapper">
        <div class="chat-input-box">
          <input 
            type="text" 
            class="chat-input" 
            placeholder="Ask Crown Intelligence..." 
            bind:value={inputQuery} 
            onkeydown={e => e.key === 'Enter' && sendMessage()}
            disabled={isThinking || isLoadingChat}
          />
          <button class="chat-submit" disabled={!inputQuery.trim() || isThinking || isLoadingChat} onclick={sendMessage}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </main>

  </div>
</div>

<!-- ══ Custom Delete Confirmation Modal ══ -->
{#if deletingChatId !== null}
  <div class="del-overlay" onclick={() => deletingChatId = null} role="dialog" aria-modal="true">
    <div class="del-modal" onclick={e => e.stopPropagation()} role="document">
      <div class="del-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/>
          <path d="M9 6V4h6v2"/>
        </svg>
      </div>
      <h3 class="del-title">Delete Conversation?</h3>
      <p class="del-desc">This conversation and all its messages will be permanently removed. This action cannot be undone.</p>
      <div class="del-actions">
        <button class="del-cancel" onclick={() => deletingChatId = null}>Cancel</button>
        <button class="del-confirm" onclick={confirmDeleteChat}>Delete</button>
      </div>
    </div>
  </div>
{/if}

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* ── Page Layout ── */
.intelligence-page {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  padding: 0;
  height: calc(100vh - 60px);
  box-sizing: border-box;
}

.chat-container {
  display: flex;
  height: 100%;
  background: var(--surface);
  overflow: hidden;
}

/* ── SIDEBAR ── */
.chat-sidebar {
  width: 260px;
  background: var(--surface-2);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  font-family: 'Inter', sans-serif;
}

.chat-sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 14px 10px;
}
/* New Chat Button */
.sidebar-new-chat {
  padding: 6px 10px 10px;
}

.new-chat-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 9px 12px;
  background: transparent;
  border: 1px solid var(--border-md);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-2);
  cursor: pointer;
  transition: background 150ms, border-color 150ms, color 150ms;
  font-family: 'Inter', sans-serif;
}

.new-chat-btn:hover {
  background: var(--surface-3);
  border-color: var(--blue);
  color: var(--blue);
}

.new-chat-btn svg {
  width: 15px;
  height: 15px;
}

/* Chat List Label */
.chat-list-label {
  padding: 4px 14px 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-3);
}

/* Chat List */
.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.chat-list::-webkit-scrollbar { width: 4px; }
.chat-list::-webkit-scrollbar-track { background: transparent; }
.chat-list::-webkit-scrollbar-thumb { background: var(--border-md); border-radius: 4px; }

.chat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 9px 10px;
  text-align: left;
  border-radius: 7px;
  transition: background 120ms ease;
  width: 100%;
  min-width: 0;
}

.chat-item:hover {
  background: var(--surface-3);
}

.chat-item.active {
  background: var(--blue-tint);
}

.chat-item.active .chat-item-title {
  color: var(--blue);
  font-weight: 600;
}

.chat-item-title {
  font-size: 13px;
  font-weight: 400;
  color: var(--ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
  font-family: 'Inter', sans-serif;
  line-height: 1.4;
}

.chat-menu-btn {
  background: transparent;
  border: none;
  color: var(--ink-3);
  cursor: pointer;
  padding: 3px 4px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 150ms, background 150ms;
  flex-shrink: 0;
  line-height: 1;
}

.chat-item:hover .chat-menu-btn,
.chat-item.active .chat-menu-btn {
  opacity: 1;
}

.chat-menu-btn:hover {
  background: var(--surface-2);
  color: var(--ink);
}

.chat-item-dropdown {
  position: absolute;
  top: calc(100% - 4px);
  right: 4px;
  background: var(--surface);
  border: 1px solid var(--border-md);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  z-index: 1002;
  display: flex;
  flex-direction: column;
  min-width: 130px;
  overflow: hidden;
  padding: 4px;
}

.chat-item-dropdown button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  text-align: left;
  padding: 8px 10px;
  font-size: 13px;
  cursor: pointer;
  color: var(--ink);
  border-radius: 6px;
  transition: background 100ms;
  font-family: 'Inter', sans-serif;
}

.chat-item-dropdown button:hover {
  background: var(--surface-2);
}

.chat-item-dropdown button.danger {
  color: var(--red);
}

.rename-input {
  width: 100%;
  border: 1px solid var(--blue);
  border-radius: 5px;
  padding: 3px 7px;
  font-size: 13px;
  outline: none;
  background: var(--surface);
  color: var(--ink);
  font-family: 'Inter', sans-serif;
}

.chat-list-empty {
  padding: 20px 12px;
  font-size: 12px;
  color: var(--ink-3);
  text-align: center;
  font-family: 'Inter', sans-serif;
}

/* Sidebar Footer */
.sidebar-footer {
  padding: 10px 10px 14px;
  border-top: 1px solid var(--border);
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 8px;
  border-radius: 7px;
  cursor: pointer;
}

.sidebar-user:hover {
  background: var(--surface-3);
}

.sidebar-user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--blue);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.sidebar-user-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: 'Inter', sans-serif;
}

/* Mobile buttons */
.mobile-menu-btn, .mobile-close-btn {
  display: none;
  background: none;
  border: none;
  color: var(--ink-2);
  padding: 8px;
  cursor: pointer;
  border-radius: var(--r-md);
  transition: background 150ms;
}
.mobile-menu-btn:hover, .mobile-close-btn:hover {
  background: var(--surface-3);
}
.mobile-menu-btn svg, .mobile-close-btn svg {
  width: 20px;
  height: 20px;
}

/* ── CHAT MAIN ── */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  min-width: 0;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 32px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chat-messages::-webkit-scrollbar { width: 5px; }
.chat-messages::-webkit-scrollbar-track { background: transparent; }
.chat-messages::-webkit-scrollbar-thumb { background: var(--border-md); border-radius: 4px; }

/* ── Welcome Screen ── */
.welcome-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px 20px;
  gap: 12px;
}

.welcome-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, var(--blue), #6c8de6);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-bottom: 4px;
  box-shadow: 0 8px 24px rgba(var(--blue-rgb, 66, 133, 244), 0.3);
}

.welcome-icon svg {
  width: 26px;
  height: 26px;
}

.welcome-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--ink);
  margin: 0;
  font-family: 'Inter', sans-serif;
  letter-spacing: -0.02em;
}

.welcome-subtitle {
  font-size: 14px;
  color: var(--ink-3);
  margin: 0;
  font-family: 'Inter', sans-serif;
}

.welcome-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 16px;
  max-width: 500px;
}

.suggestion-chip {
  display: flex;
  align-items: center;
  gap: 7px;
  background: var(--surface-2);
  border: 1px solid var(--border-md);
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 13px;
  color: var(--ink-2);
  cursor: pointer;
  transition: background 150ms, border-color 150ms, color 150ms;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
}

.suggestion-chip svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.suggestion-chip:hover {
  background: var(--blue-tint);
  border-color: var(--blue);
  color: var(--blue);
}

/* ── Messages ── */
.message {
  display: flex;
  gap: 12px;
  padding: 0 24px;
  max-width: 860px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.ai-message {
  align-self: stretch;
}

.user-message {
  justify-content: flex-end;
}

.message-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.ai-avatar {
  background: var(--blue);
  color: #fff;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.65;
  font-family: 'Inter', sans-serif;
  max-width: 100%;
}

.ai-bubble {
  background: var(--surface-2);
  color: var(--ink);
  border-top-left-radius: 3px;
  flex: 1;
}

.user-bubble {
  background: var(--blue);
  color: #fff;
  border-top-right-radius: 3px;
  max-width: 75%;
}

.user-bubble p {
  color: #ffffff;
  margin: 0;
}

/* ── Pro Thinking Animation ── */
.thinking-avatar {
  animation: avatar-glow 1.5s ease-in-out infinite alternate;
}

@keyframes avatar-glow {
  from { box-shadow: 0 0 0 0 rgba(66, 133, 244, 0); opacity: 0.8; }
  to   { box-shadow: 0 0 0 6px rgba(66, 133, 244, 0.2); opacity: 1; }
}

.thinking-bubble {
  background: var(--surface-2);
  border-radius: 12px;
  border-top-left-radius: 3px;
  padding: 14px 20px;
  display: flex;
  align-items: center;
}

.thinking-dots {
  display: flex;
  gap: 5px;
  align-items: center;
}

.thinking-dots span {
  display: block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--blue);
  opacity: 0.4;
  animation: dot-bounce 1.4s ease-in-out infinite;
}

.thinking-dots span:nth-child(1) { animation-delay: 0s; }
.thinking-dots span:nth-child(2) { animation-delay: 0.2s; }
.thinking-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes dot-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30%            { transform: translateY(-6px); opacity: 1; }
}

/* ── Loading Skeleton (chat switching) ── */
.chat-loading-skeleton {
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 860px;
  width: 100%;
  margin: 0 auto;
}

.skeleton-msg {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.skeleton-msg.user {
  justify-content: flex-end;
}

.skeleton-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--border-md);
  flex-shrink: 0;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-lines {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.skeleton-lines.right {
  align-items: flex-end;
}

.skeleton-line {
  height: 14px;
  border-radius: 6px;
  background: var(--border-md);
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { opacity: 0.5; }
  50%       { opacity: 1; }
}

/* ── Input Bar ── */
.chat-input-wrapper {
  padding: 12px 24px 16px;
  background: var(--surface);
  border-top: 1px solid var(--border);
  max-width: 860px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.chat-input-box {
  display: flex;
  align-items: center;
  background: var(--surface-1);
  border: 1.5px solid var(--border-md);
  border-radius: 14px;
  padding: 8px 8px 8px 16px;
  transition: border-color 200ms ease, box-shadow 200ms ease;
}

.chat-input-box:focus-within {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px var(--blue-tint);
  background: var(--surface);
}

.chat-input {
  flex: 1;
  background: transparent;
  border: none;
  font-size: 14px;
  outline: none;
  color: var(--ink);
  font-family: 'Inter', sans-serif;
}

.chat-input::placeholder {
  color: var(--ink-3);
}

.chat-submit {
  border: none;
  background: var(--blue);
  color: #fff;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 150ms ease, opacity 150ms ease;
  flex-shrink: 0;
}

.chat-submit:disabled {
  background: var(--border-md);
  color: var(--ink-3);
  cursor: not-allowed;
}

.chat-submit:not(:disabled):hover {
  transform: scale(1.06);
}

.chat-submit svg {
  width: 15px;
  height: 15px;
}

.chat-disclaimer {
  text-align: center;
  font-size: 11px;
  color: var(--ink-3);
  margin: 8px 0 0;
  font-family: 'Inter', sans-serif;
}

/* ── Mobile ── */
/* ── Delete Modal ── */
.del-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(4px);
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.del-modal {
  background: var(--surface);
  border: 1px solid var(--border-md);
  border-radius: 20px;
  padding: 32px 28px 24px;
  max-width: 360px;
  width: 100%;
  box-shadow: 0 24px 80px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  animation: del-pop 0.2s cubic-bezier(0.34,1.56,0.64,1);
}

@keyframes del-pop {
  from { transform: scale(0.9); opacity: 0; }
  to   { transform: scale(1);   opacity: 1; }
}

.del-icon {
  width: 52px;
  height: 52px;
  background: rgba(255,59,48,0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  color: var(--red);
}

.del-icon svg { width: 22px; height: 22px; }

.del-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--ink);
  margin: 0 0 8px;
  font-family: 'Inter', sans-serif;
  letter-spacing: -0.02em;
}

.del-desc {
  font-size: 13px;
  color: var(--ink-3);
  line-height: 1.6;
  margin: 0 0 24px;
  font-family: 'Inter', sans-serif;
}

.del-actions {
  display: flex;
  gap: 10px;
  width: 100%;
}

.del-cancel {
  flex: 1;
  padding: 10px;
  border: 1px solid var(--border-md);
  border-radius: 10px;
  background: var(--surface-2);
  color: var(--ink-2);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 150ms;
  font-family: 'Inter', sans-serif;
}
.del-cancel:hover { background: var(--surface-3); }

.del-confirm {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 10px;
  background: var(--red);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 150ms;
  font-family: 'Inter', sans-serif;
}
.del-confirm:hover { opacity: 0.85; }

@media (max-width: 768px) {
  .mobile-menu-btn { display: flex; }
  .mobile-close-btn { display: flex; }

  .chat-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 1001;
    width: 280px;
    background: var(--surface);
    transform: translateX(-100%);
    transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 20px 0 50px rgba(0,0,0,0.1);
    display: flex;
  }
  .chat-sidebar.open {
    transform: translateX(0);
  }

  .sidebar-backdrop {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.3);
    backdrop-filter: blur(2px);
    z-index: 1000;
  }

  .chat-messages {
    padding: 16px 0;
  }

  .message {
    padding: 0 12px;
  }

  .chat-loading-skeleton {
    padding: 0 12px;
  }

  .chat-input-wrapper {
    padding: 8px 12px 10px;
  }

  .intelligence-page {
    height: calc(100vh - 125px);
  }

  .welcome-screen {
    padding: 32px 16px 16px;
  }
}
</style>
