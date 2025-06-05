
// Entities module - Player, enemies, bullets, powerups

// Player setup
const player = {
  x: 0,
  y: 0,
  width: 50,
  height: 20,
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

function spawnCluster() {
  const diffSettings = getDifficultySettings();
  const baseCount = Math.floor(Math.random() * (8 - 3 + 1)) + 3;
  const count = Math.floor(baseCount * diffSettings.spawnMultiplier);
  const clusterCenterX = Math.random() * (canvas.width - 100) + 50;
  const spread = 50;

  const levelHealthBonus = Math.floor((currentLevel - 1) * diffSettings.levelHealthIncrease * 2);
  const levelSpeedBonus = (currentLevel - 1) * diffSettings.levelSpeedIncrease;

  for (let i = 0; i < count; i++) {
    const offsetX = (Math.random() - 0.5) * spread;
    const offsetY = (Math.random() - 0.5) * spread;
    const baseHealth = Math.floor(Math.random() * 2) + baseEnemyHealth + currentLevel;
    const health = baseHealth + levelHealthBonus;

    const isSpinner = Math.random() < 0.2;

    let blob = {
      x: clusterCenterX + offsetX,
      y: -20 + offsetY,
      radius: (isSpinner ? 25 : 20) * mobileScale,
      speed: (isSpinner ? 0.5 + Math.random() * 0.5 : 1 + Math.random()) * baseEnemySpeed + levelSpeedBonus,
      color: isSpinner ? '#FF00FF' : 'hsl(' + Math.random() * 360 + ', 100%, 50%)',
      health: isSpinner ? health + 2 : health,
      maxHealth: isSpinner ? health + 2 : health,
      isSpinner: isSpinner,
      rotation: 0,
      pulsatePhase: Math.random() * Math.PI * 2,
      get scaledRadius() { return this.radius; }
    };
    blobs.push(blob);
  }
}

function spawnBoxForType(type, isInitial = false) {
  const boxWidth = 40 * mobileScale, boxHeight = 40 * mobileScale;
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

function spawnBoss() {
  let bossRadius = 80 * mobileScale;
  const diffSettings = getDifficultySettings();
  const baseHealth = 500 + (currentLevel - 1) * 50;
  const health = Math.floor(baseHealth * diffSettings.bossHealthMultiplier);
  boss = {
    x: Math.random() * (canvas.width - bossRadius*2) + bossRadius,
    y: -bossRadius,
    radius: bossRadius,
    speed: 1,
    color: 'red',
    health: health,
    maxHealth: health,
    isBoss: true,
    get scaledRadius() { return this.radius; }
  };
  bossDefeatedThisLevel = false;
}
