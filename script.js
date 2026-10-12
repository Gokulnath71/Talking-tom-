(function () {
  "use strict";

  var cat = document.getElementById("cat");
  var input = document.getElementById("speech");
  var speakBtn = document.getElementById("speakBtn");
  var stopBtn = document.getElementById("stopBtn");
  var pitch = document.getElementById("pitch");
  var rate = document.getElementById("rate");
  var pitchVal = document.getElementById("pitchVal");
  var rateVal = document.getElementById("rateVal");
  var live = document.getElementById("live");
  var unsupported = document.getElementById("unsupported");

  var synth = window.speechSynthesis;
  var supportsSpeech = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

  if (!supportsSpeech) {
    unsupported.hidden = false;
  }

  var liveTimer = null;
  var speechToken = 0;

  function updateLabels() {
    pitchVal.textContent = pitch.value;
    rateVal.textContent = rate.value;
  }

  function setSpeaking(on) {
    cat.classList.toggle("speaking", on);
  }

  // Pick a voice with a bit of character when one is available.
  function pickVoice() {
    if (!supportsSpeech) return null;
    var voices = synth.getVoices();
    if (!voices || !voices.length) return null;
    var preferred = voices.find(function (v) {
      return /female|zira|samantha|kid|child/i.test(v.name);
    });
    return preferred || voices[0];
  }

  function speak(options) {
    if (!supportsSpeech) return;
    var text = (input.value || "").trim();
    if (!text) return;
    options = options || {};
    if (options.celebrate == null) options.celebrate = true;
    speakText(text, options);
  }

  function speakText(text, options) {
    if (!supportsSpeech || !text) return;
    options = options || {};

    synth.cancel();

    var token = ++speechToken;

    var utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = options.pitch != null ? options.pitch : parseFloat(pitch.value);
    utterance.rate = options.rate != null ? options.rate : parseFloat(rate.value);
    utterance.volume = 1;

    var voice = pickVoice();
    if (voice) utterance.voice = voice;

    utterance.onstart = function () {
      if (token !== speechToken) return;
      setSpeaking(true);
    };
    utterance.onend = function () {
      if (token !== speechToken) return;
      setSpeaking(false);
      if (options.celebrate) celebrate();
    };
    utterance.onerror = function () {
      if (token !== speechToken) return;
      setSpeaking(false);
    };

    synth.speak(utterance);
  }

  var HOORAY_MS = 1200;
  var hoorayTimer = null;

  // A little jump-and-cheer once Tom has finished repeating the text.
  function celebrate() {
    cat.classList.remove("hooray");
    void cat.offsetWidth;
    cat.classList.add("hooray");

    clearTimeout(hoorayTimer);
    hoorayTimer = setTimeout(function () {
      cat.classList.remove("hooray");
    }, HOORAY_MS);

    speakText("Hooray!", { pitch: 2, rate: 1.2 });
  }

  var ACTIONS = {
    feed: { say: "Mmm, yummy! Thank you!", pitch: 2, rate: 1.15, duration: 3400 },
    chill: { say: "Ahh... so relaxed.", pitch: 1.5, rate: 0.9, duration: 3600 },
    hypno: { say: "You are getting sleepy... you are getting sleepy.", pitch: 1.2, rate: 0.8, duration: 4600 },
    tickle: { say: "Hehehe! That tickles! Stop it!", pitch: 2, rate: 1.4, duration: 3200 },
    slap: { say: "Whoa! Ouch! That hurt!", pitch: 2, rate: 1.3, duration: 3200 }
  };

  var actionTimer = null;

  function runAction(name) {
    var config = ACTIONS[name];
    if (!config) return;

    cat.classList.remove("feed", "chill", "hypno", "tickle", "slap");
    void cat.offsetWidth;
    cat.classList.add(name);

    clearTimeout(actionTimer);
    actionTimer = setTimeout(function () {
      cat.classList.remove(name);
    }, config.duration);

    speakText(config.say, { pitch: config.pitch, rate: config.rate });
  }

  var feedBtn = document.getElementById("feedBtn");
  var chillBtn = document.getElementById("chillBtn");
  var hypnoBtn = document.getElementById("hypnoBtn");
  var tickleBtn = document.getElementById("tickleBtn");
  var slapBtn = document.getElementById("slapBtn");

  feedBtn.addEventListener("click", function () { runAction("feed"); });
  chillBtn.addEventListener("click", function () { runAction("chill"); });
  hypnoBtn.addEventListener("click", function () { runAction("hypno"); });
  tickleBtn.addEventListener("click", function () { runAction("tickle"); });
  slapBtn.addEventListener("click", function () { runAction("slap"); });

  function stop() {
    if (supportsSpeech) synth.cancel();
    speechToken++;
    setSpeaking(false);
    clearTimeout(actionTimer);
    clearTimeout(hoorayTimer);
    cat.classList.remove("feed", "chill", "hypno", "tickle", "slap", "hooray");
  }

  function scheduleLiveSpeak() {
    if (!live.checked) return;
    clearTimeout(liveTimer);
    liveTimer = setTimeout(function () {
      speak({ celebrate: false });
    }, 700);
  }

  speakBtn.addEventListener("click", function () { speak(); });
  stopBtn.addEventListener("click", stop);

  pitch.addEventListener("input", updateLabels);
  rate.addEventListener("input", updateLabels);

  input.addEventListener("input", scheduleLiveSpeak);

  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      speak();
    }
  });

  // Voices may load asynchronously.
  if (supportsSpeech) {
    synth.onvoiceschanged = function () {};
    synth.getVoices();
  }

  window.addEventListener("beforeunload", stop);

  updateLabels();
})();
