(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };

  // ═══════════════════════════════════════════
  //  1. PARTICLE BACKGROUND SYSTEM
  // ═══════════════════════════════════════════
  (function initParticles() {
    var canvas = $("particleBg");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var particles = [];
    var mouseX = -1000, mouseY = -1000;
    var PARTICLE_COUNT = 60;
    var CONNECT_DIST = 140;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    document.addEventListener("mousemove", function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function Particle() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.radius = Math.random() * 2 + 0.8;
      this.opacity = Math.random() * 0.4 + 0.1;
    }

    for (var i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle());
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Subtle mouse repulsion
        var dx = p.x - mouseX;
        var dy = p.y - mouseY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          p.x += dx * 0.01;
          p.y += dy * 0.01;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(13, 155, 110, " + p.opacity + ")";
        ctx.fill();

        // Connect nearby particles
        for (var j = i + 1; j < particles.length; j++) {
          var p2 = particles[j];
          var ddx = p.x - p2.x;
          var ddy = p.y - p2.y;
          var d = Math.sqrt(ddx * ddx + ddy * ddy);
          if (d < CONNECT_DIST) {
            var alpha = (1 - d / CONNECT_DIST) * 0.12;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = "rgba(13, 155, 110, " + alpha + ")";
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(animate);
    }
    animate();
  })();

  // ═══════════════════════════════════════════
  //  2. SCROLL-TRIGGERED ANIMATIONS
  // ═══════════════════════════════════════════
  (function initScrollAnimations() {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

    document.querySelectorAll(".animate-in").forEach(function (el) {
      observer.observe(el);
    });
  })();

  // ═══════════════════════════════════════════
  //  3. FORM PROGRESS TRACKING
  // ═══════════════════════════════════════════
  (function initProgressBar() {
    var bar = $("progressBar");
    var allInputs = document.querySelectorAll("#f select, #f input[type=checkbox], #f input[type=date]");
    var totalFields = 3; // ttype, res, income are required

    function updateProgress() {
      var filledCount = 0;
      // Count required selects that are filled (they always have a value)
      filledCount += 1; // ttype always selected
      filledCount += 1; // res always selected
      filledCount += 1; // income always selected

      // Count checked checkboxes
      var checks = document.querySelectorAll("#f input[type=checkbox]:checked");
      filledCount += checks.length;

      // Count date if filled
      if ($("dob").value) filledCount += 1;

      var total = totalFields + document.querySelectorAll("#f input[type=checkbox]").length + 1;
      var pct = Math.min(100, Math.round((filledCount / total) * 100));
      bar.style.width = pct + "%";
    }

    allInputs.forEach(function (inp) {
      inp.addEventListener("change", updateProgress);
    });
    updateProgress();
  })();

  // ═══════════════════════════════════════════
  //  4. CONDITIONAL SECTIONS (animated)
  // ═══════════════════════════════════════════
  var pairs = [
    ["s_house", "c_house"],
    ["s_cg", "c_cg"],
    ["s_agri", "c_agri"],
    ["s_presum", "c_presum"]
  ];

  pairs.forEach(function (p) {
    var cb = $(p[0]);
    var block = $(p[1]);
    if (cb && block) {
      cb.addEventListener("change", function () {
        if (this.checked) {
          block.classList.add("show");
          block.style.maxHeight = block.scrollHeight + 40 + "px";
        } else {
          block.style.maxHeight = "0px";
          // Delay class removal for smooth close
          setTimeout(function () { block.classList.remove("show"); }, 300);
        }
      });
    }
  });

  // ═══════════════════════════════════════════
  //  5. CHIP SELECTION ANIMATION
  // ═══════════════════════════════════════════
  document.querySelectorAll(".chip-label input[type=checkbox]").forEach(function (cb) {
    cb.addEventListener("change", function () {
      var label = this.closest(".chip-label");
      if (this.checked) {
        label.classList.add("animate-pop");
        setTimeout(function () { label.classList.remove("animate-pop"); }, 400);
      }
    });
  });

  // ═══════════════════════════════════════════
  //  6. DOB / RESIDENTIAL SYNC
  // ═══════════════════════════════════════════
  function syncType() {
    var t = $("ttype").value;
    var dobWrap = $("dobWrap");
    var resWrap = $("resWrap");

    if (t === "individual") {
      dobWrap.style.opacity = "1";
      dobWrap.style.pointerEvents = "auto";
    } else {
      dobWrap.style.opacity = "0.3";
      dobWrap.style.pointerEvents = "none";
    }

    if (t === "individual" || t === "huf") {
      resWrap.style.opacity = "1";
      resWrap.style.pointerEvents = "auto";
    } else {
      resWrap.style.opacity = "0.3";
      resWrap.style.pointerEvents = "none";
    }
  }
  $("ttype").addEventListener("change", syncType);
  syncType();

  // ═══════════════════════════════════════════
  //  7. INPUT GATHERING
  // ═══════════════════════════════════════════
  function gatherInputs() {
    var dob = $("dob").value;
    var dobAfter2007 = dob ? (new Date(dob) >= new Date("2007-04-01")) : false;
    var houseCount = $("houseCount").value;
    var d = {
      ttype: $("ttype").value, res: $("res").value, income: $("income").value,
      dobAfter2007: dobAfter2007,
      s_salary: $("s_salary").checked, s_house: $("s_house").checked,
      s_busreg: $("s_busreg").checked, s_presum: $("s_presum").checked,
      s_cg: $("s_cg").checked, s_other: $("s_other").checked,
      s_lottery: $("s_lottery").checked, s_agri: $("s_agri").checked,
      s_partner: $("s_partner").checked, s_crypto: $("s_crypto").checked,
      houseLoss: $("s_house").checked && $("houseLoss").checked,
      x_director: $("x_director").checked, x_unlisted: $("x_unlisted").checked,
      x_foreign: $("x_foreign").checked, x_esop: $("x_esop").checked,
      x_clubbing: $("x_clubbing").checked,
      presumFail: $("s_presum").checked ? $("presumFail").value : "ok"
    };
    d.moreThan2House = d.s_house && houseCount === "3";
    d.houseOK = !(d.moreThan2House || d.houseLoss);
    d.agriBig = d.s_agri && $("agriAmt").value === "gt5000";
    var cgType = d.s_cg ? $("cgType").value : "";
    d.cgSmall = d.s_cg && cgType === "small112a";
    d.heavyCG = (d.s_cg && cgType === "other") || d.s_crypto;
    return d;
  }

  // ═══════════════════════════════════════════
  //  8. VALIDATION
  // ═══════════════════════════════════════════
  function validate(d) {
    var errs = [];
    var anyIncome = d.s_salary || d.s_house || d.s_busreg || d.s_presum || d.s_cg || d.s_other || d.s_lottery || d.s_agri || d.s_partner || d.s_crypto;
    if ((d.ttype === "individual" || d.ttype === "huf") && !anyIncome)
      errs.push("⚠ Please select at least one income source.");
    if (d.s_busreg && d.s_presum)
      errs.push("⚠ 'Business — Regular Books' and 'Presumptive' cannot both be selected. Choose the primary one.");
    return errs;
  }

  // ═══════════════════════════════════════════
  //  9. ITR DECISION ENGINE
  // ═══════════════════════════════════════════
  function FR(code, who, why, cannot, schedules, dueText, switchNote) {
    return { code: code, who: who, why: why, cannot: cannot, schedules: schedules, dueText: dueText, switchNote: switchNote };
  }

  function decideITR(d) {
    // ─── ENTITIES ───
    if (d.ttype === "company")
      return FR("ITR-6", "Company (Pvt Ltd / Public Ltd)",
        ["Tumi ekta Company (non-charitable) — Companies Act-e incorporated entity.",
         "Section 11 exemption claim kora na hole, every company files ITR-6."],
        null,
        ["Schedule BP (Business & Profession)", "Schedule DEP (Depreciation)", "Balance Sheet & P&L", "Tax Audit details (u/s 44AB)", "Schedule AL if applicable"],
        "31 October 2026 (Audit deadline)", "Section 11 exemption claim korle ITR-7 hobe.");

    if (d.ttype === "trust")
      return FR("ITR-7", "Trust / Institution / Society / Sec 8 / Political Party",
        ["Trust, society, political party — exemption claim u/s 11, 12, 139(4A–4D)."],
        null,
        ["Schedule Exemption (11/12)", "Schedule of income application", "Audit report (10B/10BB)", "Registration details (12A/12AB/80G)"],
        "31 October 2026 (Trust timeline)", "Exemption na niye corporate run korle ITR-6.");

    if (d.ttype === "llp" || d.ttype === "aopboi")
      return FR("ITR-5", d.ttype === "llp" ? "LLP" : "AOP / BOI",
        ["Tumi " + (d.ttype === "llp" ? "ekta LLP" : "AOP/BOI") + " — ITR-5 mandatory.",
         "Firms/LLPs/AOPs/BOIs — ITR-1 to 4 ba ITR-6/7 allowed na."],
        null,
        ["Schedule BP", "Partners'/members' details", "Balance Sheet & P&L", "Audit details if turnover crosses limit"],
        "Non-audit: 31 Jul 2026 · Audit: 31 Oct 2026", "LLP ITR-4 use korte pare na — shudhu non-LLP resident firms er jonno.");

    if (d.ttype === "firm") {
      if (d.s_presum && d.res === "ror" && d.income === "under50" && d.presumFail === "ok" && !d.x_foreign && !d.heavyCG && d.houseOK)
        return buildITR4(d, "Non-LLP Resident Firm (Presumptive)");
      return FR("ITR-5", "Partnership Firm (non-LLP)",
        ["Tumi ekta non-LLP firm.", "Presumptive conditions na milleo ITR-5 use korte hobe."],
        null, ["Schedule BP", "Partners' details", "Balance Sheet & P&L"],
        "Non-audit: 31 Jul 2026 · Audit: 31 Oct 2026", "Presumptive conditions meet korle ITR-4-o possible.");
    }

    // ─── INDIVIDUAL / HUF ───
    var isHUF = d.ttype === "huf";
    var notResident = d.res === "rnor" || d.res === "nri";

    var dqs = [];
    if (d.x_director) dqs.push("Company director");
    if (d.x_unlisted) dqs.push("Unlisted equity shares");
    if (notResident) dqs.push("RNOR / NRI status");
    if (d.x_foreign) dqs.push("Foreign income / assets");
    if (d.income !== "under50") dqs.push("Income > ₹50 lakh");
    if (d.heavyCG) dqs.push("Complex capital gains");
    if (d.moreThan2House || d.houseLoss) dqs.push(">2 house property / HP loss carry-forward");
    if (d.agriBig) dqs.push("Agricultural income > ₹5,000");
    if (d.s_lottery) dqs.push("Lottery / horse-race income");
    if (d.x_esop) dqs.push("ESOP deferred tax");
    if (d.x_clubbing) dqs.push("Clubbing / 5A income");

    var hasBusReg = d.s_busreg, hasPartner = d.s_partner, hasPresum = d.s_presum;
    var presumFails = hasPresum && (d.presumFail === "fail" || notResident || d.income !== "under50" || d.x_foreign || d.x_director || d.heavyCG || d.moreThan2House || d.houseLoss || d.agriBig || d.s_lottery || d.x_esop || d.x_clubbing);

    if (hasBusReg || hasPartner || presumFails) {
      var why3 = [];
      if (hasBusReg) why3.push("Regular business/profession income with books of accounts.");
      if (hasPartner) why3.push("Partner in a firm — salary/profit share/interest income.");
      if (presumFails) why3.push("Presumptive income but ITR-4 conditions not met.");
      return FR("ITR-3", isHUF ? "HUF (Business/Profession)" : "Individual (Business/Profession)", why3,
        { form: "ITR-1/2/4", reason: hasBusReg || presumFails ? "business/profession income" : "partnership income" },
        ["Schedule BP", "Balance Sheet & P&L", d.s_cg ? "Schedule CG" : null, d.x_foreign ? "Schedule FA" : null, d.income === "over100" ? "Schedule AL" : null].filter(Boolean),
        "Non-audit: 31 Aug 2026 · Audit: 31 Oct 2026", "Multiple business / foreign assets thakle CA review nao.");
    }

    if (hasPresum) return buildITR4(d, isHUF ? "HUF (Presumptive)" : "Individual (Presumptive)");

    var itr1Blocks = [];
    if (isHUF) itr1Blocks.push("HUF cannot file ITR-1");
    if (d.res !== "ror") itr1Blocks.push("Must be Resident (ROR) for ITR-1");
    if (d.dobAfter2007) itr1Blocks.push("Born on/after 1 Apr 2007");
    itr1Blocks = itr1Blocks.concat(dqs);

    if (itr1Blocks.length === 0)
      return FR("ITR-1 (Sahaj)", "Resident Individual — Simple Income",
        ["Resident (ROR), income < ₹50L, simple sources only.", "Salary/Pension" + (d.s_house ? " + House Property (≤2)" : "") + (d.s_other ? " + Other Sources" : "") + (d.cgSmall ? " + Minor LTCG u/s 112A" : "") + ".", "No disqualifiers — shortest, simplest form."],
        null,
        ["Salary details (Form 16)", "House property (if any)", "Deductions 80C–80U", "Bank accounts"],
        "31 July 2026", d.cgSmall ? "LTCG > ₹1.25L ba capital loss → ITR-2." : "Capital gains / foreign asset / director → ITR-2.");

    return FR("ITR-2", isHUF ? "HUF (No Business Income)" : "Individual (Complex, No Business)",
      ["No business income, but ITR-1 not eligible.", "Reason: " + itr1Blocks.join("; ") + "."],
      { form: "ITR-1 (Sahaj)", reason: itr1Blocks[0] },
      ["Schedule S (Salary)", d.s_house ? "Schedule HP" : null, d.s_cg ? "Schedule CG" : null, d.x_foreign ? "Schedule FA" : null, d.s_crypto ? "Schedule VDA" : null, d.income === "over100" ? "Schedule AL" : null].filter(Boolean),
      "31 July 2026", "Business/profession income ele ITR-3 lagbe.");
  }

  function buildITR4(d, who) {
    return FR("ITR-4 (Sugam)", who,
      ["Resident (ROR), income < ₹50L, presumptive scheme (44AD/44ADA/44AE).", "No complex disqualifiers — simplified scheme."],
      { form: "ITR-1", reason: "presumptive business income" },
      ["Schedule BP (Presumptive 44AD/ADA/AE)", "Gross receipts / Turnover", "Financial particulars", "Bank accounts"],
      "31 July 2026", "Income > ₹50L / regular books / director / foreign assets → ITR-3.");
  }

  // ═══════════════════════════════════════════
  // 10. CONFETTI CELEBRATION SYSTEM
  // ═══════════════════════════════════════════
  function launchConfetti() {
    var box = $("confettiBox");
    box.innerHTML = "";
    var colors = ["#0d9b6e", "#d4a233", "#065f44", "#e8d5a0", "#ffffff", "#2dd4a8", "#f59e0b"];
    var shapes = ["square", "rect", "circle"];
    
    for (var i = 0; i < 80; i++) {
      var piece = document.createElement("div");
      piece.className = "confetti-piece";
      var color = colors[Math.floor(Math.random() * colors.length)];
      var shape = shapes[Math.floor(Math.random() * shapes.length)];
      var size = Math.random() * 8 + 5;
      
      piece.style.background = color;
      piece.style.left = Math.random() * 100 + "%";
      piece.style.width = shape === "rect" ? size * 2.5 + "px" : size + "px";
      piece.style.height = size + "px";
      if (shape === "circle") piece.style.borderRadius = "50%";
      else piece.style.borderRadius = "2px";
      
      piece.style.animationDuration = (Math.random() * 2 + 2) + "s";
      piece.style.animationDelay = (Math.random() * 0.8) + "s";
      
      box.appendChild(piece);
    }

    setTimeout(function () { box.innerHTML = ""; }, 4500);
  }

  // ═══════════════════════════════════════════
  // 11. LOADING SEQUENCE
  // ═══════════════════════════════════════════
  function runLoading(callback) {
    var resultBox = $("result");
    var btn = $("submitBtn");
    btn.classList.add("loading");

    var messages = [
      "Checking taxpayer entity type...",
      "Analyzing residential status...",
      "Evaluating income source parameters...",
      "Applying presumptive scheme rules...",
      "Matching form eligibility criteria...",
      "Generating recommendation..."
    ];

    resultBox.innerHTML =
      '<div class="loading-state">' +
        '<div class="ledger-loader">' +
          '<div class="ledger-circle"></div>' +
          '<div class="ledger-icon">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
              '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />' +
            '</svg>' +
          '</div>' +
        '</div>' +
        '<h3>Processing Tax Rules</h3>' +
        '<div class="loading-steps" id="loadSteps"></div>' +
        '<div class="loading-dots"><span></span><span></span><span></span></div>' +
      '</div>';

    resultBox.scrollIntoView({ behavior: "smooth", block: "start" });

    var stepContainer = $("loadSteps");
    var idx = 0;
    
    function showStep() {
      if (idx < messages.length) {
        stepContainer.innerHTML = '<div class="loading-step-text">' + messages[idx] + '</div>';
        idx++;
      }
    }
    showStep();
    var interval = setInterval(showStep, 220);

    setTimeout(function () {
      clearInterval(interval);
      btn.classList.remove("loading");
      callback();
    }, 1400);
  }

  // ═══════════════════════════════════════════
  // 12. RENDER VERDICT
  // ═══════════════════════════════════════════
  function renderVerdict(r) {
    var short = r.code.split(" ")[0];
    var num = short.replace("ITR-", "");

    var cannotHtml = "";
    if (r.cannot) {
      cannotHtml =
        '<div class="vsec cannot">' +
          '<h4>⛔ Cannot file as</h4>' +
          '<ul><li><b>' + r.cannot.form + '</b> — ' + r.cannot.reason + '.</li></ul>' +
        '</div>';
    }

    var html =
      '<div class="verdict">' +
        '<div class="verdict-top">' +
          '<div class="vt">' +
            '<small>✓ Recommended Form</small>' +
            '<h3>' + r.code + '</h3>' +
            '<p>' + r.who + '</p>' +
          '</div>' +
          '<div class="stamp-wrapper">' +
            '<div class="stamp">' +
              '<span>FILE</span><b>' + num + '</b><span>FORM</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="vbody">' +
          '<div class="vsec"><h4>Why This Form</h4><ul>' + r.why.map(function (w) { return '<li>' + w + '</li>'; }).join("") + '</ul></div>' +
          cannotHtml +
          '<div class="vsec"><h4>Required Schedules & Info</h4><ul>' + r.schedules.map(function (s) { return '<li>' + s + '</li>'; }).join("") + '</ul></div>' +
          '<div class="vsec"><h4>Filing Due Date — AY 2026-27</h4><span class="duedate">' + r.dueText + '</span></div>' +
          '<div class="vsec"><h4>Portal Steps</h4><p class="portal-guide">incometax.gov.in → Login → <b>"Income Tax Act 1961"</b> tab (Tab 1) → <code>e-File</code> → <code>Income Tax Return</code> → Select <b>' + short + '</b></p></div>' +
          '<div class="vsec"><h4>Switch Warning</h4><div class="switch-card"><b>⚡ Alert:</b> ' + r.switchNote + '</div></div>' +
          '<p class="disclaimer">Disclaimer: Educational tool by Finative Solutions for AY 2026-27 (FY 2025-26). Foreign assets, ESOP, trust, and audit cases require CA verification. Incorrect form → defective return.</p>' +
        '</div>' +
      '</div>';

    $("result").innerHTML = html;
    $("result").scrollIntoView({ behavior: "smooth", block: "start" });

    // 🎉 Launch confetti on successful result
    launchConfetti();
  }

  // ═══════════════════════════════════════════
  // 13. FORM SUBMIT HANDLER
  // ═══════════════════════════════════════════
  $("f").addEventListener("submit", function (e) {
    e.preventDefault();
    var data = gatherInputs();
    var errs = validate(data);
    var errBox = $("err");

    if (errs.length) {
      errBox.innerHTML = errs.join("<br>");
      errBox.classList.add("show");
      errBox.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    errBox.classList.remove("show");

    runLoading(function () {
      renderVerdict(decideITR(data));
    });
  });

  // ═══════════════════════════════════════════
  // 14. RESET HANDLER
  // ═══════════════════════════════════════════
  $("resetBtn").addEventListener("click", function () {
    $("f").reset();
    pairs.forEach(function (p) {
      var block = $(p[1]);
      if (block) {
        block.style.maxHeight = "0px";
        block.classList.remove("show");
      }
    });
    $("err").classList.remove("show");
    $("progressBar").style.width = "0%";

    $("result").innerHTML =
      '<div class="empty-state">' +
        '<div class="empty-icon-wrap">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.2">' +
            '<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />' +
          '</svg>' +
          '<div class="empty-pulse"></div>' +
        '</div>' +
        '<h3>Awaiting Your Inputs</h3>' +
        '<p>Fill out the diagnostic form on the left — your personalized ITR recommendation will appear here instantly.</p>' +
        '<div class="empty-steps"><span>① Fill details</span><span>→</span><span>② Click diagnose</span><span>→</span><span>③ Get ITR form</span></div>' +
      '</div>';

    syncType();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

})();
