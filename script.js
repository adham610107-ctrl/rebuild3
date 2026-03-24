let allQuestions = [];
let subjectsData = { musiqa_nazariyasi: [], cholgu_ijrochiligi: [], vokal_ijrochiligi: [], metodika_repertuar: [] };
let usedQuestions = new Set(); 
let currentTestSet = []; 
let userAnswers = new Array(20).fill(null); 
let currentStep = 0;

window.onload = async () => {
    generateChapterButtons();
    await loadAllJSONs();
};

async function loadAllJSONs() {
    try {
        const files = ['musiqa_nazariyasi.json', 'cholgu_ijrochiligi.json', 'vokal_ijrochiligi.json', 'metodika_repertuar.json'];
        for (let file of files) {
            let res = await fetch(file);
            let data = await res.json();
            let subjectName = file.split('.')[0];
            data = data.map((q, idx) => ({ ...q, id: `${subjectName}_${idx}` }));
            subjectsData[subjectName] = data;
            allQuestions = allQuestions.concat(data);
        }
    } catch (e) { console.error("Fayllarni yuklashda xatolik.", e); }
}

function enterDashboard() {
    document.getElementById('welcome-screen').classList.replace('active', 'hidden');
    document.getElementById('dashboard-screen').classList.replace('hidden', 'active');
}

function backToDashboard() {
    if(confirm("Testni to'xtatib asosiy menyuga qaytasizmi?")) {
        document.getElementById('test-screen').classList.replace('active', 'hidden');
        document.getElementById('dashboard-screen').classList.replace('hidden', 'active');
    }
}

function toggleChapters() {
    document.getElementById('chapters-grid').classList.toggle('hidden');
}

function generateChapterButtons() {
    const grid = document.getElementById('chapters-grid');
    for (let i = 1; i <= 40; i++) {
        let btn = document.createElement('button');
        btn.className = 'chapter-btn-ui';
        let start = (i - 1) * 20 + 1;
        let end = i * 20;
        btn.innerText = `${start}-${end}`;
        btn.onclick = () => startSequentialTest(i);
        grid.appendChild(btn);
    }
}

function startSubjectTest(subject) { prepareTestSet(subjectsData[subject]); }
function startRandomAllTest() { prepareTestSet(allQuestions); }
function startSequentialTest(chapterNum) {
    let startIdx = (chapterNum - 1) * 20;
    let pool = allQuestions.slice(startIdx, startIdx + 20);
    prepareTestSet(pool, true);
}

function prepareTestSet(sourcePool, isSequential = false) {
    let selectedQuestions = [];
    if (isSequential) {
        selectedQuestions = [...sourcePool];
    } else {
        let available = sourcePool.filter(q => !usedQuestions.has(q.id));
        if (available.length < 20) { usedQuestions.clear(); available = sourcePool; }
        selectedQuestions = shuffleArray(available).slice(0, 20);
    }

    currentTestSet = selectedQuestions.map(q => {
        let originalAnswerText = q.options[q.answer];
        let shuffledOptions = shuffleArray([...q.options]);
        return { ...q, options: shuffledOptions, answer: shuffledOptions.indexOf(originalAnswerText) };
    });

    initTestUI();
}

function initTestUI() {
    document.getElementById('dashboard-screen').classList.add('hidden');
    document.getElementById('test-screen').classList.remove('hidden');
    currentStep = 0;
    userAnswers.fill(null);
    updateStats();
    buildMap();
    showQuestion(0);
}

function buildMap() {
    const map = document.getElementById('indicator-map');
    map.innerHTML = '';
    for (let i = 0; i < 20; i++) {
        let dot = document.createElement('div');
        dot.className = 'dot';
        dot.id = `dot-${i}`;
        dot.innerText = i + 1;
        dot.onclick = () => showQuestion(i);
        map.appendChild(dot);
    }
}

function showQuestion(index) {
    currentStep = index;
    const qData = currentTestSet[index];
    const area = document.getElementById('active-question-area');
    
    // Progress bar yangilash
    document.getElementById('progress-bar').style.width = `${((index + 1) / 20) * 100}%`;

    // Map ranglarini yangilash
    document.querySelectorAll('.dot').forEach((d, i) => {
        d.classList.remove('current');
        if(i === index) d.classList.add('current');
    });

    let html = `<h2>${index + 1}. ${qData.q}</h2><div class="options-list">`;
    qData.options.forEach((opt, i) => {
        let cls = 'option-btn';
        let extra = '';
        if(userAnswers[index]) {
            extra = 'disabled';
            if(i === userAnswers[index].selectedIdx) cls += userAnswers[index].isCorrect ? ' correct-ans' : ' wrong-ans';
        }
        html += `<button class="${cls}" ${extra} onclick="handleSelect(${index}, ${i}, this)">${opt}</button>`;
    });
    area.innerHTML = html + `</div>`;
    
    // Yakunlash tugmasini tekshirish
    document.getElementById('finish-btn').classList.toggle('hidden', !userAnswers.every(a => a !== null));
}

function handleSelect(qIdx, optIdx, btn) {
    const isCorrect = optIdx === currentTestSet[qIdx].answer;
    userAnswers[qIdx] = { selectedIdx: optIdx, isCorrect: isCorrect };
    
    if (isCorrect) {
        btn.classList.add('correct-ans');
        usedQuestions.add(currentTestSet[qIdx].id);
    } else {
        btn.classList.add('wrong-ans');
    }

    document.getElementById(`dot-${qIdx}`).classList.add(isCorrect ? 'correct' : 'wrong');
    updateStats();

    setTimeout(() => {
        let next = userAnswers.findIndex(a => a === null);
        if (next !== -1) showQuestion(next);
        else showQuestion(qIdx);
    }, 800);
}

function moveStep(step) {
    let next = currentStep + step;
    if (next >= 0 && next < 20) showQuestion(next);
}

function updateStats() {
    document.getElementById('stat-correct').innerText = userAnswers.filter(a => a?.isCorrect).length;
    document.getElementById('stat-wrong').innerText = userAnswers.filter(a => a && !a.isCorrect).length;
}

function forceFinish() {
    let correct = userAnswers.filter(a => a?.isCorrect).length;
    if (correct < 20) {
        alert(`Natija: ${correct}/20. Xatolar bor! Qoidaga ko'ra, 100% bo'lmaguncha ushbu savollar qayta beriladi.`);
        prepareTestSet(currentTestSet, true); // O'sha savollarni qayta yuklash
    } else {
        alert("TABRIKLAYMIZ! 100% natija.");
        location.reload();
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function toggleTheme() { document.body.classList.toggle('dark-mode'); }