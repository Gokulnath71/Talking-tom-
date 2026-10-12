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
  var title = document.getElementById("title");
  var characterBar = document.getElementById("characterBar");

  var CHARACTERS = {
    tom: { name: "Tom", pitch: 2, rate: 1.2, voiceMatch: /female|zira|samantha|kid|child/i },
    snowball: { name: "Snowball", pitch: 2, rate: 1.35, voiceMatch: /female|samantha|zira/i },
    midnight: { name: "Midnight", pitch: 0.6, rate: 0.85, voiceMatch: /male|david|mark|george|james/i },
    ginger: { name: "Ginger", pitch: 1.4, rate: 1.05, voiceMatch: /female|samantha|zira/i },
    blueberry: { name: "Blueberry", pitch: 2, rate: 1.4, voiceMatch: /kid|child|female|zira/i }
  };
  var currentCharacter = "tom";

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
    var match = CHARACTERS[currentCharacter] && CHARACTERS[currentCharacter].voiceMatch;
    if (match) {
      var themed = voices.find(function (v) { return match.test(v.name); });
      if (themed) return themed;
    }
    var preferred = voices.find(function (v) {
      return /female|zira|samantha|kid|child/i.test(v.name);
    });
    return preferred || voices[0];
  }

  function applyCharacter(key) {
    var config = CHARACTERS[key];
    if (!config) return;
    currentCharacter = key;

    cat.classList.remove(
      "character-tom", "character-snowball", "character-midnight",
      "character-ginger", "character-blueberry"
    );
    cat.classList.add("character-" + key);
    cat.setAttribute("aria-label", "An animated cartoon cat named " + config.name);

    title.textContent = "Talking " + config.name;

    var buttons = characterBar.querySelectorAll(".character");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].classList.toggle("active", buttons[i].dataset.character === key);
    }

    pitch.value = config.pitch;
    rate.value = config.rate;
    updateLabels();

    try {
      localStorage.setItem("tom.character", key);
    } catch (e) {}
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

  characterBar.addEventListener("click", function (e) {
    var btn = e.target.closest(".character");
    if (btn) applyCharacter(btn.dataset.character);
  });

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

  var savedCharacter = null;
  try {
    savedCharacter = localStorage.getItem("tom.character");
  } catch (e) {}

  updateLabels();
  applyCharacter(CHARACTERS[savedCharacter] ? savedCharacter : "tom");
})();
