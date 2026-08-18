import random, csv, copy

random.seed(7)

# ---------------------------------------------------------------------------
# Exact vocabulary taken verbatim from the app worksheet (Sheet 1 & Sheet 2)
# ---------------------------------------------------------------------------
COMORBIDITIES = ["Diabetes", "Hypertension", "Migraine", "Anxiety or stress disorders",
                  "Autoimmune disorders", "Panic episodes", "Anaemia", "Cardiac arrythmia"]

PRESENTING = ["Vertigo", "Dizziness/ Light headedness", "Unsteadiness", "Oscillopsia", "Not sure"]

TRIGGERS = ["Head movements", "Changes in middle ear pressure (Coughing, defecation)",
            "Loud sounds", "During ascend or descend in air travel", "Visual Stimuli",
            "Anxiety or stress"]

ASSOCIATED = ["Nausea", "Vomiting", "Ear Symptoms", "Headache", "Photophobia/ phonophobia",
              "Fever", "Neck stiffness", "Cerebellar symptoms", "Cranial nerve dysfunction symptoms",
              "Dyspnoea", "Palpitation"]

EAR_SYMPTOMS = ["Hearing loss", "Tinnitus", "Aural fullness", "Otorrhea", "Otalgia"]

CEREBELLAR = ["Unsteady gait/ difficulty walking straight", "Dysarthria",
              "Difficulty combing hair", "Weakness of limbs"]

CRANIAL = ["Hyposmia", "Blurring of vision", "Diplopia", "Loss of sensation on face",
           "Incomplete closure of eye", "Deviation of angle of mouth at rest or when asked to smile",
           "Alteration of taste", "Difficulty swallowing", "Dysphonia",
           "Difficulty movements of neck or shrugging of shoulder",
           "Difficulty movements of tongue"]

DRUG_HISTORY_CATS = ["Antiepileptics", "Antipsychotics", "Ototoxic Drugs", "None of the above"]
ANTIEPILEPTICS = ["Carbamazepine", "Phenytoin", "Valproate", "Lamotrigine", "Gabapentine",
                   "Vigabatrin", "Oxcarbazepine", "Others"]
ANTIPSYCHOTICS = ["Chlorpromazine", "Haloperidol", "Thioridazine", "Risperidone", "Olanzapine",
                   "Quetiapine", "Clozapine", "Others"]
OTOTOXIC_DRUGS = ["Cisplatin", "Carboplatin", "Aminoglycosides", "Loop diuretics", "Quinine",
                   "Erythromycin", "Aspirin", "Vancomycin", "Others"]

POST_ONSET_MEDS = ["Benzodiazepines", "Labyrinthine sedatives (Cinnarizine, Meclizine, Procholorperazine, etc)",
                    "Betahistine", "None of the above"]

DUR_UNITS_TOTAL = ["Minutes", "Hours", "Days", "Months", "Years"]
DUR_UNITS_EPISODE = ["Seconds", "Minutes", "Hours", "Days"]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def weighted_choice(weight_dict):
    items = list(weight_dict.keys())
    weights = list(weight_dict.values())
    return random.choices(items, weights=weights, k=1)[0]

def bernoulli_subset(prob_dict, baseline_noise=0.02, min_select=0):
    """Return list of items selected independently by their probability, with
    small background noise added for items not in prob_dict (realism)."""
    chosen = []
    for item, p in prob_dict.items():
        if random.random() < p:
            chosen.append(item)
    if min_select and not chosen:
        # force at least one from the highest-probability items
        best = max(prob_dict, key=prob_dict.get)
        chosen.append(best)
    return chosen

def rand_int(rng):
    lo, hi = rng
    return random.randint(lo, hi)

DEFAULT_COMORBID_BASELINE = {c: 0.05 for c in COMORBIDITIES}
DEFAULT_ASSOCIATED_BASELINE = {a: 0.03 for a in ASSOCIATED}
DEFAULT_TRIGGER_BASELINE = {t: 0.03 for t in TRIGGERS}

def merged(base, override):
    d = dict(base)
    d.update(override)
    return d

# ---------------------------------------------------------------------------
# Per-diagnosis clinical profiles
# ---------------------------------------------------------------------------
PROFILES = {}

def add(name, **kw):
    PROFILES[name] = kw

# ---- 1. BPPV -----------------------------------------------------------
add("BPPV",
    age_range=(50, 80), sex_weights={"Male": 0.35, "Female": 0.62, "Others": 0.03},
    comorbid_probs=merged(DEFAULT_COMORBID_BASELINE, {}),
    presenting_weights={"Vertigo": 0.9, "Dizziness/ Light headedness": 0.08, "Not sure": 0.02},
    onset_weights={"Sudden": 1.0},
    duration_total_options=[("Hours", (1, 20)), ("Days", (1, 10))],
    sensation_weights={"Spinning": 1.0},
    episodic="Episodic",
    episode_duration_options=[("Seconds", (10, 59)), ("Minutes", (1, 5))],
    remission_weights={"Complete": 1.0},
    trigger_probs=merged(DEFAULT_TRIGGER_BASELINE, {"Head movements": 0.95}),
    head_trigger_weights={"Triggered": 0.85, "Aggravated": 0.15},
    head_injury_prob=0.15,
    associated_probs=merged(DEFAULT_ASSOCIATED_BASELINE, {"Nausea": 0.6, "Vomiting": 0.3}),
    ear_sub_probs={}, cerebellar_sub_probs={}, cranial_sub_probs={},
    drug_history_weights={"None of the above": 0.9, "Ototoxic Drugs": 0.05,
                           "Antiepileptics": 0.03, "Antipsychotics": 0.02},
    post_onset_weights={"Labyrinthine sedatives (Cinnarizine, Meclizine, Procholorperazine, etc)": 0.4,
                         "Betahistine": 0.25, "Benzodiazepines": 0.1, "None of the above": 0.25})

# ---- 2. Recurrent BPPV --------------------------------------------------
p = copy.deepcopy(PROFILES["BPPV"])
p["duration_total_options"] = [("Months", (2, 24)), ("Years", (1, 5))]
p["age_range"] = (55, 85)
add("Recurrent BPPV", **p)

# ---- 3. Vestibular Neuritis ---------------------------------------------
add("Vestibular Neuritis",
    age_range=(30, 65), sex_weights={"Male": 0.5, "Female": 0.48, "Others": 0.02},
    comorbid_probs=DEFAULT_COMORBID_BASELINE,
    presenting_weights={"Vertigo": 0.92, "Dizziness/ Light headedness": 0.06, "Not sure": 0.02},
    onset_weights={"Sudden": 1.0},
    duration_total_options=[("Minutes", (30, 59)), ("Hours", (1, 48)), ("Days", (1, 4))],
    sensation_weights={"Spinning": 1.0},
    episodic="Persistent",
    episode_duration_options=[], remission_weights={},
    trigger_probs=merged(DEFAULT_TRIGGER_BASELINE, {"Head movements": 0.5}),
    head_trigger_weights={"Aggravated": 0.9, "Triggered": 0.1},
    head_injury_prob=0.03,
    associated_probs=merged(DEFAULT_ASSOCIATED_BASELINE, {"Nausea": 0.75, "Vomiting": 0.55}),
    ear_sub_probs={}, cerebellar_sub_probs={}, cranial_sub_probs={},
    drug_history_weights={"None of the above": 0.95, "Ototoxic Drugs": 0.02,
                           "Antiepileptics": 0.02, "Antipsychotics": 0.01},
    post_onset_weights={"Labyrinthine sedatives (Cinnarizine, Meclizine, Procholorperazine, etc)": 0.45,
                         "Benzodiazepines": 0.2, "Betahistine": 0.15, "None of the above": 0.2},
    other_history_note="Recent URI common (not a direct app field)")

# ---- 4. Pseudo Vestibular Neuritis (central mimic, e.g. cerebellar stroke) -
add("Pseudo Vestibular Neuritis",
    age_range=(55, 85), sex_weights={"Male": 0.55, "Female": 0.43, "Others": 0.02},
    comorbid_probs=merged(DEFAULT_COMORBID_BASELINE,
                           {"Hypertension": 0.55, "Diabetes": 0.35, "Cardiac arrythmia": 0.2}),
    presenting_weights={"Vertigo": 0.6, "Unsteadiness": 0.3, "Dizziness/ Light headedness": 0.1},
    onset_weights={"Sudden": 1.0},
    duration_total_options=[("Hours", (1, 48)), ("Days", (1, 7))],
    sensation_weights={"Spinning": 0.55, "Back and Forth": 0.45},
    episodic="Persistent",
    episode_duration_options=[], remission_weights={},
    trigger_probs=merged(DEFAULT_TRIGGER_BASELINE, {"Head movements": 0.3}),
    head_trigger_weights={"Aggravated": 0.8, "Triggered": 0.2},
    head_injury_prob=0.03,
    associated_probs=merged(DEFAULT_ASSOCIATED_BASELINE,
                             {"Nausea": 0.6, "Vomiting": 0.4, "Headache": 0.3,
                              "Cerebellar symptoms": 0.55, "Cranial nerve dysfunction symptoms": 0.25}),
    ear_sub_probs={},
    cerebellar_sub_probs={"Unsteady gait/ difficulty walking straight": 0.85, "Dysarthria": 0.35,
                            "Difficulty combing hair": 0.15, "Weakness of limbs": 0.3},
    cranial_sub_probs={"Diplopia": 0.4, "Blurring of vision": 0.3, "Dysphonia": 0.15,
                        "Difficulty swallowing": 0.15},
    drug_history_weights={"None of the above": 0.95, "Antiepileptics": 0.02,
                           "Antipsychotics": 0.02, "Ototoxic Drugs": 0.01},
    post_onset_weights={"Benzodiazepines": 0.2, "Labyrinthine sedatives (Cinnarizine, Meclizine, Procholorperazine, etc)": 0.3,
                         "Betahistine": 0.1, "None of the above": 0.4})

# ---- 5/6. Acute Labyrinthitis Right / Left -------------------------------
for side in ["Right", "Left"]:
    add(f"Acute  Labyrinthitis {side}",
        age_range=(25, 65), sex_weights={"Male": 0.5, "Female": 0.48, "Others": 0.02},
        comorbid_probs=DEFAULT_COMORBID_BASELINE,
        presenting_weights={"Vertigo": 0.9, "Dizziness/ Light headedness": 0.08, "Not sure": 0.02},
        onset_weights={"Sudden": 1.0},
        duration_total_options=[("Minutes", (30, 59)), ("Hours", (1, 48)), ("Days", (1, 5))],
        sensation_weights={"Spinning": 1.0},
        episodic="Persistent",
        episode_duration_options=[], remission_weights={},
        trigger_probs=merged(DEFAULT_TRIGGER_BASELINE, {"Head movements": 0.5}),
        head_trigger_weights={"Aggravated": 0.9, "Triggered": 0.1},
        head_injury_prob=0.03,
        associated_probs=merged(DEFAULT_ASSOCIATED_BASELINE,
                                 {"Nausea": 0.75, "Vomiting": 0.55, "Ear Symptoms": 0.85}),
        ear_sub_probs={"Hearing loss": 0.8, "Tinnitus": 0.55, "Aural fullness": 0.2,
                       "Otorrhea": 0.05, "Otalgia": 0.05},
        hl_laterality={f"Unilateral {side}": 1.0},
        hl_onset={"Sudden": 0.8, "Insidious": 0.2},
        hl_timing={"With or Following vertigo": 1.0},
        hl_progression={"Non progressive": 0.5, "Progressive": 0.5},
        cerebellar_sub_probs={}, cranial_sub_probs={},
        drug_history_weights={"None of the above": 0.92, "Ototoxic Drugs": 0.04,
                               "Antiepileptics": 0.02, "Antipsychotics": 0.02},
        post_onset_weights={"Labyrinthine sedatives (Cinnarizine, Meclizine, Procholorperazine, etc)": 0.4,
                             "Benzodiazepines": 0.2, "Betahistine": 0.2, "None of the above": 0.2})

# ---- 7/8. Meniere's disease Left / Right ----------------------------------
for side in ["Left", "Right"]:
    add(f"Menieres disease {side}",
        age_range=(35, 65), sex_weights={"Male": 0.48, "Female": 0.5, "Others": 0.02},
        comorbid_probs=merged(DEFAULT_COMORBID_BASELINE, {"Migraine": 0.15}),
        presenting_weights={"Vertigo": 0.92, "Dizziness/ Light headedness": 0.06, "Not sure": 0.02},
        onset_weights={"Sudden": 1.0},
        duration_total_options=[("Hours", (1, 24)), ("Days", (1, 10)), ("Months", (1, 36)),
                                  ("Years", (1, 10))],
        sensation_weights={"Spinning": 1.0},
        episodic="Episodic",
        episode_duration_options=[("Minutes", (20, 59)), ("Hours", (1, 23)), ("Days", (1, 1))],
        remission_weights={"Complete": 1.0},
        trigger_probs=merged(DEFAULT_TRIGGER_BASELINE, {"Head movements": 0.35}),
        head_trigger_weights={"Aggravated": 0.85, "Triggered": 0.15},
        head_injury_prob=0.02,
        associated_probs=merged(DEFAULT_ASSOCIATED_BASELINE,
                                 {"Nausea": 0.75, "Vomiting": 0.55, "Ear Symptoms": 0.95}),
        ear_sub_probs={"Hearing loss": 0.9, "Tinnitus": 0.75, "Aural fullness": 0.7,
                       "Otorrhea": 0.02, "Otalgia": 0.03},
        hl_laterality={f"Unilateral {side}": 0.85, "Bilateral": 0.15},
        hl_onset={"Sudden": 0.35, "Insidious": 0.65},
        hl_timing={"With or Following vertigo": 1.0},
        hl_progression={"Fluctuating": 1.0},
        cerebellar_sub_probs={}, cranial_sub_probs={},
        drug_history_weights={"None of the above": 0.94, "Ototoxic Drugs": 0.02,
                               "Antiepileptics": 0.02, "Antipsychotics": 0.02},
        post_onset_weights={"Betahistine": 0.5, "Labyrinthine sedatives (Cinnarizine, Meclizine, Procholorperazine, etc)": 0.25,
                             "Benzodiazepines": 0.1, "None of the above": 0.15})

# ---- 9. PPPD --------------------------------------------------------------
add("Persistent Postural Perceptual Dizziness (PPPD)",
    age_range=(25, 60), sex_weights={"Male": 0.35, "Female": 0.62, "Others": 0.03},
    comorbid_probs=merged(DEFAULT_COMORBID_BASELINE,
                           {"Anxiety or stress disorders": 0.55, "Panic episodes": 0.2, "Migraine": 0.2}),
    presenting_weights={"Unsteadiness": 0.5, "Dizziness/ Light headedness": 0.4, "Vertigo": 0.1},
    onset_weights={"Gradual": 1.0},
    duration_total_options=[("Months", (3, 36)), ("Years", (1, 8))],
    sensation_weights={"Back and Forth": 0.75, "Spinning": 0.25},
    episodic="Persistent",
    episode_duration_options=[], remission_weights={},
    trigger_probs=merged(DEFAULT_TRIGGER_BASELINE,
                          {"Visual Stimuli": 0.8, "Anxiety or stress": 0.75, "Head movements": 0.4}),
    head_trigger_weights={"Aggravated": 0.9, "Triggered": 0.1},
    head_injury_prob=0.05,
    associated_probs=merged(DEFAULT_ASSOCIATED_BASELINE, {"Nausea": 0.3, "Photophobia/ phonophobia": 0.2}),
    ear_sub_probs={}, cerebellar_sub_probs={}, cranial_sub_probs={},
    drug_history_weights={"None of the above": 0.85, "Antiepileptics": 0.03,
                           "Antipsychotics": 0.05, "Ototoxic Drugs": 0.02, "": 0.0},
    post_onset_weights={"Benzodiazepines": 0.2, "None of the above": 0.5,
                         "Labyrinthine sedatives (Cinnarizine, Meclizine, Procholorperazine, etc)": 0.15,
                         "Betahistine": 0.15})

# ---- 10/11/12. Ototoxicity Left / Right / Bilateral -----------------------
for side, lat_map in [("Left", {"Unilateral Left": 1.0}),
                        ("Right", {"Unilateral Right": 1.0}),
                        ("Bilateral", {"Bilateral": 1.0})]:
    name = f"Ototoxicity {side}" if side != "Bilateral" else "Bilateral Ototoxicity"
    add(name,
        age_range=(20, 75), sex_weights={"Male": 0.5, "Female": 0.48, "Others": 0.02},
        comorbid_probs=DEFAULT_COMORBID_BASELINE,
        presenting_weights={"Vertigo": 0.5, "Unsteadiness": 0.3, "Dizziness/ Light headedness": 0.2},
        onset_weights={"Sudden": 0.5, "Gradual": 0.5},
        duration_total_options=[("Hours", (1, 24)), ("Days", (1, 20)), ("Months", (1, 6))],
        sensation_weights={"Spinning": 0.5, "Back and Forth": 0.5},
        episodic="Persistent",
        episode_duration_options=[], remission_weights={},
        trigger_probs=merged(DEFAULT_TRIGGER_BASELINE, {"Head movements": 0.6}),
        head_trigger_weights={"Aggravated": 0.9, "Triggered": 0.1},
        head_injury_prob=0.02,
        associated_probs=merged(DEFAULT_ASSOCIATED_BASELINE,
                                 {"Nausea": 0.5, "Vomiting": 0.3, "Ear Symptoms": 0.85}),
        ear_sub_probs={"Hearing loss": 0.85, "Tinnitus": 0.6, "Aural fullness": 0.35,
                       "Otorrhea": 0.02, "Otalgia": 0.02},
        hl_laterality=lat_map,
        hl_onset={"Sudden": 0.3, "Insidious": 0.7},
        hl_timing={"With or Following vertigo": 1.0},
        hl_progression={"Progressive": 1.0},
        cerebellar_sub_probs={}, cranial_sub_probs={},
        drug_history_weights={"Ototoxic Drugs": 0.9, "None of the above": 0.06,
                               "Antiepileptics": 0.02, "Antipsychotics": 0.02},
        ototoxic_drug_weights={"Aminoglycosides": 0.35, "Cisplatin": 0.2, "Loop diuretics": 0.15,
                                 "Quinine": 0.1, "Vancomycin": 0.08, "Carboplatin": 0.05,
                                 "Erythromycin": 0.04, "Aspirin": 0.02, "Others": 0.01},
        post_onset_weights={"Labyrinthine sedatives (Cinnarizine, Meclizine, Procholorperazine, etc)": 0.3,
                             "Betahistine": 0.2, "Benzodiazepines": 0.1, "None of the above": 0.4})

# ---- 13. Vestibular migraine ----------------------------------------------
add("Vestibular migraine",
    age_range=(20, 55), sex_weights={"Male": 0.25, "Female": 0.73, "Others": 0.02},
    comorbid_probs=merged(DEFAULT_COMORBID_BASELINE,
                           {"Migraine": 0.8, "Anxiety or stress disorders": 0.25}),
    presenting_weights={"Vertigo": 0.55, "Dizziness/ Light headedness": 0.35, "Unsteadiness": 0.1},
    onset_weights={"Sudden": 1.0},
    duration_total_options=[("Hours", (1, 48)), ("Days", (1, 3))],
    sensation_weights={"Spinning": 0.55, "Back and Forth": 0.45},
    episodic="Episodic",
    episode_duration_options=[("Minutes", (5, 59)), ("Hours", (1, 71))],
    remission_weights={"Complete": 1.0},
    trigger_probs=merged(DEFAULT_TRIGGER_BASELINE,
                          {"Head movements": 0.5, "Visual Stimuli": 0.55, "Loud sounds": 0.4,
                           "Anxiety or stress": 0.4}),
    head_trigger_weights={"Triggered": 0.5, "Aggravated": 0.5},
    head_injury_prob=0.03,
    associated_probs=merged(DEFAULT_ASSOCIATED_BASELINE,
                             {"Nausea": 0.65, "Vomiting": 0.35, "Headache": 0.85,
                              "Photophobia/ phonophobia": 0.65, "Ear Symptoms": 0.25}),
    ear_sub_probs={"Aural fullness": 0.5, "Tinnitus": 0.35, "Hearing loss": 0.1,
                   "Otorrhea": 0.02, "Otalgia": 0.03},
    hl_laterality={"Unilateral Left": 0.4, "Unilateral Right": 0.4, "Bilateral": 0.2},
    hl_onset={"Insidious": 0.7, "Sudden": 0.3},
    hl_timing={"Preexisting": 0.3, "With or Following vertigo": 0.7},
    hl_progression={"Non progressive": 0.7, "Fluctuating": 0.3},
    cerebellar_sub_probs={"Unsteady gait/ difficulty walking straight": 0.5},
    cranial_sub_probs={},
    drug_history_weights={"None of the above": 0.85, "Antiepileptics": 0.06,
                           "Antipsychotics": 0.04, "Ototoxic Drugs": 0.05},
    post_onset_weights={"Benzodiazepines": 0.1, "Betahistine": 0.15,
                         "Labyrinthine sedatives (Cinnarizine, Meclizine, Procholorperazine, etc)": 0.3,
                         "None of the above": 0.45})

# ---- 14. SCDS ---------------------------------------------------------------
add("Sup SCC Dehiscence synd (SCDS)",
    age_range=(30, 60), sex_weights={"Male": 0.5, "Female": 0.48, "Others": 0.02},
    comorbid_probs=DEFAULT_COMORBID_BASELINE,
    presenting_weights={"Vertigo": 0.55, "Oscillopsia": 0.25, "Dizziness/ Light headedness": 0.2},
    onset_weights={"Sudden": 0.5, "Gradual": 0.5},
    duration_total_options=[("Seconds", (5, 59)), ("Minutes", (1, 30)), ("Hours", (1, 5)),
                              ("Days", (1, 3))],
    sensation_weights={"Spinning": 1.0},
    episodic="Episodic",
    episode_duration_options=[("Seconds", (1, 59)), ("Minutes", (1, 30)), ("Hours", (1, 3)),
                                ("Days", (1, 2))],
    remission_weights={"Complete": 1.0},
    trigger_probs=merged(DEFAULT_TRIGGER_BASELINE,
                          {"Loud sounds": 0.7, "Changes in middle ear pressure (Coughing, defecation)": 0.65}),
    head_trigger_weights={"Aggravated": 1.0},
    head_injury_prob=0.05,
    associated_probs=merged(DEFAULT_ASSOCIATED_BASELINE,
                             {"Nausea": 0.4, "Vomiting": 0.2, "Photophobia/ phonophobia": 0.15,
                              "Ear Symptoms": 0.85}),
    ear_sub_probs={"Hearing loss": 0.75, "Tinnitus": 0.5, "Aural fullness": 0.55,
                   "Otorrhea": 0.02, "Otalgia": 0.03},
    hl_laterality={"Bilateral": 0.4, "Unilateral Left": 0.3, "Unilateral Right": 0.3},
    hl_onset={"Insidious": 0.8, "Sudden": 0.2},
    hl_timing={"Preexisting": 0.7, "With or Following vertigo": 0.3},
    hl_progression={"Progressive": 0.6, "Non progressive": 0.4},
    cerebellar_sub_probs={}, cranial_sub_probs={},
    drug_history_weights={"None of the above": 0.92, "Antiepileptics": 0.03,
                           "Antipsychotics": 0.02, "Ototoxic Drugs": 0.03},
    post_onset_weights={"None of the above": 0.55, "Benzodiazepines": 0.1,
                         "Labyrinthine sedatives (Cinnarizine, Meclizine, Procholorperazine, etc)": 0.2,
                         "Betahistine": 0.15})

# ---- 15. Alternobaric vertigo ------------------------------------------------
add("Alternobaric vertigo",
    age_range=(18, 50), sex_weights={"Male": 0.6, "Female": 0.38, "Others": 0.02},
    comorbid_probs=DEFAULT_COMORBID_BASELINE,
    presenting_weights={"Vertigo": 0.9, "Dizziness/ Light headedness": 0.1},
    onset_weights={"Sudden": 1.0},
    duration_total_options=[("Minutes", (1, 30)), ("Hours", (1, 3))],
    sensation_weights={"Spinning": 1.0},
    episodic="Episodic",
    episode_duration_options=[("Seconds", (10, 59)), ("Minutes", (1, 20))],
    remission_weights={"Complete": 1.0},
    trigger_probs=merged(DEFAULT_TRIGGER_BASELINE,
                          {"During ascend or descend in air travel": 0.95}),
    head_trigger_weights={}, head_injury_prob=0.02,
    associated_probs=merged(DEFAULT_ASSOCIATED_BASELINE,
                             {"Nausea": 0.5, "Vomiting": 0.2, "Ear Symptoms": 0.6}),
    ear_sub_probs={"Aural fullness": 0.7, "Otalgia": 0.4, "Tinnitus": 0.2, "Hearing loss": 0.1,
                   "Otorrhea": 0.02},
    hl_laterality={"Unilateral Left": 0.5, "Unilateral Right": 0.5},
    hl_onset={"Sudden": 1.0}, hl_timing={"With or Following vertigo": 1.0},
    hl_progression={"Non progressive": 1.0},
    cerebellar_sub_probs={}, cranial_sub_probs={},
    drug_history_weights={"None of the above": 0.95, "Antiepileptics": 0.02,
                           "Antipsychotics": 0.01, "Ototoxic Drugs": 0.02},
    post_onset_weights={"None of the above": 0.7, "Labyrinthine sedatives (Cinnarizine, Meclizine, Procholorperazine, etc)": 0.15,
                         "Benzodiazepines": 0.05, "Betahistine": 0.1})

# ---- 16. Vestibular paroxysmia -----------------------------------------------
add("Vestibular paroxysmia",
    age_range=(40, 70), sex_weights={"Male": 0.5, "Female": 0.48, "Others": 0.02},
    comorbid_probs=DEFAULT_COMORBID_BASELINE,
    presenting_weights={"Vertigo": 0.85, "Dizziness/ Light headedness": 0.15},
    onset_weights={"Sudden": 1.0},
    duration_total_options=[("Seconds", (1, 59)), ("Minutes", (1, 5))],
    sensation_weights={"Spinning": 0.6, "Back and Forth": 0.4},
    episodic="Episodic",
    episode_duration_options=[("Seconds", (1, 59))],
    remission_weights={"Complete": 1.0},
    trigger_probs=merged(DEFAULT_TRIGGER_BASELINE,
                          {"Head movements": 0.6, "Changes in middle ear pressure (Coughing, defecation)": 0.3,
                           "Loud sounds": 0.3}),
    head_trigger_weights={"Triggered": 0.9, "Aggravated": 0.1},
    head_injury_prob=0.02,
    associated_probs=merged(DEFAULT_ASSOCIATED_BASELINE,
                             {"Nausea": 0.3, "Vomiting": 0.15, "Ear Symptoms": 0.5, "Headache": 0.15,
                              "Photophobia/ phonophobia": 0.15}),
    ear_sub_probs={"Hearing loss": 0.5, "Tinnitus": 0.5, "Aural fullness": 0.2,
                   "Otorrhea": 0.02, "Otalgia": 0.02},
    hl_laterality={"Unilateral Left": 0.5, "Unilateral Right": 0.5},
    hl_onset={"Sudden": 0.8, "Insidious": 0.2},
    hl_timing={"With or Following vertigo": 1.0},
    hl_progression={"Fluctuating hearing loss": 0.6, "Non progressive": 0.4},
    cerebellar_sub_probs={}, cranial_sub_probs={},
    drug_history_weights={"None of the above": 0.9, "Antiepileptics": 0.05,
                           "Antipsychotics": 0.02, "Ototoxic Drugs": 0.03},
    post_onset_weights={"None of the above": 0.6, "Benzodiazepines": 0.1,
                         "Labyrinthine sedatives (Cinnarizine, Meclizine, Procholorperazine, etc)": 0.15,
                         "Betahistine": 0.15})

# ---- 17. Central causes (stroke / tumour / demyelination) -------------------
add("Central causes",
    age_range=(50, 85), sex_weights={"Male": 0.55, "Female": 0.43, "Others": 0.02},
    comorbid_probs=merged(DEFAULT_COMORBID_BASELINE,
                           {"Hypertension": 0.6, "Diabetes": 0.35, "Cardiac arrythmia": 0.25}),
    presenting_weights={"Vertigo": 0.4, "Unsteadiness": 0.35, "Dizziness/ Light headedness": 0.2,
                          "Oscillopsia": 0.05},
    onset_weights={"Sudden": 0.7, "Gradual": 0.3},
    duration_total_options=[("Hours", (1, 48)), ("Days", (1, 30)), ("Months", (1, 12))],
    sensation_weights={"Spinning": 0.4, "Back and Forth": 0.6},
    episodic="Persistent",
    episode_duration_options=[], remission_weights={},
    trigger_probs=merged(DEFAULT_TRIGGER_BASELINE, {"Head movements": 0.2}),
    head_trigger_weights={"Aggravated": 0.9, "Triggered": 0.1},
    head_injury_prob=0.05,
    associated_probs=merged(DEFAULT_ASSOCIATED_BASELINE,
                             {"Headache": 0.4, "Cerebellar symptoms": 0.6,
                              "Cranial nerve dysfunction symptoms": 0.45, "Nausea": 0.4, "Vomiting": 0.25}),
    ear_sub_probs={},
    cerebellar_sub_probs={"Unsteady gait/ difficulty walking straight": 0.85, "Dysarthria": 0.45,
                            "Weakness of limbs": 0.4, "Difficulty combing hair": 0.15},
    cranial_sub_probs={"Diplopia": 0.4, "Blurring of vision": 0.35, "Loss of sensation on face": 0.2,
                        "Dysphonia": 0.2, "Difficulty swallowing": 0.2,
                        "Deviation of angle of mouth at rest or when asked to smile": 0.15},
    drug_history_weights={"None of the above": 0.9, "Antiepileptics": 0.04,
                           "Antipsychotics": 0.03, "Ototoxic Drugs": 0.03},
    post_onset_weights={"None of the above": 0.5, "Benzodiazepines": 0.2,
                         "Labyrinthine sedatives (Cinnarizine, Meclizine, Procholorperazine, etc)": 0.15,
                         "Betahistine": 0.15})

# ---- 18. Perilymph Fistula ---------------------------------------------------
add("Perilymph Fistula",
    age_range=(20, 55), sex_weights={"Male": 0.55, "Female": 0.43, "Others": 0.02},
    comorbid_probs=DEFAULT_COMORBID_BASELINE,
    presenting_weights={"Vertigo": 0.75, "Dizziness/ Light headedness": 0.15, "Unsteadiness": 0.1},
    onset_weights={"Sudden": 1.0},
    duration_total_options=[("Hours", (1, 48)), ("Days", (1, 5))],
    sensation_weights={"Spinning": 1.0},
    episodic="Episodic",
    episode_duration_options=[("Minutes", (1, 59)), ("Hours", (1, 5))],
    remission_weights={"Partial with reduced severity": 0.5, "Complete": 0.5},
    trigger_probs=merged(DEFAULT_TRIGGER_BASELINE,
                          {"Changes in middle ear pressure (Coughing, defecation)": 0.75,
                           "Loud sounds": 0.4, "Head movements": 0.3}),
    head_trigger_weights={"Triggered": 0.5, "Aggravated": 0.5},
    head_injury_prob=0.5,
    associated_probs=merged(DEFAULT_ASSOCIATED_BASELINE,
                             {"Nausea": 0.4, "Vomiting": 0.2, "Ear Symptoms": 0.7}),
    ear_sub_probs={"Hearing loss": 0.65, "Tinnitus": 0.5, "Aural fullness": 0.3,
                   "Otorrhea": 0.05, "Otalgia": 0.05},
    hl_laterality={"Unilateral Left": 0.5, "Unilateral Right": 0.5},
    hl_onset={"Sudden": 0.8, "Insidious": 0.2},
    hl_timing={"With or Following vertigo": 1.0},
    hl_progression={"Non progressive": 0.5, "Progressive": 0.3, "Fluctuating hearing loss": 0.2},
    cerebellar_sub_probs={}, cranial_sub_probs={},
    drug_history_weights={"None of the above": 0.93, "Antiepileptics": 0.02,
                           "Antipsychotics": 0.02, "Ototoxic Drugs": 0.03},
    post_onset_weights={"None of the above": 0.5, "Labyrinthine sedatives (Cinnarizine, Meclizine, Procholorperazine, etc)": 0.2,
                         "Benzodiazepines": 0.1, "Betahistine": 0.2})

# ---- 19. Autoimmune inner ear disease ----------------------------------------
add("Autoimmune",
    age_range=(20, 55), sex_weights={"Male": 0.3, "Female": 0.68, "Others": 0.02},
    comorbid_probs=merged(DEFAULT_COMORBID_BASELINE, {"Autoimmune disorders": 0.7}),
    presenting_weights={"Vertigo": 0.5, "Unsteadiness": 0.3, "Dizziness/ Light headedness": 0.2},
    onset_weights={"Sudden": 0.4, "Gradual": 0.6},
    duration_total_options=[("Days", (5, 30)), ("Months", (1, 12)), ("Years", (1, 4))],
    sensation_weights={"Spinning": 0.5, "Back and Forth": 0.5},
    episodic="Episodic",
    episode_duration_options=[("Days", (1, 20)), ("Hours", (1, 23))],
    remission_weights={"Partial with reduced severity": 0.6, "Complete": 0.4},
    trigger_probs=merged(DEFAULT_TRIGGER_BASELINE, {"Head movements": 0.3}),
    head_trigger_weights={"Aggravated": 0.7, "Triggered": 0.3},
    head_injury_prob=0.02,
    associated_probs=merged(DEFAULT_ASSOCIATED_BASELINE,
                             {"Nausea": 0.35, "Vomiting": 0.2, "Ear Symptoms": 0.85}),
    ear_sub_probs={"Hearing loss": 0.85, "Tinnitus": 0.5, "Aural fullness": 0.3,
                   "Otorrhea": 0.02, "Otalgia": 0.05},
    hl_laterality={"Bilateral": 0.6, "Unilateral Left": 0.2, "Unilateral Right": 0.2},
    hl_onset={"Insidious": 0.6, "Sudden": 0.4},
    hl_timing={"With or Following vertigo": 0.7, "Preexisting": 0.3},
    hl_progression={"Progressive": 0.7, "Fluctuating hearing loss": 0.3},
    cerebellar_sub_probs={}, cranial_sub_probs={},
    drug_history_weights={"None of the above": 0.9, "Antiepileptics": 0.03,
                           "Antipsychotics": 0.03, "Ototoxic Drugs": 0.04},
    post_onset_weights={"None of the above": 0.5, "Betahistine": 0.2,
                         "Labyrinthine sedatives (Cinnarizine, Meclizine, Procholorperazine, etc)": 0.15,
                         "Benzodiazepines": 0.15})

# ---------------------------------------------------------------------------
# Additional diagnoses (not in the source sheet, added for broader training coverage)
# ---------------------------------------------------------------------------

add("Orthostatic Hypotension",
    age_range=(55, 90), sex_weights={"Male": 0.48, "Female": 0.5, "Others": 0.02},
    comorbid_probs=merged(DEFAULT_COMORBID_BASELINE,
                           {"Diabetes": 0.4, "Cardiac arrythmia": 0.3, "Anaemia": 0.25, "Hypertension": 0.4}),
    presenting_weights={"Dizziness/ Light headedness": 0.85, "Unsteadiness": 0.1, "Vertigo": 0.05},
    onset_weights={"Sudden": 0.8, "Gradual": 0.2},
    duration_total_options=[("Minutes", (1, 30)), ("Months", (1, 24))],
    sensation_weights={"Back and Forth": 0.9, "Spinning": 0.1},
    episodic="Episodic",
    episode_duration_options=[("Seconds", (10, 59)), ("Minutes", (1, 5))],
    remission_weights={"Complete": 1.0},
    trigger_probs=merged(DEFAULT_TRIGGER_BASELINE, {}),
    head_trigger_weights={}, head_injury_prob=0.02,
    associated_probs=merged(DEFAULT_ASSOCIATED_BASELINE, {"Palpitation": 0.3, "Nausea": 0.15}),
    ear_sub_probs={}, cerebellar_sub_probs={}, cranial_sub_probs={},
    drug_history_weights={"None of the above": 0.85, "Antiepileptics": 0.05,
                           "Antipsychotics": 0.06, "Ototoxic Drugs": 0.04},
    post_onset_weights={"None of the above": 0.75, "Benzodiazepines": 0.05,
                         "Labyrinthine sedatives (Cinnarizine, Meclizine, Procholorperazine, etc)": 0.1,
                         "Betahistine": 0.1},
    trigger_note="Positional (lying/sitting to standing) — closest listed trigger left blank / none")

add("Panic Disorder",
    age_range=(18, 45), sex_weights={"Male": 0.3, "Female": 0.68, "Others": 0.02},
    comorbid_probs=merged(DEFAULT_COMORBID_BASELINE,
                           {"Anxiety or stress disorders": 0.7, "Panic episodes": 0.75}),
    presenting_weights={"Dizziness/ Light headedness": 0.65, "Unsteadiness": 0.25, "Vertigo": 0.1},
    onset_weights={"Sudden": 0.9, "Gradual": 0.1},
    duration_total_options=[("Months", (1, 24)), ("Years", (1, 5))],
    sensation_weights={"Back and Forth": 0.85, "Spinning": 0.15},
    episodic="Episodic",
    episode_duration_options=[("Minutes", (5, 30)), ("Hours", (1, 2))],
    remission_weights={"Complete": 1.0},
    trigger_probs=merged(DEFAULT_TRIGGER_BASELINE, {"Anxiety or stress": 0.9, "Visual Stimuli": 0.2}),
    head_trigger_weights={}, head_injury_prob=0.02,
    associated_probs=merged(DEFAULT_ASSOCIATED_BASELINE, {"Dyspnoea": 0.6, "Palpitation": 0.65, "Nausea": 0.3}),
    ear_sub_probs={}, cerebellar_sub_probs={}, cranial_sub_probs={},
    drug_history_weights={"None of the above": 0.75, "Antiepileptics": 0.05,
                           "Antipsychotics": 0.15, "Ototoxic Drugs": 0.05},
    post_onset_weights={"Benzodiazepines": 0.35, "None of the above": 0.45,
                         "Labyrinthine sedatives (Cinnarizine, Meclizine, Procholorperazine, etc)": 0.1,
                         "Betahistine": 0.1})

add("Motion sickness",
    age_range=(10, 45), sex_weights={"Male": 0.4, "Female": 0.58, "Others": 0.02},
    comorbid_probs=merged(DEFAULT_COMORBID_BASELINE, {"Migraine": 0.2}),
    presenting_weights={"Dizziness/ Light headedness": 0.55, "Vertigo": 0.15, "Unsteadiness": 0.3},
    onset_weights={"Sudden": 1.0},
    duration_total_options=[("Minutes", (10, 59)), ("Hours", (1, 6))],
    sensation_weights={"Back and Forth": 0.8, "Spinning": 0.2},
    episodic="Episodic",
    episode_duration_options=[("Minutes", (10, 59)), ("Hours", (1, 6))],
    remission_weights={"Complete": 1.0},
    trigger_probs=merged(DEFAULT_TRIGGER_BASELINE, {"Visual Stimuli": 0.75}),
    head_trigger_weights={}, head_injury_prob=0.01,
    associated_probs=merged(DEFAULT_ASSOCIATED_BASELINE, {"Nausea": 0.85, "Vomiting": 0.5, "Headache": 0.2}),
    ear_sub_probs={}, cerebellar_sub_probs={}, cranial_sub_probs={},
    drug_history_weights={"None of the above": 0.95, "Antiepileptics": 0.01,
                           "Antipsychotics": 0.01, "Ototoxic Drugs": 0.03},
    post_onset_weights={"Labyrinthine sedatives (Cinnarizine, Meclizine, Procholorperazine, etc)": 0.5,
                         "None of the above": 0.35, "Benzodiazepines": 0.05, "Betahistine": 0.1})

add("Bilateral Vestibulopathy",
    age_range=(55, 85), sex_weights={"Male": 0.5, "Female": 0.48, "Others": 0.02},
    comorbid_probs=merged(DEFAULT_COMORBID_BASELINE, {"Diabetes": 0.3, "Autoimmune disorders": 0.15}),
    presenting_weights={"Unsteadiness": 0.55, "Oscillopsia": 0.3, "Dizziness/ Light headedness": 0.15},
    onset_weights={"Gradual": 0.8, "Sudden": 0.2},
    duration_total_options=[("Months", (3, 36)), ("Years", (1, 10))],
    sensation_weights={"Back and Forth": 0.9, "Spinning": 0.1},
    episodic="Persistent",
    episode_duration_options=[], remission_weights={},
    trigger_probs=merged(DEFAULT_TRIGGER_BASELINE, {"Head movements": 0.5, "Visual Stimuli": 0.3}),
    head_trigger_weights={"Aggravated": 1.0}, head_injury_prob=0.03,
    associated_probs=merged(DEFAULT_ASSOCIATED_BASELINE,
                             {"Ear Symptoms": 0.3, "Cerebellar symptoms": 0.35, "Nausea": 0.15}),
    ear_sub_probs={"Hearing loss": 0.4, "Tinnitus": 0.3, "Aural fullness": 0.1, "Otorrhea": 0.02, "Otalgia": 0.02},
    hl_laterality={"Bilateral": 1.0},
    hl_onset={"Insidious": 0.85, "Sudden": 0.15},
    hl_timing={"Preexisting": 0.5, "With or Following vertigo": 0.5},
    hl_progression={"Progressive": 0.6, "Non progressive": 0.4},
    cerebellar_sub_probs={"Unsteady gait/ difficulty walking straight": 0.9, "Weakness of limbs": 0.1},
    cranial_sub_probs={},
    drug_history_weights={"Ototoxic Drugs": 0.35, "None of the above": 0.55,
                           "Antiepileptics": 0.05, "Antipsychotics": 0.05},
    ototoxic_drug_weights={"Aminoglycosides": 0.6, "Cisplatin": 0.2, "Loop diuretics": 0.1,
                             "Vancomycin": 0.05, "Others": 0.05},
    post_onset_weights={"None of the above": 0.6, "Labyrinthine sedatives (Cinnarizine, Meclizine, Procholorperazine, etc)": 0.15,
                         "Benzodiazepines": 0.1, "Betahistine": 0.15})

add("Cervicogenic Vertigo",
    age_range=(30, 65), sex_weights={"Male": 0.45, "Female": 0.53, "Others": 0.02},
    comorbid_probs=DEFAULT_COMORBID_BASELINE,
    presenting_weights={"Dizziness/ Light headedness": 0.45, "Unsteadiness": 0.35, "Vertigo": 0.2},
    onset_weights={"Sudden": 0.5, "Gradual": 0.5},
    duration_total_options=[("Days", (1, 30)), ("Weeks".replace("Weeks", "Months"), (1, 6))],
    sensation_weights={"Back and Forth": 0.75, "Spinning": 0.25},
    episodic="Episodic",
    episode_duration_options=[("Minutes", (5, 59)), ("Hours", (1, 4))],
    remission_weights={"Complete": 0.6, "Partial with reduced severity": 0.4},
    trigger_probs=merged(DEFAULT_TRIGGER_BASELINE, {"Head movements": 0.85}),
    head_trigger_weights={"Triggered": 0.7, "Aggravated": 0.3},
    head_injury_prob=0.35,
    associated_probs=merged(DEFAULT_ASSOCIATED_BASELINE, {"Neck stiffness": 0.75, "Headache": 0.4, "Nausea": 0.2}),
    ear_sub_probs={}, cerebellar_sub_probs={}, cranial_sub_probs={},
    drug_history_weights={"None of the above": 0.92, "Antiepileptics": 0.03,
                           "Antipsychotics": 0.02, "Ototoxic Drugs": 0.03},
    post_onset_weights={"None of the above": 0.6, "Benzodiazepines": 0.15,
                         "Labyrinthine sedatives (Cinnarizine, Meclizine, Procholorperazine, etc)": 0.15,
                         "Betahistine": 0.1})

add("Vertebrobasilar Insufficiency",
    age_range=(55, 85), sex_weights={"Male": 0.58, "Female": 0.4, "Others": 0.02},
    comorbid_probs=merged(DEFAULT_COMORBID_BASELINE,
                           {"Hypertension": 0.65, "Diabetes": 0.4, "Cardiac arrythmia": 0.3}),
    presenting_weights={"Vertigo": 0.5, "Unsteadiness": 0.3, "Dizziness/ Light headedness": 0.2},
    onset_weights={"Sudden": 1.0},
    duration_total_options=[("Minutes", (1, 30)), ("Hours", (1, 3))],
    sensation_weights={"Spinning": 0.5, "Back and Forth": 0.5},
    episodic="Episodic",
    episode_duration_options=[("Minutes", (1, 30)), ("Hours", (1, 2))],
    remission_weights={"Complete": 1.0},
    trigger_probs=merged(DEFAULT_TRIGGER_BASELINE, {"Head movements": 0.4}),
    head_trigger_weights={"Triggered": 0.6, "Aggravated": 0.4},
    head_injury_prob=0.02,
    associated_probs=merged(DEFAULT_ASSOCIATED_BASELINE,
                             {"Headache": 0.25, "Cerebellar symptoms": 0.4, "Cranial nerve dysfunction symptoms": 0.35,
                              "Nausea": 0.35, "Vomiting": 0.2}),
    ear_sub_probs={},
    cerebellar_sub_probs={"Unsteady gait/ difficulty walking straight": 0.7, "Dysarthria": 0.3, "Weakness of limbs": 0.3},
    cranial_sub_probs={"Diplopia": 0.45, "Blurring of vision": 0.35, "Loss of sensation on face": 0.15,
                        "Dysphonia": 0.15, "Difficulty swallowing": 0.15},
    drug_history_weights={"None of the above": 0.9, "Antiepileptics": 0.02,
                           "Antipsychotics": 0.03, "Ototoxic Drugs": 0.05},
    post_onset_weights={"None of the above": 0.55, "Benzodiazepines": 0.15,
                         "Labyrinthine sedatives (Cinnarizine, Meclizine, Procholorperazine, etc)": 0.15,
                         "Betahistine": 0.15})

# fix cervicogenic duration_total_options typo (Weeks not a real unit in app)
PROFILES["Cervicogenic Vertigo"]["duration_total_options"] = [("Days", (1, 30)), ("Months", (1, 6))]

# ---------------------------------------------------------------------------
# Sampling one synthetic patient
# ---------------------------------------------------------------------------
DIAGNOSIS_ORDER = [
    "BPPV", "Recurrent BPPV", "Vestibular Neuritis", "Pseudo Vestibular Neuritis",
    "Acute  Labyrinthitis Right", "Acute  Labyrinthitis Left",
    "Menieres disease Left", "Menieres disease Right",
    "Persistent Postural Perceptual Dizziness (PPPD)",
    "Ototoxicity Left", "Ototoxicity Right", "Bilateral Ototoxicity",
    "Vestibular migraine", "Sup SCC Dehiscence synd (SCDS)", "Alternobaric vertigo",
    "Vestibular paroxysmia", "Central causes", "Perilymph Fistula", "Autoimmune",
    "Orthostatic Hypotension", "Panic Disorder", "Motion sickness",
    "Bilateral Vestibulopathy", "Cervicogenic Vertigo", "Vertebrobasilar Insufficiency",
]

MISSING_PROB = 0.05  # probability an individual optional field is left "Not asked / unknown"

def sample_multi(prob_dict, baseline_pool=None, baseline_p=0.02, force_min=0):
    chosen = []
    for item, p in prob_dict.items():
        if random.random() < p:
            chosen.append(item)
    if baseline_pool:
        for item in baseline_pool:
            if item not in prob_dict and random.random() < baseline_p:
                chosen.append(item)
    return chosen

def gen_patient(diag, sample_id):
    prof = PROFILES[diag]
    rec = {"sample_id": sample_id, "diagnosis": diag}

    # Demographics
    rec["age"] = rand_int(prof["age_range"])
    rec["sex"] = weighted_choice(prof["sex_weights"])
    comorbid_chosen = sample_multi(prof["comorbid_probs"])
    rec["comorbidities"] = "; ".join(comorbid_chosen) if comorbid_chosen else "No comorbidities"
    rec["presenting_symptom"] = weighted_choice(prof["presenting_weights"])

    # Q1 onset
    rec["onset"] = weighted_choice(prof["onset_weights"])

    # Q2 total duration
    unit, rng = random.choice(prof["duration_total_options"])
    rec["duration_unit"] = unit
    rec["duration_value"] = rand_int(rng)

    # Q3 sensation
    rec["sensation_type"] = weighted_choice(prof["sensation_weights"])

    # Q4 episodic/persistent
    episodic = prof["episodic"]
    rec["episodic_or_persistent"] = episodic
    if episodic == "Episodic" and prof["episode_duration_options"]:
        eu, erng = random.choice(prof["episode_duration_options"])
        rec["episode_duration_unit"] = eu
        rec["episode_duration_value"] = rand_int(erng)
        rec["remission_between_episodes"] = weighted_choice(prof["remission_weights"]) if prof["remission_weights"] else "NA"
    else:
        rec["episode_duration_unit"] = "NA"
        rec["episode_duration_value"] = "NA"
        rec["remission_between_episodes"] = "NA"

    # Q5 triggers
    triggers_chosen = sample_multi(prof["trigger_probs"])
    if random.random() < MISSING_PROB:
        rec["triggers"] = "Not asked / unknown"
    else:
        rec["triggers"] = "; ".join(triggers_chosen) if triggers_chosen else "None reported / spontaneous"
    if "Head movements" in triggers_chosen and prof.get("head_trigger_weights"):
        rec["head_movement_triggered_or_aggravated"] = weighted_choice(prof["head_trigger_weights"])
    else:
        rec["head_movement_triggered_or_aggravated"] = "NA"
    rec["recent_head_injury"] = "Yes" if random.random() < prof["head_injury_prob"] else "No"

    # Q6 associated complaints
    assoc_chosen = sample_multi(prof["associated_probs"])
    rec["associated_complaints"] = "; ".join(assoc_chosen) if assoc_chosen else "No associated complaints reported"

    # 6A ear symptoms
    if "Ear Symptoms" in assoc_chosen and prof.get("ear_sub_probs"):
        ear_chosen = sample_multi(prof["ear_sub_probs"])
        if not ear_chosen:
            ear_chosen = [max(prof["ear_sub_probs"], key=prof["ear_sub_probs"].get)]
        rec["ear_symptoms_detail"] = "; ".join(ear_chosen)
        if "Hearing loss" in ear_chosen:
            rec["hearing_loss_laterality"] = weighted_choice(prof["hl_laterality"])
            rec["hearing_loss_onset"] = weighted_choice(prof["hl_onset"])
            rec["hearing_loss_timing"] = weighted_choice(prof["hl_timing"])
            rec["hearing_loss_progression"] = weighted_choice(prof["hl_progression"])
        else:
            rec["hearing_loss_laterality"] = "NA"
            rec["hearing_loss_onset"] = "NA"
            rec["hearing_loss_timing"] = "NA"
            rec["hearing_loss_progression"] = "NA"
    else:
        rec["ear_symptoms_detail"] = "NA"
        rec["hearing_loss_laterality"] = "NA"
        rec["hearing_loss_onset"] = "NA"
        rec["hearing_loss_timing"] = "NA"
        rec["hearing_loss_progression"] = "NA"

    # 6B cerebellar
    if "Cerebellar symptoms" in assoc_chosen and prof.get("cerebellar_sub_probs"):
        cer_chosen = sample_multi(prof["cerebellar_sub_probs"])
        if not cer_chosen:
            cer_chosen = [max(prof["cerebellar_sub_probs"], key=prof["cerebellar_sub_probs"].get)]
        rec["cerebellar_symptoms_detail"] = "; ".join(cer_chosen)
    else:
        rec["cerebellar_symptoms_detail"] = "NA"

    # 6C cranial nerve
    if "Cranial nerve dysfunction symptoms" in assoc_chosen and prof.get("cranial_sub_probs"):
        cn_chosen = sample_multi(prof["cranial_sub_probs"])
        if not cn_chosen:
            cn_chosen = [max(prof["cranial_sub_probs"], key=prof["cranial_sub_probs"].get)]
        rec["cranial_nerve_symptoms_detail"] = "; ".join(cn_chosen)
    else:
        rec["cranial_nerve_symptoms_detail"] = "NA"

    # Q7 drug history
    drug_cat = weighted_choice(prof["drug_history_weights"])
    rec["drug_history_category"] = drug_cat
    if drug_cat == "Ototoxic Drugs" and prof.get("ototoxic_drug_weights"):
        rec["drug_history_detail"] = weighted_choice(prof["ototoxic_drug_weights"])
    elif drug_cat == "Antiepileptics":
        rec["drug_history_detail"] = random.choice(ANTIEPILEPTICS)
    elif drug_cat == "Antipsychotics":
        rec["drug_history_detail"] = random.choice(ANTIPSYCHOTICS)
    elif drug_cat == "Ototoxic Drugs":
        rec["drug_history_detail"] = random.choice(OTOTOXIC_DRUGS)
    else:
        rec["drug_history_detail"] = "NA"

    # Q8 post-onset medications
    post_cat = weighted_choice(prof["post_onset_weights"])
    rec["post_onset_medication"] = post_cat

    return rec

# ---------------------------------------------------------------------------
# Generate dataset
# ---------------------------------------------------------------------------
N_PER_DIAGNOSIS = 100
records = []
sid = 1
for diag in DIAGNOSIS_ORDER:
    for _ in range(N_PER_DIAGNOSIS):
        records.append(gen_patient(diag, sid))
        sid += 1

fieldnames = ["sample_id", "diagnosis", "age", "sex", "comorbidities", "presenting_symptom",
              "onset", "duration_unit", "duration_value", "sensation_type",
              "episodic_or_persistent", "episode_duration_unit", "episode_duration_value",
              "remission_between_episodes", "triggers", "head_movement_triggered_or_aggravated",
              "recent_head_injury", "associated_complaints", "ear_symptoms_detail",
              "hearing_loss_laterality", "hearing_loss_onset", "hearing_loss_timing",
              "hearing_loss_progression", "cerebellar_symptoms_detail",
              "cranial_nerve_symptoms_detail", "drug_history_category", "drug_history_detail",
              "post_onset_medication"]

out_path = "/home/claude/vertigo_gen/vertigo_app_training_data.csv"
with open(out_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for rec in records:
        writer.writerow(rec)

print("Generated", len(records), "records across", len(DIAGNOSIS_ORDER), "diagnoses ->", out_path)
