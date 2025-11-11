/* reveal up animation upon scrolling*/
document.addEventListener("DOMContentLoaded", () => {
  const reveals = document.querySelectorAll(".reveal-up");

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  reveals.forEach(el => observer.observe(el));
});

const xValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/* Chart Setup */
document.addEventListener("DOMContentLoaded", () => {
  const chartElement = document.getElementById("investChart");
  if (!chartElement) {
    return;
  }

  let chartDrawn = false;
  const xValues = Array.from({ length: 10 }, (_, i) => `Year ${i + 1}`);
  const savingsData = [120000, 240000, 360000, 480000, 600000, 720000, 840000, 960000, 1080000, 1200000];
  const investData = [125753, 265330, 418406, 590981, 789301, 1020938, 1294837, 1621474, 2013082, 2483973];

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !chartDrawn) {
          chartDrawn = true;

          const chart = new Chart(chartElement, {
            type: "line",
            data: {
              labels: xValues,
              datasets: [
                {
                  label: "Savings (₦)",
                  data: savingsData,
                  borderColor: "#00BFFF",
                  backgroundColor: "rgba(0,191,255,0.15)",
                  fill: true,
                  pointRadius: 4,
                  pointBackgroundColor: "#00BFFF",
                  tension: 0.4,
                },
                {
                  label: "Investments (₦)",
                  data: investData,
                  borderColor: "#3FB984",
                  backgroundColor: "rgba(63,185,132,0.15)",
                  fill: true,
                  pointRadius: 4,
                  pointBackgroundColor: "#3FB984",
                  tension: 0.4,
                },
              ],
            },
            options: {
              responsive: true,
              animation: {
                duration: 1800,
                easing: "easeOutQuart",

                onProgress: (animation) => {
                  const chartArea = chart.chartArea;
                  if (!chartArea) return;
                  const progress = animation.currentStep / animation.numSteps;
                  chart.data.datasets.forEach((dataset, i) => {
                    dataset.borderWidth = 2 + progress * 1.5;
                  });
                },
              },
              plugins: {
                legend: {
                  labels: {
                    color: "#fff",
                    font: { size: 14 },
                  },
                },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const label = context.dataset.label || "";
                      return `${label}: ₦${context.parsed.y.toLocaleString()}`;
                    },
                  },
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    color: "#bbb",
                    callback: (value) => `₦${value.toLocaleString()}`,
                  },
                  grid: { color: "rgba(255,255,255,0.05)" },
                },
                x: {
                  ticks: { color: "#bbb" },
                  grid: { color: "rgba(255,255,255,0.05)" },
                },
              },
            },
            plugins: [
              {
                // Smooth path growth effect
                id: "lineGrow",
                beforeDraw: (chart, args, options) => {
                  const ctx = chart.ctx;
                  ctx.save();
                  ctx.globalAlpha = options.alpha ?? 1;
                  ctx.restore();
                },
              },
            ],
          });


          chart.data.datasets.forEach(ds => (ds.data = Array(ds.data.length).fill(0)));
          chart.update();

          setTimeout(() => {
            chart.data.datasets[0].data = savingsData;
            chart.data.datasets[1].data = investData;
            chart.update({
              duration: 2500,
              easing: "easeOutQuart",
            });
          }, 300);

          observer.unobserve(chartElement);
        }
      });
    },
    { threshold: 0.5 }
  );

  observer.observe(chartElement);
});


/*Savings Calculator function*/
(function () {
  // format number with currency
  function formatMoney(value, symbol = "$", locale = "en-US") {
    try {
      return new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 2 })
        .format(value).replace("$", symbol);
    } catch (e) {
      return symbol + Number(value).toFixed(2);
    }
  }

  // Animated counter
  function animateNumber(el, start, end, duration = 900, formatFn) {
    const startTime = performance.now();
    const range = end - start;
    const step = (ts) => {
      const elapsed = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - elapsed, 3); // easeOutCubic-ish
      const current = start + range * eased;
      el.textContent = formatFn(current);
      if (elapsed < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // Calculation: monthly compounding with monthly contributions at end of month
  // P = starting principal
  // PMT = monthly contribution
  // r = annual rate
  // n = months
  function futureValue(P, PMT, r, n) {
    if (n <= 0) return P;
    const mrate = r / 12; // monthly rate
    // to avoid division by zero
    if (mrate === 0) {
      return P + PMT * n;
    }
    const factor = Math.pow(1 + mrate, n);
    // FV = P*factor + PMT * ((factor - 1) / mrate)
    return P * factor + PMT * ((factor - 1) / mrate);
  }

  function addCommas(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  const amountInputs = document.querySelectorAll('input[type="text"]');
  amountInputs.forEach(input => {
    if (input.id === "debtName") return;
    input.addEventListener("input", (e) => {
      const rawValue = e.target.value.replace(/,/g, "");
      if (!isNaN(rawValue) && rawValue !== "") {
        e.target.value = Number(rawValue).toLocaleString("en-NG");
      } else {
        e.target.value = "";
      }
    });
  });


  // DOM helpers & init
  function initCalculator() {
    const startingEl = document.getElementById("starting");
    const monthlyEl = document.getElementById("monthly");
    const periodEl = document.getElementById("period");
    const periodUnitEl = document.getElementById("periodUnit");
    const rateEl = document.getElementById("rate");
    const calculateBtn = document.getElementById("calculateBtn");

    const resultAmountEl = document.querySelector(".result-amount");
    const contribAmountEl = document.querySelector(".contrib-amount");
    const interestAmountEl = document.querySelector(".interest-amount");

    // currency buttons
    const currencyBtns = document.querySelectorAll(".currency-btn");
    let currencySymbol = "$";
    currencyBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        currencyBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currencySymbol = btn.dataset.symbol || "$";
      });
    });

    // calculate on button click
    calculateBtn.addEventListener("click", () => {
      // parse values safely
      const P = Math.max(0, parseFloat(startingEl.value.replace(/,/g, "")) || 0);
      const PMT = Math.max(0, parseFloat(monthlyEl.value.replace(/,/g, "")) || 0);
      const periodNum = Math.max(0, parseFloat(periodEl.value.replace(/,/g, "")) || 0);
      const unit = periodUnitEl.value || "years";
      const ratePercent = Math.max(0, parseFloat(rateEl.value.replace(/,/g, "")) || 0);
      const annualRate = ratePercent / 100;

      const months = unit === "years" ? Math.round(periodNum * 12) : Math.round(periodNum);

      // compute future value
      const fv = futureValue(P, PMT, annualRate, months);

      // compute totals
      const totalContributed = P + PMT * months;
      const totalInterest = Math.max(0, fv - totalContributed);

      // animate numbers
      const formatFn = (num) => {
        let locale = "en-US";
        if (currencySymbol === "₦") locale = "en-NG";
        if (currencySymbol === "€") locale = "de-DE";
        if (currencySymbol === "£") locale = "en-GB";
        return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(num).replace(/^/, currencySymbol);
      };

      // animate from current displayed to new values
      const currentDisplayed = parseFloat(resultAmountEl.dataset.current || 0);
      animateNumber(resultAmountEl, currentDisplayed, fv, 900, (n) => formatFn(n));
      animateNumber(contribAmountEl, parseFloat(contribAmountEl.dataset.current || 0), totalContributed, 700, (n) => formatFn(n));
      animateNumber(interestAmountEl, parseFloat(interestAmountEl.dataset.current || 0), totalInterest, 700, (n) => formatFn(n));

      // store current values for next animation
      resultAmountEl.dataset.current = fv;
      contribAmountEl.dataset.current = totalContributed;
      interestAmountEl.dataset.current = totalInterest;
    });
  }

  // IntersectionObserver reveal (applies .show on .reveal-up)
  function initReveal() {
    const targets = document.querySelectorAll(".reveal-up");
    if (!targets.length) return;
    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add("show");
          o.unobserve(en.target);
        }
      });
    }, { threshold: 0.18 });
    targets.forEach(t => obs.observe(t));
  }

  // DOM ready
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  // run
  ready(() => {
    try {
      initCalculator();
      initReveal();
      console.log("Savings calculator initialized");
    } catch (err) {
      console.error("Calc init error:", err);
    }
  });
})();



document.addEventListener("DOMContentLoaded", () => {
  const quiz = document.getElementById("quiz");
  if (!quiz) return;


  const quizData = [
    {
      question: "What would you do if your investment dropped 10% in a month?",
      options: [
        { text: "Sell immediately", score: 1 },
        { text: "Wait and see", score: 2 },
        { text: "Buy more while it's cheap", score: 3 }
      ]
    },
    {
      question: "How long do you plan to keep your investments?",
      options: [
        { text: "Less than 1 year", score: 1 },
        { text: "1–5 years", score: 2 },
        { text: "More than 5 years", score: 3 }
      ]
    },
    {
      question: "How would you describe your investing experience?",
      options: [
        { text: "Beginner", score: 1 },
        { text: "Some experience", score: 2 },
        { text: "Very confident", score: 3 }
      ]
    },
    {
      question: "What matters more to you?",
      options: [
        { text: "Stability and safety", score: 1 },
        { text: "A balance of safety and growth", score: 2 },
        { text: "High growth potential", score: 3 }
      ]
    },
    {
      question: "If you got a bonus of ₦500,000, how would you invest it?",
      options: [
        { text: "Fixed deposit or T-bills", score: 1 },
        { text: "Split between stocks and savings", score: 2 },
        { text: "Mostly in stocks or crypto", score: 3 }
      ]
    }
  ];

  let current = 0;
  let totalScore = 0;


  function loadQuestion() {
    if (current < quizData.length) {
      const q = quizData[current];
      quiz.innerHTML = `
        <div class="question">${q.question}</div>
        <div class="options">
          ${q.options
          .map(
            (opt, index) =>
              `<button data-score="${opt.score}" class="option-btn">${opt.text}</button>`
          )
          .join("")}
        </div>
        <div class="progress">Question ${current + 1} of ${quizData.length}</div>
      `;

      document.querySelectorAll(".option-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          nextQuestion(parseInt(btn.dataset.score));
        });
      });
    } else {
      showResult();
    }
  }

  function nextQuestion(score) {
    totalScore += score;
    current++;
    loadQuestion();
  }

  function showResult() {
    let result = "";

    if (totalScore <= 8) {
      result = `
        <h2>Conservative Investor</h2>
        <p>You prefer stability and predictable returns. Low-risk investments like bonds or savings products fit you best.</p>
      `;
    } else if (totalScore <= 11) {
      result = `
        <h2>Balanced Investor</h2>
        <p>You’re open to some risk for better growth. A mix of stocks, mutual funds, and bonds suits your goals.</p>
      `;
    } else {
      result = `
        <h2>Aggressive Investor</h2>
        <p>You’re comfortable with market swings for higher long-term returns. Stocks, ETFs, or crypto might interest you.</p>
      `;
    }

    quiz.innerHTML = `
      <div class="result">
        ${result}
        <button id="restartQuiz" class="btn-restart">Try Again</button>
      </div>
    `;

    document.getElementById("restartQuiz").addEventListener("click", restartQuiz);
  }

  function restartQuiz() {
    current = 0;
    totalScore = 0;
    loadQuestion();
  }

  loadQuestion();
});


document.addEventListener("DOMContentLoaded", function () {
  const toggles = document.querySelectorAll(".toggle-header");

  toggles.forEach(btn => {
    btn.addEventListener("click", function () {
      const card = btn.closest(".budget-card");
      const content = card.querySelector(".toggle-content");
      const expanded = card.getAttribute("aria-expanded") === "true";

      // Set expanded attributes
      card.setAttribute("aria-expanded", !expanded);
      btn.setAttribute("aria-expanded", !expanded);

      // Animate the height
      if (!expanded) {
        content.style.maxHeight = content.scrollHeight + "px";
      } else {
        content.style.maxHeight = "0";
      }

      // Toggle the icon
      const icon = btn.querySelector(".toggle-icon");
      icon.textContent = expanded ? "+" : "−";
    });
  });
});


/* Budget Planner */
document.addEventListener("DOMContentLoaded", () => {
  const ctx = document.getElementById("budgetChart");
  const incomeSlider = document.getElementById("incomeSlider");
  const incomeValue = document.getElementById("incomeValue");
  const centerAmount = document.getElementById("centerAmount");
  const resetBtn = document.getElementById("resetBtn");

  if (!ctx || !incomeSlider || !incomeValue || !centerAmount || !resetBtn) {
    console.warn("Some elements are missing. Check your HTML IDs.");
    return;
  }

  // Base ratios for 50/30/20
  const BUDGET_RATIOS = [0.5, 0.3, 0.2];
  let totalIncome = parseInt(incomeSlider.value);

  // Utility to format currency (₦)
  function formatCurrency(value) {
    return `₦${value.toLocaleString()}`;
  }

  // Create the chart
  const budgetChart = new Chart(ctx.getContext("2d"), {
    type: "doughnut",
    data: {
      labels: ["Needs (50%)", "Wants (30%)", "Savings (20%)"],
      datasets: [
        {
          data: BUDGET_RATIOS.map(r => r * totalIncome),
          backgroundColor: ["#ae3205ff", "#04874eff", "#03759bff"],
          borderWidth: 0,
          hoverOffset: 40,
        },
      ],
    },
    options: {
      responsive: true,
      cutout: "70%",
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(20,20,20,0.9)",
          titleColor: "#fff",
          bodyColor: "#eee",
          borderColor: "#444",
          borderWidth: 1,
          callbacks: {
            label: function (tooltipItem) {
              const label = tooltipItem.label || "";
              const value = tooltipItem.raw;
              return `${label}: ${formatCurrency(value)}`;
            },
          },
        },
      },
      animation: {
        duration: 800,
        easing: "easeOutCubic",
      },
    },
  });

  function updateChart() {
    totalIncome = parseInt(incomeSlider.value);
    const newData = BUDGET_RATIOS.map(r => r * totalIncome);

    budgetChart.data.datasets[0].data = newData;
    budgetChart.update();

    incomeValue.textContent = totalIncome.toLocaleString();
    centerAmount.textContent = totalIncome.toLocaleString();
  }

  incomeSlider.addEventListener("input", updateChart);
  resetBtn.addEventListener("click", () => {
    incomeSlider.value = 2000;
    totalIncome = 2000;
    updateChart();
  });
});


const debts = [];

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("debtForm");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("debtName").value.trim();
    const balance = parseFloat(document.getElementById("balance").value.replace(/,/g, ""));
    const rate = parseFloat(document.getElementById("rate").value);
    const payment = parseFloat(document.getElementById("payment").value.replace(/,/g, ""));

    if (!name || isNaN(balance) || isNaN(rate) || isNaN(payment)) {
      alert("Please fill all fields correctly.");
      return;
    }

    debts.push({ name, balance, rate, payment });
    renderDebts();
    e.target.reset();
  });
});


function renderDebts() {
  const list = document.getElementById("debtList");
  list.innerHTML = "";
  debts.forEach((d, i) => {
    list.insertAdjacentHTML("beforeend", `
        <div class="col-md-4">
          <div class="debt-card">
            <h6 class="fw-bold mb-1">${d.name}</h6>
            <small>Balance:</small> ₦${d.balance.toLocaleString()}<br>
            <small>Rate:</small> ${d.rate}%<br>
            <small>Minimum Monthly Payment:</small> ₦${d.payment.toLocaleString()}
          </div>
        </div>
      `);
  });
}

document.getElementById("simulateSnowball").addEventListener("click", () => {
  if (debts.length === 0) {
    alert("Add at least one debt first!");
    return;
  }


  debts.sort((a, b) => a.balance - b.balance);
  let months = 0;
  let total = debts.reduce((s, d) => s + d.balance, 0);
  let extra = 0;

  while (total > 0 && months < 240) {
    months++;
    for (let d of debts) {
      if (d.balance <= 0) continue;
      const interest = (d.rate / 100 / 12) * d.balance;
      const principal = d.payment + extra - interest;
      d.balance -= Math.max(principal, 0);
      if (d.balance <= 0) {
        extra += d.payment;
        d.balance = 0;
      }
    }
    total = debts.reduce((s, d) => s + d.balance, 0);
  }

  const debtFreeDate = new Date();
  debtFreeDate.setMonth(debtFreeDate.getMonth() + months);

  document.getElementById("monthsToFreedom").textContent = months;
  document.getElementById("debtFreeDate").textContent = debtFreeDate.toLocaleString("default", { month: "short", year: "numeric" });

  document.getElementById("results").classList.remove("d-none");
});

