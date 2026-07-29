let activeTopicA = "";
let activeTopicB = "";
let debateSessionData = {
    query: "",
    round1: null,
    round2: null,
    round3: null
};

// Initialize Lucide icons
lucide.createIcons();

// Display file name in custom upload input
function updateFileName(input) {
    const fileNameSpan = document.getElementById('file-name');
    if (input.files && input.files.length > 0) {
        fileNameSpan.innerText = input.files[0].name;
        fileNameSpan.classList.add('text-blue-600', 'font-semibold');
    } else {
        fileNameSpan.innerText = "Drag and drop or click to upload";
        fileNameSpan.classList.remove('text-blue-600', 'font-semibold');
    }
}

// Reset debate dashboard back to comparative setup form
function resetDebate() {
    document.getElementById('debateForm').reset();

    const fileNameSpan = document.getElementById('file-name');
    fileNameSpan.innerText = "Drag and drop or click to upload";
    fileNameSpan.classList.remove('text-blue-600', 'font-semibold');

    document.getElementById('setup-container').classList.remove('hidden');
    document.getElementById('active-debate-container').classList.add('hidden');
    document.getElementById('rounds-container').innerHTML = '';
    document.getElementById('conclusion-container').classList.add('hidden');

    // Hide header download button
    document.getElementById('header-download-btn').classList.add('hidden');
    document.getElementById('header-download-btn').classList.remove('flex');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Append round skeleton loading view to container
function createRoundSkeleton(roundNum, roundTitle) {
    const roundId = `round-${roundNum}`;
    const html = `
    <div id="${roundId}" class="space-y-4">
      <!-- Round Header -->
      <div class="flex items-center justify-between border-b border-slate-200 pb-2">
        <span class="text-xs font-bold font-outfit uppercase tracking-wider text-slate-400 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
          ROUND 0${roundNum}
        </span>
        <span class="text-xs font-semibold font-outfit italic text-slate-400 uppercase tracking-wide">
          ${roundTitle}
        </span>
      </div>

      <!-- 3-Column Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Agent A Card -->
        <div id="${roundId}-agent-a" class="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-premium transition-all hover:-translate-y-0.5 duration-300">
          <div class="flex items-center justify-center py-12 text-slate-400">
            <div class="flex flex-col items-center gap-3">
              <i data-lucide="loader-2" class="w-8 h-8 animate-spin text-blue-600"></i>
              <span class="text-xs font-medium text-slate-500">Agent A is preparing arguments...</span>
            </div>
          </div>
        </div>

        <!-- Agent B Card -->
        <div id="${roundId}-agent-b" class="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-premium transition-all hover:-translate-y-0.5 duration-300">
          <div class="flex items-center justify-center py-12 text-slate-400">
            <div class="flex flex-col items-center gap-3">
              <i data-lucide="loader-2" class="w-8 h-8 animate-spin text-blue-600"></i>
              <span class="text-xs font-medium text-slate-500">Agent B is preparing arguments...</span>
            </div>
          </div>
        </div>

        <!-- Judge Card -->
        <div id="${roundId}-judge" class="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-premium transition-all hover:-translate-y-0.5 duration-300">
          <div class="flex items-center justify-center py-12 text-slate-400">
            <div class="flex flex-col items-center gap-3">
              <i data-lucide="loader-2" class="w-8 h-8 animate-spin text-blue-600"></i>
              <span class="text-xs font-medium text-slate-500">Judge is waiting for stances...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

    const container = document.getElementById('rounds-container');
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html.trim();
    container.appendChild(tempDiv.firstChild);
    lucide.createIcons();

    // Scroll to new skeleton round
    document.getElementById(roundId).scrollIntoView({ behavior: 'smooth', block: 'end' });
}

// Render dynamic content for Round 1
function populateRound1(data) {
    debateSessionData.round1 = data.round_1;
    const roundId = 'round-1';

    // Agent A
    const agentAContainer = document.getElementById(`${roundId}-agent-a`);
    agentAContainer.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
        <i data-lucide="terminal" class="w-5 h-5 text-slate-600"></i>
        <h4 class="font-bold font-outfit text-slate-800 text-base">${activeTopicA}</h4>
      </div>
      <ul class="space-y-3">
        ${Object.values(data.round_1.agent_a).map(pt => `
          <li class="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
            <span class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
            <span>${pt}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  `;

    // Agent B
    const agentBContainer = document.getElementById(`${roundId}-agent-b`);
    agentBContainer.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
        <i data-lucide="terminal" class="w-5 h-5 text-slate-600"></i>
        <h4 class="font-bold font-outfit text-slate-800 text-base">${activeTopicB}</h4>
      </div>
      <ul class="space-y-3">
        ${Object.values(data.round_1.agent_b).map(pt => `
          <li class="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
            <span class="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0"></span>
            <span>${pt}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  `;

    // Judge Analysis
    const judgeContainer = document.getElementById(`${roundId}-judge`);
    const judgeCritique = data.round_1.judge;
    judgeContainer.innerHTML = `
    <div class="space-y-4 flex flex-col h-full justify-between">
      <div class="space-y-4">
        <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
          <i data-lucide="gavel" class="w-5 h-5 text-slate-600"></i>
          <h4 class="font-bold font-outfit text-slate-800 text-base">Judge Analysis</h4>
        </div>
        <p class="text-xs text-slate-600 leading-relaxed font-light font-outfit">
          ${judgeCritique.deciding_lead || 'Initial state logged. Analyzing arguments...'}
        </p>
        <div class="grid grid-cols-1 gap-2.5 pt-2">
          <div class="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-[10px] leading-relaxed border border-emerald-100 font-outfit font-light">
            <strong class="text-emerald-950 block mb-1">Agent A Strengths:</strong>
            <p class="mb-2">${judgeCritique.strengths_a || ''}</p>
            <strong class="text-red-900 block mb-1">Agent A Weaknesses:</strong>
            <p>${judgeCritique.weaknesses_a || ''}</p>
          </div>
          <div class="p-2.5 bg-blue-50 text-blue-800 rounded-xl text-[10px] leading-relaxed border border-blue-100 font-outfit font-light">
            <strong class="text-blue-955 block mb-1">Agent B Strengths:</strong>
            <p class="mb-2">${judgeCritique.strengths_b || ''}</p>
            <strong class="text-red-900 block mb-1">Agent B Weaknesses:</strong>
            <p>${judgeCritique.weaknesses_b || ''}</p>
          </div>
        </div>
      </div>
      <div class="pt-4 border-t border-slate-100 mt-auto">
        <button class="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 cursor-pointer">
          <i data-lucide="database" class="w-3.5 h-3.5"></i> Store and Analyze The Points
        </button>
      </div>
    </div>
  `;

    lucide.createIcons();
}

// Render dynamic content for Round 2
function populateRound2(data) {
    debateSessionData.round2 = data.round_2;
    const roundId = 'round-2';
    const agentA = data.round_2.agent_a;
    const agentB = data.round_2.agent_b;
    const judgeCritique = data.round_2.judge;

    // Extract from flat keys "1" through "5"
    const aDepthPoints = [agentA["1"], agentA["2"], agentA["3"]].filter(Boolean);
    const aRebuttalPoints = [agentA["4"], agentA["5"]].filter(Boolean);

    const bDepthPoints = [agentB["1"], agentB["2"], agentB["3"]].filter(Boolean);
    const bRebuttalPoints = [agentB["4"], agentB["5"]].filter(Boolean);

    // Agent A
    const agentAContainer = document.getElementById(`${roundId}-agent-a`);
    agentAContainer.innerHTML = `
    <div class="space-y-6">
      <!-- Technical Depth -->
      <div class="space-y-3">
        <div class="flex items-center gap-2 border-b border-slate-100 pb-2">
          <i data-lucide="terminal" class="w-4 h-4 text-slate-600"></i>
          <h4 class="font-bold font-outfit text-slate-800 text-sm">${activeTopicA} Technical Depth</h4>
        </div>
        <ul class="space-y-2.5">
          ${aDepthPoints.map(pt => `
            <li class="flex items-start gap-2 text-xs text-slate-600 leading-relaxed font-outfit">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
              <span>${pt}</span>
            </li>
          `).join('')}
        </ul>
      </div>

      <!-- Rebuttal -->
      <div class="pt-4 border-t border-slate-100 space-y-3">
        <div class="space-y-1">
          <h4 class="font-bold font-outfit text-red-600 text-sm flex items-center gap-1.5">
            <i data-lucide="shield-alert" class="w-4 h-4"></i> ${activeTopicA} Rebuttal
          </h4>
          <p class="text-[9px] font-bold text-red-400 tracking-wider uppercase font-outfit font-light">DISAPPROVING ${activeTopicB} ROUND 1 POINTS</p>
        </div>
        <ul class="space-y-2.5">
          ${aRebuttalPoints.map(pt => `
            <li class="flex items-start gap-2 text-xs text-slate-600 leading-relaxed bg-red-50/30 p-2 rounded-lg border border-red-500/10 font-outfit font-light">
              <i data-lucide="x" class="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0"></i>
              <span>${pt}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
  `;

    // Agent B
    const agentBContainer = document.getElementById(`${roundId}-agent-b`);
    agentBContainer.innerHTML = `
    <div class="space-y-6">
      <!-- Technical Depth -->
      <div class="space-y-3">
        <div class="flex items-center gap-2 border-b border-slate-100 pb-2">
          <i data-lucide="terminal" class="w-4 h-4 text-slate-600"></i>
          <h4 class="font-bold font-outfit text-slate-800 text-sm">${activeTopicB} Technical Depth</h4>
        </div>
        <ul class="space-y-2.5">
          ${bDepthPoints.map(pt => `
            <li class="flex items-start gap-2 text-xs text-slate-600 leading-relaxed font-outfit">
              <span class="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0"></span>
              <span>${pt}</span>
            </li>
          `).join('')}
        </ul>
      </div>

      <!-- Rebuttal -->
      <div class="pt-4 border-t border-slate-100 space-y-3">
        <div class="space-y-1">
          <h4 class="font-bold font-outfit text-red-600 text-sm flex items-center gap-1.5">
            <i data-lucide="shield-alert" class="w-4 h-4"></i> ${activeTopicB} Rebuttal
          </h4>
          <p class="text-[9px] font-bold text-red-400 tracking-wider uppercase font-outfit font-light">DISAPPROVING ${activeTopicA} ROUND 1 POINTS</p>
        </div>
        <ul class="space-y-2.5">
          ${bRebuttalPoints.map(pt => `
            <li class="flex items-start gap-2 text-xs text-slate-600 leading-relaxed bg-red-50/30 p-2 rounded-lg border border-red-500/10 font-outfit font-light font-outfit">
              <i data-lucide="x" class="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0"></i>
              <span>${pt}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
  `;

    // Judge Analysis
    const judgeContainer = document.getElementById(`${roundId}-judge`);
    judgeContainer.innerHTML = `
    <div class="space-y-4 flex flex-col h-full justify-between">
      <div class="space-y-4">
        <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
          <i data-lucide="gavel" class="w-5 h-5 text-slate-600"></i>
          <h4 class="font-bold font-outfit text-slate-800 text-base">Judge Analysis</h4>
        </div>
        <div class="flex gap-1.5 flex-wrap">
          <span class="text-[9px] font-bold tracking-wider uppercase bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 font-outfit">DEBATER ASSESSMENTS DONE</span>
          <span class="text-[9px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100 font-outfit">IDENTIFYING TRADEOFFS</span>
        </div>
        <p class="text-xs text-slate-600 leading-relaxed font-light font-outfit">
          ${judgeCritique.deciding_lead || 'Rebuttal states evaluated. Scaling debate...'}
        </p>
        <div class="grid grid-cols-1 gap-2.5 pt-2 font-outfit font-light">
          <div class="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-[10px] leading-relaxed border border-emerald-100">
            <strong class="text-emerald-900 block mb-1">Agent A strengths:</strong>
            <p class="mb-2">${judgeCritique.strengths_a || ''}</p>
            <strong class="text-red-900 block mb-1">Agent A weaknesses:</strong>
            <p>${judgeCritique.weaknesses_a || ''}</p>
          </div>
          <div class="p-2.5 bg-blue-50 text-blue-800 rounded-xl text-[10px] leading-relaxed border border-blue-100">
            <strong class="text-blue-900 block mb-1">Agent B strengths:</strong>
            <p class="mb-2">${judgeCritique.strengths_b || ''}</p>
            <strong class="text-red-900 block mb-1">Agent B weaknesses:</strong>
            <p>${judgeCritique.weaknesses_b || ''}</p>
          </div>
        </div>
      </div>
      <div class="pt-4 border-t border-slate-100 mt-auto">
        <button class="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 cursor-pointer">
          <i data-lucide="database" class="w-3.5 h-3.5"></i> Store and Analyze
        </button>
      </div>
    </div>
  `;

    lucide.createIcons();
}

// Render dynamic content for Round 3
function populateRound3(data) {
    debateSessionData.round3 = data.round_3;
    const roundId = 'round-3';
    const agentA = data.round_3.agent_a;
    const agentB = data.round_3.agent_b;
    const judgeCritique = data.round_3.judge;

    // Extract from flat keys "1" through "5"
    const aDepthPoints = [agentA["1"], agentA["2"], agentA["3"]].filter(Boolean);
    const aRebuttalPoints = [agentA["4"], agentA["5"]].filter(Boolean);

    const bDepthPoints = [agentB["1"], agentB["2"], agentB["3"]].filter(Boolean);
    const bRebuttalPoints = [agentB["4"], agentB["5"]].filter(Boolean);

    // Agent A
    const agentAContainer = document.getElementById(`${roundId}-agent-a`);
    agentAContainer.innerHTML = `
    <div class="space-y-6">
      <!-- Deep Dive -->
      <div class="space-y-3">
        <div class="flex items-center gap-2 border-b border-slate-100 pb-2">
          <i data-lucide="terminal" class="w-4 h-4 text-slate-600"></i>
          <h4 class="font-bold font-outfit text-slate-800 text-sm">${activeTopicA} Deep Dive</h4>
        </div>
        <ul class="space-y-2.5">
          ${aDepthPoints.map(pt => `
            <li class="flex items-start gap-2 text-xs text-slate-600 leading-relaxed font-outfit">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
              <span>${pt}</span>
            </li>
          `).join('')}
        </ul>
      </div>

      <!-- Rebuttal Continuation -->
      <div class="pt-4 border-t border-slate-100 space-y-3">
        <div class="space-y-1">
          <h4 class="font-bold font-outfit text-red-600 text-sm flex items-center gap-1.5">
            <i data-lucide="shield-alert" class="w-4 h-4"></i> ${activeTopicA} Rebuttal
          </h4>
          <p class="text-[9px] font-bold text-red-400 tracking-wider uppercase font-outfit font-light">REBUTTAL CONTINUATION</p>
        </div>
        <ul class="space-y-2.5">
          ${aRebuttalPoints.map(pt => `
            <li class="flex items-start gap-2 text-xs text-slate-600 leading-relaxed bg-red-50/30 p-2 rounded-lg border border-red-500/10 font-outfit font-light">
              <i data-lucide="arrow-right-left" class="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0"></i>
              <span>${pt}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
  `;

    // Agent B
    const agentBContainer = document.getElementById(`${roundId}-agent-b`);
    agentBContainer.innerHTML = `
    <div class="space-y-6">
      <!-- Deep Dive -->
      <div class="space-y-3">
        <div class="flex items-center gap-2 border-b border-slate-100 pb-2">
          <i data-lucide="terminal" class="w-4 h-4 text-slate-600"></i>
          <h4 class="font-bold font-outfit text-slate-800 text-sm">${activeTopicB} Deep Dive</h4>
        </div>
        <ul class="space-y-2.5">
          ${bDepthPoints.map(pt => `
            <li class="flex items-start gap-2 text-xs text-slate-600 leading-relaxed font-outfit">
              <span class="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0"></span>
              <span>${pt}</span>
            </li>
          `).join('')}
        </ul>
      </div>

      <!-- Rebuttal Continuation -->
      <div class="pt-4 border-t border-slate-100 space-y-3">
        <div class="space-y-1">
          <h4 class="font-bold font-outfit text-red-600 text-sm flex items-center gap-1.5">
            <i data-lucide="shield-alert" class="w-4 h-4"></i> ${activeTopicB} Rebuttal
          </h4>
          <p class="text-[9px] font-bold text-red-400 tracking-wider uppercase font-outfit font-light font-outfit">REBUTTAL CONTINUATION</p>
        </div>
        <ul class="space-y-2.5">
          ${bRebuttalPoints.map(pt => `
            <li class="flex items-start gap-2 text-xs text-slate-600 leading-relaxed bg-red-50/30 p-2 rounded-lg border border-red-500/10 font-outfit font-light font-outfit">
              <i data-lucide="arrow-right-left" class="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0"></i>
              <span>${pt}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
  `;

    // Judge Synthesis Card
    const judgeContainer = document.getElementById(`${roundId}-judge`);
    judgeContainer.innerHTML = `
    <div class="space-y-4 flex flex-col h-full justify-between">
      <div class="space-y-4">
        <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
          <i data-lucide="award" class="w-5 h-5 text-slate-600"></i>
          <h4 class="font-bold font-outfit text-slate-800 text-base">Synthesis</h4>
        </div>
        <p class="text-xs text-slate-600 leading-relaxed font-light font-outfit">
          ${judgeCritique.summary || 'Defining decision nodes based on final technical disclosures. Concluding comparative analysis.'}
        </p>
        <div class="space-y-1.5 pt-2 font-outfit font-light">
          <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Key Factors:</div>
          <ul class="space-y-2 text-[10px] text-slate-500 font-outfit leading-relaxed">
            <li class="flex gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100"><span class="text-blue-600 font-bold">1.</span> <span>${judgeCritique.factor_1 || ''}</span></li>
            <li class="flex gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100"><span class="text-blue-600 font-bold">2.</span> <span>${judgeCritique.factor_2 || ''}</span></li>
            <li class="flex gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100"><span class="text-blue-600 font-bold">3.</span> <span>${judgeCritique.factor_3 || ''}</span></li>
          </ul>
        </div>
      </div>
      <div class="pt-4 border-t border-slate-100 mt-auto">
        <button class="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 cursor-pointer font-outfit">
          <i data-lucide="database" class="w-3.5 h-3.5"></i> Store and Analyze
        </button>
      </div>
    </div>
  `;

    lucide.createIcons();
}

// Populate and show the Judge's Conclusion panel with final verdict and score progress bars
function populateConclusion(judgeCritique) {
    // Winner header text
    document.getElementById('conclusion-winner').innerText = judgeCritique.winner || 'The Judgment Decreed';

    // Recommendation / Summary paragraph
    document.getElementById('conclusion-summary').innerText = judgeCritique.summary || '';

    // Scoreboard Metrics Progress Bars
    const scoreboardContainer = document.getElementById('conclusion-scoreboard');
    scoreboardContainer.innerHTML = ''; // Reset

    // Generate dynamic comparative scoreboard based on winner if not sent by LLM
    let scoreboardData = judgeCritique.scoreboard;
    if (!scoreboardData) {
        const winnerLower = (judgeCritique.winner || '').toLowerCase();
        const isWinnerA = winnerLower.includes('agent a') || winnerLower.includes(activeTopicA.toLowerCase());
        scoreboardData = [
            { metric: "Speed to Market", score_a: isWinnerA ? 9.0 : 7.0, score_b: isWinnerA ? 7.0 : 9.0 },
            { metric: "Scalability & Efficiency", score_a: isWinnerA ? 8.0 : 8.5, score_b: isWinnerA ? 8.5 : 8.0 },
            { metric: "Ecosystem Maturity", score_a: isWinnerA ? 9.5 : 9.0, score_b: isWinnerA ? 9.0 : 9.5 }
        ];
    }

    scoreboardData.forEach(item => {
        const isWinnerA = item.score_a > item.score_b;
        const leadText = isWinnerA ? `${activeTopicA} Lead` : `${activeTopicB} Lead`;
        const leadColorClass = isWinnerA ? 'text-blue-400' : 'text-rose-400';

        const barHtml = `
      <div class="space-y-1.5">
        <div class="flex justify-between text-xs font-semibold text-slate-300 font-outfit">
          <span>${item.metric}</span>
          <span class="${leadColorClass} font-bold">${leadText}</span>
        </div>
        <div class="space-y-1 text-[10px] text-slate-400 font-outfit">
          <!-- Agent A Row -->
          <div class="flex items-center gap-2">
            <span class="w-20 truncate text-slate-300 font-semibold">${activeTopicA}:</span>
            <div class="flex-grow score-progress-bar">
              <div class="score-progress-bar-fill bg-blue-500" style="width: ${item.score_a * 10}%"></div>
            </div>
            <span class="w-6 text-right font-bold text-slate-200">${item.score_a.toFixed(1)}</span>
          </div>
          <!-- Agent B Row -->
          <div class="flex items-center gap-2">
            <span class="w-20 truncate text-slate-300 font-semibold">${activeTopicB}:</span>
            <div class="flex-grow score-progress-bar">
              <div class="score-progress-bar-fill bg-rose-500" style="width: ${item.score_b * 10}%"></div>
            </div>
            <span class="w-6 text-right font-bold text-slate-200">${item.score_b.toFixed(1)}</span>
          </div>
        </div>
      </div>
    `;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = barHtml.trim();
        scoreboardContainer.appendChild(tempDiv.firstChild);
    });

    // Reveal conclusion container
    const conclusionContainer = document.getElementById('conclusion-container');
    conclusionContainer.classList.remove('hidden');
    lucide.createIcons();

    // Scroll to conclusion board
    conclusionContainer.scrollIntoView({ behavior: 'smooth' });

    // Show header download button
    document.getElementById('header-download-btn').classList.remove('hidden');
    document.getElementById('header-download-btn').classList.add('flex');
}

// Submit Debate Setup Form
document.getElementById('debateForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const queryVal = document.getElementById('debate_query').value.trim();
    const webhookUrlVal = document.getElementById('webhook_url').value.trim();

    if (!queryVal) return;

    debateSessionData = {
        query: queryVal,
        round1: null,
        round2: null,
        round3: null
    };

    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Convening Courtroom...`;
    lucide.createIcons();

    // Transition UI states
    document.getElementById('setup-container').classList.add('hidden');
    document.getElementById('active-debate-container').classList.remove('hidden');
    document.getElementById('rounds-container').innerHTML = '';
    document.getElementById('conclusion-container').classList.add('hidden');

    // Update query header title
    document.getElementById('active-query-title').innerText = queryVal;

    try {
        // --- STEP 1: SPLIT CASE QUERY ---
        const splitFormData = new FormData();
        splitFormData.append('query', queryVal);
        splitFormData.append('webhook_url', webhookUrlVal);

        const splitRes = await fetch('/api/split', { method: 'POST', body: splitFormData });
        const splitData = await splitRes.json();

        if (splitRes.status !== 200 || splitData.status === 'error') {
            throw new Error(splitData.error || 'Comparative query splitting failed.');
        }

        if (splitData.status === 'not_possible') {
            alert("Halted: The query is not a comparative technical debate topic. Returning 'not_possible'.");
            resetDebate();
            return;
        }

        const session_id = splitData.session_id;
        activeTopicA = splitData.topic_a;
        activeTopicB = splitData.topic_b;

        // --- STEP 2: ROUND 1 (Foundational Arguments) ---
        createRoundSkeleton(1, "Foundational Arguments");

        const r1FormData = new FormData();
        r1FormData.append('session_id', session_id);
        r1FormData.append('webhook_url', webhookUrlVal);
        const fileInput = document.getElementById('file').files[0];
        if (fileInput) {
            r1FormData.append('file', fileInput);
        }

        const r1Res = await fetch('/api/round1', { method: 'POST', body: r1FormData });
        const r1Data = await r1Res.json();

        if (r1Data.status === 'error') {
            throw new Error((r1Data.round_1 && r1Data.round_1.judge) || r1Data.error || 'Round 1 failed.');
        }

        populateRound1(r1Data);

        // --- STEP 3: ROUND 2 (Direct Rebuttal) ---
        createRoundSkeleton(2, "Direct Rebuttal");

        const r2FormData = new FormData();
        r2FormData.append('session_id', session_id);
        r2FormData.append('webhook_url', webhookUrlVal);

        const r2Res = await fetch('/api/round2', { method: 'POST', body: r2FormData });
        const r2Data = await r2Res.json();

        if (r2Data.status === 'error') {
            throw new Error((r2Data.round_2 && r2Data.round_2.judge) || r2Data.error || 'Round 2 failed.');
        }

        populateRound2(r2Data);

        // --- STEP 4: ROUND 3 (Deep Dive Technical Counter-points) ---
        createRoundSkeleton(3, "Deep Dive Technical Counter-points");

        const r3FormData = new FormData();
        r3FormData.append('session_id', session_id);
        r3FormData.append('webhook_url', webhookUrlVal);

        const r3Res = await fetch('/api/round3', { method: 'POST', body: r3FormData });
        const r3Data = await r3Res.json();

        if (r3Data.status === 'error') {
            throw new Error((r3Data.round_3 && r3Data.round_3.judge) || r3Data.error || 'Round 3 failed.');
        }

        populateRound3(r3Data);

        // --- STEP 5: FINAL JUDGMENT / CONCLUSION ---
        populateConclusion(r3Data.round_3.judge);

    } catch (err) {
        alert("Error executing debate: " + err.message);
        resetDebate();
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="play" class="w-4 h-4"></i> Start Debate`;
        lucide.createIcons();
    }
});

// PDF Report Generator utilizing jsPDF to compile and load in a new browser tab/frame
function generatePDFReport() {
    if (!debateSessionData.round1 || !debateSessionData.round2 || !debateSessionData.round3) {
        alert("Report can only be generated after all rounds are concluded.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });

    let y = 20;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - (margin * 2);

    function checkPageOverflow(spaceNeeded) {
        if (y + spaceNeeded > 275) {
            doc.addPage();
            y = 20;
        }
    }

    function addTitle(text) {
        checkPageOverflow(15);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text(text, margin, y);
        y += 10;
    }

    function addSubtitle(text) {
        checkPageOverflow(10);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(37, 99, 235); // blue-600
        doc.text(text, margin, y);
        y += 8;
    }

    // Draw separator line
    function addDivider() {
        checkPageOverflow(5);
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;
    }

    function addHeading(text) {
        checkPageOverflow(10);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(text, margin, y);
        y += 6;
    }

    function addParagraph(text, isItalic = false) {
        if (!text) return;
        doc.setFont("Helvetica", isItalic ? "italic" : "normal");
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105); // slate-600

        const lines = doc.splitTextToSize(text, contentWidth);
        lines.forEach(line => {
            checkPageOverflow(5);
            doc.text(line, margin, y);
            y += 5;
        });
        y += 2; // small space after paragraph
    }

    function addBullet(pointText, isTopicB = false) {
        if (!pointText) return;
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);

        const bullet = "- ";
        const indent = 5;

        const lines = doc.splitTextToSize(pointText, contentWidth - indent);
        lines.forEach((line, idx) => {
            checkPageOverflow(5);
            if (idx === 0) {
                doc.setFont("Helvetica", "bold");
                doc.setTextColor(isTopicB ? 244 : 59, isTopicB ? 63 : 130, isTopicB ? 94 : 246); // Rose or Blue
                doc.text(bullet, margin, y);
                doc.setFont("Helvetica", "normal");
                doc.setTextColor(71, 85, 105);
                doc.text(line, margin + indent, y);
            } else {
                doc.text(line, margin + indent, y);
            }
            y += 5;
        });
    }

    // Title
    addTitle("DebateMind Case Synthesis Report");
    addParagraph(`Generated on: ${new Date().toLocaleString()}`);
    addParagraph(`Comparative Case: "${debateSessionData.query}"`, true);
    addDivider();

    // --- ROUND 1 ---
    addSubtitle("Round 1: Foundational Arguments");

    addHeading(`Stance A: ${activeTopicA}`);
    Object.values(debateSessionData.round1.agent_a).forEach(pt => addBullet(pt, false));
    y += 4;

    addHeading(`Stance B: ${activeTopicB}`);
    Object.values(debateSessionData.round1.agent_b).forEach(pt => addBullet(pt, true));
    y += 4;

    addHeading("Judge Critique");
    addParagraph(debateSessionData.round1.judge.deciding_lead);
    addParagraph(`Agent A Strengths: ${debateSessionData.round1.judge.strengths_a}`);
    addParagraph(`Agent A Weaknesses: ${debateSessionData.round1.judge.weaknesses_a}`);
    addParagraph(`Agent B Strengths: ${debateSessionData.round1.judge.strengths_b}`);
    addParagraph(`Agent B Weaknesses: ${debateSessionData.round1.judge.weaknesses_b}`);
    addDivider();

    // --- ROUND 2 ---
    addSubtitle("Round 2: Direct Rebuttal");

    const aDepthPoints2 = [debateSessionData.round2.agent_a["1"], debateSessionData.round2.agent_a["2"], debateSessionData.round2.agent_a["3"]].filter(Boolean);
    const aRebuttalPoints2 = [debateSessionData.round2.agent_a["4"], debateSessionData.round2.agent_a["5"]].filter(Boolean);
    const bDepthPoints2 = [debateSessionData.round2.agent_b["1"], debateSessionData.round2.agent_b["2"], debateSessionData.round2.agent_b["3"]].filter(Boolean);
    const bRebuttalPoints2 = [debateSessionData.round2.agent_b["4"], debateSessionData.round2.agent_b["5"]].filter(Boolean);

    addHeading(`Stance A (${activeTopicA}) Technical Depth`);
    aDepthPoints2.forEach(pt => addBullet(pt, false));
    addHeading(`Stance A (${activeTopicA}) Rebuttals`);
    aRebuttalPoints2.forEach(pt => addBullet(pt, false));
    y += 4;

    addHeading(`Stance B (${activeTopicB}) Technical Depth`);
    bDepthPoints2.forEach(pt => addBullet(pt, true));
    addHeading(`Stance B (${activeTopicB}) Rebuttals`);
    bRebuttalPoints2.forEach(pt => addBullet(pt, true));
    y += 4;

    addHeading("Judge Critique");
    addParagraph(debateSessionData.round2.judge.deciding_lead);
    addParagraph(`Agent A Strengths: ${debateSessionData.round2.judge.strengths_a}`);
    addParagraph(`Agent A Weaknesses: ${debateSessionData.round2.judge.weaknesses_a}`);
    addParagraph(`Agent B Strengths: ${debateSessionData.round2.judge.strengths_b}`);
    addParagraph(`Agent B Weaknesses: ${debateSessionData.round2.judge.weaknesses_b}`);
    addDivider();

    // --- ROUND 3 ---
    addSubtitle("Round 3: Deep Dive Technical Counter-points");

    const aDepthPoints3 = [debateSessionData.round3.agent_a["1"], debateSessionData.round3.agent_a["2"], debateSessionData.round3.agent_a["3"]].filter(Boolean);
    const aRebuttalPoints3 = [debateSessionData.round3.agent_a["4"], debateSessionData.round3.agent_a["5"]].filter(Boolean);
    const bDepthPoints3 = [debateSessionData.round3.agent_b["1"], debateSessionData.round3.agent_b["2"], debateSessionData.round3.agent_b["3"]].filter(Boolean);
    const bRebuttalPoints3 = [debateSessionData.round3.agent_b["4"], debateSessionData.round3.agent_b["5"]].filter(Boolean);

    addHeading(`Stance A (${activeTopicA}) Deep Dive`);
    aDepthPoints3.forEach(pt => addBullet(pt, false));
    addHeading(`Stance A (${activeTopicA}) Rebuttals`);
    aRebuttalPoints3.forEach(pt => addBullet(pt, false));
    y += 4;

    addHeading(`Stance B (${activeTopicB}) Deep Dive`);
    bDepthPoints3.forEach(pt => addBullet(pt, true));
    addHeading(`Stance B (${activeTopicB}) Rebuttals`);
    bRebuttalPoints3.forEach(pt => addBullet(pt, true));
    y += 4;

    addHeading("Synthesis");
    addParagraph(debateSessionData.round3.judge.summary);
    addHeading("Key Synthesis Factors");
    addBullet(`1. ${debateSessionData.round3.judge.factor_1}`, false);
    addBullet(`2. ${debateSessionData.round3.judge.factor_2}`, false);
    addBullet(`3. ${debateSessionData.round3.judge.factor_3}`, false);
    addDivider();

    // --- CONCLUSION / SCOREBOARD ---
    addSubtitle("Official Case Verdict");
    addHeading(debateSessionData.round3.judge.winner);
    addParagraph(debateSessionData.round3.judge.summary);

    // Scoreboard Ratings
    addHeading("Comparative Scoreboard Ratings");
    const winnerLower = (debateSessionData.round3.judge.winner || '').toLowerCase();
    const isWinnerA = winnerLower.includes('agent a') || winnerLower.includes(activeTopicA.toLowerCase());

    const scoreboardData = [
        { metric: "Speed to Market", score_a: isWinnerA ? 9.0 : 7.0, score_b: isWinnerA ? 7.0 : 9.0 },
        { metric: "Scalability & Efficiency", score_a: isWinnerA ? 8.0 : 8.5, score_b: isWinnerA ? 8.5 : 8.0 },
        { metric: "Ecosystem Maturity", score_a: isWinnerA ? 9.5 : 9.0, score_b: isWinnerA ? 9.0 : 9.5 }
    ];

    scoreboardData.forEach(item => {
        addParagraph(`${item.metric} - ${activeTopicA}: ${item.score_a.toFixed(1)} / 10 | ${activeTopicB}: ${item.score_b.toFixed(1)} / 10`);
    });

    // Output as blob URL and open in new tab
    const blob = doc.output("blob");
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank");
}



// =============================================================================
// WEBHOOK – WebSocket monitor extension
// Connects to /ws on page load, listens for backend_error events, and renders
// a dismissible toast.  Zero changes to any existing debate logic.
// =============================================================================

(function webhook() {
    const WS_URL = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
    const RECONNECT_DELAY_MS = 3000;
    const HEARTBEAT_INTERVAL_MS = 25000; // send ping every 25 s to keep the socket alive

    let _socket = null;
    let _heartbeatTimer = null;
    let _reconnectTimer = null;
    let _toastDismissTimer = null;

    // -------------------------------------------------------------------------
    // Error type → human-readable label + icon name
    // -------------------------------------------------------------------------
    const ERROR_META = {
        api_key_error: {
            title: "API Key Error",
            icon: "key-round",
            hint: "Check that your API key is valid and has the required permissions."
        },
        rate_limit: {
            title: "Rate Limit Reached",
            icon: "timer-off",
            hint: "The AI provider throttled the request. The debate may resume automatically — please wait a moment."
        },
        general: {
            title: "Backend Error",
            icon: "alert-triangle",
            hint: ""
        }
    };

    // -------------------------------------------------------------------------
    // Toast helpers
    // -------------------------------------------------------------------------
    function showWsErrorToast(errorType, message, step) {
        const meta = ERROR_META[errorType] || ERROR_META.general;
        const toast     = document.getElementById('ws-error-toast');
        const titleEl   = document.getElementById('ws-error-title');
        const bodyEl    = document.getElementById('ws-error-body');
        const stepEl    = document.getElementById('ws-error-step');
        const iconEl    = document.getElementById('ws-error-icon');

        if (!toast) return;

        titleEl.textContent = meta.title;
        bodyEl.textContent  = meta.hint ? `${meta.hint}\n\nDetail: ${message}` : message;
        stepEl.textContent  = step ? `Step: ${step}` : '';
        iconEl.setAttribute('data-lucide', meta.icon);
        lucide.createIcons();

        toast.classList.remove('hidden');
        toast.classList.add('flex');

        // Auto-dismiss after 12 s
        clearTimeout(_toastDismissTimer);
        _toastDismissTimer = setTimeout(dismissWsErrorToast, 12000);
    }

    // -------------------------------------------------------------------------
    // Connect / reconnect
    // -------------------------------------------------------------------------
    function connect() {
        try {
            _socket = new WebSocket(WS_URL);
        } catch (err) {
            console.warn('[WS Monitor] Could not create WebSocket:', err);
            scheduleReconnect();
            return;
        }

        _socket.addEventListener('open', () => {
            console.log('[WS Monitor] Connected to', WS_URL);
            startHeartbeat();
        });

        _socket.addEventListener('message', (event) => {
            let data;
            try {
                data = JSON.parse(event.data);
            } catch {
                return; // ignore non-JSON frames
            }

            if (data.event === 'backend_error') {
                showWsErrorToast(data.error_type, data.message, data.step);
            }
            // pong and other control events are silently ignored
        });

        _socket.addEventListener('close', () => {
            console.log('[WS Monitor] Connection closed – reconnecting in', RECONNECT_DELAY_MS, 'ms');
            stopHeartbeat();
            scheduleReconnect();
        });

        _socket.addEventListener('error', (err) => {
            // The 'close' event fires right after; reconnect is handled there.
            console.warn('[WS Monitor] Socket error:', err);
        });
    }

    function scheduleReconnect() {
        clearTimeout(_reconnectTimer);
        _reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
    }

    function startHeartbeat() {
        stopHeartbeat();
        _heartbeatTimer = setInterval(() => {
            if (_socket && _socket.readyState === WebSocket.OPEN) {
                _socket.send('ping');
            }
        }, HEARTBEAT_INTERVAL_MS);
    }

    function stopHeartbeat() {
        clearInterval(_heartbeatTimer);
    }

    // Kick off on page load
    connect();
})(); // end webhook IIFE

// Exposed globally so the dismiss button in HTML can call it
function dismissWsErrorToast() {
    const toast = document.getElementById('ws-error-toast');
    if (!toast) return;
    toast.classList.add('hidden');
    toast.classList.remove('flex');
}
