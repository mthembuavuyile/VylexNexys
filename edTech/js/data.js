const StorageKeys = {
    NAME: 'vylex_edtech_name',
    AVATAR: 'vylex_edtech_avatar',
    GRADE: 'vylex_edtech_grade',
    SUBJECT: 'vylex_edtech_sub',
    XP: 'vylex_edtech_xp'
};

const curriculumData = {
    "Maths": {
        id: "tab-math", label: "Mathematics", color: "brand",
        modules: [
            { id: "m1", title: "Differential Calculus", desc: "First principles, limits, and derivative rules.", progress: 0 },
            { id: "m2", title: "Analytical Geometry", desc: "Coordinate geometry, circles, and tangents.", progress: 0 },
            { id: "m3", title: "Trigonometry 3D", desc: "Compound angles and 3D problem solving.", progress: 0 },
            { id: "m4", title: "Euclidean Geometry", desc: "Circle theorems and cyclic quadrilaterals.", progress: 0 }
        ],
        bossLevels: [{ id: "b1", title: "Maths Paper 1 - Nov 2023", desc: "Algebra, Calculus, Sequences", xp: 500 }]
    },
    "Physics": {
        id: "tab-physics", label: "Physical Sciences", color: "blue",
        modules: [
            { id: "s1", title: "Work, Energy & Power", desc: "Work-energy theorem and conservation laws.", progress: 0 },
            { id: "s2", title: "Organic Chemistry", desc: "Macromolecules, nomenclature, and reactions.", progress: 0 },
            { id: "s3", title: "Electrodynamics", desc: "Generators, motors, and alternating current.", progress: 0 },
            { id: "s4", title: "Momentum & Impulse", desc: "Newton's laws of motion in terms of momentum.", progress: 0 }
        ],
        bossLevels: [{ id: "b2", title: "Physics Paper 1 - Trial 2023", desc: "Mechanics, Waves, Electricity", xp: 500 }]
    },
    "LifeSci": {
        id: "tab-lifesci", label: "Life Sciences", color: "emerald",
        modules: [
            { id: "l1", title: "DNA: The Code of Life", desc: "Structure of DNA, RNA, replication, and transcription.", progress: 0 },
            { id: "l2", title: "Meiosis", desc: "Cell division, crossing over, and genetic variation.", progress: 0 },
            { id: "l3", title: "Genetics and Inheritance", desc: "Mendelian genetics, Punnett squares, and mutations.", progress: 0 },
            { id: "l4", title: "Evolution", desc: "Natural selection, human evolution, and evidence.", progress: 0 }
        ],
        bossLevels: [{ id: "b3", title: "Life Sciences Paper 2 - Nov 2023", desc: "DNA, Genetics, Evolution", xp: 500 }]
    },
    "AgriSci": {
        id: "tab-agrisci", label: "Agricultural Sciences", color: "amber",
        modules: [
            { id: "a1", title: "Animal Nutrition", desc: "Digestive systems, feed composition, and rations.", progress: 0 },
            { id: "a2", title: "Animal Production", desc: "Farming systems, handling, and intensive farming.", progress: 0 },
            { id: "a3", title: "Animal Reproduction", desc: "Reproductive organs, artificial insemination, and cycles.", progress: 0 },
            { id: "a4", title: "Animal Protection", desc: "Diseases, parasites, and farm management.", progress: 0 }
        ],
        bossLevels: [{ id: "b4", title: "Agri Paper 1 - Trial 2023", desc: "Nutrition, Production, Reproduction", xp: 500 }]
    }
};

const lessonsData = {
    "m1": [
        {
            type: "info",
            title: "First Principles",
            content: "<p class='text-slate-400 text-lg mb-6 leading-relaxed'>The derivative of a function <span class='text-brand-400 font-bold font-mono'>f(x)</span> from first principles is given by the limit as <span class='text-brand-400 font-bold font-mono'>h &rarr; 0</span>.</p>",
            formula: "f'(x) = lim(h→0) [f(x+h) - f(x)] / h",
            buttonText: "Got it"
        },
        {
            type: "quiz",
            title: "What is the derivative of f(x) = x²?",
            options: [
                { text: "x", correct: false },
                { text: "2x", correct: true },
                { text: "2x²", correct: false }
            ]
        }
    ],
    "l1": [
        {
            type: "info",
            title: "DNA Structure",
            content: "<p class='text-slate-400 text-lg mb-6 leading-relaxed'>DNA (Deoxyribonucleic acid) is a double helix structure. It consists of nucleotides, which are made of a <span class='text-brand-400 font-bold'>sugar</span>, a <span class='text-emerald-400 font-bold'>phosphate</span>, and a <span class='text-amber-400 font-bold'>nitrogenous base</span>.</p>",
            formula: null,
            buttonText: "Next"
        },
        {
            type: "quiz",
            title: "Which of the following is NOT a nitrogenous base found in DNA?",
            options: [
                { text: "Adenine", correct: false },
                { text: "Uracil", correct: true },
                { text: "Cytosine", correct: false },
                { text: "Guanine", correct: false }
            ]
        }
    ],
    "s1": [
        {
            type: "info",
            title: "Work Done",
            content: "<p class='text-slate-400 text-lg mb-6 leading-relaxed'>Work is done when a force acting on an object causes it to move. The formula is <span class='text-brand-400 font-bold font-mono'>W = F &Delta;x cos(&theta;)</span>.</p>",
            formula: "W = F Δx cos(θ)",
            buttonText: "Understood"
        },
        {
            type: "quiz",
            title: "What is the unit of Work?",
            options: [
                { text: "Newton", correct: false },
                { text: "Watt", correct: false },
                { text: "Joule", correct: true }
            ]
        }
    ],
    "a1": [
        {
            type: "info",
            title: "Ruminant Digestion",
            content: "<p class='text-slate-400 text-lg mb-6 leading-relaxed'>Ruminants are mammals that acquire nutrients from plant-based food by fermenting it in a specialized stomach prior to digestion. The stomach has four compartments: rumen, reticulum, omasum, and abomasum.</p>",
            formula: null,
            buttonText: "Got it"
        },
        {
            type: "quiz",
            title: "Which compartment is considered the 'true stomach' in ruminants?",
            options: [
                { text: "Rumen", correct: false },
                { text: "Reticulum", correct: false },
                { text: "Omasum", correct: false },
                { text: "Abomasum", correct: true }
            ]
        }
    ]
};

const labsData = [
    { id: "lab1", title: "Electrodynamics Simulator", desc: "Build AC/DC motors and generators in 3D.", icon: "cpu", color: "blue", url: "../tools/virtual-lab.html" },
    { id: "lab2", title: "Chemical Titration", desc: "Virtual titration setup with real-time indicators.", icon: "droplet", color: "emerald", url: "../tools/virtual-lab.html" },
    { id: "lab3", title: "Projectile Motion", desc: "Launch varied masses and track parabolas.", icon: "crosshair", color: "orange", url: "../tools/virtual-lab.html" }
];

let userProfile = { name: null, avatar: null, grade: null, subject: null, xp: 0 };

function loadProfile() {
    const storedName = localStorage.getItem(StorageKeys.NAME);
    const storedAvatar = localStorage.getItem(StorageKeys.AVATAR);
    const storedGrade = localStorage.getItem(StorageKeys.GRADE);
    const storedSubj = localStorage.getItem(StorageKeys.SUBJECT);
    const storedXp = localStorage.getItem(StorageKeys.XP);

    if (storedName && storedGrade && storedSubj) {
        userProfile.name = storedName;
        userProfile.avatar = storedAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${storedName}&backgroundColor=1e293b`;
        userProfile.grade = storedGrade;
        userProfile.subject = storedSubj;
        userProfile.xp = storedXp ? parseInt(storedXp) : 0;
        return true;
    }
    return false;
}

function saveProfile() {
    localStorage.setItem(StorageKeys.NAME, userProfile.name);
    localStorage.setItem(StorageKeys.AVATAR, userProfile.avatar);
    localStorage.setItem(StorageKeys.GRADE, userProfile.grade);
    localStorage.setItem(StorageKeys.SUBJECT, userProfile.subject);
    localStorage.setItem(StorageKeys.XP, userProfile.xp);
}

function resetProgress() {
    if (confirm("Are you sure you want to completely erase your progress?")) {
        localStorage.clear();
        window.location.reload();
    }
}