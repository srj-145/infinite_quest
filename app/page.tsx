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
}

// DATA MATRICES FOR THE PROCEDURAL STORY TELLER
const NARRATIVE_POOLS = {
  "🌌 Neon Core": {
    locations: ["a rain-slicked cyber alleyway", "a glowing neon noodle bar", "an abandoned corporate mainframe server vault", "a black-market cyberware clinic", "the high-security elevator of Arasaka Tower"],
    hazards: ["a squad of corporate security drones sweeps the zone", "a rogue AI starts frying the local grid overhead", "a group of street punks demands an entry toll", "a faulty terminal leaks high-voltage plasma lines"],
    rewards: ["you find an encrypted datapad", "a sympathetic decker beams you a temporary power boost", "you discover a hidden access ventilation shaft"],
    actions: [
      { text: "Use brute force to rip open the magnetic locking bolts", statType: "strength", difficulty: 12 },
      { text: "Attempt to slide through the laser grids undetected", statType: "agility", difficulty: 13 },
      { text: "Hack the central terminal control routing nodes", statType: "intelligence", difficulty: 11 },
      { text: "Proceed cautiously into the shadows", statType: "general", difficulty: 8 }
    ]
  },
  "🏰 Eldoria": {
    locations: ["a crumbling obsidian tower balcony", "a moss-covered druid sanctuary", "the damp underground catacombs", "a flickering tavern filled with suspicious mercenaries", "a clearing next to a sleeping stone golem"],
    hazards: ["a swarm of shadow-imps descends from the rafters", "the stone floor begins collapsing into a spiked pit", "a magical ward triggers a localized fire-storm", "an armored skeletal guard draws its rusted claymore"],
    rewards: ["a glowing mana crystal hums in the corner", "you spot an unmapped escape tunnel behind a tapestry", "a fountain of clear water restores your focus"],
    actions: [
      { text: "Smash through the obstacle with pure physical might", statType: "strength", difficulty: 13 },
      { text: "Dodge under the incoming threat with a quick roll", statType: "agility", difficulty: 11 },
      { text: "Decipher the ancient arcane glyphs carved into the wall", statType: "intelligence", difficulty: 12 },
      { text: "Look around for a mundane alternative route", statType: "general", difficulty: 9 }
    ]
  },
  "☄️ Sector-9": {
    locations: ["the claustrophobic airlock chamber", "the dark, echoing main engine room", "the hydroponics bay overgrown with alien flora", "the crew quarters showing signs of a violent struggle", "the command bridge looking out into a cosmic rift"],
    hazards: ["the oxygen scrubbers suddenly fail, dropping pressure", "a mutated xenomorph lifeform screeches in the vents", "an exposed plasma fuel line bursts into flames", "the artificial gravity matrix flips completely upside down"],
    rewards: ["a pristine emergency medkit rests in a wall locker", "the auxiliary terminal reveals a maintenance schematic", "a heavy steel blast door seals off the danger just in time"],
    actions: [
      { text: "Force the manual airlock crank open with your bare hands", statType: "strength", difficulty: 14 },
      { text: "Scramble into the narrow service conduits quickly", statType: "agility", difficulty: 12 },
      { text: "Bypass the blown command circuits using a plasma torch", statType: "intelligence", difficulty: 11 },
      { text: "Brace yourself and look for standard cover", statType: "general", difficulty: 8 }
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
    
    const pool = NARRATIVE_POOLS[settingName];
    const initialText = `The chronicle of ${char.name} the ${char.class} begins inside ${pool.locations[0]}. Suddenly, ${pool.hazards[0]}! What is your immediate course of action?`;
    
    setStoryText(initialText);
    // Grab initial choices
    const initialChoices = [...pool.actions].sort(() => 0.5 - Math.random()).slice(0, 3) as Choice[];
    setCurrentChoices(initialChoices);
    setView('game');
  };

  // THE RECURSIVE ENGINE: RUNS ON EVERY SINGLE CHOICE CLICK
  const handleAction = (choice: Choice) => {
    if (!selectedSetting) return;
    const pool = NARRATIVE_POOLS[selectedSetting];
    
    // Check if this is a rest choice
    if (choice.statType === 'rest') {
      const healAmount = Math.floor(Math.random() * 15) + 15; // 15-30 healing
      const newHealth = Math.min(100, char.health + healAmount);
      setChar(prev => ({ ...prev, health: newHealth }));
      
      const resolutionText = `[REST] You chose to: "${choice.text}". You set up a secure camp and restore ${healAmount} Vitality points. (Health is now ${newHealth}/100).`;
      
      // Check if next room is a Boss room (every 5 rooms)
      const isNextBoss = (score > 0 && score % 5 === 0);
      if (isNextBoss) {
        const boss = BOSS_POOL[selectedSetting];
        const bossText = `\n\n🚨 BOSS ENCOUNTER! 🚨\nYou enter a new area. ${boss.intro}`;
        setStoryText(resolutionText + bossText);
        setCurrentChoices(boss.actions);
      } else {
        const nextLocation = pool.locations[Math.floor(Math.random() * pool.locations.length)];
        const nextHazard = pool.hazards[Math.floor(Math.random() * pool.hazards.length)];
        const nextChapterText = `\n\nMoving forward, you navigate deeper into ${nextLocation}. Before you can catch your breath, ${nextHazard}!`;
        setStoryText(resolutionText + nextChapterText);
        
        // Generate regular choices with possible rest option
        const regularChoices = [...pool.actions].sort(() => 0.5 - Math.random()) as Choice[];
        let choices = regularChoices.slice(0, 3);
        const shouldOfferRest = newHealth < 40 || (newHealth < 70 && Math.random() < 0.4);
        if (shouldOfferRest) {
          const restOptions = [
            { text: "Set up a temporary shelter and tend to your wounds", statType: "rest", difficulty: 0 },
            { text: "Consume an emergency ration pack and rest in the shadows", statType: "rest", difficulty: 0 },
            { text: "Take a brief moment to catch your breath and recuperate", statType: "rest", difficulty: 0 }
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
      playerStatValue = char[choice.statType];
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
      if (isBossChoice) {
        setEarnedPoints(prev => prev + 5); // 5 points for boss!
        const heal = 30;
        setChar(prev => ({ ...prev, health: Math.min(100, prev.health + heal) }));
        rewardText = `You defeated the Boss! You earned 5 Attribute Upgrade Points and restored ${heal} Vitality`;
      } else {
        setEarnedPoints(prev => prev + 2); // 2 points for regular success
        rewardText = pool.rewards[Math.floor(Math.random() * pool.rewards.length)];
      }
      resolutionText = `[SUCCESS] You chose to: "${choice.text}". Your ${choice.statType.toUpperCase()} trait held strong! (Rolled ${totalRoll} vs Diff ${choice.difficulty}). You expertly bypass the threat, and ${rewardText}.`;
    } else {
      let failDamage = 0;
      if (isBossChoice) {
        failDamage = Math.floor(Math.random() * 20) + 20; // 20-40 damage for boss!
        resolutionText = `[FAILURE] You tried to: "${choice.text}". The Boss completely overwhelmed you! (Rolled ${totalRoll} vs Diff ${choice.difficulty}). You take a devastating blow, losing ${failDamage} Vitality points.`;
      } else {
        failDamage = Math.floor(Math.random() * 15) + 10; // 10-25 damage
        resolutionText = `[FAILURE] You tried to: "${choice.text}". However, the scenario outmatched your raw attributes... (Rolled ${totalRoll} vs Diff ${choice.difficulty}). You take a heavy hit, losing ${failDamage} Vitality points.`;
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

    // Check if next room should be a Boss room (every 5 rooms)
    const isNextBoss = (nextScore > 0 && nextScore % 5 === 0);
    if (isNextBoss) {
      const boss = BOSS_POOL[selectedSetting];
      const bossText = `\n\n🚨 BOSS ENCOUNTER! 🚨\nYou enter a new area. ${boss.intro}`;
      setStoryText(resolutionText + bossText);
      setCurrentChoices(boss.actions);
    } else {
      const nextLocation = pool.locations[Math.floor(Math.random() * pool.locations.length)];
      const nextHazard = pool.hazards[Math.floor(Math.random() * pool.hazards.length)];
      const nextChapterText = `\n\nMoving forward, you navigate deeper into ${nextLocation}. Before you can catch your breath, ${nextHazard}!`;
      setStoryText(resolutionText + nextChapterText);

      // Generate regular choices with possible rest option
      const regularChoices = [...pool.actions].sort(() => 0.5 - Math.random()) as Choice[];
      let choices = regularChoices.slice(0, 3);
      const shouldOfferRest = currentHealth < 40 || (currentHealth < 70 && Math.random() < 0.4);
      if (shouldOfferRest) {
        const restOptions = [
          { text: "Set up a temporary shelter and tend to your wounds", statType: "rest", difficulty: 0 },
          { text: "Consume an emergency ration pack and rest in the shadows", statType: "rest", difficulty: 0 },
          { text: "Take a brief moment to catch your breath and recuperate", statType: "rest", difficulty: 0 }
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
      return (
        <svg className="w-full h-full" viewBox="0 0 400 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="160" fill="#030712"/>
          <path d="M 0 100 L 400 100 M 0 120 L 400 120 M 0 140 L 400 140" stroke="#1e1b4b" strokeWidth="1"/>
          <path d="M 200 80 L -100 160 M 200 80 L 0 160 M 200 80 L 100 160 M 200 80 L 200 160 M 200 80 L 300 160 M 200 80 L 400 160 M 200 80 L 500 160" stroke="#1e1b4b" strokeWidth="1"/>
          <rect x="30" y="40" width="40" height="80" fill="#0f172a" stroke="#3b82f6" strokeWidth="0.5" opacity="0.8"/>
          <rect x="90" y="20" width="50" height="100" fill="#0f172a" stroke="#a855f7" strokeWidth="0.5" opacity="0.8"/>
          <rect x="260" y="30" width="45" height="90" fill="#0f172a" stroke="#3b82f6" strokeWidth="0.5" opacity="0.8"/>
          <rect x="320" y="50" width="50" height="70" fill="#0f172a" stroke="#ec4899" strokeWidth="0.5" opacity="0.8"/>
          <path d="M 10 150 L 50 150 L 70 130 L 120 130" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" style={{ animation: 'pulseNeon 2s infinite' }}/>
          <circle cx="120" cy="130" r="3" fill="#06b6d4" opacity="0.8"/>
          <path d="M 390 150 L 350 150 L 330 130 L 300 130" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" style={{ animation: 'pulseNeon 2.5s infinite' }}/>
          <circle cx="300" cy="130" r="3" fill="#ec4899" opacity="0.8"/>
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
      return (
        <svg className="w-full h-full" viewBox="0 0 400 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="160" fill="#0c0a09"/>
          <path d="M 140 160 L 140 80 Q 140 40 200 40 Q 260 40 260 80 L 260 160" stroke="#44403c" strokeWidth="8" fill="none"/>
          <path d="M 150 160 L 150 80 Q 150 50 200 50 Q 250 50 250 80 L 250 160" stroke="#1c1917" strokeWidth="2" fill="none"/>
          <text x="110" y="80" fill="#d97706" fontSize="12" fontFamily="serif" opacity="0.6" style={{ animation: 'floatRune 3s ease-in-out infinite' }}>ᛗ</text>
          <text x="280" y="70" fill="#d97706" fontSize="14" fontFamily="serif" opacity="0.7" style={{ animation: 'floatRune 4s ease-in-out infinite' }}>ᚠ</text>
          <text x="200" y="30" fill="#d97706" fontSize="10" fontFamily="serif" opacity="0.5" style={{ animation: 'floatRune 2.5s ease-in-out infinite' }}>ᚱ</text>
          <path d="M 0 130 Q 200 140 400 130 L 400 160 L 0 160 Z" fill="#292524"/>
          <rect x="185" y="115" width="30" height="20" rx="3" fill="#1c1917" stroke="#d97706" strokeWidth="1.5" style={{ animation: 'glowPedestal 2s infinite' }}/>
          <style>{`
            @keyframes floatRune {
              0%, 100% { transform: translateY(0); opacity: 0.3; }
              50% { transform: translateY(-8px); opacity: 0.8; }
            }
            @keyframes glowPedestal {
              0%, 100% { filter: drop-shadow(0 0 1px #d97706); }
              50% { filter: drop-shadow(0 0 6px #f59e0b); }
            }
          `}</style>
        </svg>
      );
    }
    
    if (selectedSetting === "☄️ Sector-9") {
      return (
        <svg className="w-full h-full" viewBox="0 0 400 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="160" fill="#020617"/>
          <circle cx="40" cy="50" r="1" fill="#fff" opacity="0.8"/>
          <circle cx="340" cy="30" r="1.5" fill="#fff" opacity="0.9"/>
          <circle cx="100" cy="20" r="1.2" fill="#fff" opacity="0.7"/>
          <circle cx="280" cy="90" r="1" fill="#fff" opacity="0.5"/>
          <circle cx="180" cy="110" r="1" fill="#fff" opacity="0.6"/>
          <rect x="150" y="20" width="100" height="120" rx="10" fill="#1e293b" stroke="#475569" strokeWidth="3"/>
          <circle cx="200" cy="80" r="35" fill="#0f172a" stroke="#334155" strokeWidth="2"/>
          <circle cx="200" cy="80" r="30" fill="#020617"/>
          <path d="M 185 75 Q 200 65 215 75 T 215 90 T 185 75" fill="#0284c7" opacity="0.3" style={{ animation: 'nebulaSpace 10s infinite' }}/>
          <path d="M 130 140 L 150 160 M 150 140 L 170 160 M 170 140 L 190 160 M 190 140 L 210 160 M 210 140 L 230 160 M 230 140 L 250 160 M 250 140 L 270 160" stroke="#eab308" strokeWidth="4"/>
          <path d="M 0 145 L 400 145" stroke="#334155" strokeWidth="2"/>
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
                  <span className="font-bold text-slate-200">{char.strength}</span>
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
                  <span className="font-bold text-slate-200">{char.agility}</span>
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
                  <span className="font-bold text-slate-200">{char.intelligence}</span>
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

            <div className="border-t border-slate-800 pt-3 text-center">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Rooms Cleared</div>
              <div className="text-2xl font-black text-purple-400">{score}</div>
            </div>

            <button 
              onClick={() => {
                setView('create');
                setPointsLeft(10);
                setEarnedPoints(0);
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
                        : 'border-slate-800'
                    }`}>
                      {choice.statType === 'rest' ? 'HEAL / REST' : `${choice.statType} (Diff: ${choice.difficulty})`}
                    </span>
                  </button>
                ))
              ) : (
                <div className="bg-red-950/20 border border-red-900/40 text-red-400 text-center rounded-lg p-4 font-mono text-sm font-semibold">
                  💀 Simulation Terminated. Click Reset Simulation on the sidebar to challenge the matrix again.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </main>
  );
}