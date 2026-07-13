"use client";

import React, { useState } from 'react';
import { Shield, Atom, Sparkles, Heart, Plus, Minus, ArrowRight, RotateCcw } from 'lucide-react';

type ViewStep = 'create' | 'setting' | 'game';

interface Character {
  name: string;
  class: string;
  strength: number;
  agility: number;
  intelligence: number;
  health: number;
}

interface Choice {
  text: string;
  statType: 'strength' | 'agility' | 'intelligence' | 'general' | 'rest';
  difficulty: number;
  eventType?: string;
  rewardMult?: number;
}

interface EquipmentItem {
  id: string;
  name: string;
  slot: 'weapon' | 'head' | 'body' | 'feet' | 'accessory';
  grade: 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
  statBoost: { strength?: number; agility?: number; intelligence?: number };
  cost: number;
}

interface Potion {
  id: string;
  name: string;
  type: 'health' | 'stat' | 'gold';
  description: string;
  cost: number;
}

// DATA MATRICES FOR THE PROCEDURAL STORY TELLER
const NARRATIVE_POOLS = {
  "🌌 Neon Core": {
    locations: ["a rain-slicked cyber alleyway", "a glowing neon noodle bar", "an abandoned corporate mainframe server vault", "a black-market cyberware clinic", "the high-security elevator of Arasaka Tower"],
    hazards: ["a squad of corporate security drones sweeps the zone", "a rogue AI starts frying the local grid overhead", "a group of street punks demands an entry toll", "a faulty terminal leaks high-voltage plasma lines"],
    rewards: ["you find an encrypted datapad", "a sympathetic decker beams you a temporary power boost", "you discover a hidden access ventilation shaft"],
    actions: [
      { text: "Rip open the magnetic locks of the {location} using brute force", statType: "strength", difficulty: 12 },
      { text: "Attempt to slip past the {hazard} undetected", statType: "agility", difficulty: 13 },
      { text: "Hack the server routing nodes to override the {hazard}", statType: "intelligence", difficulty: 11 },
      { text: "Proceed cautiously into the shadows of the {location}", statType: "general", difficulty: 8 }
    ]
  },
  "🏰 Eldoria": {
    locations: ["a crumbling obsidian tower balcony", "a moss-covered druid sanctuary", "the damp underground catacombs", "a flickering tavern filled with mercenaries", "a clearing next to a sleeping stone golem"],
    hazards: ["a swarm of shadow-imps descends from the rafters", "the stone floor begins collapsing into a spiked pit", "a magical ward triggers a localized fire-storm", "an armored skeletal guard draws its rusted claymore"],
    rewards: ["a glowing mana crystal hums in the corner", "you spot an unmapped escape tunnel behind a tapestry", "a fountain of clear water restores your focus"],
    actions: [
      { text: "Smash through the magical barriers in the {location} with physical might", statType: "strength", difficulty: 13 },
      { text: "Evade the {hazard} by diving behind the stonework of the {location}", statType: "agility", difficulty: 11 },
      { text: "Decipher the runes of the {location} to neutralize the {hazard}", statType: "intelligence", difficulty: 12 },
      { text: "Look around for a mundane alternative route through the {location}", statType: "general", difficulty: 9 }
    ]
  },
  "☄️ Sector-9": {
    locations: ["the claustrophobic airlock chamber", "the dark, echoing main engine room", "the hydroponics bay overgrown with alien flora", "the crew quarters showing signs of a violent struggle", "the command bridge looking out into a cosmic rift"],
    hazards: ["the oxygen scrubbers suddenly fail, dropping pressure", "a mutated xenomorph lifeform screeches in the vents", "an exposed plasma fuel line bursts into flames", "the artificial gravity matrix flips completely upside down"],
    rewards: ["a pristine emergency medkit rests in a wall locker", "the auxiliary terminal reveals a maintenance schematic", "a heavy steel blast door seals off the danger just in time"],
    actions: [
      { text: "Force the bulkhead gears of the {location} open with your bare hands", statType: "strength", difficulty: 14 },
      { text: "Scramble into the service conduits of the {location} to dodge the {hazard}", statType: "agility", difficulty: 12 },
      { text: "Bypass the blown terminal circuits to isolate the {hazard}", statType: "intelligence", difficulty: 11 },
      { text: "Brace yourself against the steel bulkheads of the {location}", statType: "general", difficulty: 8 }
    ]
  }
};

const BOSS_POOL = {
  "🌌 Neon Core": {
    bossName: "T-800 Overlord Mech",
    intro: "A colossal corporate combat mech, the T-800 Overlord, crashes through the ceiling! Its heavy machine guns spin up and lock onto your signature. This is a boss battle!",
    actions: [
      { text: "Scale the mech and plant a virus into its control hatch", statType: "agility", difficulty: 16 },
      { text: "Brace yourself and trade direct heavy blows with its armour", statType: "strength", difficulty: 17 },
      { text: "Locate a feedback loop in its power couplings and overload it", statType: "intelligence", difficulty: 15 }
    ] as Choice[]
  },
  "🏰 Eldoria": {
    bossName: "Shadow Dragon Valthor",
    intro: "The cavern trembles as the ancient Shadow Dragon, Valthor, descends from the darkness. Dark fire spills from its jaws as it prepares to consume your essence. This is a boss battle!",
    actions: [
      { text: "Launch a desperate leaping strike at the dragon's throat", statType: "strength", difficulty: 17 },
      { text: "Sprint between stone pillars to evade its breath weapon", statType: "agility", difficulty: 16 },
      { text: "Recite a high-tier banishment incantation from memory", statType: "intelligence", difficulty: 15 }
    ] as Choice[]
  },
  "☄️ Sector-9": {
    bossName: "Xenomorph Queen",
    intro: "The ceiling vents burst open. The massive Xenomorph Queen drops down, screeching in rage. Acidic drool burns holes in the deck plates. This is a boss battle!",
    actions: [
      { text: "Pin the Queen under a heavy hydraulic loader crane", statType: "strength", difficulty: 16 },
      { text: "Dive under her tail swipes and target her primary nerve clusters", statType: "agility", difficulty: 17 },
      { text: "Bypass the reactor safety valves to engulf the room in plasma", statType: "intelligence", difficulty: 15 }
    ] as Choice[]
  }
};

const EVENT_POOL = [
  {
    title: "✨ Anomalous Datacore",
    intro: "You stumble upon a floating, glowing Datacore that hums with raw matrix energy. It seems to contain uncorrupted archives of the simulator.",
    actions: [
      { text: "Attempt to siphon the core's energy directly", statType: "strength", difficulty: 12, eventType: "datacore_siphon" },
      { text: "Inject a bypass script to download its payload", statType: "intelligence", difficulty: 11, eventType: "datacore_payload" },
      { text: "Ignore the core to avoid security alerts", statType: "general", difficulty: 0, eventType: "datacore_ignore" }
    ] as Choice[]
  },
  {
    title: "🛒 Wandering Nano-Merchant",
    intro: "A cloaked drone hovers near the debris, displaying a flickering hologram: 'CRITICAL CLEARANCE SALE. PROTOCOL OMEGA ACTIVE.'",
    actions: [
      { text: "Hack the merchant's encryption keys", statType: "agility", difficulty: 13, eventType: "merchant_hack" },
      { text: "Purchase the mystery salvage container (Costs 40 Gold)", statType: "general", difficulty: 0, eventType: "merchant_buy" },
      { text: "Scrap the drone for raw parts", statType: "strength", difficulty: 12, eventType: "merchant_scrap" }
    ] as Choice[]
  },
  {
    title: "🌀 Chrono-Synaptic Rift",
    intro: "A tear in the simulation grid expands before you, revealing fragments of future timelines. A strange draft pulls at your consciousness.",
    actions: [
      { text: "Leap across the spatial event horizon", statType: "agility", difficulty: 14, eventType: "rift_leap" },
      { text: "Stabilize the rift using your processor matrix", statType: "intelligence", difficulty: 13, eventType: "rift_stabilize" },
      { text: "Safely step back and let the rift collapse", statType: "general", difficulty: 0, eventType: "rift_ignore" }
    ] as Choice[]
  }
];

export default function InfiniteQuest() {
  const [view, setView] = useState<ViewStep>('create');
  const [pointsLeft, setPointsLeft] = useState<number>(10);
  const [selectedSetting, setSelectedSetting] = useState<keyof typeof NARRATIVE_POOLS | "">('');
  const [score, setScore] = useState<number>(0);
  
  const [char, setChar] = useState<Character>({
    name: '',
    class: 'Tech Nomad',
    strength: 5,
    agility: 5,
    intelligence: 5,
    health: 100
  });

  const [storyText, setStoryText] = useState<string>("");
  const [currentChoices, setCurrentChoices] = useState<Choice[]>([]);
  const [earnedPoints, setEarnedPoints] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  
  // RPG System States
  const [tab, setTab] = useState<'story' | 'shop'>('story');
  const [gold, setGold] = useState<number>(100);
  const [equipment, setEquipment] = useState<{
    weapon: EquipmentItem | null;
    head: EquipmentItem | null;
    body: EquipmentItem | null;
    feet: EquipmentItem | null;
    accessory: EquipmentItem | null;
  }>({
    weapon: null,
    head: null,
    body: null,
    feet: null,
    accessory: null,
  });
  const [shopItems, setShopItems] = useState<EquipmentItem[]>([]);
  const [potions, setPotions] = useState<Potion[]>([]);

  // Potion shop & belt actions
  const buyPotion = (potionName: string, cost: number, type: Potion['type'], description: string) => {
    if (gold < cost) return;
    if (potions.length >= 3) return;
    setGold(prev => prev - cost);
    const newPotion: Potion = {
      id: `potion_${Date.now()}_${Math.random()}`,
      name: potionName,
      type,
      description,
      cost
    };
    setPotions(prev => [...prev, newPotion]);
  };

  const consumePotion = (potionId: string) => {
    const potion = potions.find(p => p.id === potionId);
    if (!potion) return;
    
    let resolutionText = "";
    if (potion.type === 'health') {
      const heal = 35;
      setChar(prev => ({ ...prev, health: Math.min(100, prev.health + heal) }));
      resolutionText = `Consumed ${potion.name}: Restored ${heal} Vitality.`;
    } else if (potion.type === 'stat') {
      const stats: Array<'strength' | 'agility' | 'intelligence'> = ['strength', 'agility', 'intelligence'];
      const rolledStat = stats[Math.floor(Math.random() * stats.length)];
      setChar(prev => ({ ...prev, [rolledStat]: prev[rolledStat] + 1 }));
      resolutionText = `Consumed ${potion.name}: Permanently upgraded base ${rolledStat.toUpperCase()} by +1.`;
    } else if (potion.type === 'gold') {
      const goldYield = Math.floor(Math.random() * 81) + 20;
      setGold(prev => prev + goldYield);
      resolutionText = `Consumed ${potion.name}: Transmuted into ${goldYield} Gold.`;
    }

    setStoryText(prev => `${prev}\n\n🧪 [POTION USE] ${resolutionText}`);
    setPotions(prev => prev.filter(p => p.id !== potionId));
  };

  // Calculate combat stats including equipment boosts
  const getStat = (stat: 'strength' | 'agility' | 'intelligence') => {
    let val = char[stat];
    Object.values(equipment).forEach(item => {
      if (item && item.statBoost[stat]) {
        val += item.statBoost[stat];
      }
    });
    return val;
  };

  // Check if any gear is boosting a specific stat
  const isStatBoosted = (stat: 'strength' | 'agility' | 'intelligence') => {
    return Object.values(equipment).some(item => item && item.statBoost[stat]);
  };

  // Generate 3 random shop items based on weighted rarity
  const generateShopItems = () => {
    const slots: Array<EquipmentItem['slot']> = ['weapon', 'head', 'body', 'feet', 'accessory'];
    const grades: Array<{ grade: EquipmentItem['grade']; weight: number }> = [
      { grade: 'E', weight: 50 },
      { grade: 'D', weight: 25 },
      { grade: 'C', weight: 12 },
      { grade: 'B', weight: 7 },
      { grade: 'A', weight: 4 },
      { grade: 'S', weight: 2 }
    ];
    
    const rollGrade = (): EquipmentItem['grade'] => {
      const rand = Math.random() * 100;
      let sum = 0;
      for (const g of grades) {
        sum += g.weight;
        if (rand <= sum) return g.grade;
      }
      return 'E';
    };

    const itemNames = {
      weapon: {
        E: ["Dull Dagger", "Rusty Pipe"],
        D: ["Laser Pistol", "Steel Sword"],
        C: ["Plasma Cutter", "Runic Blade"],
        B: ["Charged Energy Rifle", "Mithril Greatsword"],
        A: ["Gravity Disruptor", "Void Slayer Claymore"],
        S: ["Singularity Railgun", "Excalibur Prime"]
      },
      head: {
        E: ["Scrap Goggles", "Worn Cap"],
        D: ["Reinforced Visor", "Tactical Helmet"],
        C: ["Neural Interface Band", "Holographic Monocle"],
        B: ["Aegis Neuro-Crown", "Paladin Greathelm"],
        A: ["Chrono-Sensor Visor", "Crown of the Wind-Walker"],
        S: ["AI Overlord Neuro-Matrix", "Arch-Mage Diadem of Eternity"]
      },
      body: {
        E: ["Ragged Vest", "Fibre Coat"],
        D: ["Flak Jacket", "Leather Chestplate"],
        C: ["Nanofiber Mesh", "Hardened Chainmail"],
        B: ["Titanium Plate Vest", "Mithril Hauberk"],
        A: ["Powered Exoskeleton Frame", "Runic Arch-Mage Robes"],
        S: ["Quantum Shift Warp Armor", "Dragonscale Primordial Plate"]
      },
      feet: {
        E: ["Worn Boots", "Scrap Sandals"],
        D: ["Steel-Toed Boots", "Silent Sneakers"],
        C: ["Kinetic Springs", "Reinforced Greaves"],
        B: ["Magnetic Hover-Soles", "Swift-Wing Boots"],
        A: ["Phase-Shift Boots", "Greaves of the Titan"],
        S: ["Gravity Anchor Soles", "Hermetic Rift Treads"]
      },
      accessory: {
        E: ["Rusty Copper Ring", "Dull Necklace"],
        D: ["Laser Pointer", "Silver Ring of Focus"],
        C: ["Bio-Scanner Bracelet", "Mana Crystal Pendant"],
        B: ["Shield Generator Ring", "Amulet of Health"],
        A: ["Gravity Manipulator Ring", "Pendant of Power"],
        S: ["Singularity Core Loop", "Eye of the Void Necklace"]
      }
    };

    const newItems = Array.from({ length: 3 }).map((_, idx) => {
      const slot = slots[Math.floor(Math.random() * slots.length)];
      const grade = rollGrade();
      const names = itemNames[slot][grade];
      const name = names[Math.floor(Math.random() * names.length)];
      
      let strength = 0, agility = 0, intelligence = 0;
      const boostVal = { E: 1, D: 2, C: 4, B: 6, A: 9, S: 15 }[grade];
      const stats: Array<'strength' | 'agility' | 'intelligence'> = ['strength', 'agility', 'intelligence'];
      const primaryStat = stats[Math.floor(Math.random() * stats.length)];
      
      if (primaryStat === 'strength') strength = boostVal;
      if (primaryStat === 'agility') agility = boostVal;
      if (primaryStat === 'intelligence') intelligence = boostVal;

      const baseCost = { E: 20, D: 45, C: 90, B: 170, A: 300, S: 500 }[grade];
      const cost = Math.floor(baseCost * (0.9 + Math.random() * 0.2));

      return {
        id: `item_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`,
        name,
        slot,
        grade,
        statBoost: {
          ...(strength > 0 && { strength }),
          ...(agility > 0 && { agility }),
          ...(intelligence > 0 && { intelligence })
        },
        cost
      };
    });

    return newItems;
  };

  const modifyStat = (stat: 'strength' | 'agility' | 'intelligence', quantity: number) => {
    if (quantity > 0 && pointsLeft > 0) {
      setChar({ ...char, [stat]: char[stat] + 1 });
      setPointsLeft(pointsLeft - 1);
    } else if (quantity < 0 && char[stat] > 5) {
      setChar({ ...char, [stat]: char[stat] - 1 });
      setPointsLeft(pointsLeft + 1);
    }
  };

  // INITIALIZE THE GAME PROPERLY
  const startGameLoop = (settingName: keyof typeof NARRATIVE_POOLS) => {
    setSelectedSetting(settingName);
    setScore(0);
    setEarnedPoints(0);
    setGold(100);
    setEquipment({ weapon: null, head: null, body: null, feet: null, accessory: null });
    setShopItems(generateShopItems());
    setPotions([]);
    setTab('story');
    
    const pool = NARRATIVE_POOLS[settingName];
    const initialLocation = pool.locations[0];
    const initialHazard = pool.hazards[0];
    const initialText = `The chronicle of ${char.name} the ${char.class} begins inside ${initialLocation}. Suddenly, ${initialHazard}! What is your immediate course of action?`;
    
    setStoryText(initialText);
    
    // Grab initial choices and interpolate situation details with varied weights
    const initialChoices = [...pool.actions].sort(() => 0.5 - Math.random()).slice(0, 3).map(action => {
      const text = action.text
        .replace("{location}", initialLocation)
        .replace("{hazard}", initialHazard);
      
      const rand = Math.random();
      let difficultyBonus = 0;
      let rewardMult = 1.0;
      if (rand < 0.3) {
        difficultyBonus = -3;
        rewardMult = 0.6;
      } else if (rand > 0.7) {
        difficultyBonus = 4;
        rewardMult = 2.0;
      }
      
      const scaledDiff = Math.max(5, Math.floor(action.difficulty + difficultyBonus));
      return { ...action, text, difficulty: scaledDiff, rewardMult };
    }) as Choice[];
    
    setCurrentChoices(initialChoices);
    setView('game');
  };

  const handleEventAction = (choice: Choice) => {
    if (!selectedSetting || isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      executeEventActionLogic(choice);
      setIsTransitioning(false);
    }, 850);
  };

  const executeEventActionLogic = (choice: Choice) => {
    if (!selectedSetting) return;
    const pool = NARRATIVE_POOLS[selectedSetting];
    
    let playerStatValue = 10;
    if (choice.statType !== 'general') {
      playerStatValue = getStat(choice.statType);
    }
    
    const diceRoll = Math.floor(Math.random() * 6) + 1;
    const totalRoll = playerStatValue + diceRoll;
    const isSuccess = totalRoll >= choice.difficulty;
    
    let resolutionText = "";
    let healthChange = 0;
    let goldChange = 0;
    let pointChange = 0;
    let equipmentEarned: EquipmentItem | null = null;
    let potionEarned: Potion | null = null;

    switch(choice.eventType) {
      case "datacore_siphon":
        if (isSuccess) {
          healthChange = 25;
          resolutionText = `[SUCCESS] You siphon the Datacore's backup grids, recharging your bio-cells (+25 Vitality).`;
        } else {
          healthChange = -15;
          resolutionText = `[FAILURE] The Datacore's protective shielding discharges a feedback loop (-15 Vitality).`;
        }
        break;
      case "datacore_payload":
        if (isSuccess) {
          const items = generateShopItems();
          equipmentEarned = items[0];
          resolutionText = `[SUCCESS] You extract a cache of high-tier gear data, fabricating a new item: ${equipmentEarned.name} (${equipmentEarned.grade}-Grade).`;
        } else {
          healthChange = -10;
          resolutionText = `[FAILURE] The Datacore's firewall detects your bypass, launching a neuro-drain countermeasure (-10 Vitality).`;
        }
        break;
      case "datacore_ignore":
        resolutionText = `You bypass the Datacore safely, leaving its secrets intact.`;
        break;
        
      case "merchant_hack":
        if (isSuccess) {
          goldChange = 80;
          resolutionText = `[SUCCESS] You bypass the drone's security grid, forcing its transaction channels to dump +80 Gold.`;
        } else {
          healthChange = -20;
          resolutionText = `[FAILURE] The drone locks its compartments and releases defense spikes (-20 Vitality).`;
        }
        break;
      case "merchant_buy":
        if (gold >= 40) {
          goldChange = -40;
          if (Math.random() < 0.5) {
            const items = generateShopItems();
            equipmentEarned = items[0];
            resolutionText = `You purchase the mystery crate. Inside you uncover: ${equipmentEarned.name} (${equipmentEarned.grade}-Grade).`;
          } else {
            const potTypes = [
              { name: "Vitality Elixir", type: "health" as const, desc: "Heals 35 Vitality on use" },
              { name: "Alchemist Liquid", type: "gold" as const, desc: "Yields 20-100 Gold" },
              { name: "Core Mutagen", type: "stat" as const, desc: "Permanent +1 to a random base stat" }
            ];
            const pot = potTypes[Math.floor(Math.random() * potTypes.length)];
            potionEarned = {
              id: `potion_${Date.now()}_${Math.random()}`,
              name: pot.name,
              type: pot.type,
              description: pot.desc,
              cost: 0
            };
            resolutionText = `You purchase the mystery crate. Inside you find a: ${potionEarned.name} (${potionEarned.description}).`;
          }
        } else {
          resolutionText = `You don't have enough Gold! The drone scolds you and flies away.`;
        }
        break;
      case "merchant_scrap":
        if (isSuccess) {
          goldChange = 30;
          resolutionText = `[SUCCESS] You smash the drone with force, salvaging high-grade raw processors (+30 Gold).`;
        } else {
          healthChange = -10;
          resolutionText = `[FAILURE] The drone dodges your smash and zaps you before self-destructing (-10 Vitality).`;
        }
        break;
        
      case "rift_leap":
        if (isSuccess) {
          pointChange = 3;
          resolutionText = `[SUCCESS] You vault cleanly through the rift's center, absorbing temporal equations. You gain +3 Attribute Points!`;
        } else {
          healthChange = -25;
          resolutionText = `[FAILURE] The rift borders collapse as you jump, crushing your structural parameters (-25 Vitality).`;
        }
        break;
      case "rift_stabilize":
        if (isSuccess) {
          goldChange = 50;
          const items = generateShopItems();
          equipmentEarned = items[0];
          resolutionText = `[SUCCESS] You stabilize the rift, materializing a localized gear drop: ${equipmentEarned.name} (${equipmentEarned.grade}-Grade) and +50 Gold.`;
        } else {
          healthChange = -15;
          resolutionText = `[FAILURE] Your mind is flooded with static as the rift collapses violently (-15 Vitality).`;
        }
        break;
      case "rift_ignore":
        resolutionText = `You step back and let the tear collapse into space.`;
        break;
        
      default:
        resolutionText = `The anomaly fades back into the background grid.`;
        break;
    }

    if (goldChange !== 0) setGold(prev => Math.max(0, prev + goldChange));
    if (pointChange > 0) setEarnedPoints(prev => prev + pointChange);
    
    let currentHealth = char.health;
    if (healthChange > 0) {
      currentHealth = Math.min(100, char.health + healthChange);
      setChar(prev => ({ ...prev, health: currentHealth }));
    } else if (healthChange < 0) {
      currentHealth = Math.max(0, char.health + healthChange);
      setChar(prev => ({ ...prev, health: currentHealth }));
    }

    if (equipmentEarned) {
      let refundText = "";
      const currentEquipped = equipment[equipmentEarned.slot];
      if (currentEquipped) {
        const refund = Math.floor(currentEquipped.cost / 2);
        setGold(prev => prev + refund);
        refundText = ` (Your old ${equipmentEarned.slot} was sold for +${refund} Gold).`;
      }
      setEquipment(prev => ({ ...prev, [equipmentEarned!.slot]: equipmentEarned }));
      resolutionText += `${refundText}`;
    }

    if (potionEarned) {
      if (potions.length < 3) {
        setPotions(prev => [...prev, potionEarned!]);
      } else {
        setGold(prev => prev + 15);
        resolutionText += ` (Your Potion Belt was full, so the potion was auto-salvaged for +15 Gold).`;
      }
    }

    if (currentHealth <= 0) {
      setStoryText(`${resolutionText} The anomalies of the matrix have dissolved your parameters. ${char.name} has fallen. Your final score: ${score} encounters completed.`);
      setCurrentChoices([]);
      return;
    }

    const nextLocation = pool.locations[Math.floor(Math.random() * pool.locations.length)];
    const nextHazard = pool.hazards[Math.floor(Math.random() * pool.hazards.length)];
    const nextChapterText = `\n\nMoving forward, you navigate deeper into ${nextLocation}. Before you can catch your breath, ${nextHazard}!`;
    setStoryText(resolutionText + nextChapterText);

    // Interpolate situation details & varied weights
    const regularChoices = [...pool.actions].map(action => {
      const text = action.text
        .replace("{location}", nextLocation)
        .replace("{hazard}", nextHazard);
      
      const rand = Math.random();
      let difficultyBonus = 0;
      let rewardMult = 1.0;
      if (rand < 0.3) {
        difficultyBonus = -3;
        rewardMult = 0.6;
      } else if (rand > 0.7) {
        difficultyBonus = 4;
        rewardMult = 2.0;
      }
      
      const scaledDiff = Math.max(5, Math.floor(action.difficulty + score / 3 + difficultyBonus));
      return { ...action, text, difficulty: scaledDiff, rewardMult };
    }) as Choice[];
    
    let choices = regularChoices.sort(() => 0.5 - Math.random()).slice(0, 3);
    const shouldOfferRest = currentHealth < 40 || (currentHealth < 70 && Math.random() < 0.4);
    if (shouldOfferRest) {
      const restOptions = [
        { text: `Set up a temporary shelter in the ${nextLocation} and tend to your wounds`, statType: "rest", difficulty: 0, rewardMult: 1.0 },
        { text: `Consume an emergency ration pack and rest in the shadows of ${nextLocation}`, statType: "rest", difficulty: 0, rewardMult: 1.0 },
        { text: `Take a brief moment in the ${nextLocation} to catch your breath`, statType: "rest", difficulty: 0, rewardMult: 1.0 }
      ] as Choice[];
      choices[2] = restOptions[Math.floor(Math.random() * restOptions.length)];
    }
    setCurrentChoices(choices);
    setShopItems(generateShopItems());
  };

  const handleAction = (choice: Choice) => {
    if (!selectedSetting || isTransitioning) return;
    
    if (choice.eventType) {
      handleEventAction(choice);
      return;
    }
    
    setIsTransitioning(true);
    setTimeout(() => {
      executeActionLogic(choice);
      setIsTransitioning(false);
    }, 850);
  };

  const executeActionLogic = (choice: Choice) => {
    if (!selectedSetting) return;
    const pool = NARRATIVE_POOLS[selectedSetting];
    
    if (choice.eventType) {
      handleEventAction(choice);
      return;
    }
    
    // Check if this is a rest choice
    if (choice.statType === 'rest') {
      const healAmount = Math.floor(Math.random() * 15) + 15; // 15-30 healing
      const newHealth = Math.min(100, char.health + healAmount);
      setChar(prev => ({ ...prev, health: newHealth }));
      
      const resolutionText = `[REST] You chose to: "${choice.text}". You set up a secure camp and restore ${healAmount} Vitality points. (Health is now ${newHealth}/100).`;
      
      // Restock shop
      setShopItems(generateShopItems());
      
      // Check if next room is a Boss room (every 5 rooms) or Anomaly Event (25% chance)
      const isNextBoss = (score > 0 && score % 5 === 0);
      const triggerEvent = !isNextBoss && Math.random() < 0.25;
      
      if (isNextBoss) {
        const boss = BOSS_POOL[selectedSetting];
        const bossText = `\n\n🚨 BOSS ENCOUNTER! 🚨\nYou enter a new area. ${boss.intro}`;
        setStoryText(resolutionText + bossText);
        setCurrentChoices(boss.actions);
      } else if (triggerEvent) {
        const randomEvent = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
        setStoryText(resolutionText + `\n\n🔮 ANOMALY EVENT: ${randomEvent.title} 🔮\n${randomEvent.intro}`);
        setCurrentChoices(randomEvent.actions);
      } else {
        const nextLocation = pool.locations[Math.floor(Math.random() * pool.locations.length)];
        const nextHazard = pool.hazards[Math.floor(Math.random() * pool.hazards.length)];
        const nextChapterText = `\n\nMoving forward, you navigate deeper into ${nextLocation}. Before you can catch your breath, ${nextHazard}!`;
        setStoryText(resolutionText + nextChapterText);
        
        // Interpolate situation details & varied weights
        const regularChoices = [...pool.actions].map(action => {
          const text = action.text
            .replace("{location}", nextLocation)
            .replace("{hazard}", nextHazard);
          
          const rand = Math.random();
          let difficultyBonus = 0;
          let rewardMult = 1.0;
          if (rand < 0.3) {
            difficultyBonus = -3;
            rewardMult = 0.6;
          } else if (rand > 0.7) {
            difficultyBonus = 4;
            rewardMult = 2.0;
          }
          
          const scaledDiff = Math.max(5, Math.floor(action.difficulty + score / 3 + difficultyBonus));
          return { ...action, text, difficulty: scaledDiff, rewardMult };
        }) as Choice[];
        
        let choices = regularChoices.sort(() => 0.5 - Math.random()).slice(0, 3);
        const shouldOfferRest = newHealth < 40 || (newHealth < 70 && Math.random() < 0.4);
        if (shouldOfferRest) {
          const restOptions = [
            { text: `Set up a temporary shelter in the ${nextLocation} and tend to your wounds`, statType: "rest", difficulty: 0, rewardMult: 1.0 },
            { text: `Consume an emergency ration pack and rest in the shadows of ${nextLocation}`, statType: "rest", difficulty: 0, rewardMult: 1.0 },
            { text: `Take a brief moment in the ${nextLocation} to catch your breath`, statType: "rest", difficulty: 0, rewardMult: 1.0 }
          ] as Choice[];
          choices[2] = restOptions[Math.floor(Math.random() * restOptions.length)];
        }
        setCurrentChoices(choices);
      }
      return;
    }
    
    // Calculate Stat Check Success
    let playerStatValue = 10; // Default general challenge modifier
    if (choice.statType !== 'general') {
      playerStatValue = getStat(choice.statType);
    }
    
    // Add a small local random dice roll (1 to 6) to mimic a true tabletop RPG challenge
    const diceRoll = Math.floor(Math.random() * 6) + 1;
    const totalRoll = playerStatValue + diceRoll;
    const isSuccess = totalRoll >= choice.difficulty;

    let resolutionText = "";
    let healthDamage = 0;
    
    const isBossChoice = BOSS_POOL[selectedSetting].actions.some(a => a.text === choice.text);
    let nextScore = score;

    if (isSuccess) {
      nextScore = score + 1;
      setScore(nextScore);
      
      let rewardText = "";
      let goldGain = 0;
      if (isBossChoice) {
        const bossPoints = Math.floor(Math.random() * 4) + 4; // 4 to 7 points
        setEarnedPoints(prev => prev + bossPoints);
        const heal = 30;
        setChar(prev => ({ ...prev, health: Math.min(100, prev.health + heal) }));
        goldGain = Math.floor(Math.random() * 51) + 50; // 50-100 gold
        setGold(prev => prev + goldGain);
        rewardText = `You defeated the Boss! You earned ${bossPoints} Attribute Upgrade Points, gained ${goldGain} Gold, and restored ${heal} Vitality`;
      } else {
        const baseGold = Math.floor(Math.random() * 11) + 15;
        const mult = choice.rewardMult || 1.0;
        goldGain = Math.floor(baseGold * mult);
        setGold(prev => prev + goldGain);
        
        let extraText = "";
        if (mult > 1.5 && Math.random() < 0.15 && potions.length < 3) {
          const potTypes = [
            { name: "Vitality Elixir", type: "health" as const, desc: "Heals 35 Vitality on use" },
            { name: "Alchemist Liquid", type: "gold" as const, desc: "Yields 20-100 Gold" },
            { name: "Core Mutagen", type: "stat" as const, desc: "Permanent +1 to a random base stat" }
          ];
          const pot = potTypes[Math.floor(Math.random() * potTypes.length)];
          const potionEarned = {
            id: `potion_${Date.now()}_${Math.random()}`,
            name: pot.name,
            type: pot.type,
            description: pot.desc,
            cost: 0
          };
          setPotions(prev => [...prev, potionEarned]);
          extraText = ` and salvaged a ${pot.name}`;
        }
        rewardText = `${pool.rewards[Math.floor(Math.random() * pool.rewards.length)]} (Gained +${goldGain} Gold${extraText})`;
      }
      resolutionText = `[SUCCESS] You chose to: "${choice.text}". Your ${choice.statType.toUpperCase()} trait held strong! (Rolled ${totalRoll} vs Diff ${choice.difficulty}). You expertly bypass the threat, and ${rewardText}.`;
    } else {
      let failDamage = 0;
      let goldLoss = 0;
      if (isBossChoice) {
        failDamage = Math.floor(Math.random() * 20) + 20; // 20-40 damage for boss!
        resolutionText = `[FAILURE] You tried to: "${choice.text}". The Boss completely overwhelmed you! (Rolled ${totalRoll} vs Diff ${choice.difficulty}). You take a devastating blow, losing ${failDamage} Vitality points.`;
      } else {
        failDamage = Math.floor(Math.random() * 15) + 10; // 10-25 damage
        goldLoss = Math.floor(Math.random() * 6) + 5; // 5-10 gold loss on failure
        setGold(prev => Math.max(0, prev - goldLoss));
        resolutionText = `[FAILURE] You tried to: "${choice.text}". However, the scenario outmatched your raw attributes... (Rolled ${totalRoll} vs Diff ${choice.difficulty}). You take a heavy hit, losing ${failDamage} Vitality points and ${goldLoss} Gold.`;
      }
      healthDamage = failDamage;
    }

    // Update player health state
    const currentHealth = Math.max(0, char.health - healthDamage);
    setChar(prev => ({ ...prev, health: currentHealth }));

    // Check Death Condition state
    if (currentHealth <= 0) {
      setStoryText(`${resolutionText} The physical limits of your character have been shattered. ${char.name} has fallen within the depths of ${selectedSetting}. Your final score: ${nextScore} encounters completed.`);
      setCurrentChoices([]); // Wipe choices out to show game over state
      return;
    }

    // Restock shop
    setShopItems(generateShopItems());

    // Check if next room should be a Boss room (every 5 rooms) or Anomaly Event (25% chance)
    const isNextBoss = (nextScore > 0 && nextScore % 5 === 0);
    const triggerEvent = !isNextBoss && Math.random() < 0.25;
    
    if (isNextBoss) {
      const boss = BOSS_POOL[selectedSetting];
      const bossText = `\n\n🚨 BOSS ENCOUNTER! 🚨\nYou enter a new area. ${boss.intro}`;
      setStoryText(resolutionText + bossText);
      setCurrentChoices(boss.actions);
    } else if (triggerEvent) {
      const randomEvent = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
      setStoryText(resolutionText + `\n\n🔮 ANOMALY EVENT: ${randomEvent.title} 🔮\n${randomEvent.intro}`);
      setCurrentChoices(randomEvent.actions);
    } else {
      const nextLocation = pool.locations[Math.floor(Math.random() * pool.locations.length)];
      const nextHazard = pool.hazards[Math.floor(Math.random() * pool.hazards.length)];
      const nextChapterText = `\n\nMoving forward, you navigate deeper into ${nextLocation}. Before you can catch your breath, ${nextHazard}!`;
      setStoryText(resolutionText + nextChapterText);

      // Interpolate situation details & varied weights
      const regularChoices = [...pool.actions].map(action => {
        const text = action.text
          .replace("{location}", nextLocation)
          .replace("{hazard}", nextHazard);
        
        const rand = Math.random();
        let difficultyBonus = 0;
        let rewardMult = 1.0;
        if (rand < 0.3) {
          difficultyBonus = -3;
          rewardMult = 0.6;
        } else if (rand > 0.7) {
          difficultyBonus = 4;
          rewardMult = 2.0;
        }
        
        const scaledDiff = Math.max(5, Math.floor(action.difficulty + score / 3 + difficultyBonus));
        return { ...action, text, difficulty: scaledDiff, rewardMult };
      }) as Choice[];
      
      let choices = regularChoices.sort(() => 0.5 - Math.random()).slice(0, 3);
      const shouldOfferRest = currentHealth < 40 || (currentHealth < 70 && Math.random() < 0.4);
      if (shouldOfferRest) {
        const restOptions = [
          { text: `Set up a temporary shelter in the ${nextLocation} and tend to your wounds`, statType: "rest", difficulty: 0, rewardMult: 1.0 },
          { text: `Consume an emergency ration pack and rest in the shadows of ${nextLocation}`, statType: "rest", difficulty: 0, rewardMult: 1.0 },
          { text: `Take a brief moment in the ${nextLocation} to catch your breath`, statType: "rest", difficulty: 0, rewardMult: 1.0 }
        ] as Choice[];
        choices[2] = restOptions[Math.floor(Math.random() * restOptions.length)];
      }
      setCurrentChoices(choices);
    }
  };

  const renderStoryGraphic = () => {
    if (!selectedSetting) return null;
    
    const isGameOver = currentChoices.length === 0;
    const isBossActive = currentChoices.length > 0 && BOSS_POOL[selectedSetting]?.actions.some(a => a.text === currentChoices[0].text);
    const isRestingActive = currentChoices.length > 0 && currentChoices.some(c => c.statType === 'rest');
    const floor = score + 1;

    if (isTransitioning) {
      return (
        <svg className="w-full h-full" viewBox="0 0 400 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="160" fill="#020617"/>
          <g style={{ transformOrigin: '200px 80px', animation: 'zoomSpace 0.8s ease-in-out infinite' }}>
            <line x1="200" y1="80" x2="50" y2="-20" stroke="#a855f7" strokeWidth="2" opacity="0.6"/>
            <line x1="200" y1="80" x2="350" y2="-20" stroke="#ec4899" strokeWidth="2" opacity="0.6"/>
            <line x1="200" y1="80" x2="-50" y2="180" stroke="#3b82f6" strokeWidth="2" opacity="0.6"/>
            <line x1="200" y1="80" x2="450" y2="180" stroke="#06b6d4" strokeWidth="2" opacity="0.6"/>
            <line x1="200" y1="80" x2="200" y2="-40" stroke="#a855f7" strokeWidth="1.5" opacity="0.4"/>
            <line x1="200" y1="80" x2="200" y2="200" stroke="#3b82f6" strokeWidth="1.5" opacity="0.4"/>
            <line x1="200" y1="80" x2="-40" y2="80" stroke="#ec4899" strokeWidth="1.5" opacity="0.4"/>
            <line x1="200" y1="80" x2="440" y2="80" stroke="#06b6d4" strokeWidth="1.5" opacity="0.4"/>
          </g>
          <circle cx="200" cy="80" r="10" stroke="#fff" strokeWidth="1.5" opacity="0.8" style={{ animation: 'expandCircle 0.8s ease-out infinite' }}/>
          <circle cx="200" cy="80" r="30" stroke="#fff" strokeWidth="1" opacity="0.5" style={{ animation: 'expandCircle 0.8s ease-out infinite', animationDelay: '0.2s' }}/>
          <circle cx="200" cy="80" r="60" stroke="#a855f7" strokeWidth="1" opacity="0.3" style={{ animation: 'expandCircle 0.8s ease-out infinite', animationDelay: '0.4s' }}/>
          <text x="50%" y="85" textAnchor="middle" fill="#fff" fontSize="10" fontFamily="monospace" fontWeight="bold" letterSpacing="4" style={{ animation: 'textPulse 0.4s infinite' }}>DEVOLVING TO FLOOR 0{floor}...</text>
          <style>{`
            @keyframes zoomSpace {
              0% { transform: scale(0.3); opacity: 0.2; }
              100% { transform: scale(1.5); opacity: 1; }
            }
            @keyframes expandCircle {
              0% { r: 5px; opacity: 1; stroke-width: 2px; }
              100% { r: 120px; opacity: 0; stroke-width: 0.5px; }
            }
            @keyframes textPulse {
              0%, 100% { opacity: 0.6; }
              50% { opacity: 1; }
            }
          `}</style>
        </svg>
      );
    }
    
    if (isGameOver) {
      return (
        <svg className="w-full h-full" viewBox="0 0 400 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="160" fill="#020617"/>
          <path d="M 0 40 L 400 40 M 0 80 L 400 80 M 0 120 L 400 120 M 100 0 L 100 160 M 200 0 L 200 160 M 300 0 L 300 160" stroke="#1e293b" strokeWidth="0.5"/>
          <path d="M 180 50 L 220 50 L 230 70 L 230 90 L 210 110 L 210 120 L 190 120 L 190 110 L 170 90 L 170 70 Z" fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 4"/>
          <circle cx="190" cy="75" r="4" fill="#ef4444"/>
          <circle cx="210" cy="75" r="4" fill="#ef4444"/>
          <path d="M 195 95 L 205 95" stroke="#ef4444" strokeWidth="2"/>
          <line x1="0" y1="0" x2="400" y2="0" stroke="#ef4444" strokeWidth="1.5" opacity="0.4" style={{ animation: 'scanline 3s linear infinite' }}/>
          <text x="50%" y="145" textAnchor="middle" fill="#ef4444" fontSize="10" fontFamily="monospace" letterSpacing="2">💀 SIMULATION CRITICAL FAILURE 💀</text>
          <style>{`
            @keyframes scanline {
              0% { transform: translateY(0px); }
              100% { transform: translateY(160px); }
            }
          `}</style>
        </svg>
      );
    }
    
    if (isBossActive) {
      return (
        <svg className="w-full h-full" viewBox="0 0 400 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="160" fill="#09050d"/>
          <path d="M 0 20 L 400 20 M 0 60 L 400 60 M 0 100 L 400 100 M 0 140 L 400 140 M 50 0 L 50 160 M 150 0 L 150 160 M 250 0 L 250 160 M 350 0 L 350 160" stroke="#ef4444" strokeWidth="0.5" opacity="0.2"/>
          <circle cx="200" cy="75" r="35" stroke="#ef4444" strokeWidth="2" strokeDasharray="10 5" style={{ animation: 'rotate 6s linear infinite' }}/>
          <circle cx="200" cy="75" r="10" fill="#ef4444" opacity="0.3"/>
          <path d="M 200 25 L 200 45 M 200 105 L 200 125 M 150 75 L 170 75 M 230 75 L 250 75" stroke="#ef4444" strokeWidth="2"/>
          <rect x="0" y="115" width="400" height="20" fill="#ef4444" fillOpacity="0.2"/>
          <text x="50%" y="129" textAnchor="middle" fill="#f87171" fontSize="9" fontFamily="monospace" fontWeight="bold" letterSpacing="4" style={{ animation: 'pulseWarning 1.5s infinite' }}>⚠️ WARNING: BOSS SIGNATURE DETECTED ⚠️</text>
          <style>{`
            @keyframes rotate {
              from { transform: rotate(0deg); transform-origin: 200px 75px; }
              to { transform: rotate(360deg); transform-origin: 200px 75px; }
            }
            @keyframes pulseWarning {
              0%, 100% { opacity: 0.4; }
              50% { opacity: 1; }
            }
          `}</style>
        </svg>
      );
    }
    
    if (isRestingActive) {
      return (
        <svg className="w-full h-full" viewBox="0 0 400 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="160" fill="#02140c"/>
          <circle cx="40" cy="50" r="1" fill="#fff" opacity="0.5"/>
          <circle cx="150" cy="20" r="1.5" fill="#fff" opacity="0.8"/>
          <circle cx="280" cy="40" r="1" fill="#fff" opacity="0.6"/>
          <circle cx="320" cy="25" r="1.2" fill="#fff" opacity="0.7"/>
          <path d="M 180 110 L 220 95 M 180 95 L 220 110" stroke="#78350f" strokeWidth="6" strokeLinecap="round"/>
          <path d="M 200 60 C 215 80 205 100 200 100 C 195 100 185 80 200 60 Z" fill="#ea580c" style={{ animation: 'flicker 1.2s infinite' }}/>
          <path d="M 200 70 C 208 85 203 95 200 95 C 197 95 192 85 200 70 Z" fill="#eab308" style={{ animation: 'flicker 0.8s infinite' }}/>
          <circle cx="200" cy="90" r="50" stroke="#10b981" strokeWidth="1" strokeDasharray="3 6" opacity="0.4" style={{ animation: 'pulseAura 3s infinite' }}/>
          <text x="50%" y="145" textAnchor="middle" fill="#34d399" fontSize="10" fontFamily="monospace" letterSpacing="1">SECURE CAMP: VITALITY RESTORATION FIELD ACTIVE</text>
          <style>{`
            @keyframes flicker {
              0%, 100% { transform: scale(1) translate(0,0); transform-origin: 200px 100px; }
              50% { transform: scale(1.15, 0.95) translate(0,-2px); transform-origin: 200px 100px; }
              25% { transform: rotate(1deg) scale(0.95, 1.05); transform-origin: 200px 100px; }
              75% { transform: rotate(-1deg) scale(1.05, 1.1); transform-origin: 200px 100px; }
            }
            @keyframes pulseAura {
              0%, 100% { transform: scale(0.95); transform-origin: 200px 90px; opacity: 0.2; }
              50% { transform: scale(1.05); transform-origin: 200px 90px; opacity: 0.5; }
            }
          `}</style>
        </svg>
      );
    }
    
    if (selectedSetting === "🌌 Neon Core") {
      const neonColor1 = floor <= 3 ? "#06b6d4" : floor <= 6 ? "#10b981" : "#ef4444";
      const neonColor2 = floor <= 3 ? "#3b82f6" : floor <= 6 ? "#f59e0b" : "#ec4899";
      const cityBgColor = floor <= 3 ? "#0f172a" : floor <= 6 ? "#064e3b" : "#450a0a";
      const strokeLines = floor <= 3 ? "#1e1b4b" : floor <= 6 ? "#065f46" : "#7f1d1d";

      return (
        <svg className="w-full h-full" viewBox="0 0 400 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="160" fill="#030712"/>
          <path d="M 0 100 L 400 100 M 0 120 L 400 120 M 0 140 L 400 140" stroke={strokeLines} strokeWidth="1"/>
          <path d="M 200 80 L -100 160 M 200 80 L 0 160 M 200 80 L 100 160 M 200 80 L 200 160 M 200 80 L 300 160 M 200 80 L 400 160 M 200 80 L 500 160" stroke={strokeLines} strokeWidth="1"/>
          <rect x="30" y="40" width="40" height="80" fill={cityBgColor} stroke={neonColor2} strokeWidth="0.5" opacity="0.8"/>
          <rect x="90" y="20" width="50" height="100" fill={cityBgColor} stroke={neonColor1} strokeWidth="0.5" opacity="0.8"/>
          <rect x="260" y="30" width="45" height="90" fill={cityBgColor} stroke={neonColor2} strokeWidth="0.5" opacity="0.8"/>
          <rect x="320" y="50" width="50" height="70" fill={cityBgColor} stroke={neonColor1} strokeWidth="0.5" opacity="0.8"/>
          <path d="M 10 150 L 50 150 L 70 130 L 120 130" stroke={neonColor1} strokeWidth="1.5" strokeLinecap="round" opacity="0.8" style={{ animation: 'pulseNeon 2s infinite' }}/>
          <circle cx="120" cy="130" r="3" fill={neonColor1} opacity="0.8"/>
          <path d="M 390 150 L 350 150 L 330 130 L 300 130" stroke={neonColor2} strokeWidth="1.5" strokeLinecap="round" opacity="0.8" style={{ animation: 'pulseNeon 2.5s infinite' }}/>
          <circle cx="300" cy="130" r="3" fill={neonColor2} opacity="0.8"/>
          <text x="345" y="20" fill="#94a3b8" fontSize="8" fontFamily="monospace" fontWeight="bold" opacity="0.7">FLR // 0{floor}</text>
          <style>{`
            @keyframes pulseNeon {
              0%, 100% { opacity: 0.4; }
              50% { opacity: 1; }
            }
          `}</style>
        </svg>
      );
    }
    
    if (selectedSetting === "🏰 Eldoria") {
      const runeColor = floor <= 3 ? "#d97706" : floor <= 6 ? "#38bdf8" : "#f43f5e";
      const stoneColor = floor <= 3 ? "#44403c" : floor <= 6 ? "#475569" : "#7f1d1d";
      const dungeonBg = floor <= 3 ? "#0c0a09" : floor <= 6 ? "#0f172a" : "#1a0505";
      const runeGlow = floor <= 3 ? "#f59e0b" : floor <= 6 ? "#0ea5e9" : "#e11d48";

      return (
        <svg className="w-full h-full" viewBox="0 0 400 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="160" fill={dungeonBg}/>
          <path d="M 140 160 L 140 80 Q 140 40 200 40 Q 260 40 260 80 L 260 160" stroke={stoneColor} strokeWidth="8" fill="none"/>
          <path d="M 150 160 L 150 80 Q 150 50 200 50 Q 250 50 250 80 L 250 160" stroke="#1c1917" strokeWidth="2" fill="none"/>
          <text x="110" y="80" fill={runeColor} fontSize="12" fontFamily="serif" opacity="0.6" style={{ animation: 'floatRune 3s ease-in-out infinite' }}>ᛗ</text>
          <text x="280" y="70" fill={runeColor} fontSize="14" fontFamily="serif" opacity="0.7" style={{ animation: 'floatRune 4s ease-in-out infinite' }}>ᚠ</text>
          <text x="200" y="30" fill={runeColor} fontSize="10" fontFamily="serif" opacity="0.5" style={{ animation: 'floatRune 2.5s ease-in-out infinite' }}>ᚱ</text>
          <path d="M 0 130 Q 200 140 400 130 L 400 160 L 0 160 Z" fill="#292524"/>
          <rect x="185" y="115" width="30" height="20" rx="3" fill="#1c1917" stroke={runeColor} strokeWidth="1.5" style={{ animation: 'glowPedestal 2s infinite' }}/>
          <text x="345" y="20" fill="#94a3b8" fontSize="8" fontFamily="monospace" fontWeight="bold" opacity="0.7">FLR // 0{floor}</text>
          <style>{`
            @keyframes floatRune {
              0%, 100% { transform: translateY(0); opacity: 0.3; }
              50% { transform: translateY(-8px); opacity: 0.8; }
            }
            @keyframes glowPedestal {
              0%, 100% { filter: drop-shadow(0 0 1px ${runeColor}); }
              50% { filter: drop-shadow(0 0 6px ${runeGlow}); }
            }
          `}</style>
        </svg>
      );
    }
    
    if (selectedSetting === "☄️ Sector-9") {
      const nebulaColor = floor <= 3 ? "#0284c7" : floor <= 6 ? "#8b5cf6" : "#e11d48";
      const hatchColor = floor <= 3 ? "#1e293b" : floor <= 6 ? "#1e1b4b" : "#111827";
      const warningColor = floor <= 3 ? "#eab308" : floor <= 6 ? "#c084fc" : "#ef4444";

      return (
        <svg className="w-full h-full" viewBox="0 0 400 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="160" fill="#020617"/>
          <circle cx="40" cy="50" r="1" fill="#fff" opacity="0.8"/>
          <circle cx="340" cy="30" r="1.5" fill="#fff" opacity="0.9"/>
          <circle cx="100" cy="20" r="1.2" fill="#fff" opacity="0.7"/>
          <circle cx="280" cy="90" r="1" fill="#fff" opacity="0.5"/>
          <circle cx="180" cy="110" r="1" fill="#fff" opacity="0.6"/>
          <rect x="150" y="20" width="100" height="120" rx="10" fill={hatchColor} stroke="#475569" strokeWidth="3"/>
          <circle cx="200" cy="80" r="35" fill="#0f172a" stroke="#334155" strokeWidth="2"/>
          <circle cx="200" cy="80" r="30" fill="#020617"/>
          <path d="M 185 75 Q 200 65 215 75 T 215 90 T 185 75" fill={nebulaColor} opacity="0.3" style={{ animation: 'nebulaSpace 10s infinite' }}/>
          <path d="M 130 140 L 150 160 M 150 140 L 170 160 M 170 140 L 190 160 M 190 140 L 210 160 M 210 140 L 230 160 M 230 140 L 250 160 M 250 140 L 270 160" stroke={warningColor} strokeWidth="4"/>
          <path d="M 0 145 L 400 145" stroke="#334155" strokeWidth="2"/>
          <text x="345" y="20" fill="#94a3b8" fontSize="8" fontFamily="monospace" fontWeight="bold" opacity="0.7">FLR // 0{floor}</text>
          <style>{`
            @keyframes nebulaSpace {
              0%, 100% { opacity: 0.2; }
              50% { opacity: 0.6; }
            }
          `}</style>
        </svg>
      );
    }
    
    return null;
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 antialiased">
      
      {/* VIEW 1: CHARACTER CREATOR */}
      {view === 'create' && (
        <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
          <div className="space-y-2 mb-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Character Matrix Initialization
            </h1>
            <p className="text-sm text-slate-400">Forge your protagonist identity to begin the localized campaign loop.</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Character Alias</label>
              <input 
                type="text" 
                placeholder="Enter character name..."
                value={char.name}
                onChange={(e) => setChar({ ...char, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Archetype Signature</label>
              <div className="grid grid-cols-3 gap-3">
                {['Tech Nomad', 'Cyber Mage', 'Scrapper'].map((className) => (
                  <button
                    key={className}
                    onClick={() => setChar({ ...char, class: className })}
                    className={`p-3 text-xs font-medium border rounded-lg transition-all ${
                      char.class === className 
                        ? 'bg-purple-950/40 border-purple-500 text-purple-300 shadow-md shadow-purple-500/10' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {className}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Attribute Mapping</span>
                <span className="text-xs font-bold text-purple-400 bg-purple-950/50 px-2 py-0.5 rounded border border-purple-800">
                  {pointsLeft} Points Remaining
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-slate-300 font-medium w-24">Strength</span>
                    <span className="text-sm font-bold text-slate-100">{char.strength}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => modifyStat('strength', -1)} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 text-slate-400"><Minus className="w-3.5 h-3.5" /></button>
                    <button onClick={() => modifyStat('strength', 1)} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 text-slate-400"><Plus className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Atom className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-slate-300 font-medium w-24">Agility</span>
                    <span className="text-sm font-bold text-slate-100">{char.agility}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => modifyStat('agility', -1)} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 text-slate-400"><Minus className="w-3.5 h-3.5" /></button>
                    <button onClick={() => modifyStat('agility', 1)} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 text-slate-400"><Plus className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-slate-300 font-medium w-24">Intelligence</span>
                    <span className="text-sm font-bold text-slate-100">{char.intelligence}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => modifyStat('intelligence', -1)} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 text-slate-400"><Minus className="w-3.5 h-3.5" /></button>
                    <button onClick={() => modifyStat('intelligence', 1)} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 text-slate-400"><Plus className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            </div>

            <button
              disabled={!char.name || pointsLeft > 0}
              onClick={() => setView('setting')}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm py-2.5 rounded-lg shadow-lg transition-all"
            >
              Lock Character Matrix <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* VIEW 2: SETTING SELECTOR */}
      {view === 'setting' && (
        <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
          <div className="space-y-2 mb-6">
            <h1 className="text-xl font-bold text-slate-100">Select Narrative Setting</h1>
            <p className="text-sm text-slate-400">Choose the spatial zone where your story anchor initializes.</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {(Object.keys(NARRATIVE_POOLS) as Array<keyof typeof NARRATIVE_POOLS>).map((settingKey) => (
              <button
                key={settingKey}
                onClick={() => startGameLoop(settingKey)}
                className="w-full text-left p-4 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition-all space-y-1 group"
              >
                <div className="font-semibold text-sm text-slate-200 group-hover:text-purple-400 transition-colors">{settingKey}</div>
                <div className="text-xs text-slate-400">Launch an active procedural run inside this campaign canvas.</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: ACTIVE PLAYABLE LOOP */}
      {view === 'game' && (
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Character sidebar tracking layout */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:col-span-1 space-y-4 h-fit">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Character</div>
              <div className="font-bold text-slate-100 text-lg truncate">{char.name}</div>
              <div className="text-xs text-purple-400 font-medium">{char.class}</div>
            </div>

            <div className="border-t border-slate-800 pt-3 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-slate-400"><Heart className="w-3.5 h-3.5 text-red-500" /> Vitality</span>
                <span className="font-bold text-slate-200">{char.health} / 100</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-red-500 h-full transition-all" style={{ width: `${char.health}%` }}></div>
              </div>
              <div className="flex justify-between items-center text-xs pt-1">
                <span className="flex items-center gap-1.5 text-slate-400">🪙 Credits / Gold</span>
                <span className="font-bold text-yellow-400">{gold}g</span>
              </div>
            </div>

             <div className="border-t border-slate-800 pt-3 space-y-2 text-xs">
              {earnedPoints > 0 && (
                <div className="text-[10px] text-purple-400 font-bold bg-purple-950/40 border border-purple-800 rounded px-2 py-1 text-center animate-pulse mb-2">
                  ✨ {earnedPoints} Upgrade Point{earnedPoints > 1 ? 's' : ''} available!
                </div>
              )}
              <div className="flex justify-between items-center h-6">
                <span className="text-slate-400">Strength:</span>
                <div className="flex items-center gap-1.5">
                  <span className={`font-bold ${isStatBoosted('strength') ? 'text-amber-400 font-black' : 'text-slate-200'}`}>
                    {getStat('strength')} {isStatBoosted('strength') && `(${char.strength})`}
                  </span>
                  {earnedPoints > 0 && (
                    <button
                      onClick={() => {
                        setChar(prev => ({ ...prev, strength: prev.strength + 1 }));
                        setEarnedPoints(prev => prev - 1);
                      }}
                      className="p-0.5 bg-purple-900 hover:bg-purple-800 text-white rounded border border-purple-700 transition-colors"
                      title="Upgrade Strength"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center h-6">
                <span className="text-slate-400">Agility:</span>
                <div className="flex items-center gap-1.5">
                  <span className={`font-bold ${isStatBoosted('agility') ? 'text-amber-400 font-black' : 'text-slate-200'}`}>
                    {getStat('agility')} {isStatBoosted('agility') && `(${char.agility})`}
                  </span>
                  {earnedPoints > 0 && (
                    <button
                      onClick={() => {
                        setChar(prev => ({ ...prev, agility: prev.agility + 1 }));
                        setEarnedPoints(prev => prev - 1);
                      }}
                      className="p-0.5 bg-purple-900 hover:bg-purple-800 text-white rounded border border-purple-700 transition-colors"
                      title="Upgrade Agility"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center h-6">
                <span className="text-slate-400">Intelligence:</span>
                <div className="flex items-center gap-1.5">
                  <span className={`font-bold ${isStatBoosted('intelligence') ? 'text-amber-400 font-black' : 'text-slate-200'}`}>
                    {getStat('intelligence')} {isStatBoosted('intelligence') && `(${char.intelligence})`}
                  </span>
                  {earnedPoints > 0 && (
                    <button
                      onClick={() => {
                        setChar(prev => ({ ...prev, intelligence: prev.intelligence + 1 }));
                        setEarnedPoints(prev => prev - 1);
                      }}
                      className="p-0.5 bg-purple-900 hover:bg-purple-800 text-white rounded border border-purple-700 transition-colors"
                      title="Upgrade Intelligence"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3 space-y-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">🧪 Potion Belt (Max 3)</div>
              {potions.length > 0 ? (
                <div className="space-y-1.5">
                  {potions.map((potion) => (
                    <div key={potion.id} className="flex justify-between items-center bg-slate-950/60 border border-slate-850 px-2 py-1.5 rounded text-xs font-mono">
                      <div>
                        <div className="font-bold text-slate-350">{potion.name}</div>
                        <div className="text-[9px] text-slate-500">{potion.description}</div>
                      </div>
                      <button
                        onClick={() => consumePotion(potion.id)}
                        className="bg-purple-950 border border-purple-800 hover:bg-purple-900 text-purple-300 text-[10px] px-2 py-0.5 rounded font-black transition-colors"
                      >
                        Drink
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 italic font-mono">No potions carried. Buy them from the Matrix Shop!</div>
              )}
            </div>

            <div className="border-t border-slate-800 pt-3 text-center">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Rooms Cleared</div>
              <div className="text-2xl font-black text-purple-400">{score}</div>
            </div>

            <button 
              onClick={() => {
                setView('create');
                setPointsLeft(10);
                setEarnedPoints(0);
                setGold(100);
                setEquipment({ weapon: null, head: null, body: null, feet: null, accessory: null });
                setShopItems([]);
                setPotions([]);
                setTab('story');
                setChar({
                  name: '',
                  class: 'Tech Nomad',
                  strength: 5,
                  agility: 5,
                  intelligence: 5,
                  health: 100
                });
                setScore(0);
              }}
              className="w-full mt-2 flex items-center justify-center gap-2 text-xs border border-slate-800 hover:bg-slate-800 text-slate-400 py-2 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Simulation
            </button>
          </div>

          {/* Interactive display output stream panel */}
          <div className="md:col-span-3 space-y-4 flex flex-col justify-between">
            {/* Simulation Tabs */}
            <div className="flex gap-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setTab('story')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-t-lg transition-all ${
                  tab === 'story'
                    ? 'bg-slate-900 border-t border-x border-slate-800 text-purple-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🎮 Chronicle Simulation
              </button>
              <button
                onClick={() => setTab('shop')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-t-lg transition-all relative ${
                  tab === 'shop'
                    ? 'bg-slate-900 border-t border-x border-slate-800 text-purple-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🛒 Matrix Shop & Armory
                {gold >= 20 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-500 rounded-full animate-ping" />}
              </button>
            </div>

            {tab === 'story' ? (
              <>
                <div className="bg-slate-900 border border-slate-800 rounded-xl min-h-[420px] flex flex-col justify-between shadow-lg overflow-hidden">
                  {/* Story graphic banner */}
                  <div className="w-full h-40 bg-slate-950 border-b border-slate-800 relative overflow-hidden flex items-center justify-center">
                    {renderStoryGraphic()}
                  </div>
                  
                  {/* Story text display */}
                  <div className="p-6 flex-1 flex flex-col justify-start overflow-y-auto">
                    <span className="text-[10px] uppercase bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-slate-500 w-fit mb-4 tracking-wider font-mono">
                      CURRENT CHRONICLE NODE // {selectedSetting.toUpperCase()}
                    </span>
                    <p className="text-sm leading-relaxed text-slate-300 font-mono whitespace-pre-line">
                      {storyText}
                    </p>
                  </div>
                </div>

                {/* Dynamic Action Matrix Layout */}
                <div className="grid grid-cols-1 gap-2.5">
                  {currentChoices.length > 0 ? (
                    currentChoices.map((choice, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleAction(choice)}
                        className={`w-full text-left text-xs p-3.5 bg-slate-900 hover:bg-slate-850 border rounded-lg text-slate-300 transition-all font-mono flex justify-between items-center group ${
                          choice.statType === 'rest' 
                            ? 'border-emerald-900/45 hover:border-emerald-500/40 hover:text-emerald-300' 
                            : 'border-slate-800 hover:border-purple-900/40 hover:text-purple-300'
                        }`}
                      >
                        <span>
                          {choice.statType === 'rest' ? '⛺ ' : '🎯 '}
                          {choice.text}
                        </span>
                        <span className={`text-[10px] uppercase bg-slate-950 px-2 py-0.5 rounded border text-slate-500 group-hover:text-purple-400 transition-colors ${
                          choice.statType === 'rest' 
                            ? 'border-emerald-800 text-emerald-400 group-hover:text-emerald-300' 
                            : 'border-slate-800 font-mono text-[9px] flex gap-1.5 items-center'
                        }`}>
                          {choice.statType === 'rest' ? 'HEAL / REST' : (
                            <>
                              <span>{choice.statType} (Diff: {choice.difficulty})</span>
                              {choice.rewardMult && choice.rewardMult > 1.5 && (
                                <span className="text-red-400 font-black animate-pulse">🔥 HARD [2.0x Gold]</span>
                              )}
                              {choice.rewardMult && choice.rewardMult < 0.8 && (
                                <span className="text-emerald-400 font-semibold">🟢 EASY [0.6x Gold]</span>
                              )}
                              {(!choice.rewardMult || (choice.rewardMult >= 0.8 && choice.rewardMult <= 1.5)) && (
                                <span className="text-blue-400 font-medium">⚡ MED [1.0x Gold]</span>
                              )}
                            </>
                          )}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="bg-red-950/20 border border-red-900/40 text-red-400 text-center rounded-lg p-4 font-mono text-sm font-semibold">
                      💀 Simulation Terminated. Click Reset Simulation on the sidebar to challenge the matrix again.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 min-h-[490px] flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">Matrix Shop & Armory</h2>
                    <span className="text-xs font-bold text-yellow-400 bg-yellow-950/50 px-3 py-1 rounded border border-yellow-800 flex items-center gap-1.5 font-mono">
                      🪙 {gold} Gold
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Gear */}
                    <div className="space-y-4 border-r border-slate-800 pr-0 md:pr-6">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Equipped Gear</h3>
                      
                      {([
                        { slotName: 'weapon', displayName: '⚔️ Primary Weapon' },
                        { slotName: 'head', displayName: '👤 Head Unit' },
                        { slotName: 'body', displayName: '🛡️ Torso Shell' },
                        { slotName: 'feet', displayName: '⚡ Thrusters / Boots' },
                        { slotName: 'accessory', displayName: '🔮 Accessory Core' }
                      ] as const).map(({ slotName, displayName }) => {
                        const item = equipment[slotName];
                        return (
                          <div key={slotName} className="p-3 bg-slate-950/80 border border-slate-850 rounded-lg flex justify-between items-center font-mono">
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase font-semibold">{displayName}</span>
                              {item ? (
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                                    { E: 'bg-slate-800 text-slate-300', D: 'bg-emerald-950 text-emerald-400', C: 'bg-sky-950 text-sky-400', B: 'bg-indigo-950 text-indigo-400', A: 'bg-amber-950 text-amber-500', S: 'bg-pink-950 text-pink-500' }[item.grade]
                                  }`}>
                                    {item.grade}
                                  </span>
                                  <span className="text-xs font-bold text-slate-200">{item.name}</span>
                                </div>
                              ) : (
                                <div className="text-xs text-slate-500 italic mt-0.5">Empty Slot</div>
                              )}
                            </div>
                            {item && (
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] text-purple-400 font-bold">
                                  {Object.entries(item.statBoost).map(([k, v]) => `+${v} ${k.slice(0, 3).toUpperCase()}`).join(', ')}
                                </span>
                                <button
                                  onClick={() => {
                                    setEquipment(prev => ({ ...prev, [slotName]: null }));
                                    setGold(prev => prev + Math.floor(item.cost / 2));
                                  }}
                                  className="text-[10px] text-red-400 hover:text-red-300 hover:underline transition-colors"
                                >
                                  Sell ({Math.floor(item.cost / 2)}g)
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Right Column: Shop Cache */}
                    <div className="space-y-4">
                      {/* Gear Cache */}
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Merchant Cache (Gear)</h3>
                        
                        {shopItems.length > 0 ? (
                          shopItems.map((item) => {
                            const canBuy = gold >= item.cost;
                            const gradeColor = {
                              E: 'text-slate-400 border-slate-800 bg-slate-950/50',
                              D: 'text-emerald-400 border-emerald-950/50 bg-emerald-950/10',
                              C: 'text-sky-400 border-sky-950/50 bg-sky-950/10',
                              B: 'text-indigo-400 border-indigo-950/50 bg-indigo-950/10',
                              A: 'text-amber-500 border-amber-950/50 bg-amber-950/10',
                              S: 'text-pink-500 border-pink-950/50 bg-pink-950/10 animate-pulse'
                            }[item.grade];

                            return (
                              <div key={item.id} className={`p-3 border rounded-lg flex justify-between items-center font-mono ${gradeColor}`}>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] uppercase font-black opacity-60">[{item.slot}]</span>
                                    <span className="text-xs font-bold">{item.name}</span>
                                  </div>
                                  <div className="text-[10px] mt-1 opacity-90 font-bold">
                                    Boost: {Object.entries(item.statBoost).map(([k, v]) => `+${v} ${k.slice(0, 3).toUpperCase()}`).join(', ')}
                                  </div>
                                </div>
                                <button
                                  disabled={!canBuy}
                                  onClick={() => {
                                    let refund = 0;
                                    const equipped = equipment[item.slot];
                                    if (equipped) {
                                      refund = Math.floor(equipped.cost / 2);
                                    }
                                    setGold(prev => prev - item.cost + refund);
                                    setEquipment(prev => ({ ...prev, [item.slot]: item }));
                                    setShopItems(prev => prev.filter(i => i.id !== item.id));
                                  }}
                                  className={`px-2.5 py-1 text-[10px] font-bold rounded transition-all ${
                                    canBuy
                                      ? 'bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-black shadow-md cursor-pointer'
                                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                  }`}
                                >
                                  🪙 {item.cost}g
                                </button>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-xs text-slate-500 italic text-center py-4 font-mono">Stock sold out. Restocks upon clearing or completing any room!</div>
                        )}
                      </div>

                      {/* Potions Cache */}
                      <div className="space-y-2 border-t border-slate-800 pt-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Liquid Mutagen Cache</h3>
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            { name: "Vitality Elixir", cost: 25, type: 'health' as const, desc: "Restores 35 Vitality on use" },
                            { name: "Alchemist Liquid", cost: 50, type: 'gold' as const, desc: "Gambles gold: yields 20g - 100g" },
                            { name: "Core Mutagen", cost: 80, type: 'stat' as const, desc: "Permanently gains +1 to a random stat" }
                          ].map((p, idx) => {
                            const canBuy = gold >= p.cost && potions.length < 3;
                            return (
                              <div key={idx} className="p-2 border border-slate-850 bg-slate-950/40 rounded-lg flex justify-between items-center font-mono text-xs">
                                <div>
                                  <div className="font-bold text-slate-200">{p.name}</div>
                                  <div className="text-[9px] text-slate-500">{p.desc}</div>
                                </div>
                                <button
                                  disabled={!canBuy}
                                  onClick={() => buyPotion(p.name, p.cost, p.type, p.desc)}
                                  className={`px-2.5 py-1 text-[10px] font-bold rounded transition-all ${
                                    canBuy
                                      ? 'bg-purple-900 hover:bg-purple-800 text-purple-200 cursor-pointer font-black'
                                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                  }`}
                                >
                                  {potions.length >= 3 && gold >= p.cost ? 'Full' : `🪙 ${p.cost}g`}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </main>
  );
}