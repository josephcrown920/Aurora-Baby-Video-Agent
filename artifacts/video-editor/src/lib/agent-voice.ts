let currentUtterance: SpeechSynthesisUtterance | null = null;

export function primeAgentVoice() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}

export function stopAgentVoice() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  currentUtterance = null;
}

export function speakAgentReply(text: string, rate = 1) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const clean = text.replace(/\s+/g, " ").trim().slice(0, 1200);
  if (!clean) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = rate;
  utterance.pitch = 1;
  utterance.volume = 1;
  currentUtterance = utterance;
  utterance.onend = () => { if (currentUtterance === utterance) currentUtterance = null; };
  window.speechSynthesis.speak(utterance);
}
