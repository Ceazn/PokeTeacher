import streamlit as st
import pandas as pd

# Example Meta Pokémon Data
meta_pokemon = pd.DataFrame({
    "Name": ["Chi-Yu", "Gholdengo", "Great Tusk", "Iron Bundle", "Flutter Mane", "Koridon"],
    "Type": [["Dark", "Fire"], ["Steel", "Ghost"], ["Ground", "Fighting"], ["Ice", "Water"], ["Ghost", "Fairy"], ["Dragon", "Fighting"]],
    "Base HP": [55, 87, 115, 56, 55, 100],
    "Base Atk": [120, 60, 131, 80, 55, 135],
    "Base Def": [80, 95, 131, 114, 55, 100],
    "Base SpDef": [120, 133, 53, 60, 135, 100],
})

# Type Effectiveness Table
type_chart = {
    "Fire": {"Water": 2, "Grass": 0.5, "Steel": 0.5, "Fire": 0.5},
    "Dragon": {"Fairy": 2, "Dragon": 2},
    "Fighting": {"Rock": 2, "Steel": 2, "Dark": 2, "Fairy": 0.5},
    # Add all types here
}

# Damage Calculation Formula
def calculate_damage(attacker, defender, move, weather=None, level=50, ev_spread=None, item=None):
    # Power and stats
    power = move["Power"]
    atk_stat = attacker["Base Atk"] + (ev_spread.get("Atk", 0) if ev_spread else 0)
    def_stat = defender["Base Def"] + (ev_spread.get("Def", 0) if ev_spread else 0)
    hp = defender["Base HP"] + (ev_spread.get("HP", 0) if ev_spread else 0)

    # Weather boosts
    if weather == "Sun" and move["Type"] == "Fire":
        power *= 1.5
    elif weather == "Rain" and move["Type"] == "Water":
        power *= 1.5

    # Item effects
    if item == "Life Orb":
        power *= 1.3

    # Type Effectiveness
    type_effectiveness = 1
    for defender_type in defender["Type"]:
        type_effectiveness *= type_chart.get(move["Type"], {}).get(defender_type, 1)

    # Damage Formula
    damage = (((2 * level / 5 + 2) * power * atk_stat / def_stat) / 50 + 2) * type_effectiveness
    return min(100, (damage / hp) * 100)

# AI Coach
def ai_coach(attacker, defender, moves, weather=None, ev_spread=None, item=None):
    suggestions = []
    for move in moves:
        damage = calculate_damage(attacker, defender, move, weather, ev_spread, item)
        if damage > 50:
            suggestions.append({"Move": move["Name"], "Type": "Risky", "Reason": f"High potential damage ({damage:.2f}%)"})
        else:
            suggestions.append({"Move": move["Name"], "Type": "Safe", "Reason": f"Reliable move with decent coverage"})
    return suggestions

# Streamlit App
st.title("VGC Damage Calculator with AI Coach")

# Team Setup
st.sidebar.header("Team Setup")
user_team = []
opponent_team = []

st.sidebar.subheader("Your Team")
for i in range(3):  # Adjust for team size
    user_team.append(st.sidebar.selectbox(f"Your Pokémon {i+1}", meta_pokemon["Name"]))

st.sidebar.subheader("Opponent Team")
for i in range(3):  # Adjust for opponent team size
    opponent_team.append(st.sidebar.selectbox(f"Opponent Pokémon {i+1}", meta_pokemon["Name"]))

# Battlefield Conditions
st.sidebar.header("Battlefield Conditions")
weather = st.sidebar.selectbox("Weather", ["None", "Sun", "Rain", "Sandstorm", "Hail"])
terrain = st.sidebar.selectbox("Terrain", ["None", "Electric", "Psychic", "Grassy", "Misty"])

# Select Active Pokémon
st.header("Battlefield Interaction")
st.subheader("Select Active Pokémon")
active_user = st.selectbox("Your Active Pokémon", user_team)
active_opponent = st.selectbox("Opponent's Active Pokémon", opponent_team)

# Custom EV Spreads and Items
st.sidebar.header("Customize Active Pokémon")
ev_spread_user = {
    "HP": st.sidebar.slider(f"{active_user} HP EVs", 0, 252, 0, step=4),
    "Atk": st.sidebar.slider(f"{active_user} Atk EVs", 0, 252, 0, step=4),
    "Def": st.sidebar.slider(f"{active_user} Def EVs", 0, 252, 0, step=4),
}
item_user = st.sidebar.selectbox(f"{active_user} Item", ["None", "Life Orb", "Choice Band"])

# Fetch Data
active_user_data = meta_pokemon[meta_pokemon["Name"] == active_user].iloc[0]
active_opponent_data = meta_pokemon[meta_pokemon["Name"] == active_opponent].iloc[0]

# Moves and AI Coach Suggestions
st.subheader("AI Coach Suggestions")
example_moves = [
    {"Name": "Move 1", "Power": 80, "Type": "Fire"},
    {"Name": "Move 2", "Power": 100, "Type": "Dragon"},
    {"Name": "Move 3", "Power": 120, "Type": "Fighting"},
]

suggestions = ai_coach(active_user_data, active_opponent_data, example_moves, weather, ev_spread_user, item_user)

for suggestion in suggestions:
    st.write(f"{suggestion['Type']} Play: {suggestion['Move']} - {suggestion['Reason']}")

# Battle State Updates
st.subheader("Update Battle State")
hp_user = st.number_input(f"{active_user} HP", min_value=0, max_value=100, value=100, step=1)
hp_opponent = st.number_input(f"{active_opponent} HP", min_value=0, max_value=100, value=100, step=1)