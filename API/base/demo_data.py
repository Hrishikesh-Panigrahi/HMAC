"""Sample answers to one question, used by the tests and the seed_demo_assignment command.

Every answer covers the same topic with the same vocabulary. Only two pairs involve
copying: "copied_from_aarav" is Aarav's answer with a few OCR-style slips, and
"partly_from_meera" reuses three of Meera's sentences.
"""

TITLE = "Demo: Photosynthesis (sample data)"

# Question paper plus the textbook definition most students reproduce.
REFERENCE_TEXT = (
    "Q1. Explain the process of photosynthesis and describe the role of chlorophyll. "
    "Photosynthesis is the process by which green plants make their own food using sunlight, "
    "water and carbon dioxide."
)

ANSWERS = {
    "aarav": (
        "Aarav Shah",
        "Photosynthesis is the process by which green plants make their own food using sunlight, water and "
        "carbon dioxide. It mostly happens in the leaves, inside small structures called chloroplasts. The "
        "chloroplasts contain a green pigment named chlorophyll which traps the energy of sunlight. Using this "
        "energy the plant splits water into hydrogen and oxygen. The oxygen escapes into the air through tiny "
        "pores called stomata. The hydrogen is combined with carbon dioxide taken from the air to make glucose. "
        "Glucose is used by the plant for energy and extra glucose is stored as starch. Without chlorophyll the "
        "plant cannot capture light, so photosynthesis would stop and the plant would not be able to grow.",
    ),
    "copied_from_aarav": (
        "Kabir Mehta",
        "Photosynthesis is the process by which green plants make their own food using sunlight, water and "
        "carbon dioxide. It mostly happens in the leaves, inside small structures called chloroplast. The "
        "chloroplasts contain a green pigment named chlorophyll which traps the energy of the sun. Using this "
        "energy the plant splits water in to hydrogen and oxygen. The oxygen escapes into the air through tiny "
        "pores called stomata. The hydrogen is combined with carbon dioxide taken from the air to make glucose. "
        "Glucose is used by the plant for energy and extra glucose is kept as starch. Without chlorophyll the "
        "plant can not capture light, so photosynthesis would stop.",
    ),
    "meera": (
        "Meera Iyer",
        "Plants are autotrophs, which means they prepare their food themselves. In photosynthesis the leaf "
        "absorbs light with the help of chlorophyll, the pigment that gives leaves their green colour. Water "
        "reaches the leaf from the roots through the xylem, while carbon dioxide enters from the atmosphere "
        "through the stomata. Inside the chloroplast, light energy is changed into chemical energy and glucose "
        "is formed. Oxygen is released as a by-product, which is why plants are important for all living "
        "things. The overall equation is six carbon dioxide plus six water gives one glucose and six oxygen. "
        "Chlorophyll is essential because only it can absorb the red and blue parts of light.",
    ),
    "partly_from_meera": (
        "Diya Nair",
        "Plants are autotrophs, which means they prepare their food themselves. Photosynthesis takes place "
        "mainly in the green leaves of a plant. Water reaches the leaf from the roots through the xylem, while "
        "carbon dioxide enters from the atmosphere through the stomata. The sunlight is captured by chlorophyll "
        "and used to make sugar. Oxygen is released as a by-product, which is why plants are important for all "
        "living things. My teacher showed us an experiment where a leaf kept in the dark did not make any "
        "starch, which proves that light is needed. So chlorophyll and sunlight are both necessary for the plant.",
    ),
    "rohan": (
        "Rohan Das",
        "Green plants use sunlight to make glucose from carbon dioxide and water, and they give out oxygen. This "
        "happens in the chloroplasts of leaf cells. Chlorophyll is a green coloured substance present in the "
        "chloroplasts and its job is to absorb light energy. The light energy is used in two stages. In the "
        "light reaction water molecules are broken and oxygen is released. In the dark reaction, also called "
        "the Calvin cycle, carbon dioxide is fixed to form sugar. The sugar is then transported to other parts "
        "of the plant through the phloem. Factors like light intensity, temperature and amount of carbon "
        "dioxide affect the rate of photosynthesis.",
    ),
    "sana": (
        "Sana Khan",
        "Explain the process of photosynthesis and describe the role of chlorophyll. Photosynthesis is how a "
        "plant feeds itself. The roots take in water and minerals from the soil and the leaves take in carbon "
        "dioxide from the air. When sunlight falls on the leaves, chlorophyll absorbs it and the plant converts "
        "water and carbon dioxide into glucose and oxygen. The glucose gives the plant energy to grow and some "
        "of it is changed into starch for later. The oxygen that plants release is what humans and animals "
        "breathe. Chlorophyll is very important because it is the only part of the leaf that can trap sunlight.",
    ),
}

# Pairs that really involve copying; every other pair was written independently.
COPIED_PAIRS = {("copied_from_aarav", "aarav"), ("partly_from_meera", "meera")}
