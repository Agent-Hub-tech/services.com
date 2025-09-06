(function () {
  const toggle = document.getElementById('chatbotToggle');
  const win = document.getElementById('chatbotWindow');
  const closeBtn = document.getElementById('chatbotClose');
  const form = document.getElementById('chatbotForm');
  const input = document.getElementById('chatbotText');
  const messages = document.getElementById('chatbotMessages');

  if (!toggle || !win || !form || !input || !messages) return;

  function openChat() {
    win.style.display = 'block';
    toggle.setAttribute('aria-expanded', 'true');
    setTimeout(() => input.focus(), 50);
  }
  function closeChat() {
    win.style.display = 'none';
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', () => {
    if (win.style.display === 'block') { closeChat(); } else { openChat(); }
  });
  closeBtn.addEventListener('click', closeChat);

  function addMessage(text, who = 'bot') {
    const div = document.createElement('div');
    div.className = `msg ${who}`;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function botReply(userText) {
    const text = userText.toLowerCase();

    const replies = [
      { test: /hello|hi|hey|welcome/, reply: "Hey! Ask me about services, plans, timing, or how to get started." },
      { test: /service|what.*offer|do you do/, reply: "We offer: Video Creation, Image Generation, Content Writing, Logo Generation, and Fashion & Clothes Design." },
      { test: /price|plan|cost|pricing/, reply: "Our plans: Starter ($199/mo), Pro ($499/mo), and Enterprise (custom). See more on the Plans page." },
      { test: /deliver|turnaround|time|how long/, reply: "Typical delivery: 48h on Pro, ~3 days on Starter. Enterprise gets custom SLAs." },
      { test: /video|edit|motion/, reply: "Video Creation covers edits, motion graphics, captions, and exports for all major formats." },
      { test: /image|photo|visual|render/, reply: "Image Generation includes product renders, concept art, and social-ready sets." },
      { test: /content|copy|write|blog|script/, reply: "Content Writing: web copy, blogs, scripts, and ad creatives — on-brand and conversion-focused." },
      { test: /logo|brand|identity/, reply: "Logo Generation delivers primary/secondary marks, icons, and usage guidelines." },
      { test: /fashion|clothes|apparel|garment/, reply: "Fashion & Clothes Design: concepts, patterns, and print-ready tech packs." },
      { test: /start|get started|signup|sign up/, reply: "Great! Pick a plan on the Plans page or drop a message on Contact — we’ll guide you from there." },
      { test: /.*/, reply: "Got it! For specifics, try: “plans”, “video”, “timing”, or “contact”." }
    ];

    const found = replies.find(r => r.test.test(text));
    setTimeout(() => addMessage(found.reply, 'bot'), 400);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = input.value.trim();
    if (!val) return;
    addMessage(val, 'user');
    input.value = '';
    botReply(val);
  });
})();