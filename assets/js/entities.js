
// Entities module - Player, enemies, bullets, powerups

// Player setup
const player = {
  x: 0,
  y: 0,
  width: 70,
  height: 28,
  color: 'white',
  get scaledWidth() { return this.width * mobileScale; },
  get scaledHeight() { return this.height * mobileScale; }
};

function resetPlayerPosition() {
  // Ensure canvas exists and has dimensions
  if (!canvas || !canvas.width || !canvas.height) {
    return;
  }
  
  // Ensure mobileScale is defined
  const scale = (typeof mobileScale !== 'undefined') ? mobileScale : 1;
  const mobile = (typeof isMobile !== 'undefined') ? isMobile : false;
  
  player.x = canvas.width / 2 - (player.scaledWidth / 2);
  const bottomOffset = mobile ? Math.max(80 * scale, canvas.height * 0.1) : 80;
  player.y = canvas.height - bottomOffset;
}

// Game objects arrays
let bullets = [];
let blobs = [];
let boxes = [];
let boss = null;

// Functions to spawn game objects
function getDifficultySettings() {
  switch(difficulty) {
    case 'easy':
      return { 
        spawnMultiplier: 0.8, 
        bossHealthMultiplier: 0.7, 
        spawnInterval: 350,
        levelHealthIncrease: 0.3,
        levelSpeedIncrease: 0.1 
      };
    case 'medium':
      return { 
        spawnMultiplier: 1.0, 
        bossHealthMultiplier: 1.0, 
        spawnInterval: 250,
        levelHealthIncrease: 0.5,
        levelSpeedIncrease: 0.15 
      };
    case 'hard':
      return { 
        spawnMultiplier: 1.3, 
        bossHealthMultiplier: 1.5, 
        spawnInterval: 150,
        levelHealthIncrease: 0.8,
        levelSpeedIncrease: 0.2 
      };
    default:
      return { 
        spawnMultiplier: 1.0, 
        bossHealthMultiplier: 1.0, 
        spawnInterval: 250,
        levelHealthIncrease: 0.5,
        levelSpeedIncrease: 0.15 
      };
  }
}

// Enemy type definitions
const enemyTypes = {
  basic: { rarity: 0.4, sizeMultiplier: 1.0, healthMultiplier: 1.0, speedMultiplier: 1.0, movement: 'straight' },
  small: { rarity: 0.25, sizeMultiplier: 0.7, healthMultiplier: 0.7, speedMultiplier: 1.3, movement: 'zigzag' },
  large: { rarity: 0.15, sizeMultiplier: 1.4, healthMultiplier: 1.8, speedMultiplier: 0.8, movement: 'straight' },
  spinner: { rarity: 0.1, sizeMultiplier: 1.3, healthMultiplier: 1.5, speedMultiplier: 0.6, movement: 'spin' },
  weaver: { rarity: 0.06, sizeMultiplier: 1.1, healthMultiplier: 1.2, speedMultiplier: 0.9, movement: 'weave' },
  giant: { rarity: 0.03, sizeMultiplier: 2.0, healthMultiplier: 3.0, speedMultiplier: 0.5, movement: 'straight' },
  swooper: { rarity: 0.02, sizeMultiplier: 0.9, healthMultiplier: 1.0, speedMultiplier: 1.5, movement: 'swoop' }
};

function getEnemyType() {
  const rand = Math.random();
  let cumulative = 0;
  
  for (const [type, data] of Object.entries(enemyTypes)) {
    cumulative += data.rarity;
    if (rand <= cumulative) {
      return { type, ...data };
    }
  }
  return { type: 'basic', ...enemyTypes.basic };
}

function spawnCluster() {
  const diffSettings = getDifficultySettings();
  
  // Scale spawn count based on total power-up levels
  const totalPowerLevel = permanentRapidLevel + permanentSprayLevel + permanentBulletLevel + 
                         permanentShieldLevel + permanentSpeedLevel + permanentMultiLevel;
  const powerScaling = 1 + (totalPowerLevel * 0.15);
  
  const baseCount = Math.floor(Math.random() * (8 - 3 + 1)) + 3;
  const count = Math.floor(baseCount * diffSettings.spawnMultiplier * powerScaling);
  const clusterCenterX = Math.random() * (canvas.width - 100) + 50;
  const spread = 80;

  const levelHealthBonus = Math.floor((currentLevel - 1) * diffSettings.levelHealthIncrease * 2);
  const levelSpeedBonus = (currentLevel - 1) * diffSettings.levelSpeedIncrease;

  for (let i = 0; i < count; i++) {
    const offsetX = (Math.random() - 0.5) * spread;
    const offsetY = (Math.random() - 0.5) * spread;
    
    const enemyData = getEnemyType();
    const baseRadius = 28 * mobileScale;
    const radius = baseRadius * enemyData.sizeMultiplier;
    
    const baseHealth = Math.floor(Math.random() * 2) + baseEnemyHealth + currentLevel;
    const health = Math.floor((baseHealth + levelHealthBonus) * enemyData.healthMultiplier);
    
    const baseSpeed = (1 + Math.random()) * baseEnemySpeed + levelSpeedBonus;
    const speed = baseSpeed * enemyData.speedMultiplier;

    let blob = {
      x: clusterCenterX + offsetX,
      y: -20 + offsetY,
      radius: radius,
      speed: speed,
      baseSpeed: speed,
      color: getEnemyColor(enemyData.type),
      health: health,
      maxHealth: health,
      enemyType: enemyData.type,
      movement: enemyData.movement,
      rotation: 0,
      pulsatePhase: Math.random() * Math.PI * 2,
      movementTimer: 0,
      amplitude: 30 + Math.random() * 40,
      frequency: 0.02 + Math.random() * 0.03,
      swoopStartY: -20 + offsetY,
      swoopDirection: Math.random() < 0.5 ? -1 : 1,
      get scaledRadius() { return this.radius; },
      get isSpinner() { return this.enemyType === 'spinner'; }
    };
    blobs.push(blob);
  }
}

function getEnemyColor(type) {
  const colorMap = {
    basic: 'hsl(' + Math.random() * 360 + ', 100%, 50%)',
    small: '#00FF88',
    large: '#FF4444',
    spinner: '#FF00FF',
    weaver: '#FFAA00',
    giant: '#8B0000',
    swooper: '#00AAFF'
  };
  return colorMap[type] || colorMap.basic;
}

function spawnBoxForType(type, isInitial = false) {
  const boxWidth = 60 * mobileScale, boxHeight = 60 * mobileScale;
  const min = 10, max = isInitial ? 20 : 50;
  let boxColor, doorColor;
  
  const colorMap = {
    "rapid": { boxColor: "#1E90FF", doorColor: "#1874CD" },
    "spray": { boxColor: "#FFA500", doorColor: "#CC8400" },
    "bullet": { boxColor: "#32CD32", doorColor: "#2E8B57" },
    "shield": { boxColor: "#9932CC", doorColor: "#8B008B" },
    "speed": { boxColor: "#FF69B4", doorColor: "#FF1493" },
    "multi": { boxColor: "#DC143C", doorColor: "#B22222" },
    "bomb": { boxColor: "#FFD700", doorColor: "#FFA500" }
  };
  
  const colors = colorMap[type];
  
  const newBox = {
    x: Math.random() * (canvas.width - boxWidth),
    y: Math.random() * (canvas.height / 3),
    width: boxWidth,
    height: boxHeight,
    type: type,
    health: Math.floor(Math.random() * (max - min + 1)) + min,
    createdTime: Date.now(),
    boxColor: colors.boxColor,
    doorColor: colors.doorColor
  };
  boxes.push(newBox);
}

function checkIfMaxLevel(type) {
  const maxLevels = {
    'rapid': 10, 'spray': 10, 'bullet': 2, 'shield': 10, 'speed': 5, 'multi': 3
  };
  const currentLevels = {
    'rapid': permanentRapidLevel, 'spray': permanentSprayLevel, 'bullet': permanentBulletLevel,
    'shield': permanentShieldLevel, 'speed': permanentSpeedLevel, 'multi': permanentMultiLevel
  };
  return currentLevels[type] >= maxLevels[type];
}

function spawnRandomBox(isInitial = false) {
  const rand = Math.random();
  let type;

  const availablePowerUps = ['rapid'];
  if (currentLevel >= 1) availablePowerUps.push('spray');
  if (currentLevel >= 2) availablePowerUps.push('bullet', 'shield');
  if (currentLevel >= 3) availablePowerUps.push('speed');
  if (currentLevel >= 4) availablePowerUps.push('multi');
  if (currentLevel >= 5) availablePowerUps.push('bomb');

  if (availablePowerUps.includes('bomb') && rand < 0.008) {
    type = "bomb";
  } else if (availablePowerUps.includes('bullet') && rand < 0.01) {
    type = "bullet";
  } else if (availablePowerUps.includes('shield') && rand < 0.03) {
    type = "shield";
  } else if (availablePowerUps.includes('speed') && rand < 0.05) {
    type = "speed";
  } else if (availablePowerUps.includes('multi') && rand < 0.07) {
    type = "multi";
  } else if (availablePowerUps.includes('spray') && rand < 0.4) {
    type = "spray";
  } else {
    type = "rapid";
  }

  spawnBoxForType(type, isInitial);
}

function spawnBoxes() {
  boxes = [];
  spawnBoxForType("rapid", true);
  spawnBoxForType("spray", true);

  if (currentLevel >= 2 && boxes.length < 5) {
    spawnBoxForType("bullet", true);
    if (boxes.length < 5) {
      spawnBoxForType("shield", true);
    }
  }
  if (currentLevel >= 3 && boxes.length < 5) {
    spawnBoxForType("speed", true);
  }
  if (currentLevel >= 4 && boxes.length < 5) {
    spawnBoxForType("multi", true);
  }
}

// Boss type definitions
const bossTypes = {
  destroyer: { 
    sizeMultiplier: 1.0, healthMultiplier: 1.0, speedMultiplier: 1.0, 
    color: '#FF0000', movement: 'straight', rarity: 0.4 
  },
  titan: { 
    sizeMultiplier: 1.5, healthMultiplier: 1.8, speedMultiplier: 0.7, 
    color: '#8B0000', movement: 'weave', rarity: 0.25 
  },
  guardian: { 
    sizeMultiplier: 1.2, healthMultiplier: 1.4, speedMultiplier: 0.8, 
    color: '#FF4500', movement: 'circle', rarity: 0.2 
  },
  colossus: { 
    sizeMultiplier: 2.2, healthMultiplier: 2.5, speedMultiplier: 0.5, 
    color: '#4B0000', movement: 'straight', rarity: 0.1 
  },
  leviathan: { 
    sizeMultiplier: 3.0, healthMultiplier: 4.0, speedMultiplier: 0.3, 
    color: '#2F0000', movement: 'pulse', rarity: 0.05 
  }
};

function getBossType() {
  const rand = Math.random();
  let cumulative = 0;
  
  for (const [type, data] of Object.entries(bossTypes)) {
    cumulative += data.rarity;
    if (rand <= cumulative) {
      return { type, ...data };
    }
  }
  return { type: 'destroyer', ...bossTypes.destroyer };
}

function spawnBoss() {
  // Safety checks for canvas dimensions and mobileScale
  const safeCanvasWidth = isFinite(canvas.width) ? canvas.width : 800;
  const safeCanvasHeight = isFinite(canvas.height) ? canvas.height : 600;
  const safeMobileScale = isFinite(mobileScale) ? mobileScale : 1;
  
  const bossData = getBossType();
  const baseRadius = 80 * safeMobileScale;
  const bossRadius = baseRadius * bossData.sizeMultiplier;
  
  const diffSettings = getDifficultySettings();
  const baseHealth = 500 + (currentLevel - 1) * 50;
  const health = Math.floor(baseHealth * diffSettings.bossHealthMultiplier * bossData.healthMultiplier);
  
  // Ensure boss spawns within valid boundaries
  const maxX = Math.max(safeCanvasWidth - bossRadius * 2, bossRadius);
  const spawnX = Math.random() * maxX + bossRadius;
  
  boss = {
    x: isFinite(spawnX) ? spawnX : safeCanvasWidth / 2,
    y: -bossRadius,
    radius: isFinite(bossRadius) ? bossRadius : 80,
    speed: bossData.speedMultiplier,
    baseSpeed: bossData.speedMultiplier,
    color: bossData.color,
    health: isFinite(health) ? health : 500,
    maxHealth: isFinite(health) ? health : 500,
    bossType: bossData.type,
    movement: bossData.movement,
    isBoss: true,
    movementTimer: 0,
    centerX: isFinite(spawnX) ? spawnX : safeCanvasWidth / 2,
    amplitude: 100,
    frequency: 0.01,
    pulsePhase: 0,
    get scaledRadius() { return this.radius; }
  };
  bossDefeatedThisLevel = false;
}
