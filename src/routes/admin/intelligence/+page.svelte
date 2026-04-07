<script lang="ts">
  let inputQuery = $state('');

  const previousChats = [
    { title: 'Abebe & Sara Revenue Projections', date: 'Today' },
    { title: 'Draft email to Pending Payments', date: 'Yesterday' },
    { title: 'Schedule overlap analysis for May', date: 'Last Week' },
    { title: 'Crew assignment suggestions', date: 'Last Week' },
  ];
</script>

<svelte:head><title>Intelligence — Crown Wedding Films</title></svelte:head>

<div class="topbar">
  <div class="topbar-title">Crown Intelligence</div>
</div>

<div class="intelligence-page">
  <div class="chat-container">

    <!-- ══ LEFT SIDEBAR: Chat History ══ -->
    <aside class="chat-sidebar">
      <div class="chat-sidebar-header">
        <span class="chat-history-title">Chat History</span>
        <button class="btn btn-ghost btn-icon btn-sm" title="New Chat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>
      
      <div class="chat-list">
        {#each previousChats as chat, i}
          <button class="chat-item" class:active={i === 0}>
            <div class="chat-item-header">
              <span class="chat-item-title">{chat.title}</span>
            </div>
            <div class="chat-item-date">{chat.date}</div>
          </button>
        {/each}
      </div>
    </aside>

    <!-- ══ RIGHT SIDE: Active Chat ══ -->
    <main class="chat-main">
      <div class="chat-messages">
        
        <!-- Welcome / AI Message -->
        <div class="message ai-message">
          <div class="message-avatar ai-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
            </svg>
          </div>
          <div class="message-bubble ai-bubble">
            <p>Welcome to Crown Intelligence. I have analyzed your <strong>6 recent events</strong> and upcoming schedules.</p>
            <p style="margin-top:8px">I can help you review unpaid deliveries, suggest available crew members, or draft communications for clients. What can I assist you with today?</p>
          </div>
        </div>

        <!-- User Message -->
        <div class="message user-message">
          <div class="message-bubble user-bubble">
            <p>Can you summarize the total revenue projections for Abebe & Sara's wedding?</p>
          </div>
        </div>

        <!-- AI Processing/Response Message -->
        <div class="message ai-message">
          <div class="message-avatar ai-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
            </svg>
          </div>
          <div class="message-bubble ai-bubble">
            <p>Certainly.</p>
            <p style="margin-top:8px">The wedding event for <strong>Abebe & Sara</strong> has a total contract value of <strong style="color:var(--ink)">$340,000</strong>.</p>
            <ul style="margin-top:10px;padding-left:18px;display:flex;flex-direction:column;gap:5px">
              <li>They have already paid a Prepayment of <strong style="color:var(--green)">$257,590.49</strong> (75%).</li>
              <li>There is a Remaining balance of <strong style="color:var(--red)">$82,409.51</strong> upon final DVD delivery.</li>
              <li>Currently, this event sits in the <strong>Editing</strong> stage with Kira and Sura assigned.</li>
            </ul>
          </div>
        </div>

      </div>

      <!-- Input Bar -->
      <div class="chat-input-wrapper">
        <div class="chat-input-box">
          <input type="text" class="chat-input" placeholder="Ask Crown Intelligence..." bind:value={inputQuery} />
          <button class="chat-submit" disabled={!inputQuery.trim()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </main>

  </div>
</div>

<style>
/* Wrapper to lock height so chat doesn't push the window scroll, but rather internal scroll */
.intelligence-page {
  padding: 16px;
  height: calc(100vh - 60px); /* Full window height minus topbar */
  box-sizing: border-box;
}

.chat-container {
  display: flex;
  height: 100%;
  background: var(--surface);
  border: 1px solid var(--border-md);
  border-radius: var(--r-lg);
  box-shadow: var(--sh-sm);
  overflow: hidden;
}

/* Sidebar */
.chat-sidebar {
  width: 280px;
  background: var(--surface-2);
  border-right: 1px solid var(--border-md);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.chat-sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border);
}

.chat-history-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--ink);
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chat-item {
  display: flex;
  flex-direction: column;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 10px 12px;
  text-align: left;
  border-radius: var(--r-md);
  transition: background 150ms ease;
}

.chat-item:hover {
  background: var(--surface-3);
}

.chat-item.active {
  background: var(--blue-tint);
}

.chat-item.active .chat-item-title {
  color: var(--blue);
}

.chat-item-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.chat-item-date {
  font-size: 11px;
  color: var(--ink-3);
}

/* Chat Main */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--surface);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.message {
  display: flex;
  max-width: 80%;
  gap: 12px;
}

.ai-message {
  align-self: flex-start;
}

.user-message {
  align-self: flex-end;
  justify-content: flex-end;
}

.message-avatar {
  width: 28px;
  height: 28px;
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
  padding: 14px 18px;
  border-radius: 12px;
  font-size: 14.5px;
  line-height: 1.6;
}

.ai-bubble {
  background: var(--surface-2);
  color: var(--ink-2);
  border-top-left-radius: 4px;
}

.user-bubble {
  background: var(--blue);
  color: #fff;
  border-top-right-radius: 4px;
}
.user-bubble p{
    color: #ffffff;
}
/* Input Area */
.chat-input-wrapper {
  padding: 16px 32px 24px;
  background: var(--surface);
  border-top: 1px solid var(--border);
}

.chat-input-box {
  display: flex;
  align-items: center;
  background: var(--surface-2);
  border: 1px solid var(--border-md);
  border-radius: 20px;
  padding: 6px 6px 6px 16px;
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
  font-size: 14.5px;
  outline: none;
  color: var(--ink);
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
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 150ms ease, opacity 150ms ease;
}

.chat-submit:disabled {
  background: var(--border-md);
  color: var(--ink-3);
  cursor: not-allowed;
}

.chat-submit:not(:disabled):hover {
  transform: scale(1.05);
}

.chat-submit svg {
  width: 16px;
  height: 16px;
}

.chat-disclaimer {
  text-align: center;
  font-size: 11px;
  color: var(--ink-3);
  margin-top: 10px;
}

@media (max-width: 768px) {
  .chat-sidebar {
    display: none;
  }
  .chat-messages {
    padding: 16px;
  }
  .chat-input-wrapper {
    padding: 12px 16px 16px;
  }
}
</style>
