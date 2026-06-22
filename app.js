(function () {
  "use strict";

  // Quick helper selector
  var $ = function (id) { return document.getElementById(id); };

  // Setup conditional form sections
  var pairs = [
    ["s_house", "c_house"],
    ["s_cg", "c_cg"],
    ["s_agri", "c_agri"],
    ["s_presum", "c_presum"]
  ];

  pairs.forEach(function (p) {
    var checkbox = $(p[0]);
    var block = $(p[1]);
    if (checkbox && block) {
      checkbox.addEventListener("change", function () {
        if (this.checked) {
          block.classList.add("show");
          // Smooth height setting (using scrollHeight)
          block.style.maxHeight = block.scrollHeight + "px";
        } else {
          block.style.maxHeight = "0px";
          block.classList.remove("show");
        }
      });
    }
  });

  // DOB & Residential status visibility depending on taxpayer type
  function syncType() {
    var t = $("ttype").value;
    var dobWrap = $("dobWrap");
    var resWrap = $("resWrap");
    
    if (t === "individual") {
      dobWrap.style.opacity = "1";
      dobWrap.style.pointerEvents = "auto";
    } else {
      dobWrap.style.opacity = "0.35";
      dobWrap.style.pointerEvents = "none";
    }

    if (t === "individual" || t === "huf") {
      resWrap.style.opacity = "1";
      resWrap.style.pointerEvents = "auto";
    } else {
      resWrap.style.opacity = "0.35";
      resWrap.style.pointerEvents = "none";
    }
  }

  $("ttype").addEventListener("change", syncType);
  syncType();

  // Gather inputs and normalize
  function gatherInputs() {
    var dob = $("dob").value;
    var dobAfter2007 = false;
    if (dob) {
      // If born on or after 1st April 2007
      dobAfter2007 = (new Date(dob) >= new Date("2007-04-01"));
    }
    var houseCount = $("houseCount").value;
    var presumFail = $("s_presum").checked ? $("presumFail").value : "ok";
    var agriAmt = $("s_agri").checked ? $("agriAmt").value : "le5000";
    var cgType = $("s_cg").checked ? $("cgType").value : "small112a";

    var d = {
      ttype: $("ttype").value,
      res: $("res").value,
      income: $("income").value,
      dobAfter2007: dobAfter2007,
      s_salary: $("s_salary").checked,
      s_house: $("s_house").checked,
      s_busreg: $("s_busreg").checked,
      s_presum: $("s_presum").checked,
      s_cg: $("s_cg").checked,
      s_other: $("s_other").checked,
      s_lottery: $("s_lottery").checked,
      s_agri: $("s_agri").checked,
      s_partner: $("s_partner").checked,
      s_crypto: $("s_crypto").checked,
      
      houseLoss: $("s_house").checked && $("houseLoss").checked,
      x_director: $("x_director").checked,
      x_unlisted: $("x_unlisted").checked,
      x_foreign: $("x_foreign").checked,
      x_esop: $("x_esop").checked,
      x_clubbing: $("x_clubbing").checked,
      presumFail: presumFail
    };

    d.moreThan2House = d.s_house && houseCount === "3";
    d.houseOK = !(d.moreThan2House || d.houseLoss);
    d.agriBig = d.s_agri && agriAmt === "gt5000";
    d.cgSmall = d.s_cg && cgType === "small112a";
    
    // heavy capital gains (other CG types or crypto holding)
    d.heavyCG = (d.s_cg && cgType === "other") || d.s_crypto;
    
    return d;
  }

  // Validate form entries
  function validate(d) {
    var errs = [];
    var anyIncome = d.s_salary || d.s_house || d.s_busreg || d.s_presum || d.s_cg || d.s_other || d.s_lottery || d.s_agri || d.s_partner || d.s_crypto;
    
    if ((d.ttype === "individual" || d.ttype === "huf") && !anyIncome) {
      errs.push("Kono income source select kora hoyni. Ekta holeo select koro (Select at least one income source).");
    }
    
    if (d.s_busreg && d.s_presum) {
      errs.push("Regular business books (Business - regular books) ebong Presumptive business ekshathe selected. Primary jeta, sheta select koro.");
    }
    
    return errs;
  }

  // Engine decision builder
  function formResult(code, who, why, cannot, schedules, dueText, switchNote) {
    return {
      code: code,
      who: who,
      why: why,
      cannot: cannot,
      schedules: schedules,
      dueText: dueText,
      switchNote: switchNote
    };
  }

  // Form decision matrix (mirrors tax criteria)
  function decideITR(d) {
    // ---------------- ENTITIES FIRST ----------------
    if (d.ttype === "company") {
      return formResult(
        "ITR-6",
        "Company (Pvt Ltd / Public Ltd)",
        [
          "Tumi ekta Company (other than charitable/trust claim).",
          "Companies (je gulo section 11 exemption claim kore na) ITR-6-ei return file kore."
        ],
        null,
        ["Schedule BP (Business & Profession)", "Schedule DEP (Depreciation)", "Balance Sheet & Profit & Loss", "Tax Audit Report u/s 44AB details", "Schedule AL-1 / AL-2 if applicable"],
        "31 October 2026 (Audit deadline type)",
        "Section 11 deduction claim korle ITR-7 hobe, normal company file corporate return in ITR-6."
      );
    }

    if (d.ttype === "trust") {
      return formResult(
        "ITR-7",
        "Trust / Institution / Society / Sec 8 / Political Party",
        [
          "Trusts, societies, political parties, and section 8 companies exemption claim korche under sections 11, 12, 139(4A), 139(4B), 139(4C), or 139(4D)."
        ],
        null,
        ["Schedule of Trust Exemption (11/12)", "Schedule of application of income", "Audit report details (Form 10B/10BB)", "Registration certificate details (12A/12AB/80G)"],
        "31 October 2026 (Trust filing timeline)",
        "Jodi kono exemption na niye normal corporate structure-e run korche, tahole ITR-6 hobe."
      );
    }

    if (d.ttype === "llp" || d.ttype === "aopboi") {
      var isLLP = (d.ttype === "llp");
      return formResult(
        "ITR-5",
        isLLP ? "Limited Liability Partnership (LLP)" : "AOP / BOI",
        [
          "Tumi " + (isLLP ? "ekta LLP" : "Association of Persons / Body of Individuals") + ".",
          "Firms/LLPs/AOPs/BOIs are not allowed to file simple ITR-1 to 4 or ITR-6/7 (unless charitable), so ITR-5 applies."
        ],
        null,
        ["Schedule BP", "Partners' or Members' details", "Balance Sheet & P&L", "Audit report details if turnover crosses threshold"],
        "Non-audit: 31 July 2026. Audit cases: 31 October 2026.",
        "LLP has to file ITR-5. They cannot use ITR-4 (Sugam) presumptive scheme, which is only for non-LLP resident firms."
      );
    }

    if (d.ttype === "firm") {
      // non-LLP Partnership Firm
      // check if it meets presumptive / residency / threshold criteria for ITR-4
      if (d.s_presum && d.res === "ror" && d.income === "under50" && d.presumFail === "ok" && !d.x_foreign && !d.heavyCG && d.houseOK) {
        return buildITR4(d, "Non-LLP Partnership Firm (Presumptive Scheme)");
      }
      return formResult(
        "ITR-5",
        "Partnership Firm (non-LLP)",
        [
          "Tumi ekta non-LLP partnership firm.",
          "Presumptive, resident, ar minor condition sob clear thakle ITR-4 (Sugam) hotam, kintu details meet na hole standard ITR-5 use korte hobe."
        ],
        null,
        ["Schedule BP", "Partnership details & sharing ratio", "Balance Sheet & P&L"],
        "Non-audit: 31 July 2026. Audit cases: 31 October 2026.",
        "Sob condition meet korle presumptive firm ITR-4-eo file korte pare."
      );
    }

    // ---------------- INDIVIDUALS / HUF ----------------
    var isHUF = (d.ttype === "huf");
    var notResident = (d.res === "rnor" || d.res === "nri");

    // Gather disqualifiers for simple forms (ITR-1 and ITR-4)
    var dqs = [];
    if (d.x_director) dqs.push("Year-e kono company-te Director thakle");
    if (d.x_unlisted) dqs.push("Unlisted equity shares hold korle");
    if (notResident) dqs.push("Residential status RNOR ba NRI hole");
    if (d.x_foreign) dqs.push("Foreign income, assets ba signing authority thakle");
    if (d.income !== "under50") dqs.push("Total income ₹50 lakh er upore hole");
    if (d.heavyCG) dqs.push("Capital gains (except minor LTCG section 112A) thakle");
    if (d.moreThan2House || d.houseLoss) dqs.push("2 tir beshi house property ba carry-forward HP loss thakle");
    if (d.agriBig) dqs.push("Agricultural income ₹5,000 er beshi hole");
    if (d.s_lottery) dqs.push("Lottery, horse race, ba card games er income thakle");
    if (d.x_esop) dqs.push("Startup ESOP tax deferment details thakle");
    if (d.x_clubbing) dqs.push("Clubbing of income (e.g. minor child income) ba alternative TDS claim thakle");

    var hasBusReg = d.s_busreg;
    var hasPartner = d.s_partner;
    var hasPresum = d.s_presum;

    // Standard ITR-3 Triggers: regular business books, partner in firm, or presumptive failing conditions
    var presumFails = hasPresum && (d.presumFail === "fail" || notResident || d.income !== "under50" || d.x_foreign || d.x_director || d.heavyCG || d.moreThan2House || d.houseLoss || d.agriBig || d.s_lottery || d.x_esop || d.x_clubbing);

    if (hasBusReg || hasPartner || presumFails) {
      var why3 = [];
      if (hasBusReg) why3.push("Business ba profession regular books (regular accounts) maintain korcho.");
      if (hasPartner) why3.push("Firms/LLPs er active partner — salary, profit share ba interest pao.");
      if (presumFails) why3.push("Presumptive business income ache kintu simple form (ITR-4) er boundary limit periye gecho (e.g. high income, director status, foreign assets).");
      
      return formResult(
        "ITR-3",
        isHUF ? "HUF (with Business / Profession Income)" : "Individual (with Business / Profession Income)",
        why3,
        {
          form: "ITR-1/2/4",
          reason: (hasBusReg || presumFails) ? "regular/complex business income simple forms-e allowed noy" : "partnership firm-partner remuneration details regular form (ITR-3)-ei allowed"
        },
        [
          "Schedule BP (Business & Profession details)",
          "Balance Sheet & P&L statement (audited or no-account category)",
          d.s_cg ? "Schedule CG (Capital Gains)" : null,
          d.x_foreign ? "Schedule FA (Foreign Assets details)" : null,
          (d.income === "over100") ? "Schedule AL (Assets & Liabilities if income > 1cr)" : null,
          "Schedule for partner salary, share of profit details"
        ].filter(Boolean),
        "Non-audit: 31 August 2026. Audit cases: 31 October 2026.",
        "Multiple businesses ba foreign assets thakle professional assistance review kore file kora safe."
      );
    }

    // If presumptive, and passes all basic checks, go to ITR-4
    if (hasPresum) {
      return buildITR4(d, isHUF ? "HUF (Presumptive Scheme)" : "Individual (Presumptive Scheme)");
    }

    // Strict ITR-1 checks
    var bornTooLate = d.dobAfter2007;
    var itr1Blocks = [];
    if (isHUF) itr1Blocks.push("HUF values simple ITR-1 file korte pare na");
    if (d.res !== "ror") itr1Blocks.push("ITR-1 only Resident Ordinary Resident (ROR) er jonno");
    if (bornTooLate) itr1Blocks.push("1 April 2007 er por jonmo (minor child criteria)");
    itr1Blocks = itr1Blocks.concat(dqs);

    if (itr1Blocks.length === 0) {
      return formResult(
        "ITR-1 (Sahaj)",
        "Resident Individual (Simple Income)",
        [
          "Resident Ordinary Resident (ROR) individual, income ₹50 lakh er niche.",
          "Simple sources: Salary/Pension" + (d.s_house ? ", 1 ti House Property" : "") + (d.s_other ? ", details of interest/dividend" : "") + (d.cgSmall ? ", capital gains ₹1.25L/112A u/s range u/s 112A u/s u/s" : "") + ".",
          "Kono complex exceptions (Foreign asset, Director, ESOP) nei — eta shobcheye short code-er return form."
        ],
        null,
        ["Salary Info (Form 16 mapping)", "Single House Property address & income", "Schedule 80C to 80U deductions", "Bank accounts schedule"],
        "31 July 2026 (Non-audit timeline)",
        "LTCG u/s 112A ₹1.25L cross korle ba carry forward capital loss layout tracking active korle ITR-2 e upgrade korte hobe."
      );
    }

    // Standard ITR-2 (Individual / HUF with complex income but no business)
    return formResult(
      "ITR-2",
      isHUF ? "HUF (No Business Income)" : "Individual (Complex Income, No Business)",
      [
        "Regular business or presumptive details nei, kintu simple ITR-1 er boundary cross korecho.",
        "Karon: " + itr1Blocks.join("; ") + "."
      ],
      {
        form: "ITR-1 (Sahaj)",
        reason: itr1Blocks[0]
      },
      [
        "Schedule S (Salary / Pension details)",
        d.s_house ? "Schedule HP (House Property detail, 1 tir beshi)" : null,
        d.s_cg ? "Schedule CG (Capital Gains calculations)" : null,
        d.x_foreign ? "Schedule FA (Foreign Assets & income disclosure)" : null,
        d.s_crypto ? "Schedule VDA (Virtual Digital Assets / Crypto details)" : null,
        (d.income === "over100") ? "Schedule AL (Asset disclosure u/s 1cr limit)" : null
      ].filter(Boolean),
      "31 July 2026 (Non-audit timeline)",
      "Pore jodi freelance, business, ba professional practice income active hoy, automatically ITR-3 card active hobe."
    );
  }

  // Builder for ITR-4 (Sugam)
  function buildITR4(d, who) {
    return formResult(
      "ITR-4 (Sugam)",
      who,
      [
        "Resident Ordinary Resident, income ₹50 lakh er niche, presumptive scheme (44AD / 44ADA / 44AE) select korecho.",
        "Business regular books of accounts details maintenance-er dorkar nei, simple limits.",
        "Boro details ba disqualifiers (Foreign assets, unlisted equity, director post) nei."
      ],
      {
        form: "ITR-1",
        reason: "presumptive business details simple ITR-1 e allowed noy"
      },
      [
        "Schedule BP (Presumptive business/profession 44AD/44ADA/44AE)",
        "Gross receipts / Turnover statement",
        "Financial particulars of business (Cash balance, Debtors, Creditors, Stock)",
        "Bank account listings"
      ],
      "31 July 2026 (Non-audit timeline)",
      "Income limit ₹50 lakh cross korle, regular account maintain korle, or director/foreign assets thakle, ITR-3 file korte hobe."
    );
  }

  // Create loading sequence
  function runCalculationLoading(callback) {
    var resultContainer = $("result");
    
    // Ledger-themed loading UI
    var loaderHtml = 
      '<div class="loading-state">' +
        '<div class="ledger-loader">' +
          '<div class="ledger-circle"></div>' +
          '<div class="ledger-icon">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">' +
              '<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />' +
            '</svg>' +
          '</div>' +
        '</div>' +
        '<h3>Processing Tax Rules</h3>' +
        '<div class="loading-steps" id="loadSteps">' +
          '<div class="loading-step-text">Checking taxpayer entity...</div>' +
        '</div>' +
      '</div>';
      
    resultContainer.innerHTML = loaderHtml;
    resultContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    
    var stepText = $("loadSteps");
    var messages = [
      "Analyzing residency structure...",
      "Evaluating income source parameters...",
      "Matching audit criteria..."
    ];
    
    // Cycle text animations
    var currentMsgIndex = 0;
    var messageInterval = setInterval(function () {
      if (currentMsgIndex < messages.length) {
        stepText.innerHTML = '<div class="loading-step-text" style="animation-delay: 0s;">' + messages[currentMsgIndex] + '</div>';
        currentMsgIndex++;
      }
    }, 200);

    setTimeout(function () {
      clearInterval(messageInterval);
      callback();
    }, 850);
  }

  // Render Verdict
  function renderVerdict(r) {
    var shortCode = r.code.split(" ")[0]; // Get ITR-X
    var formNumberSymbol = shortCode.replace("ITR-", "");
    
    var cannotHtml = "";
    if (r.cannot) {
      cannotHtml = 
        '<div class="vsec cannot">' +
          '<h4>Ja file kora jabe na</h4>' +
          '<ul>' +
            '<li><b>' + r.cannot.form + '</b> noy — karon ' + r.cannot.reason + '.</li>' +
          '</ul>' +
        '</div>';
    }

    var whyItems = r.why.map(function(item) { return '<li>' + item + '</li>'; }).join("");
    var scheduleItems = r.schedules.map(function(item) { return '<li>' + item + '</li>'; }).join("");

    var html = 
      '<div class="verdict">' +
        '<div class="verdict-top">' +
          '<div class="vt">' +
            '<small>Recommended return form</small>' +
            '<h3>' + r.code + '</h3>' +
            '<p>' + r.who + '</p>' +
          '</div>' +
          '<div class="stamp-wrapper">' +
            '<div class="stamp">' +
              '<span>FILE</span>' +
              '<b>' + formNumberSymbol + '</b>' +
              '<span>FORM</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="vbody">' +
          '<div class="vsec">' +
            '<h4>Keno / Why this form</h4>' +
            '<ul>' + whyItems + '</ul>' +
          '</div>' +
          cannotHtml +
          '<div class="vsec">' +
            '<h4>Schedules & Information needed</h4>' +
            '<ul>' + scheduleItems + '</ul>' +
          '</div>' +
          '<div class="vsec">' +
            '<h4>Filing Due Date</h4>' +
            '<span class="duedate">' + r.dueText + '</span>' +
          '</div>' +
          '<div class="vsec">' +
            '<h4>Portal-e e-filing steps</h4>' +
            '<p class="portal-guide">' +
              'incometax.gov.in e login koro &rarr; <b>"Income Tax Act 1961" tab</b> (Tab 1, AY 2026-27 er jonno — Tab 2 "Income Tax Act 2025" noy) &rarr; <code>e-File</code> &rarr; <code>Income Tax Return</code> &rarr; <b>' + r.code.split(" ")[0] + '</b> form drop-down select koro.' +
            '</p>' +
          '</div>' +
          '<div class="vsec">' +
            '<h4>Rule Switch Warnings</h4>' +
            '<div class="switch-card">' +
              '<b>Switch alert:</b> ' + r.switchNote +
            '</div>' +
          '</div>' +
          '<p class="disclaimer">' +
            'Disclaimer: Eta ekta educational helper tool created by Finative Solutions. Tax rules configurations are based on AY 2026-27 (FY 2025-26) details. Foreign assets, startup ESOPs, trust portfolios, and audit criteria require detailed verification by an active Chartered Accountant (CA) or certified practitioner.' +
          '</p>' +
        '</div>' +
      '</div>';

    var box = $("result");
    box.innerHTML = html;
    box.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Handle submit trigger
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
    
    // Run ledger diagnostic loading transition
    runCalculationLoading(function () {
      var verdict = decideITR(data);
      renderVerdict(verdict);
    });
  });

  // Handle Form reset trigger
  $("resetBtn").addEventListener("click", function () {
    $("f").reset();
    
    // Collapse all conditional blocks
    pairs.forEach(function (p) {
      var block = $(p[1]);
      if (block) {
        block.classList.remove("show");
        block.style.maxHeight = "0px";
      }
    });
    
    $("err").classList.remove("show");
    
    // Restore default empty state illustration in results pane
    $("result").innerHTML = 
      '<div class="empty-state">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">' +
          '<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />' +
        '</svg>' +
        '<h3>Awaiting Inputs</h3>' +
        '<p>Tomar details left side-er card layout-e select koro, recommended return report ekhane active hobe.</p>' +
      '</div>';
      
    syncType();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

})();
