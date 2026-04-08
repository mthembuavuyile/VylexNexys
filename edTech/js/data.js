const StorageKeys = {
    GRADE: 'vylex_edtech_grade',
    SUBJECT: 'vylex_edtech_sub',
    XP: 'vylex_edtech_xp'
};

const curriculumData = {
    "Maths": {
        id: "tab-math", label: "Mathematics", color: "brand",
        modules: [
            { id: "m1", title: "Differential Calculus", desc: "First principles, limits, and derivative rules.", progress: 33 },
            { id: "m2", title: "Analytical Geometry", desc: "Coordinate geometry, circles, and tangents.", progress: 0 },
            { id: "m3", title: "Trigonometry 3D", desc: "Compound angles and 3D problem solving.", progress: 0 }
        ],
        bossLevels: [{ id: "b1", title: "Maths Paper 1 - Nov 2023", desc: "Algebra, Calculus, Sequences", xp: 500 }]
    },
    "Science": {
        id: "tab-science", label: "Physical Sciences", color: "blue",
        modules: [
            { id: "s1", title: "Work, Energy & Power", desc: "Work-energy theorem and conservation laws.", progress: 0 },
            { id: "s2", title: "Organic Chemistry", desc: "Macromolecules, nomenclature, and reactions.", progress: 0 }
        ],
        bossLevels: []
    },
    "Tech": {
        id: "tab-tech", label: "Tech & IT", color: "indigo",
        modules: [
            { id: "t1", title: "Database Architecture", desc: "Relational databases, SQL queries, and normalization.", progress: 0 },
            { id: "t2", title: "Algorithmic Logic", desc: "Data structures, loops, and conditional flow.", progress: 0 }
        ],
        bossLevels: []
    }
};

const labsData = [
    { id: "l1", title: "Electrodynamics Simulator", desc: "Build AC/DC motors and generators in 3D.", icon: "cpu", color: "blue" },
    { id: "l2", title: "Chemical Titration", desc: "Virtual titration setup with real-time indicators.", icon: "droplet", color: "emerald" },
    { id: "l3", title: "Projectile Motion", desc: "Launch varied masses and track parabolas.", icon: "crosshair", color: "orange" }
];

let userProfile = { grade: null, subject: null, xp: 0 };

function loadProfile() {
    const storedGrade = localStorage.getItem(StorageKeys.GRADE);
    const storedSubj = localStorage.getItem(StorageKeys.SUBJECT);
    const storedXp = localStorage.getItem(StorageKeys.XP);

    if (storedGrade && storedSubj) {
        userProfile.grade = storedGrade;
        userProfile.subject = storedSubj;
        userProfile.xp = storedXp ? parseInt(storedXp) : 0;
        return true;
    }
    return false;
}

function saveProfile() {
    localStorage.setItem(StorageKeys.GRADE, userProfile.grade);
    localStorage.setItem(StorageKeys.SUBJECT, userProfile.subject);
    localStorage.setItem(StorageKeys.XP, userProfile.xp);
}

function resetProgress() {
    if (confirm("Are you sure you want to completely erase your progress?")) {
        localStorage.removeItem(StorageKeys.GRADE);
        localStorage.removeItem(StorageKeys.SUBJECT);
        localStorage.removeItem(StorageKeys.XP);
        window.location.reload();
    }
}