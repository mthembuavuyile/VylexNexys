/**
 * VYLEX NEXYS EdTech — Curriculum Data Registry
 * Single source of truth for all subjects, topics, and modules.
 */

const CURRICULUM = {
    mathematics: {
        id: 'mathematics', label: 'Mathematics', icon: 'fa-square-root-variable',
        colorVar: '--et-math', color: '#8b5cf6',
        topics: [
            { id: 'math-algebra', label: 'Algebra', modules: [
                { id: 'math-alg-01', title: 'Expressions & Equations', desc: 'Simplify, factorise, and solve algebraic expressions.' },
                { id: 'math-alg-02', title: 'Inequalities', desc: 'Linear and quadratic inequalities on a number line.' },
                { id: 'math-alg-03', title: 'Exponents & Surds', desc: 'Laws of exponents and surd operations.' }
            ]},
            { id: 'math-functions', label: 'Functions', modules: [
                { id: 'math-fn-01', title: 'Linear & Quadratic Functions', desc: 'Graphs, intercepts, turning points, and transformations.' },
                { id: 'math-fn-02', title: 'Exponential & Logarithmic', desc: 'Growth/decay and logarithmic functions.' },
                { id: 'math-fn-03', title: 'Hyperbolic & Inverse Functions', desc: 'Asymptotes, domains, and finding inverses.' }
            ]},
            { id: 'math-trigonometry', label: 'Trigonometry', modules: [
                { id: 'math-trig-01', title: 'Trig Ratios & Identities', desc: 'Sin, cos, tan identities and reduction formulae.' },
                { id: 'math-trig-02', title: 'Trig Equations', desc: 'Solve general trigonometric equations.' },
                { id: 'math-trig-03', title: 'Compound & Double Angles', desc: 'Compound angle identities and applications.' },
                { id: 'math-trig-04', title: '2D & 3D Trigonometry', desc: 'Sine and cosine rules in real-world problems.' }
            ]},
            { id: 'math-calculus', label: 'Calculus', badge: 'Gr 12', modules: [
                { id: 'math-calc-01', title: 'First Principles', desc: 'Limits and the definition of the derivative.' },
                { id: 'math-calc-02', title: 'Differentiation Rules', desc: 'Power rule, product/quotient rules, chain rule.' },
                { id: 'math-calc-03', title: 'Cubic Functions', desc: 'Sketch cubic graphs using calculus techniques.' },
                { id: 'math-calc-04', title: 'Applications of Calculus', desc: 'Rates of change and optimisation problems.' }
            ]},
            { id: 'math-statistics', label: 'Statistics', modules: [
                { id: 'math-stat-01', title: 'Data Handling', desc: 'Mean, median, mode, range, standard deviation.' },
                { id: 'math-stat-02', title: 'Regression & Correlation', desc: 'Scatter plots and least squares regression.' },
                { id: 'math-stat-03', title: 'Probability', desc: 'Counting principles, Venn diagrams, tree diagrams.' }
            ]},
            { id: 'math-exam-prep', label: 'Exam Prep & Past Papers', isExamPrep: true, modules: [
                { id: 'math-exam-01', title: 'Paper 1 Practice', desc: 'Algebra, Functions, Sequences, Calculus.' },
                { id: 'math-exam-02', title: 'Paper 2 Practice', desc: 'Geometry, Trigonometry, Statistics.' },
                { id: 'math-exam-03', title: 'NSC Past Papers', desc: 'Full past papers with memo walkthroughs.' }
            ]}
        ]
    },

    physical_sciences: {
        id: 'physical_sciences', label: 'Physical Sciences', icon: 'fa-atom',
        colorVar: '--et-physics', color: '#3b82f6',
        sections: [
            { id: 'physics', label: 'Physics', icon: 'fa-bolt', colorVar: '--et-physics', color: '#3b82f6',
              topics: [
                { id: 'phys-mechanics', label: 'Mechanics', modules: [
                    { id: 'phys-mech-01', title: "Newton's Laws", desc: 'Forces, free-body diagrams, applications.' },
                    { id: 'phys-mech-02', title: 'Work, Energy & Power', desc: 'Work-energy theorem and conservation.' },
                    { id: 'phys-mech-03', title: 'Vertical Projectile Motion', desc: 'Free-fall and equations of motion.' }
                ]},
                { id: 'phys-electricity', label: 'Electricity', modules: [
                    { id: 'phys-elec-01', title: 'Electric Circuits', desc: "Ohm's law, series/parallel, internal resistance." },
                    { id: 'phys-elec-02', title: 'Electrodynamics', desc: 'Generators, motors, alternating current.' },
                    { id: 'phys-elec-03', title: 'Electrostatics', desc: "Coulomb's law, electric fields, charge." }
                ]},
                { id: 'phys-waves', label: 'Waves & Sound', modules: [
                    { id: 'phys-wav-01', title: 'Transverse & Longitudinal Waves', desc: 'Properties, superposition, standing waves.' },
                    { id: 'phys-wav-02', title: 'Sound Waves', desc: 'Pitch, loudness, and resonance.' },
                    { id: 'phys-wav-03', title: 'EM Radiation', desc: 'Photoelectric effect and EM spectrum.' }
                ]},
                { id: 'phys-momentum', label: 'Momentum', modules: [
                    { id: 'phys-mom-01', title: 'Momentum & Impulse', desc: 'Conservation and impulse-momentum theorem.' },
                    { id: 'phys-mom-02', title: 'Collisions', desc: 'Elastic and inelastic collisions.' }
                ]},
                { id: 'phys-doppler', label: 'Doppler Effect', modules: [
                    { id: 'phys-dop-01', title: 'Doppler Effect', desc: 'Frequency shifts for moving sources/observers.' },
                    { id: 'phys-dop-02', title: 'Applications', desc: 'Radar, medical imaging, astronomy.' }
                ]}
            ]},
            { id: 'chemistry', label: 'Chemistry', icon: 'fa-flask', colorVar: '--et-chemistry', color: '#06b6d4',
              topics: [
                { id: 'chem-organic', label: 'Organic Chemistry', modules: [
                    { id: 'chem-org-01', title: 'Nomenclature & Structure', desc: 'IUPAC naming, functional groups, isomers.' },
                    { id: 'chem-org-02', title: 'Reactions & Mechanisms', desc: 'Addition, elimination, substitution.' },
                    { id: 'chem-org-03', title: 'Polymers', desc: 'Plastics, proteins, polymerisation.' }
                ]},
                { id: 'chem-change', label: 'Chemical Change', modules: [
                    { id: 'chem-chg-01', title: 'Rates of Reaction', desc: 'Factors affecting rate and collision theory.' },
                    { id: 'chem-chg-02', title: 'Chemical Equilibrium', desc: "Le Chatelier's principle and Kc." }
                ]},
                { id: 'chem-acids', label: 'Acids & Bases', modules: [
                    { id: 'chem-ab-01', title: 'Acid-Base Reactions', desc: 'Strong/weak acids, pH, neutralisation.' },
                    { id: 'chem-ab-02', title: 'Titrations', desc: 'Volumetric analysis and indicators.' }
                ]},
                { id: 'chem-electrochem', label: 'Electrochemistry', modules: [
                    { id: 'chem-ec-01', title: 'Galvanic Cells', desc: 'Voltaic cells, potentials, cell notation.' },
                    { id: 'chem-ec-02', title: 'Electrolytic Cells', desc: "Electrolysis and Faraday's laws." }
                ]},
                { id: 'chem-stoichiometry', label: 'Stoichiometry', modules: [
                    { id: 'chem-stoi-01', title: 'Moles & Molar Mass', desc: "Avogadro's number and concentrations." },
                    { id: 'chem-stoi-02', title: 'Balanced Equations', desc: 'Limiting reagents and percentage yield.' }
                ]}
            ]}
        ],
        examPrep: { id: 'physci-exam-prep', label: 'Exam Prep & Past Papers', isExamPrep: true, modules: [
            { id: 'physci-exam-01', title: 'Paper 1 (Physics)', desc: 'Mechanics, Waves, Electricity.' },
            { id: 'physci-exam-02', title: 'Paper 2 (Chemistry)', desc: 'Organic, Acids & Bases, Electrochemistry.' },
            { id: 'physci-exam-03', title: 'NSC Past Papers', desc: 'Full past papers with memos.' }
        ]}
    },

    life_sciences: {
        id: 'life_sciences', label: 'Life Sciences', icon: 'fa-dna',
        colorVar: '--et-lifesci', color: '#10b981',
        topics: [
            { id: 'ls-genetics', label: 'Genetics', modules: [
                { id: 'ls-gen-01', title: 'Mendelian Genetics', desc: 'Punnett squares, dominance, inheritance.' },
                { id: 'ls-gen-02', title: 'Genetic Engineering', desc: 'Biotechnology, cloning, GMOs.' },
                { id: 'ls-gen-03', title: 'Mutations', desc: 'Gene and chromosomal mutations.' }
            ]},
            { id: 'ls-evolution', label: 'Evolution', modules: [
                { id: 'ls-evo-01', title: 'Natural Selection', desc: "Darwin's theory, adaptation, speciation." },
                { id: 'ls-evo-02', title: 'Human Evolution', desc: 'Hominid fossils and cranial capacity.' },
                { id: 'ls-evo-03', title: 'Evidence for Evolution', desc: 'Fossil record and molecular evidence.' }
            ]},
            { id: 'ls-human-systems', label: 'Human Systems', modules: [
                { id: 'ls-hs-01', title: 'Nervous System', desc: 'Neurons, reflex arcs, the brain.' },
                { id: 'ls-hs-02', title: 'Endocrine System', desc: 'Hormones and feedback mechanisms.' },
                { id: 'ls-hs-03', title: 'Circulatory System', desc: 'Heart, blood vessels, blood.' },
                { id: 'ls-hs-04', title: 'Reproductive System', desc: 'Gametogenesis, fertilisation, pregnancy.' }
            ]},
            { id: 'ls-ecology', label: 'Ecology', modules: [
                { id: 'ls-eco-01', title: 'Biosphere & Ecosystems', desc: 'Biomes, food webs, energy flow.' },
                { id: 'ls-eco-02', title: 'Population Ecology', desc: 'Growth curves and carrying capacity.' },
                { id: 'ls-eco-03', title: 'Human Impact', desc: 'Pollution, conservation, sustainability.' }
            ]},
            { id: 'ls-dna-cells', label: 'DNA & Cells', modules: [
                { id: 'ls-dc-01', title: 'Cell Structure', desc: 'Organelles, membranes, cell theory.' },
                { id: 'ls-dc-02', title: 'DNA & Protein Synthesis', desc: 'Transcription, translation, genetic code.' },
                { id: 'ls-dc-03', title: 'Meiosis & Mitosis', desc: 'Stages of cell division.' }
            ]},
            { id: 'ls-exam-prep', label: 'Exam Prep & Past Papers', isExamPrep: true, modules: [
                { id: 'ls-exam-01', title: 'Paper 1 Practice', desc: 'Cells, DNA, Genetics, Human Systems.' },
                { id: 'ls-exam-02', title: 'Paper 2 Practice', desc: 'Ecology, Evolution, Environment.' },
                { id: 'ls-exam-03', title: 'NSC Past Papers', desc: 'Full past papers with memos.' }
            ]}
        ]
    },

    cat: {
        id: 'cat', label: 'Computer Applications Technology', shortLabel: 'CAT',
        icon: 'fa-laptop-code', colorVar: '--et-cat', color: '#f59e0b',
        topics: [
            { id: 'cat-office', label: 'Microsoft Office', modules: [
                { id: 'cat-off-01', title: 'Word Processing', desc: 'Formatting, styles, tables, mail merge.' },
                { id: 'cat-off-02', title: 'Presentations', desc: 'Slide design, transitions, multimedia.' }
            ]},
            { id: 'cat-html', label: 'HTML Basics', modules: [
                { id: 'cat-html-01', title: 'HTML Structure & Tags', desc: 'Elements, attributes, page structure.' },
                { id: 'cat-html-02', title: 'CSS Styling', desc: 'Selectors, properties, basic layouts.' }
            ]},
            { id: 'cat-spreadsheets', label: 'Spreadsheets', modules: [
                { id: 'cat-ss-01', title: 'Formulas & Functions', desc: 'SUM, AVERAGE, IF, VLOOKUP, COUNTIF.' },
                { id: 'cat-ss-02', title: 'Charts & Data Analysis', desc: 'Chart types, pivot tables, validation.' },
                { id: 'cat-ss-03', title: 'Advanced Techniques', desc: 'Conditional formatting and nested functions.' }
            ]},
            { id: 'cat-database', label: 'Database Concepts', modules: [
                { id: 'cat-db-01', title: 'Database Fundamentals', desc: 'Tables, fields, records, data types.' },
                { id: 'cat-db-02', title: 'Queries & Reports', desc: 'SQL basics, criteria, report generation.' }
            ]},
            { id: 'cat-pat', label: 'Practical Tasks (PAT Prep)', isExamPrep: true, modules: [
                { id: 'cat-pat-01', title: 'PAT Phase 1', desc: 'Research and planning.' },
                { id: 'cat-pat-02', title: 'PAT Phase 2', desc: 'Implementation and documentation.' },
                { id: 'cat-pat-03', title: 'Exam Practice', desc: 'Theory papers and past papers.' }
            ]}
        ]
    },

    egd: {
        id: 'egd', label: 'Engineering Graphics and Design', shortLabel: 'EGD',
        icon: 'fa-compass-drafting', colorVar: '--et-egd', color: '#ef4444',
        topics: [
            { id: 'egd-technical', label: 'Technical Drawing', modules: [
                { id: 'egd-td-01', title: 'Drawing Conventions', desc: 'Line types, scales, dimensioning.' },
                { id: 'egd-td-02', title: 'Geometric Constructions', desc: 'Tangents, loci, geometric figures.' }
            ]},
            { id: 'egd-isometric', label: 'Isometric Drawings', modules: [
                { id: 'egd-iso-01', title: 'Isometric Views', desc: '3D objects on isometric grids.' },
                { id: 'egd-iso-02', title: 'Isometric Curves', desc: 'Ellipses and curved surfaces.' }
            ]},
            { id: 'egd-orthographic', label: 'Orthographic Projection', modules: [
                { id: 'egd-orth-01', title: '1st & 3rd Angle Projection', desc: 'Multi-view drawings and methods.' },
                { id: 'egd-orth-02', title: 'Sectional Views', desc: 'Full/half sections and hatching.' }
            ]},
            { id: 'egd-cad', label: 'CAD Concepts', modules: [
                { id: 'egd-cad-01', title: 'CAD Fundamentals', desc: 'Intro to computer-aided design.' },
                { id: 'egd-cad-02', title: '3D Modelling', desc: 'Solid modelling and rendering.' }
            ]},
            { id: 'egd-civil-mech', label: 'Civil / Mechanical Drawings', modules: [
                { id: 'egd-cm-01', title: 'Civil Working Drawings', desc: 'Floor plans, elevations, site plans.' },
                { id: 'egd-cm-02', title: 'Mechanical Assembly', desc: 'Assembly drawings and parts lists.' }
            ]},
            { id: 'egd-exam-prep', label: 'Exam Prep & Past Papers', isExamPrep: true, modules: [
                { id: 'egd-exam-01', title: 'Paper 1 Practice', desc: 'Civil technology drawing tasks.' },
                { id: 'egd-exam-02', title: 'Paper 2 Practice', desc: 'Mechanical technology drawing tasks.' },
                { id: 'egd-exam-03', title: 'NSC Past Papers', desc: 'Full past papers with memos.' }
            ]}
        ]
    },

    agricultural_sciences: {
        id: 'agricultural_sciences', label: 'Agricultural Sciences', shortLabel: 'Agri Sciences',
        icon: 'fa-seedling', colorVar: '--et-agrisci', color: '#84cc16',
        topics: [
            { id: 'agri-animal', label: 'Animal Production', modules: [
                { id: 'agri-ap-01', title: 'Animal Nutrition', desc: 'Digestive systems, feed composition, rations.' },
                { id: 'agri-ap-02', title: 'Animal Reproduction', desc: 'Reproductive cycles, AI, breeding.' },
                { id: 'agri-ap-03', title: 'Animal Health', desc: 'Diseases, parasites, farm management.' }
            ]},
            { id: 'agri-soil', label: 'Soil Science', modules: [
                { id: 'agri-ss-01', title: 'Soil Formation & Properties', desc: 'Profiles, texture, structure, pH.' },
                { id: 'agri-ss-02', title: 'Soil Fertility', desc: 'Nutrient cycles, fertilisers, conservation.' }
            ]},
            { id: 'agri-plant', label: 'Plant Studies', modules: [
                { id: 'agri-ps-01', title: 'Plant Physiology', desc: 'Photosynthesis, respiration, transpiration.' },
                { id: 'agri-ps-02', title: 'Crop Production', desc: 'Planting, irrigation, pest control.' },
                { id: 'agri-ps-03', title: 'Plant Genetics', desc: 'Selection, hybridisation, GM crops.' }
            ]},
            { id: 'agri-management', label: 'Agricultural Management', modules: [
                { id: 'agri-mg-01', title: 'Farm Planning & Economics', desc: 'Budgets, records, marketing.' },
                { id: 'agri-mg-02', title: 'Agricultural Technology', desc: 'Mechanisation and precision farming.' }
            ]},
            { id: 'agri-sustainability', label: 'Sustainability', modules: [
                { id: 'agri-sus-01', title: 'Sustainable Agriculture', desc: 'Organic farming and climate-smart practices.' },
                { id: 'agri-sus-02', title: 'Environmental Impact', desc: 'Deforestation, water, biodiversity.' }
            ]},
            { id: 'agri-exam-prep', label: 'Exam Prep & Past Papers', isExamPrep: true, modules: [
                { id: 'agri-exam-01', title: 'Paper 1 Practice', desc: 'Animal production, nutrition, reproduction.' },
                { id: 'agri-exam-02', title: 'Paper 2 Practice', desc: 'Soil science, plants, management.' },
                { id: 'agri-exam-03', title: 'NSC Past Papers', desc: 'Full past papers with memos.' }
            ]}
        ]
    }
};

/** Get all subject keys */
function getSubjectKeys() { return Object.keys(CURRICULUM); }

/** Count total modules in a subject */
function countModules(subjectKey) {
    const s = CURRICULUM[subjectKey];
    if (!s) return 0;
    let c = 0;
    if (s.sections) {
        s.sections.forEach(sec => sec.topics.forEach(t => c += t.modules.length));
        if (s.examPrep) c += s.examPrep.modules.length;
    } else {
        s.topics.forEach(t => c += t.modules.length);
    }
    return c;
}
