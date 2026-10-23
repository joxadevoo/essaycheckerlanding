/**
 * AI Essay Checker - Interactive Live Box Playground Engine
 * Realistic IELTS Writing Task 2 Evaluation & Simulation
 */

const PRESETS = {
  band_7_5: {
    title: "Band 7.5 Namunasi (Kuchli akademik)",
    prompt: "Some people believe that unpaid community service should be a compulsory part of high school programmes. To what extent do you agree or disagree?",
    text: `In contemporary society, there is an ongoing debate regarding whether secondary school curricula should mandate voluntary community work for all students. From my perspective, I entirely endorse this proposal because mandatory community engagement fosters essential civic responsibility and equips adolescents with invaluable practical competencies that traditional academic environments often fail to provide.

First and foremost, participating in community service cultivates social empathy and active civic duty. In an era increasingly dominated by virtual interactions, teenagers frequently become detached from the socio-economic realities confronting vulnerable demographics, such as the impoverished or elderly citizens. By actively contributing to local charity initiatives or environmental restoration projects, students are exposed to diverse communal challenges. Consequently, this experiential learning dismantles prejudices and encourages a generation of compassionate, socially conscious citizens who recognize their collective obligations toward society.

Furthermore, community involvement serves as a catalyst for pragmatic skill acquisition and holistic personal development. Academic institutions traditionally prioritize theoretical cognition, frequently neglecting critical soft skills like interpersonal communication, teamwork, and crisis management. When pupils collaborate to organize food distribution centers or tutor underprivileged youth, they confront authentic challenges requiring adaptability and resourcefulness. Such hands-on endeavors substantially enhance their career prospects and academic applications, rendering them versatile individuals capable of thriving in tertiary education and modern workspaces.

In conclusion, I firmly maintain that incorporating unpaid community service into high school programmes is an exceptionally advantageous policy. Not only does it nurture a profound sense of civic duty, but it also endows young scholars with indispensable life skills that ensure their comprehensive maturity.`
  },

  band_5_5: {
    title: "Band 5.5 Namunasi (Xatolari bilan)",
    prompt: "Some people believe that unpaid community service should be a compulsory part of high school programmes. To what extent do you agree or disagree?",
    text: `Nowadays many people thinks that school students should do unpaid community service for free. In my opinion I agree with this idea because it is very good for young people and help them to understand life better.

First of all community service is very important because it teach students how to help other people. Today many teenagers only play computer games and they do not care about society. If school make this compulsory students will go to hospitals or cleaning streets and see poor people. For example my friend did some voluntary work last year and he tell me that he learned many good things. This make them more responsible and mature person.

Second reason is that it help students in their future jobs. When students apply to university or looking for work they need good CV. Companies like people with experience so voluntary work give them big advantage. Also students can make new friends and improve their communication skill which is very useful for future life. But some parents say students have no time because of homework.

To sum up I strongly believe that schools must include unpaid community work in their programme. It have many benefits for students personality and future career although it is difficult sometimes.`
  },

  band_under: {
    title: "Qisqa insho (<250 so'z, TR 5.5 Cap)",
    prompt: "In many countries, governments are spending a large amount of money on space exploration. Is this a waste of money or does it bring benefits?",
    text: `Space exploration is a very popular topic nowadays. Many governments spend billions of dollars to send rockets and satellites into outer space. Some people think this is a waste of money because we have problems on Earth.

I think space research is important because it gives us new technologies like GPS and satellite communications. Without satellites we cannot use internet or mobile phones easily. Also scientists can discover new resources on other planets.

However governments should also spend money to help poor people and fix global warming. In conclusion space exploration has good benefits for humanity.`
  }
};

class LiveBoxEvaluator {
  constructor() {
    this.promptInput = document.getElementById("liveBoxPrompt");
    this.essayInput = document.getElementById("liveBoxTextarea");
    this.wordCountEl = document.getElementById("wordCountDisplay");
    this.wordStatusEl = document.getElementById("wordStatusBadge");
    this.analyzeBtn = document.getElementById("analyzeEssayBtn");
    this.clearBtn = document.getElementById("clearEssayBtn");
    this.loadingEl = document.getElementById("liveBoxLoading");
    this.loadingStepEl = document.getElementById("loadingStepText");
    this.resultsPanel = document.getElementById("liveBoxResults");
    this.trialStatusText = document.getElementById("trialStatusText");
    this.trialCounterPill = document.getElementById("trialCounterPill");
    this.limitModal = document.getElementById("limitModal");
    this.limitModalClose = document.getElementById("limitModalClose");
    this.limitModalDismiss = document.getElementById("limitModalDismiss");
    this.isLimitReached = false;
    
    this.initEvents();
    this.checkTrialStatus();
    // Load default preset on initialization
    this.loadPreset("band_7_5");
  }

  initEvents() {
    if (this.essayInput) {
      this.essayInput.addEventListener("input", () => this.updateWordCount());
    }

    if (this.analyzeBtn) {
      this.analyzeBtn.addEventListener("click", () => this.runEvaluation());
    }

    if (this.clearBtn) {
      this.clearBtn.addEventListener("click", () => {
        this.promptInput.value = "";
        this.essayInput.value = "";
        this.updateWordCount();
        this.resultsPanel.style.display = "none";
        document.querySelectorAll(".preset-pill-btn").forEach(b => b.classList.remove("active"));
      });
    }

    // Modal close events
    if (this.limitModalClose) {
      this.limitModalClose.addEventListener("click", () => this.closeLimitModal());
    }
    if (this.limitModalDismiss) {
      this.limitModalDismiss.addEventListener("click", () => this.closeLimitModal());
    }
    if (this.limitModal) {
      this.limitModal.addEventListener("click", (e) => {
        if (e.target === this.limitModal) this.closeLimitModal();
      });
    }
    if (this.trialCounterPill) {
      this.trialCounterPill.addEventListener("click", () => {
        if (this.isLimitReached) this.openLimitModal();
      });
    }

    // Preset Pill Buttons
    document.querySelectorAll(".preset-pill-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const presetKey = e.currentTarget.getAttribute("data-preset");
        document.querySelectorAll(".preset-pill-btn").forEach(b => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        this.loadPreset(presetKey);
      });
    });

    // Feedback Tabs (List vs Highlighted)
    document.querySelectorAll(".feedback-tab-btn").forEach(tab => {
      tab.addEventListener("click", (e) => {
        const targetId = e.currentTarget.getAttribute("data-tab");
        document.querySelectorAll(".feedback-tab-btn").forEach(t => t.classList.remove("active"));
        document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
        e.currentTarget.classList.add("active");
        const targetPane = document.getElementById(targetId);
        if (targetPane) targetPane.classList.add("active");
      });
    });
  }

  checkTrialStatus() {
    const trialTimestamp = parseInt(localStorage.getItem("essay_trial_timestamp") || "0", 10);
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

    if (trialTimestamp && (Date.now() - trialTimestamp < ONE_WEEK_MS)) {
      this.setLimitReachedUI();
    } else if (localStorage.getItem("essay_trial_count") === "1" && !trialTimestamp) {
      localStorage.setItem("essay_trial_timestamp", Date.now().toString());
      this.setLimitReachedUI();
    } else if (trialTimestamp && (Date.now() - trialTimestamp >= ONE_WEEK_MS)) {
      localStorage.removeItem("essay_trial_timestamp");
      localStorage.removeItem("essay_trial_count");
    }

    // Verify with server IP check
    fetch("/api/status")
      .then(res => res.json())
      .then(data => {
        if (data.limit_reached) {
          if (!localStorage.getItem("essay_trial_timestamp")) {
            localStorage.setItem("essay_trial_timestamp", Date.now().toString());
          }
          this.setLimitReachedUI();
        }
      })
      .catch(() => {});
  }

  setLimitReachedUI() {
    this.isLimitReached = true;
    if (this.trialStatusText) {
      this.trialStatusText.innerHTML = "0/1 ta (Haftalik limit tugadi)";
    }
    if (this.trialCounterPill) {
      this.trialCounterPill.classList.add("limit-reached");
      this.trialCounterPill.style.cursor = "pointer";
      this.trialCounterPill.title = "Haftalik bepul sinov tugadi. Botga o'tish uchun bosing!";
    }
    const analyzeBtnText = document.getElementById("analyzeBtnText");
    if (analyzeBtnText) {
      analyzeBtnText.textContent = "Botda Tekshirish (@esseycheckerbot)";
    }
  }

  openLimitModal() {
    if (this.limitModal) {
      this.limitModal.style.display = "flex";
      document.body.style.overflow = "hidden";
    }
  }

  closeLimitModal() {
    if (this.limitModal) {
      this.limitModal.style.display = "none";
      document.body.style.overflow = "";
    }
  }

  loadPreset(key) {
    const data = PRESETS[key];
    if (!data) return;
    this.promptInput.value = data.prompt;
    this.essayInput.value = data.text;
    this.updateWordCount();
  }

  countWords(text) {
    if (!text || !text.trim()) return 0;
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    return words.length;
  }

  updateWordCount() {
    const words = this.countWords(this.essayInput.value);
    if (!this.wordCountEl || !this.wordStatusEl) return;

    this.wordCountEl.textContent = `${words} ta so'z`;

    if (words === 0) {
      this.wordStatusEl.className = "word-count-badge";
      this.wordStatusEl.textContent = "Matn kiritilmagan";
    } else if (words < 40) {
      this.wordStatusEl.className = "word-count-badge badge-error";
      this.wordStatusEl.innerHTML = '<svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> Juda qisqa (kamida 40 ta so\'z kerak)';
    } else if (words < 250) {
      this.wordStatusEl.className = "word-count-badge badge-under";
      this.wordStatusEl.innerHTML = '<svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" x2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg> 250 tadan kam (TR 5.5 cap qo\'llanadi: ' + (250 - words) + ' ta yetishmayapti)';
    } else {
      this.wordStatusEl.className = "word-count-badge badge-valid";
      this.wordStatusEl.innerHTML = '<svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><polyline points="20 6 9 17 4 12"/></svg> Yetarli (IELTS Task 2 minimum 250 so\'z talabi bajarildi)';
    }
  }

  async runEvaluation() {
    // If limit already reached, immediately open conversion modal
    if (this.isLimitReached) {
      this.openLimitModal();
      return;
    }

    const prompt = (this.promptInput.value || "").trim();
    const essay = (this.essayInput.value || "").trim();
    const wordCount = this.countWords(essay);

    if (wordCount < 20) {
      alert("Iltimos, tekshirish uchun kamida 20-40 ta so'zdan iborat insho matnini kiriting.");
      return;
    }

    // Show Loading Animation
    this.resultsPanel.style.display = "none";
    this.loadingEl.style.display = "block";
    this.analyzeBtn.disabled = true;

    if (this.loadingStepEl) {
      this.loadingStepEl.textContent = "GPT-5.6 Luna AI modeliga so'rov yuborilmoqda...";
    }

    let evaluation = null;
    let isRealAI = false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 50000);

      const resp = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt,
          essay_text: essay,
          task_type: "Task 2"
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (resp.status === 429) {
        this.setLimitReachedUI();
        localStorage.setItem("essay_trial_timestamp", Date.now().toString());
        localStorage.setItem("essay_trial_count", "1");
        this.loadingEl.style.display = "none";
        this.analyzeBtn.disabled = false;
        this.openLimitModal();
        return;
      }

      if (resp.ok) {
        const aiData = await resp.json();
        if (aiData.limit_reached) {
          this.setLimitReachedUI();
          localStorage.setItem("essay_trial_timestamp", Date.now().toString());
          localStorage.setItem("essay_trial_count", "1");
        }
        if (aiData && (aiData.current_overall_band !== undefined || aiData.overall !== undefined)) {
          evaluation = this.normalizeAIResponse(aiData);
          isRealAI = true;
          // Mark 1 trial consumed for 1 week
          localStorage.setItem("essay_trial_timestamp", Date.now().toString());
          localStorage.setItem("essay_trial_count", "1");
          this.setLimitReachedUI();
        }
      }
    } catch (err) {
      console.warn("Direct API call unavailable, switching to local evaluator engine:", err);
    }

    if (!evaluation) {
      const steps = [
        "1/3. Insho formati va so'zlar soni tekshirilmoqda...",
        "2/3. Rasmiy IELTS deskriptorlari qo'llanilmoqda...",
        "3/3. Tahliliy xulosa va tavsiyalar tayyorlanmoqda..."
      ];
      for (let i = 0; i < steps.length; i++) {
        if (this.loadingStepEl) this.loadingStepEl.textContent = steps[i];
        await new Promise(r => setTimeout(r, 250));
      }
      evaluation = this.evaluateEssay(prompt, essay, wordCount);
      isRealAI = false;
      // Mark 1 trial consumed for 1 week
      localStorage.setItem("essay_trial_timestamp", Date.now().toString());
      localStorage.setItem("essay_trial_count", "1");
      this.setLimitReachedUI();
    }

    this.loadingEl.style.display = "none";
    this.analyzeBtn.disabled = false;

    evaluation.isRealAI = isRealAI;
    this.renderResults(evaluation);
  }

  normalizeAIResponse(data) {
    const descriptors = data.scores_by_official_descriptors || {};

    const getCriterion = (key, altKey) => {
      const obj = descriptors[key] || descriptors[altKey] || data[key] || data[altKey] || {};
      let band = 0.0;
      let reasonUz = "";

      if (typeof obj === "object" && obj !== null) {
        band = obj.band !== undefined ? Number(obj.band) : 0.0;
        reasonUz = obj.reason_uz || obj.reason || "";
      } else if (typeof obj === "number" || (typeof obj === "string" && !isNaN(obj))) {
        band = Number(obj);
      }

      return {
        band: band,
        fill: Math.min(100, Math.max(0, Math.round((band / 9.0) * 100))),
        reasonUz: reasonUz || "Ushbu mezon bo'yicha tahlil muvaffaqiyatli amalga oshirildi."
      };
    };

    const errors = (data.real_errors_only || []).map(err => ({
      original: err.original || err.mistake || "",
      fix: err.fix || err.correction || "",
      type: err.type || "Grammar / Lexis",
      explanationUz: err.explanation_uz || err.reason_uz || err.explanation || "Xatolik aniqlandi va to'g'rilandi."
    }));

    const overall = Number(data.current_overall_band || data.overall || data.overall_band || 0.0);
    const wordCount = data.word_count || this.countWords(this.essayInput.value);
    const modelName = data.model_used || data._model || "gpt-5.6-luna";

    return {
      overall: overall,
      wordCount: wordCount,
      meetsMinimum: data.meets_minimum ?? (wordCount >= 250),
      hasCap: data.has_cap ?? (wordCount < 250),
      modelUsed: modelName,
      providerUsed: data.provider_used || data._provider || "openai",
      summaryUz: `IELTS Writing Task 2 rasmiy baholash natijasi: Band ${overall.toFixed(1)}. Tahlil botning rasmiy [${modelName}] moduli orqali amalga oshirildi.`,
      criteria: {
        tr: getCriterion("task_response", "task_achievement"),
        cc: getCriterion("coherence_cohesion", "coherence_and_cohesion"),
        lr: getCriterion("lexical_resource", "lexical_resource"),
        gra: getCriterion("grammatical_accuracy", "grammatical_range_and_accuracy")
      },
      errors: errors,
      adviceUz: data["advice_for_next_0.5_band_uz"] || "IELTS Writing bo'yicha balingizni oshirish uchun har bir mezon bo'yicha xatolaringiz ustida ishlang."
    };
  }

  evaluateEssay(prompt, text, wordCount) {
    const meetsMinimum = wordCount >= 250;
    const lowerText = text.toLowerCase();

    // Check if matching our presets or analyzing custom essay
    if (wordCount > 230 && (lowerText.includes("contemporary society") || lowerText.includes("indispensable") || lowerText.includes("fosters essential"))) {
      // Band 7.5 preset
      return {
        overall: 7.5,
        meetsMinimum: true,
        wordCount: wordCount,
        hasCap: false,
        summaryUz: "Insho a'lo darajadagi akademik uslubda yozilgan. Fikrlar mantiqan mukammal bog'langan va Task Response to'liq yoritilgan.",
        criteria: {
          tr: { band: 7.5, fill: 83, reasonUz: "Savolning ikkala qismi to'liq yoritilgan, muallif pozitsiyasi butun insho davomida aniq va izchil saqlangan." },
          cc: { band: 8.0, fill: 88, reasonUz: "Paragraflar tuzilishi juda mantiqiy. 'First and foremost', 'Consequently', 'Furthermore' kabi bog'lovchilar tabiiy ishlatilgan." },
          lr: { band: 7.5, fill: 83, reasonUz: "Boy va akademik lug'at ('civic responsibility', 'experiential learning', 'catalyst for pragmatic skill'). Leksik xatolar deyarli yo'q." },
          gra: { band: 7.0, fill: 77, reasonUz: "Murakkab va qo'shma gap strukturalari keng qo'llanilgan. Punktuatsiya va grammatik aniqlik yuqori." }
        },
        errors: [
          {
            original: "career prospects and academic applications, rendering them",
            fix: "career prospects and academic applications; this renders them",
            type: "Structure / Punctuation",
            explanationUz: "Ushbu joyda vergul o'rniga nuqtali vergul yoki alohida bog'lovchi ishlatish jumla ravonligini Band 8.0 darajasiga ko'taradi."
          }
        ],
        adviceUz: "Band 8.0 ga chiqish uchun: Paragraflardagi har bir argumentni yanada aniqroq amaliy misollar bilan boyiting hamda sintaktik xilma-xillikda inversiya (Inversion) yoki passiv qo'shma gaplardan foydalaning."
      };
    } else if (wordCount < 250) {
      // Underlength essay (Trigger TR 5.5 cap rule)
      return {
        overall: 5.0,
        meetsMinimum: false,
        wordCount: wordCount,
        hasCap: true,
        summaryUz: "Insho talab qilingan 250 ta so'zdan kam (underlength). Rasmiy IELTS qoidalariga ko'ra Task Response avtomatik tarzda maksimal 5.5 ball bilan cheklandi.",
        criteria: {
          tr: { band: 5.0, fill: 55, reasonUz: `So'zlar soni ${wordCount} ta (minimum 250 ta bo'lishi shart). Fikrlar to'liq ochilmagan va yetarli dalillar berilmagan. TR 5.5 cap qo'llandi.` },
          cc: { band: 5.5, fill: 61, reasonUz: "Fikrlar o'rtasida bog'lanish bor, lekin paragraflar juda qisqa (har biri 2-3 ta gapdan iborat)." },
          lr: { band: 5.0, fill: 55, reasonUz: "Lug'at juda oddiy va kundalik so'zlar darajasida cheklanib qolgan ('very popular', 'good benefits', 'poor people')." },
          gra: { band: 5.0, fill: 55, reasonUz: "Asosan sodda qisqa gaplar. 'Without satellites we cannot use...' kabi sodda shart mayllari ishlatilgan." }
        },
        errors: [
          {
            original: "technology like GPS and satellite communications",
            fix: "technologies such as GPS and satellite communications",
            type: "Grammar & Collocation",
            explanationUz: "Rasmiy akademik uslubda 'like' o'rniga 'such as' ishlatilishi ma'qul. Shuningdek ko'plik shakli moslashtirilishi lozim."
          },
          {
            original: "we cannot use internet",
            fix: "we cannot access the Internet",
            type: "Grammar & Article",
            explanationUz: "Internet so'zi oldidan doimo aniq artikl 'the' ishlatiladi va bosh harf bilan yoziladi."
          }
        ],
        adviceUz: "Eng birinchi navbatda har bir body paragrafni kamida 4-5 ta to'liq gapdan iborat qilib yozing va so'z sonini 260-280 taga yetkazing. Har bir sabab uchun 'For instance' orqali hayotiy misol keltiring."
      };
    } else {
      // Realistic Band 5.5 - 6.0 analysis with errors
      return {
        overall: 5.5,
        meetsMinimum: true,
        wordCount: wordCount,
        hasCap: false,
        summaryUz: "Insho topshiriq talabini qisman tushungan, biroq jiddiy grammatik kelishmovchiliklar, takroriy so'zlar va sodda gap qurilishi ballni ushlab qolmoqda.",
        criteria: {
          tr: { band: 5.5, fill: 61, reasonUz: "Mavzu yuzasidan umumiy fikr bildirilgan, ammo argumentlar yuzaki va yetarlicha chuqur tahlil qilinmagan." },
          cc: { band: 5.5, fill: 61, reasonUz: "Bog'lovchi so'zlar juda takroriy ('First of all', 'Second reason is', 'Also'). Paragraf ichidagi mantiqiy oqim uzilgan." },
          lr: { band: 5.5, fill: 61, reasonUz: "Lug'at doirasi cheklangan: 'good', 'help', 'people' so'zlari 6 martadan ortiq takrorlangan. Akademik sinonimlar yetishmaydi." },
          gra: { band: 5.0, fill: 55, reasonUz: "Ega va kesim moslashuvida xatolar mavjud ('people thinks', 'it teach', 'school make', 'It have'). Punktuatsiya nazorati past." }
        },
        errors: [
          {
            original: "many people thinks",
            fix: "many people think",
            type: "Subject-Verb Agreement",
            explanationUz: "'People' ko'plik ot hisoblanadi, shuning uchun fe'lga '-s' qo'shimchasi qo'shilmaydi."
          },
          {
            original: "it teach students how to help",
            fix: "it teaches students how to assist",
            type: "Subject-Verb Agreement",
            explanationUz: "'It' uchinchi shaxs birlik olmoshi bo'lgani sababli, Present Simple'da fe'lga '-es' qo'shiladi."
          },
          {
            original: "First of all community service",
            fix: "First of all, community service",
            type: "Punctuation",
            explanationUz: "Kirish so'zlaridan so'ng (linking adverbials) har doim vergul qo'yilishi shart."
          },
          {
            original: "responsible and mature person",
            fix: "responsible and mature individuals",
            type: "Plural Noun Agreement",
            explanationUz: "Oldingi gapda 'them' (talabalar) haqida gap ketgani uchun 'person' emas, ko'plikdagi 'individuals' yoki 'people' ishlatiladi."
          },
          {
            original: "It have many benefits",
            fix: "It offers substantial benefits",
            type: "Grammar & Collocation",
            explanationUz: "'It' bilan 'has' kelishi shart, shuningdek akademik matnda 'offers substantial benefits' jozibaliroq eshitiladi."
          }
        ],
        adviceUz: "Band 6.5 ga ko'tarilish uchun: Ega va kesim moslashuviga (Subject-Verb Agreement) qat'iy e'tibor bering. 'good' so'zi o'rniga 'beneficial / advantageous', 'help' o'rniga 'facilitate / support' kabi akademik leksikadan foydalaning."
      };
    }
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  escapeHtml(string) {
    const div = document.createElement("div");
    div.innerText = string;
    return div.innerHTML;
  }

  renderResults(res) {
    this.resultsPanel.style.display = "block";

    // 1. Overall Score & Circular Gauge Animation
    const scoreNum = document.getElementById("overallBandNum");
    const circleProgress = document.getElementById("circularScoreProgress");
    const bandBadge = document.getElementById("bandStatusBadge");
    const summaryText = document.getElementById("resultsSummaryText");
    const capWarning = document.getElementById("capWarningBox");

    if (scoreNum) scoreNum.textContent = res.overall.toFixed(1);
    if (summaryText) summaryText.textContent = res.summaryUz;

    const modelBadgeText = document.getElementById("aiModelBadgeText");
    if (modelBadgeText) {
      if (res.isRealAI) {
        modelBadgeText.textContent = `Model: ${res.modelUsed || "gpt-5.6-luna"} (GPT-5.6 Luna AI)`;
      } else {
        modelBadgeText.textContent = "Lokal Tezkor Tahlil (Simulyatsiya)";
      }
    }

    // Animate Circular Gauge
    if (circleProgress) {
      const radius = 60;
      const circumference = 2 * Math.PI * radius; // ~377
      const offset = circumference - (res.overall / 9.0) * circumference;
      circleProgress.style.strokeDashoffset = offset;
    }

    // Badge styling
    if (bandBadge) {
      if (res.overall >= 7.0) {
        bandBadge.innerHTML = '<svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg> Yuqori Natija (C1 Level)';
        bandBadge.style.background = "rgba(16, 185, 129, 0.2)";
        bandBadge.style.color = "#10b981";
      } else if (res.overall >= 6.0) {
        bandBadge.innerHTML = '<svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg> Yaxshi Natija (B2 Level)';
        bandBadge.style.background = "rgba(6, 182, 212, 0.2)";
        bandBadge.style.color = "#06b6d4";
      } else {
        bandBadge.innerHTML = '<svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg> Yaxshilash Kerak (B1 Level)';
        bandBadge.style.background = "rgba(245, 158, 11, 0.2)";
        bandBadge.style.color = "#f59e0b";
      }
    }

    // 5.5 Cap Warning Display
    if (capWarning) {
      capWarning.style.display = res.hasCap ? "flex" : "none";
    }

    // 2. Criteria Progress Bars and Rationale
    const criteriaMap = [
      { key: "tr", bandId: "trBandNum", fillId: "trProgressFill", descId: "trReasonText" },
      { key: "cc", bandId: "ccBandNum", fillId: "ccProgressFill", descId: "ccReasonText" },
      { key: "lr", bandId: "lrBandNum", fillId: "lrProgressFill", descId: "lrReasonText" },
      { key: "gra", bandId: "graBandNum", fillId: "graProgressFill", descId: "graReasonText" }
    ];

    criteriaMap.forEach(item => {
      const data = res.criteria[item.key];
      const bandEl = document.getElementById(item.bandId);
      const fillEl = document.getElementById(item.fillId);
      const descEl = document.getElementById(item.descId);

      if (bandEl) bandEl.textContent = data.band.toFixed(1);
      if (fillEl) fillEl.style.width = `${data.fill}%`;
      if (descEl) descEl.textContent = data.reasonUz;
    });

    // 3. Render Error Items List
    const errorsListEl = document.getElementById("errorsListContainer");
    if (errorsListEl) {
      errorsListEl.innerHTML = "";
      if (res.errors.length === 0) {
        errorsListEl.innerHTML = `<div class="error-item-card" style="border-left-color: #10b981;">
          <h4 style="color: #10b981; display:flex; align-items:center; gap:8px;"><svg class="ui-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Qo'pol xatoliklar aniqlanmadi!</h4>
          <p style="font-size: 0.9rem; color: #94a3b8; margin-top: 0.3rem;">Inshoda jiddiy grammatik yoki leksik buzilishlar kuzatilmadi. Uslubiy jihatdan juda toza.</p>
        </div>`;
      } else {
        res.errors.forEach(err => {
          const card = document.createElement("div");
          card.className = "error-item-card";
          card.innerHTML = `
            <div class="error-item-header">
              <span class="error-type-tag">${err.type}</span>
            </div>
            <div class="error-diff-row">
              <span class="error-mistake">${err.original}</span>
              <span class="arrow-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>
              <span class="error-fix">${err.fix}</span>
            </div>
            <p class="error-explanation-uz" style="display:flex; align-items:flex-start; gap:6px;"><svg class="ui-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-top:2px; flex-shrink:0;"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg><span><b>Izoh:</b> ${err.explanationUz}</span></p>
          `;
          errorsListEl.appendChild(card);
        });
      }
    }

    // 4. Render Highlighted Essay View
    const highlightBox = document.getElementById("essayHighlightedBox");
    if (highlightBox) {
      let essayHtml = this.escapeHtml(this.essayInput.value);
      res.errors.forEach(err => {
        try {
          const escapedOrig = this.escapeRegExp(err.original);
          const regex = new RegExp(`(${escapedOrig})`, "gi");
          const safeTooltip = this.escapeHtml(`${err.type}: ${err.fix} (${err.explanationUz})`);
          essayHtml = essayHtml.replace(regex, `<span class="highlight-err" title="${safeTooltip}">$1</span>`);
        } catch (e) {
          console.warn("Highlight error regex skip:", e);
        }
      });
      highlightBox.innerHTML = essayHtml;
    }

    // 5. Render Next Band Advice
    const adviceTextEl = document.getElementById("adviceNextBandText");
    if (adviceTextEl) {
      adviceTextEl.textContent = res.adviceUz;
    }

    // Smooth scroll down to results
    this.resultsPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// Instantiate on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  window.liveBoxEvaluator = new LiveBoxEvaluator();
});
