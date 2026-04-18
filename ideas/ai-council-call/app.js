const state = {
  running: false,
  activeTurn: -1,
  round: 0,
  transcript: [],
  orchestratorMemo: "",
  personas: [
    {
      id: crypto.randomUUID(),
      name: "Product Lead",
      systemPrompt:
        "You are an optimistic product leader. Focus on user value, adoption, and MVP speed.",
      voiceProfile: "calm",
      lastResponse: "Ready to map customer value.",
    },
    {
      id: crypto.randomUUID(),
      name: "CFO Skeptic",
      systemPrompt:
        "You are a skeptical CFO. Focus on cost, downside risk, and gross-margin impact.",
      voiceProfile: "assertive",
      lastResponse: "Ready to pressure-test assumptions.",
    },
    {
      id: crypto.randomUUID(),
      name: "Ops Architect",
      systemPrompt:
        "You are an operations architect. Focus on implementation constraints and reliability.",
      voiceProfile: "analytical",
      lastResponse: "Ready to outline technical trade-offs.",
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
  personaVoiceProfile: document.getElementById("personaVoiceProfile"),
  addPersonaBtn: document.getElementById("addPersonaBtn"),
  anthropicKey: document.getElementById("anthropicKey"),
  meetingMode: document.getElementById("meetingMode"),
  interruptIntensity: document.getElementById("interruptIntensity"),
  voiceEnabled: document.getElementById("voiceEnabled"),
  voiceRate: document.getElementById("voiceRate"),
};

async function callAnthropic({ prompt, systemPrompt, apiKey }) {
  if (!apiKey) return localFallback(prompt, systemPrompt);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-latest",
      max_tokens: 260,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) throw new Error(`Anthropic error: ${response.status}`);
  const data = await response.json();
  return data.content?.[0]?.text || "No content.";
}

function localFallback(prompt, systemPrompt) {
  const p = prompt.split(" ").slice(0, 18).join(" ");
  const style = systemPrompt.split(" ").slice(0, 10).join(" ");
  return `[Local simulation] ${style} ... About "${p}", my recommendation is to make one bet, one risk check, and one measurable next step.`;
}

function mode() {
  return els.meetingMode.value;
}

function intensity() {
  return Number(els.interruptIntensity.value) / 100;
}

function voiceRate() {
  return Number(els.voiceRate.value) / 100;
}

function recentTranscript(limit = 8) {
  return state.transcript.slice(-limit).map((t) => `${t.speaker}: ${t.text}`).join("\n");
}

function personaPrompt(persona, opts = {}) {
  const common = [
    `Primary question: ${els.promptInput.value.trim()}`,
    `Orchestrator guidance: ${state.orchestratorMemo || "(none yet)"}`,
    "Recent transcript:",
    recentTranscript(8) || "(none)",
  ];

  if (opts.interruptTarget) {
    common.push(`Interrupt ${opts.interruptTarget} with a direct rebuttal in 1-2 sentences.`);
  } else if (mode() === "contentious") {
    common.push("Respond in 2-3 sharp sentences. Challenge one prior speaker.");
  } else {
    common.push("Respond in 3 short sentences and end with one concrete recommendation.");
  }

  return common.join("\n");
}

async function buildOrchestratorMemo() {
  const key = els.anthropicKey.value.trim();
  const prompt = [
    `Question: ${els.promptInput.value.trim()}`,
    `Personas: ${state.personas.map((p) => `${p.name}(${p.systemPrompt})`).join(" | ")}`,
    "Create a short moderator brief with: decision goal, key tension, and what each persona should focus on.",
  ].join("\n");

  const systemPrompt =
    "You are a neutral meeting orchestrator. Produce concise guidance that helps experts disagree productively.";

  state.orchestratorMemo = await callAnthropic({
    prompt,
    systemPrompt,
    apiKey: key,
  });

  state.transcript.push({
    speaker: "Orchestrator",
    text: state.orchestratorMemo,
    kind: "orchestrator",
  });
}

function pickSpeechVoice(profileName) {
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  if (!voices.length) return null;

  if (profileName === "calm") return voices.find((v) => /samantha|victoria|zira|en/i.test(v.name + v.lang)) || voices[0];
  if (profileName === "assertive") return voices.find((v) => /david|alex|guy|en/i.test(v.name + v.lang)) || voices[0];
  if (profileName === "analytical") return voices.find((v) => /google|narrator|en/i.test(v.name + v.lang)) || voices[0];
  return voices.find((v) => /en/i.test(v.lang)) || voices[0];
}

function speakOutLoud(persona, text, isInterrupt = false) {
  if (!els.voiceEnabled.checked || !("speechSynthesis" in window)) return;

  const utterance = new SpeechSynthesisUtterance(`${persona.name}: ${text}`);
  const base = voiceProfiles[persona.voiceProfile] || voiceProfiles.assertive;
  utterance.rate = Math.min(2, Math.max(0.65, base.rate * voiceRate()));
  utterance.pitch = isInterrupt ? Math.min(2, base.pitch + 0.07) : base.pitch;
  utterance.voice = pickSpeechVoice(persona.voiceProfile);

  if (!isInterrupt && mode() === "turns") window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

async function speakPersona(persona, opts = {}) {
  const key = els.anthropicKey.value.trim();
  const text = await callAnthropic({
    prompt: personaPrompt(persona, opts),
    systemPrompt: persona.systemPrompt,
    apiKey: key,
  });

  persona.lastResponse = text;
  state.transcript.push({
    speaker: persona.name,
    text,
    kind: opts.interruptTarget ? "interrupt" : "normal",
  });
  speakOutLoud(persona, text, Boolean(opts.interruptTarget));
}

async function runTurnMode() {
  state.activeTurn = (state.activeTurn + 1) % state.personas.length;
  if (state.activeTurn === 0) state.round += 1;
  const persona = state.personas[state.activeTurn];

  try {
    await speakPersona(persona);
  } catch (error) {
    state.transcript.push({ speaker: persona.name, text: `Anthropic call failed: ${error.message}`, kind: "normal" });
  }
}

async function runContentiousMode() {
  state.round += 1;

  const jobs = state.personas.map(async (persona, index) => {
    await new Promise((r) => setTimeout(r, 220 + Math.random() * 900));
    state.activeTurn = index;
    render();

    try {
      await speakPersona(persona);

      if (Math.random() < intensity() && state.personas.length > 1) {
        const others = state.personas.filter((p) => p.id !== persona.id);
        const interrupter = others[Math.floor(Math.random() * others.length)];
        await speakPersona(interrupter, { interruptTarget: persona.name });
      }
    } catch (error) {
      state.transcript.push({ speaker: persona.name, text: `Anthropic call failed: ${error.message}`, kind: "normal" });
    }

    render();
  });

  await Promise.all(jobs);
}

async function runNextAction() {
  if (!state.running || !state.personas.length) return;
  if (!els.promptInput.value.trim()) return alert("Please provide a council prompt.");

  if (!state.orchestratorMemo) {
    try {
      await buildOrchestratorMemo();
    } catch (error) {
      state.transcript.push({ speaker: "Orchestrator", text: `Could not build memo: ${error.message}`, kind: "orchestrator" });
    }
  }

  if (mode() === "contentious") await runContentiousMode();
  else await runTurnMode();

  render();
}

function resetMeeting() {
  state.running = false;
  state.round = 0;
  state.activeTurn = -1;
  state.orchestratorMemo = "";
  state.transcript = [];
  for (const persona of state.personas) persona.lastResponse = "Awaiting turn...";
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  render();
}

function render() {
  els.participantGrid.innerHTML = "";
  for (const [index, persona] of state.personas.entries()) {
    const node = els.template.content.firstElementChild.cloneNode(true);
    node.classList.toggle("active", state.running && index === state.activeTurn);
    node.querySelector(".name").textContent = persona.name;
    node.querySelector(".provider").textContent = `Anthropic persona • ${persona.voiceProfile}`;
    node.querySelector(".persona").textContent = persona.systemPrompt;
    node.querySelector(".bubble").textContent = persona.lastResponse || "Awaiting turn...";
    els.participantGrid.appendChild(node);
  }

  els.transcript.innerHTML = "";
  for (const item of state.transcript.slice(-50)) {
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

els.startBtn.addEventListener("click", async () => {
  if (!els.promptInput.value.trim()) return alert("Please provide a council prompt.");

  state.running = true;
  state.round = 0;
  state.activeTurn = -1;
  state.orchestratorMemo = "";
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
  const voiceProfile = els.personaVoiceProfile.value;
  if (!name || !systemPrompt) return alert("Name and perspective prompt are required.");

  state.personas.push({
    id: crypto.randomUUID(),
    name,
    systemPrompt,
    voiceProfile,
    lastResponse: "Ready to contribute.",
  });

  els.personaName.value = "";
  els.personaPrompt.value = "";
  render();
});

if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => render();
}

render();
