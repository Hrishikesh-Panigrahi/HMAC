"""Independent answers used to tune duplicate detection (see manage.py evaluate_similarity).

Each question has five answers written independently. They deliberately contain
the overlap real answers have: memorised definitions, the law quoted word for word,
the same names and dates. Copies are generated from these by the evaluation.
"""
from . import demo_data

QUESTIONS = {
    "photosynthesis": {
        "reference": "Q1. Explain the process of photosynthesis and describe the role of chlorophyll.",
        "textbook": (
            "Photosynthesis is the process by which green plants make their own food using sunlight, "
            "water and carbon dioxide."
        ),
        "answers": [
            demo_data.ANSWERS["aarav"][1],
            demo_data.ANSWERS["meera"][1],
            demo_data.ANSWERS["rohan"][1],
            demo_data.ANSWERS["sana"][1],
            "During photosynthesis the plant makes food with the help of light. Leaves are broad and flat so that "
            "they can catch as much sunlight as possible. Carbon dioxide from the air enters through small openings "
            "on the underside of the leaf, and water is pulled up from the roots. The green chlorophyll inside the "
            "chloroplasts absorbs light energy and uses it to join carbon dioxide and water into glucose. Oxygen is "
            "given out into the air, which is good for us. The glucose can be turned into starch, cellulose or "
            "proteins. So chlorophyll is like a solar panel for the plant.",
        ],
    },
    "water_cycle": {
        "reference": "Q2. Describe the water cycle and explain why it is important.",
        "answers": [
            "The water cycle is the continuous movement of water between the earth and the atmosphere. The sun heats "
            "water in oceans, rivers and lakes and it turns into water vapour. This is called evaporation. Plants also "
            "release water vapour from their leaves by transpiration. As the vapour rises it cools down and forms tiny "
            "droplets, which join together to make clouds. This is condensation. When the droplets become heavy they "
            "fall as rain, snow or hail, which is precipitation. The water then flows back into rivers and seas or "
            "soaks into the ground. The cycle is important because it gives us fresh water for drinking and farming.",
            "Water keeps moving around our planet in a cycle. First, heat from the sun makes surface water evaporate. "
            "The warm moist air goes up, and high in the sky it becomes cold, so the vapour condenses into clouds. "
            "Winds carry these clouds over land. Later the water comes down again as precipitation. Some of it runs "
            "off the land as surface runoff and reaches the sea, and some sinks underground and becomes groundwater "
            "that we pump from wells. Without this cycle the land would dry up, crops would fail and there would be "
            "no rivers. It also spreads heat around the world and controls the weather.",
            "The water cycle has four main stages: evaporation, condensation, precipitation and collection. In "
            "evaporation liquid water becomes a gas because of the sun's heat. In condensation the gas cools and "
            "turns back into liquid drops that make clouds and fog. Precipitation is when water falls from the "
            "clouds to the ground. Collection means the water gathers in oceans, lakes and underground. Then the "
            "whole thing repeats. It is important for living things since every plant and animal needs water, and "
            "the cycle cleans water too, because salt and dirt are left behind when water evaporates.",
            "The sun is the engine of the water cycle. Every day huge amounts of sea water are heated and change "
            "into invisible vapour. Trees add more vapour through transpiration. Up in the atmosphere the "
            "temperature is low, so the vapour condenses on dust particles and clouds are made. When clouds cannot "
            "hold any more water, it rains. Rain water fills ponds and rivers, recharges the ground water and "
            "finally returns to the ocean. This natural recycling means the same water has been used again and "
            "again for millions of years. We depend on it for agriculture, electricity from dams and our daily needs.",
            "In the water cycle water changes its state and place again and again. Evaporation happens when the sun "
            "warms the oceans. The vapour goes up into the sky, cools and condenses into clouds. Then it falls back "
            "down as rain or snow; this is called precipitation. On land the water may collect in lakes, flow in "
            "rivers, or be taken in by plants. Glaciers and ice caps also store water for a long time. The water "
            "cycle is very important because it provides the fresh water that people and animals need, and it "
            "keeps the balance of water on earth.",
        ],
    },
    "newtons_first_law": {
        "reference": "Q3. State Newton's first law of motion and give two examples from daily life.",
        # The textbook statement several students reproduce word for word.
        "textbook": (
            "An object at rest stays at rest and an object in motion stays in motion with the same speed and in "
            "the same direction unless acted upon by an unbalanced force."
        ),
        "answers": [
            "Newton's first law of motion states that an object at rest stays at rest and an object in motion stays "
            "in motion with the same speed and in the same direction unless acted upon by an unbalanced force. This "
            "is also called the law of inertia. One example is when a bus suddenly starts, the passengers fall "
            "backwards because their bodies want to stay at rest. Another example is when a car stops suddenly and "
            "we move forward, so we should always wear seat belts.",
            "According to the first law, a body will continue in its state of rest or of uniform motion in a "
            "straight line unless an external force makes it change that state. The tendency of things to resist a "
            "change in their motion is called inertia. For example, when we shake a branch of a tree the fruits "
            "fall down, because the branch moves but the fruits try to stay where they were. Also, dust comes out "
            "of a carpet when we beat it with a stick.",
            "Newton's first law says that things do not change their motion by themselves. An object at rest stays "
            "at rest and an object in motion stays in motion unless a force acts on it. Heavier objects have more "
            "inertia than lighter ones. In daily life, if you put a coin on a card over a glass and flick the card "
            "quickly, the coin drops into the glass. When a moving train brakes, the luggage on the racks slides "
            "forward. A football keeps rolling until friction slows it down.",
            "The law of inertia is Newton's first law. It means an object keeps doing what it is doing. If it is "
            "not moving it will not start to move, and if it is moving it will keep moving at the same velocity, "
            "until some unbalanced force pushes or pulls it. When I am riding my bicycle and it hits a stone, I get "
            "thrown forward over the handle. Another example is a hockey puck on ice which slides a long way "
            "because there is very little friction to stop it.",
            "Sir Isaac Newton gave three laws of motion and the first one is about inertia. It states that an "
            "object at rest stays at rest and an object in motion stays in motion with the same speed and in the "
            "same direction unless acted upon by an unbalanced force. Two examples are: a person standing in a bus "
            "falls forward when the driver applies sudden brakes, and a ball placed on the floor will not move "
            "until someone kicks it. In space, a spacecraft keeps moving without engines because nothing slows it "
            "down.",
        ],
    },
    "ww1_causes": {
        "reference": "Q4. Explain the main causes of the First World War.",
        "answers": [
            "The First World War started in 1914 and had many causes. Historians often use the word MAIN to "
            "remember them: militarism, alliances, imperialism and nationalism. The big powers were building huge "
            "armies and navies, especially Britain and Germany. Europe was divided into two alliance systems, so a "
            "small conflict could pull everyone in. Countries also competed for colonies in Africa and Asia. The "
            "immediate cause was the assassination of Archduke Franz Ferdinand in Sarajevo by a Serbian "
            "nationalist, after which Austria-Hungary declared war on Serbia.",
            "There were long term and short term causes of World War One. In the long term, nationalism made "
            "people believe their own nation was superior, and groups like the Slavs wanted independence from "
            "Austria-Hungary. The arms race between Germany and Britain created fear and suspicion. Imperial "
            "rivalry over colonies made relations worse. The short term cause, or spark, was the killing of the "
            "heir to the Austrian throne in June 1914. Because of the alliance system, Russia supported Serbia, "
            "Germany supported Austria, and soon France and Britain were also at war.",
            "The main causes of the First World War were militarism, alliances, imperialism and nationalism. "
            "Militarism means countries believed in having strong armies and were ready to use them. The Triple "
            "Alliance of Germany, Austria-Hungary and Italy faced the Triple Entente of Britain, France and Russia. "
            "Under imperialism the European nations fought for land and resources in other continents. Nationalism "
            "caused tension in the Balkans. Finally the assassination of Archduke Franz Ferdinand in Sarajevo on "
            "28 June 1914 started the war.",
            "No single event caused the Great War. Tension had been growing for years. Germany wanted a place in "
            "the sun and challenged Britain's navy, which led to a naval race with battleships called dreadnoughts. "
            "The Moroccan crises and the Balkan wars showed how dangerous the situation was. When Gavrilo Princip "
            "shot Franz Ferdinand, Austria blamed Serbia and gave it an ultimatum. Secret treaties and war plans "
            "like the Schlieffen Plan meant that mobilisation quickly spread the war across Europe within a few "
            "weeks.",
            "I think the most important cause was the alliance system, because it turned a local quarrel into a "
            "world war. But militarism, imperialism and nationalism also played a big part. Each country had "
            "generals who planned for war and made weapons. Nations were proud and did not want to back down. The "
            "trigger was the assassination of Archduke Franz Ferdinand in Sarajevo, which made Austria-Hungary "
            "attack Serbia. Then one by one the allies joined, and by August 1914 most of Europe was fighting.",
        ],
    },
}
