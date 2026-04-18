const state = {
  running: false,
  activeTurn: -1,
  round: 0,
  transcript: [],
  personas: [
    {
      id: crypto.randomUUID(),
      name: "Facilitator",
      provider: "openai",
      systemPrompt: "You drive toward clear decisions and keep things moving.",
      voiceProfile: "calm",
      lastResponse: "Ready to run this meeting.",
    },
    {
      id: crypto.randomUUID(),
      name: "Skeptic",
      provider: "anthropic",
      systemPrompt: "You challenge assumptions and call out weak logic.",
      voiceProfile: "assertive",
      lastResponse: "I'll challenge anything vague.",
    },
    {
      id: crypto.randomUUID(),
      name: "Operator",
      provider: "gemini",
      systemPrompt: "You focus on implementation and execution risks.",
      voiceProfile: "analytical",
      lastResponse: "I'll keep this grounded.",
    },
  ],
};

const voiceProfiles = {
  calm: { rate: 0.9, pitch: 0.95 },
  assertive: { rate: 1.05, pitch: 1.05 },
  analytical: { rate: 0.98, pitch: 0.85 },
  urgent: { rate: 1.2, pitch: 1.18 },
};

const els = {
  participantGrid: document.getElementById("participantGrid"),
  template: document.getElementById("participantTemplate"),
  startBtn: document.getElementById("startBtn"),
  nextTurnBtn: document.getElementById("nextTurnBtn"),
  resetBtn: document.getElementById("resetBtn"),
  promptInput: document.getElementById("promptInput"),
  meetingStatus: document.getElementById("meetingStatus"),
  statusDot: document.getElementById("statusDot"),
  transcript: document.getElementById("transcript"),
  personaName: document.getElementById("personaName"),
  personaPrompt: document.getElementById("personaPrompt"),
  personaProvider: document.getElementById("personaProvider"),
  personaVoiceProfile: document.getElementById("personaVoiceProfile"),
  addPersonaBtn: document.getElementById("addPersonaBtn"),
  openaiKey: document.getElementById("openaiKey"),
  anthropicKey: document.getElementById("anthropicKey"),
  geminiKey: document.getElementById("geminiKey"),
  meetingMode: document.getElementById("meetingMode"),
  interruptIntensity: document.getElementById("interruptIntensity"),
  voiceEnabled: document.getElementById("voiceEnabled"),
  voiceRate: document.getElementById("voiceRate"),
};

const apiClients = {
  async openai({ prompt, systemPrompt, apiKey }) {
    if (!apiKey) return localFallback("OpenAI", prompt, systemPrompt);
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);
    const data = await response.json();
    return data.output_text || data.output?.[0]?.content?.[0]?.text || "No content.";
  },
  async anthropic({ prompt, systemPrompt, apiKey }) {
    if (!apiKey) return localFallback("Anthropic", prompt, systemPrompt);
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-latest",
        max_tokens: 220,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!response.ok) throw new Error(`Anthropic error: ${response.status}`);
    const data = await response.json();
    return data.content?.[0]?.text || "No content.";
  },
  async gemini({ prompt, systemPrompt, apiKey }) {
    if (!apiKey) return localFallback("Gemini", prompt, systemPrompt);
    const model = "gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });
    if (!response.ok) throw new Error(`Gemini error: ${response.status}`);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No content.";
  },
  async local({ prompt, systemPrompt }) {
    return localFallback("Local", prompt, systemPrompt);
  },
};

function providerLabel(provider) {
  return { openai: "OpenAI", anthropic: "Anthropic", gemini: "Google Gemini", local: "Local" }[provider] || provider;
}

function currentApiKey(provider) {
  if (provider === "openai") return els.openaiKey.value.trim();
  if (provider === "anthropic") return els.anthropicKey.value.trim();
  if (provider === "gemini") return els.geminiKey.value.trim();
  return "";
}

function localFallback(provider, prompt, systemPrompt) {
  const p = prompt.split(" ").slice(0, 16).join(" ");
  const voice = systemPrompt.split(" ").slice(0, 8).join(" ");
  return `[${provider} simulator] ${voice} ... On "${p}", push one concrete decision plus one challenge.`;
}

function mode() {
  return els.meetingMode.value;
}

function intensity() {
  return Number(els.interruptIntensity.value) / 100;
}

function globalVoiceRateMultiplier() {
  return Number(els.voiceRate.value) / 100;
}

function render() {
  els.participantGrid.innerHTML = "";

  state.personas.forEach((persona, index) => {
    const node = els.template.content.firstElementChild.cloneNode(true);
    node.classList.toggle("active", index === state.activeTurn && state.running);
    node.querySelector(".name").textContent = persona.name;
    node.querySelector(".provider").textContent = `${providerLabel(persona.provider)} • ${persona.voiceProfile}`;
    node.querySelector(".persona").textContent = persona.systemPrompt;
    node.querySelector(".bubble").textContent = persona.lastResponse || "Awaiting turn...";
    els.participantGrid.appendChild(node);
  });

  els.transcript.innerHTML = "";
  for (const item of state.transcript.slice(-40)) {
    const div = document.createElement("div");
    div.className = `transcript-item ${item.kind === "interrupt" ? "interrupt" : ""}`.trim();
    div.innerHTML = `<b>${item.speaker}</b>: ${item.text}`;
    els.transcript.appendChild(div);
  }

  const modeLabel = mode() === "contentious" ? "Contentious" : "Turn-based";
  const voiceLabel = els.voiceEnabled.checked ? "Voice on" : "Voice off";
  els.statusDot.style.background = state.running ? "#2ad77f" : "#54617f";
  els.meetingStatus.textContent = state.running ? `${modeLabel} • ${voiceLabel} • round ${state.round + 1}` : "Waiting";
}

function buildPrompt(opts = {}) {
  const recent = state.transcript.slice(-8).map((t) => `${t.speaker}: ${t.text}`).join("\n");
  const core = [
    `Main topic: ${els.promptInput.value.trim()}`,
    "Recent transcript:",
    recent || "(none)",
  ];

  if (opts.interruptTarget) {
    core.push(`Interrupt ${opts.interruptTarget} directly with a forceful but constructive rebuttal in 1-2 sentences.`);
  } else if (mode() === "contentious") {
    core.push("Respond sharply in 2-3 sentences and challenge at least one prior speaker.");
  } else {
    core.push("Respond in 3-4 short sentences and advance the discussion.");
  }

  return core.join("\n");
}

function pickSpeechVoice(profileName) {
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  if (!voices.length) return null;

  if (profileName === "calm") {
    return voices.find((v) => /en|samantha|victoria|zira|daniel/i.test(v.name + v.lang)) || voices[0];
  }
  if (profileName === "assertive") {
    return voices.find((v) => /en|david|alex|guy|microsoft/i.test(v.name + v.lang)) || voices[0];
  }
  if (profileName === "analytical") {
    return voices.find((v) => /en|google|narrator|natural/i.test(v.name + v.lang)) || voices[0];
  }
  return voices.find((v) => /en/i.test(v.lang)) || voices[0];
}

function speakOutLoud(persona, text, { interrupt = false } = {}) {
  if (!els.voiceEnabled.checked || !("speechSynthesis" in window)) return;

  const utterance = new SpeechSynthesisUtterance(`${persona.name} says: ${text}`);
  const base = voiceProfiles[persona.voiceProfile] || voiceProfiles.assertive;
  utterance.rate = Math.min(2, Math.max(0.6, base.rate * globalVoiceRateMultiplier()));
  utterance.pitch = interrupt ? Math.min(2, base.pitch + 0.07) : base.pitch;
  utterance.voice = pickSpeechVoice(persona.voiceProfile);

  if (!interrupt && mode() === "turns") {
    window.speechSynthesis.cancel();
  }

  window.speechSynthesis.speak(utterance);
}

async function speak(persona, opts = {}) {
  const text = await apiClients[persona.provider]({
    prompt: buildPrompt(opts),
    systemPrompt: persona.systemPrompt,
    apiKey: currentApiKey(persona.provider),
  });

  persona.lastResponse = text;
  state.transcript.push({
    speaker: persona.name,
    text,
    kind: opts.interruptTarget ? "interrupt" : "normal",
  });

  speakOutLoud(persona, text, { interrupt: Boolean(opts.interruptTarget) });
}

async function runTurnMode() {
  state.activeTurn = (state.activeTurn + 1) % state.personas.length;
  if (state.activeTurn === 0) state.round += 1;
  const persona = state.personas[state.activeTurn];

  try {
    await speak(persona);
  } catch (error) {
    state.transcript.push({ speaker: persona.name, text: `API error: ${error.message}`, kind: "normal" });
  }
}

async function runContentiousMode() {
  state.round += 1;
  const batch = state.personas.map(async (persona, idx) => {
    const jitter = Math.floor(Math.random() * 900);
    await new Promise((r) => setTimeout(r, 250 + jitter));

    state.activeTurn = idx;
    render();

    try {
      await speak(persona);

      const shouldInterrupt = Math.random() < intensity();
      if (shouldInterrupt && state.personas.length > 1) {
        const others = state.personas.filter((p) => p.id !== persona.id);
        const interrupter = others[Math.floor(Math.random() * others.length)];
        await speak(interrupter, { interruptTarget: persona.name });
      }
    } catch (error) {
      state.transcript.push({ speaker: persona.name, text: `API error: ${error.message}`, kind: "normal" });
    }

    render();
  });

  await Promise.all(batch);
}

async function runNextAction() {
  if (!state.running || !state.personas.length) return;
  if (!els.promptInput.value.trim()) {
    alert("Please provide a council prompt.");
    return;
  }

  if (mode() === "contentious") await runContentiousMode();
  else await runTurnMode();

  render();
}

function resetMeeting() {
  state.running = false;
  state.round = 0;
  state.activeTurn = -1;
  state.transcript = [];
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  for (const persona of state.personas) persona.lastResponse = "Awaiting turn...";
  render();
}

els.startBtn.addEventListener("click", async () => {
  if (!els.promptInput.value.trim()) {
    alert("Please provide a council prompt.");
    return;
  }

  state.running = true;
  state.round = 0;
  state.activeTurn = -1;
  state.transcript = [{ speaker: "Moderator", text: els.promptInput.value.trim(), kind: "normal" }];

  await runNextAction();
});

els.nextTurnBtn.addEventListener("click", runNextAction);
els.resetBtn.addEventListener("click", resetMeeting);
els.meetingMode.addEventListener("change", render);
els.voiceEnabled.addEventListener("change", render);

els.addPersonaBtn.addEventListener("click", () => {
  const name = els.personaName.value.trim();
  const systemPrompt = els.personaPrompt.value.trim();
  const provider = els.personaProvider.value;
  const voiceProfile = els.personaVoiceProfile.value;
  if (!name || !systemPrompt) return alert("Name and persona prompt are required.");

  state.personas.push({
    id: crypto.randomUUID(),
    name,
    provider,
    voiceProfile,
    systemPrompt,
    lastResponse: "Ready to jump in.",
  });

  els.personaName.value = "";
  els.personaPrompt.value = "";
  render();
});

if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => render();
}

render();
