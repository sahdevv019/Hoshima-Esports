import type { GameDefinition } from '../types/games';

export const GAMES_DATA: Record<string, GameDefinition> = {
  ff: {
    id: 'ff',
    name: 'Free Fire Max',
    subtitle: 'Battle Royale — Squad Mode',
    badge: 'Battle Royale',
    badgeColor: 'rgba(255,107,0,.15)',
    badgeText: '#ff9800',
    badgeBorder: 'rgba(255,152,0,.35)',
    heroBg: 'linear-gradient(135deg,#1a0a00,#3a1000 50%,rgba(255,107,0,.15))',
    iconBg: 'linear-gradient(135deg,#1a0500,#3a1000)',
    accent: '#ff9800',
    playersCount: 6,
    titlesCount: 12,
    rankBadge: 'A+',
    scrims: [
      { title: 'Squad Warmup — Bermuda', time: 'Today 8:00 PM', format: '4v4 Squad', spots: '2 spots left', status: 'open' },
      { title: 'Zone Rotation Practice', time: 'Today 10:00 PM', format: 'Full Lobby', spots: 'Full', status: 'full' },
      { title: 'Clash Squad Training', time: 'Tomorrow 7:00 PM', format: '4v4 CS', spots: '4 spots left', status: 'upcoming' }
    ],
    strategies: [
      { title: 'Clock Tower Rush', category: 'attack', desc: 'Aggressive early-game push to Clock Tower using smoke + flash combo. IGL leads with AWM cover.', author: 'AXIOM', likes: 24 },
      { title: 'Blue Zone Rotation', category: 'rotation', desc: 'Consistent safe-zone path via factory — never cross open fields without vehicle cover.', author: 'REXX', likes: 18 },
      { title: 'Final Circle Defense', category: 'defense', desc: 'Box formation with designated corners. Never break formation unless 1v1 situation arises.', author: 'AXIOM', likes: 31 },
      { title: 'Squad Communication', category: 'team', desc: 'Callout format: Zone > Distance > Direction. Keep comms clean — no panic calling.', author: 'Coach', likes: 42 }
    ],
    roles: [
      { name: 'IGL', player: 'AXIOM', tag: 'Leader', color: '#ff9800' },
      { name: 'Sniper', player: 'REXX', tag: 'Long Range', color: '#ffd600' },
      { name: 'Support', player: 'SB', tag: 'Medic', color: '#4fc3f7' },
      { name: 'Rusher', player: 'AX', tag: 'Entry', color: '#ff4655' }
    ],
    callouts: ['Clock Tower', 'Factory', 'Bimasakti', 'Peak', 'Pochinok', 'Shipyard', 'Cape Town', 'Bermuda', 'Kalahari', 'Purgatory'],
    timeline: [
      { time: '0:00 — Drop', title: 'Hot Drop Protocol', desc: 'Land Clock Tower or Peak — contest enemies immediately for early kills.' },
      { time: '5:00 — Mid Game', title: 'Rotate & Loot', desc: 'Clear one mid-tier zone, full heal, consolidate ammo before third-party risk.' },
      { time: '10:00 — End Game', title: 'Final Circle Setup', desc: 'Establish elevated position before the last 3 circles. Box up and wait.' }
    ],
    objectives: [
      { text: 'First Kill — secure IGL kill within 90 seconds of landing.' },
      { text: 'Mid-game lead — top-3 kill count before final circle entry.' },
      { text: 'Booyah — last squad standing. No unnecessary 3rd-party risks.' }
    ]
  },
  bgmi: {
    id: 'bgmi',
    name: 'BGMI',
    subtitle: 'Battle Royale — Tactical Squads',
    badge: 'Battle Royale',
    badgeColor: 'rgba(224,64,251,.12)',
    badgeText: '#e040fb',
    badgeBorder: 'rgba(224,64,251,.35)',
    heroBg: 'linear-gradient(135deg,#0a0a1a,#1a0a2a 50%,rgba(92,45,145,.2))',
    iconBg: 'linear-gradient(135deg,#0a001a,#2a0050)',
    accent: '#e040fb',
    playersCount: 4,
    titlesCount: 8,
    rankBadge: 'S+',
    scrims: [
      { title: 'Erangel Tactical Scrim', time: 'Today 9:00 PM', format: '4v4 TPP', spots: '3 spots left', status: 'open' },
      { title: 'Miramar Sniper Drill', time: 'Tomorrow 6:30 PM', format: 'Duo', spots: '2 spots left', status: 'upcoming' },
      { title: 'Full Lobby Practice', time: 'Tomorrow 9:00 PM', format: '4v4 Squad', spots: 'Full', status: 'full' }
    ],
    strategies: [
      { title: 'School Rush Strategy', category: 'attack', desc: 'Aggressive school drop on Erangel — deny early loot and force nearby squads into unfavorable positions.', author: 'PHANTOM', likes: 19 },
      { title: 'Compound Defense', category: 'defense', desc: 'Claim compound near the center of final zone early. Hard hold with throwables and suppressed fire.', author: 'Coach', likes: 27 },
      { title: 'Motorcycle Rotation', category: 'rotation', desc: 'Always have a driver-assigned player. Pre-scout rotation paths before zone shifts.', author: 'PHANTOM', likes: 14 },
      { title: 'Grenade Coordination', category: 'team', desc: 'Simultaneous frag+smoke push — IGL calls "3-2-1 throw". Never solo grenade in endgame.', author: 'Coach', likes: 35 }
    ],
    roles: [
      { name: 'IGL', player: 'PHANTOM', tag: 'Tactician', color: '#e040fb' },
      { name: 'Fragger', player: 'AX', tag: 'Entry', color: '#ff4655' },
      { name: 'Sniper', player: 'ZERO', tag: 'AWM', color: '#ffd600' },
      { name: 'Support', player: 'SB', tag: 'Medic', color: '#4fc3f7' }
    ],
    callouts: ['School', 'Pochinki', 'Military Base', 'Mylta Power', 'Georgopol', 'Ferry Pier', 'Rozhok', 'Ruins', 'Sosnovka', 'Lipovka'],
    timeline: [
      { time: '0:00 — Drop', title: 'Coordinated Landing', desc: 'Stick together — no split drops. Call loot status in first 30 seconds.' },
      { time: '6:00 — Mid Ring', title: 'Control Zone', desc: 'Take compound inside zone. Deny vehicle access to enemies trying to rotate.' },
      { time: '12:00 — End Ring', title: 'Smoke & Push', desc: 'Coordinated smoke grenade coverage across open fields for the final push.' }
    ],
    objectives: [
      { text: 'No solo pushes — always move as unit of 2 minimum.' },
      { text: 'Zone advantage — always be inside blue zone before final circle.' },
      { text: 'Chicken Dinner — methodical, not aggressive. Let others fight first.' }
    ]
  },
  val: {
    id: 'val',
    name: 'Valorant',
    subtitle: 'Tactical FPS — 5v5 Competitive',
    badge: 'Tactical FPS',
    badgeColor: 'rgba(255,70,85,.1)',
    badgeText: '#ff4655',
    badgeBorder: 'rgba(255,70,85,.35)',
    heroBg: 'linear-gradient(135deg,#1a0005,#2a0008 50%,rgba(255,70,85,.15))',
    iconBg: 'linear-gradient(135deg,#1a0003,#3a0008)',
    accent: '#ff4655',
    playersCount: 5,
    titlesCount: 5,
    rankBadge: 'Radiant',
    scrims: [
      { title: 'Haven Retake Drill', time: 'Today 8:30 PM', format: '5v5 Ranked', spots: '1 spot left', status: 'open' },
      { title: 'Ascent Offensive Strats', time: 'Tomorrow 7:00 PM', format: '5v5 Unrated', spots: '3 spots left', status: 'upcoming' },
      { title: 'Clutch Scenarios', time: 'Tomorrow 9:30 PM', format: '1v1 / 2v2', spots: '2 spots left', status: 'upcoming' }
    ],
    strategies: [
      { title: 'B Site Default Take', category: 'attack', desc: 'Smokes on CT and Catwalk. Entry fragger peeks with Jett dash. Sentinel sets up post-plant.', author: 'NOVA', likes: 38 },
      { title: 'A Site Retake', category: 'defense', desc: 'IGL calls "retake" after 2 enemies spotted. Brimstone molly + Sova dart to deny spike.', author: 'STROBE', likes: 29 },
      { title: 'Mid Control First', category: 'rotation', desc: 'Controlling mid on Ascent or Haven gives fastest rotation to both sites. Priority every round.', author: 'Coach', likes: 44 },
      { title: 'Economy Rounds', category: 'team', desc: 'On eco rounds, stack one site 4-1. One player sentinel-holds other. Force a buy next round.', author: 'NOVA', likes: 22 }
    ],
    roles: [
      { name: 'IGL / Controller', player: 'STROBE', tag: 'Brimstone', color: '#42a5f5' },
      { name: 'Duelist', player: 'NOVA', tag: 'Jett', color: '#ff4655' },
      { name: 'Initiator', player: 'PHANTOM', tag: 'Sova', color: '#ce93d8' },
      { name: 'Sentinel', player: 'AX', tag: 'Cypher', color: '#ffd600' },
      { name: 'Flex', player: 'SB', tag: 'Omen', color: '#4fc3f7' }
    ],
    callouts: ['A Site', 'B Site', 'Mid', 'CT', 'Catwalk', 'Market', 'Garage', 'Generator', 'Rafters', 'Sewers'],
    timeline: [
      { time: 'Buy Phase', title: 'Economy Call', desc: 'IGL calls buy/half-buy/eco before purchase phase ends. No solo full-buys.' },
      { time: 'Round Start', title: 'Mid Control', desc: 'Initiator-darts mid, Controller smokes key angles, Duelist watches flanks.' },
      { time: 'Post-Plant', title: 'Spike Defense', desc: 'Sentinel plants and repositions. Two players lurk CT side. Do not rush re-peek.' }
    ],
    objectives: [
      { text: 'Win pistol round — establishes eco momentum for the half.' },
      { text: 'First blood priority — Duelist should open with 2+ kills in attack rounds.' },
      { text: 'Match win — 13 rounds win. Adapt agent composition between halves.' }
    ]
  },
  ml: {
    id: 'ml',
    name: 'Mobile Legends',
    subtitle: 'MOBA — 5v5 Ranked',
    badge: 'MOBA',
    badgeColor: 'rgba(0,229,255,.08)',
    badgeText: '#00e5ff',
    badgeBorder: 'rgba(0,229,255,.3)',
    heroBg: 'linear-gradient(135deg,#00050a,#001020 50%,rgba(13,71,161,.2))',
    iconBg: 'linear-gradient(135deg,#00050a,#001a30)',
    accent: '#00e5ff',
    playersCount: 5,
    titlesCount: 9,
    rankBadge: 'Mythic',
    scrims: [
      { title: 'Draft Pick Practice', time: 'Today 7:30 PM', format: '5v5 Ranked', spots: '2 spots left', status: 'open' },
      { title: 'Jungler Sync Drill', time: 'Tomorrow 8:00 PM', format: '5v5 Custom', spots: '3 spots left', status: 'upcoming' },
      { title: 'Late Game Scenarios', time: 'Tomorrow 10:00 PM', format: 'Full Match', spots: 'Full', status: 'full' }
    ],
    strategies: [
      { title: 'Early Turtle Control', category: 'attack', desc: 'Roamer initiates Turtle fight at 3:00. Marksman and Mage poke from distance. Never dive blind.', author: 'ZERO', likes: 26 },
      { title: 'Defensive Rotation', category: 'defense', desc: 'If enemy pushes turret, rotate 2 players to defend while jungle secures opposite objective.', author: 'Coach', likes: 33 },
      { title: 'Triple Lane Rotation', category: 'rotation', desc: 'After Lord spawn, all 5 collapse mid. Sacrifice side turrets only when Lord is secured.', author: 'ZERO', likes: 21 },
      { title: 'Engage Sequence', category: 'team', desc: 'Tank engages, Marksman follows, Assassin cleans up. Never let Marksman initiate fights.', author: 'AXIOM', likes: 47 }
    ],
    roles: [
      { name: 'Jungler', player: 'ZERO', tag: 'Carry', color: '#00e5ff' },
      { name: 'Roamer / Tank', player: 'AX', tag: 'Initiator', color: '#42a5f5' },
      { name: 'Marksman', player: 'NOVA', tag: 'ADC', color: '#ffd600' },
      { name: 'Mage', player: 'STROBE', tag: 'Burst', color: '#ce93d8' },
      { name: 'Gold Laner', player: 'PHANTOM', tag: 'Fighter', color: '#ff9800' }
    ],
    callouts: ['Blue Buff', 'Red Buff', 'Turtle', 'Lord', 'Gold Lane', 'Exp Lane', 'Mid Lane', 'Jungle', 'Rotation', 'Base'],
    timeline: [
      { time: '0:00 — Early', title: 'Buff & Invade', desc: 'Secure own buff immediately. Scout enemy jungle for early kills if possible.' },
      { time: '3:00 — Turtle', title: 'First Objective', desc: 'Full team collects near Turtle. If enemy contest — fight. If not, free Turtle.' },
      { time: '10:00 — Lord', title: 'Lord Push', desc: 'Lord push with Marksman and Mage staying safe. Tank and Assassin dive base if Lord taken.' }
    ],
    objectives: [
      { text: 'First Blood — Jungler ganks Gold Lane at 1:30 for momentum.' },
      { text: 'Turtle x3 — never let enemy take 2 free Turtles. Contest every one.' },
      { text: 'Lord close-out — use Lord push to win game. Avoid backdoor strategies.' }
    ]
  }
};
