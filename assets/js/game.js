
// Main game logic and control

// Canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI elements
const startGameBtn = document.getElementById('startGameBtn');
const tryAgainBtn = document.getElementById('tryAgainBtn');
const difficultySelection = document.getElementById('difficultySelection');
const easyBtn = document.getElementById('easyBtn');
const mediumBtn = document.getElementById('mediumBtn');
const hardBtn = document.getElementById('hardBtn');

// Mobile scaling system
let mobileScale = 1;
let isMobile = false;

// Set canvas size to full screen with max width, ensuring full frame visibility
function resizeCanvas() {
  const maxWidth = Math.min(window.innerWidth, 1080);
  
  isMobile = window.innerWidth <= 768;
  // Much larger mobile scale for better visibility
  mobileScale = isMobile ? 3.2 : 1;
  
  let availableHeight = window.innerHeight;
  
  if (isMobile) {
    availableHeight = Math.min(window.innerHeight, window.screen.height * 0.9);
  }
  
  canvas.width = maxWidth;
  canvas.height = availableHeight;
  
  canvas.style.width = maxWidth + 'px';
  canvas.style.height = availableHeight + 'px';
  canvas.style.margin = '0 auto';
  canvas.style.display = 'block';
}

// Game state variables
let gameStarted = false;
let gameOver = false;
let score = 0;
let bombCount = 3;
let bombFlashTimer = 0;
let blobSpawnTimer = 0;
let bulletFireTimer = 0;
let startTime;
let permanentRapidLevel = 0;
let permanentSprayLevel = 0;
let permanentBulletLevel = 0;
let permanentShieldLevel = 0;
let permanentSpeedLevel = 0;
let permanentMultiLevel = 0;
let nextBossScore = 3500;
let difficulty = 'medium';
let hasRapidPowerUp = false;
let hasSprayPowerUp = false;
let hasBulletPowerUp = false;
let hasShieldPowerUp = false;
let hasSpeedPowerUp = false;
let hasMultiPowerUp = false;
let playerShield = 0;
let playerSpeed = 1;

// Level system variables
let currentLevel = 1;
let nextLevelScore = 5000;
let levelUpDisplay = 0;
let levelUpWaveTimer = 0;
let baseEnemyHealth = 1;
let baseEnemySpeed = 1;
let bossDefeatedThisLevel = true;

// Power-up decay system
let powerUpDecayTimers = {
  rapid: 0, spray: 0, bullet: 0, shield: 0, speed: 0, multi: 0
};
let powerUpDecayIntervals = {
  rapid: 0, spray: 0, bullet: 0, shield: 0, speed: 0, multi: 0
};

// Skill-based stats and temporary boosts
let killStreak = 0;
let maxKillStreak = 0;
let totalShots = 0;
let totalHits = 0;
let lastKillTime = 0;
let skillPoints = 0;
let weaponEvolution = 0;
let temporaryBoosts = new Map();

// Initialize canvas and ensure all variables are ready
resizeCanvas();
resetPlayerPosition();

// Make sure mobileScale is globally available
window.mobileScale = mobileScale;
window.isMobile = isMobile;

window.addEventListener('resize', () => {
  resizeCanvas();
  resetPlayerPosition();
  window.mobileScale = mobileScale;
  window.isMobile = isMobile;
});

// Calculate progressive level score requirements
function getNextLevelScore(level) {
  const scores = [0, 3000, 7000, 15000, 25000];
  if (level <= 5) {
    return scores[level - 1];
  } else {
    return 25000 + (level - 5) * 20000;
  }
}

// Level-up wave attack function
function triggerLevelUpWave() {
  const waveStartTime = Date.now();

  for (let i = blobs.length - 1; i >= 0; i--) {
    blobs[i].health -= 1000;
    if (blobs[i].health <= 0) {
      score += 10;
      blobs.splice(i, 1);
    }
  }

  if (boss) {
    boss.health -= 1000;
    if (boss.health <= 0) {
      boss = null;
      bossDefeatedThisLevel = true;
      score += 500;
    }
  }

  levelUpWaveTimer = 60;
}

// Power-up decay function
function updatePowerUpDecay() {
  const currentTime = Date.now();

  ['rapid', 'spray', 'bullet', 'speed', 'multi'].forEach(type => {
    let currentLevel;
    switch(type) {
      case 'rapid': currentLevel = permanentRapidLevel; break;
      case 'spray': currentLevel = permanentSprayLevel; break;
      case 'bullet': currentLevel = permanentBulletLevel; break;
      case 'shield': currentLevel = permanentShieldLevel; break;
      case 'speed': currentLevel = permanentSpeedLevel; break;
      case 'multi': currentLevel = permanentMultiLevel; break;
    }

    if (currentLevel > 1) {
      if (currentTime - powerUpDecayTimers[type] >= powerUpDecayIntervals[type]) {
        switch(type) {
          case 'rapid': 
            permanentRapidLevel = Math.max(1, permanentRapidLevel - 1);
            break;
          case 'spray': 
            permanentSprayLevel = Math.max(1, permanentSprayLevel - 1);
            break;
          case 'bullet': 
            permanentBulletLevel = Math.max(1, permanentBulletLevel - 1);
            break;
          case 'shield': 
            permanentShieldLevel = Math.max(1, permanentShieldLevel - 1);
            playerShield = Math.max(playerShield - 2, permanentShieldLevel * 2);
            break;
          case 'speed': 
            permanentSpeedLevel = Math.max(1, permanentSpeedLevel - 1);
            break;
          case 'multi': 
            permanentMultiLevel = Math.max(1, permanentMultiLevel - 1);
            break;
        }

        powerUpDecayTimers[type] = currentTime;
        setPowerUpDecayInterval(type);
      }
    }
  });
}

// Set decay interval based on power-up level
function setPowerUpDecayInterval(type) {
  let currentLevel;
  let maxLevel;

  const levelMap = {
    'rapid': { current: permanentRapidLevel, max: 10 },
    'spray': { current: permanentSprayLevel, max: 10 },
    'bullet': { current: permanentBulletLevel, max: 2 },
    'shield': { current: permanentShieldLevel, max: 10 },
    'speed': { current: permanentSpeedLevel, max: 5 },
    'multi': { current: permanentMultiLevel, max: 3 }
  };

  const typeData = levelMap[type];
  currentLevel = typeData.current;
  maxLevel = typeData.max;

  if (currentLevel <= 1) {
    powerUpDecayIntervals[type] = 0;
  } else {
    const levelFromMin = currentLevel - 1;
    const maxLevelFromMin = maxLevel - 1;
    const powerUpLevelMultiplier = Math.pow(0.2, levelFromMin / maxLevelFromMin);
    
    const gameLevelMultiplier = Math.pow(0.6, (currentLevel - 1) * 0.5);
    
    const baseMinInterval = 8000;
    const baseMaxInterval = 45000;
    
    const minInterval = baseMinInterval * gameLevelMultiplier;
    const maxInterval = baseMaxInterval * gameLevelMultiplier;
    
    powerUpDecayIntervals[type] = minInterval + (maxInterval - minInterval) * powerUpLevelMultiplier;
  }
}

// Level up function
function levelUp() {
  currentLevel++;
  levelUpDisplay = 180;

  triggerLevelUpWave();

  setTimeout(() => {
    blobs = [];
    if (boss && boss.health <= 0) {
      boss = null;
    }
    bossDefeatedThisLevel = true;
  }, 1000);

  if (permanentRapidLevel > 3) permanentRapidLevel = Math.max(2, permanentRapidLevel - 1);
  if (permanentSprayLevel > 3) permanentSprayLevel = Math.max(2, permanentSprayLevel - 1);
  if (permanentBulletLevel > 2) permanentBulletLevel = Math.max(2, permanentBulletLevel - 1);
  if (permanentShieldLevel > 3) {
    permanentShieldLevel = Math.max(2, permanentShieldLevel - 1);
    playerShield = Math.max(playerShield - 2, permanentShieldLevel * 2);
  }
  if (permanentSpeedLevel > 3) permanentSpeedLevel = Math.max(2, permanentSpeedLevel - 1);
  if (permanentMultiLevel > 2) permanentMultiLevel = Math.max(2, permanentMultiLevel - 1);

  hasRapidPowerUp = permanentRapidLevel > 0;
  hasSprayPowerUp = permanentSprayLevel > 0;
  hasBulletPowerUp = permanentBulletLevel > 0;
  hasShieldPowerUp = permanentShieldLevel > 0;
  hasSpeedPowerUp = permanentSpeedLevel > 0;
  hasMultiPowerUp = permanentMultiLevel > 0;

  killStreak = 0;
  skillPoints = 0;
  temporaryBoosts.clear();

  baseEnemySpeed += 0.1;

  spawnBoxes();
  nextBossScore = score + 3500;
}

// Reset game state
function resetGame() {
  score = 0;
  gameOver = false;
  bullets = [];
  blobs = [];
  boxes = [];
  boss = null;
  bombCount = 3;
  blobSpawnTimer = 0;
  bulletFireTimer = 0;
  permanentRapidLevel = 0;
  permanentSprayLevel = 0;
  permanentBulletLevel = 0;
  permanentShieldLevel = 0;
  permanentSpeedLevel = 0;
  permanentMultiLevel = 0;
  nextBossScore = 3500;
  hasRapidPowerUp = false;
  hasSprayPowerUp = false;
  hasBulletPowerUp = false;
  hasShieldPowerUp = false;
  hasSpeedPowerUp = false;
  hasMultiPowerUp = false;
  playerShield = 0;
  playerSpeed = 1;

  const currentTime = Date.now();
  powerUpDecayTimers = {
    rapid: currentTime, spray: currentTime, bullet: currentTime,
    shield: currentTime, speed: currentTime, multi: currentTime
  };
  powerUpDecayIntervals = {
    rapid: 0, spray: 0, bullet: 0, shield: 0, speed: 0, multi: 0
  };

  currentLevel = 1;
  nextLevelScore = getNextLevelScore(2);
  levelUpDisplay = 0;
  levelUpWaveTimer = 0;
  baseEnemyHealth = 1;
  baseEnemySpeed = 1;
  bossDefeatedThisLevel = true;

  killStreak = 0;
  maxKillStreak = 0;
  totalShots = 0;
  totalHits = 0;
  lastKillTime = 0;
  skillPoints = 0;
  weaponEvolution = 0;
  temporaryBoosts.clear();

  spawnBoxes();
  resetPlayerPosition();
  startTime = Date.now();
}

// Input handling
function setupInputHandlers() {
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const targetX = touch.clientX - rect.left - player.scaledWidth / 2;
    const speedMult = 1 + (permanentSpeedLevel * 0.5);
    player.x += (targetX - player.x) * 0.3 * speedMult;
    if (player.x < 0) player.x = 0;
    if (player.x + player.scaledWidth > canvas.width) {
      player.x = canvas.width - player.scaledWidth;
    }
  });

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
  });

  let lastTap = 0;
  canvas.addEventListener('touchend', function(e) {
    let currentTime = new Date().getTime();
    let tapLength = currentTime - lastTap;
    if (tapLength > 0 && tapLength < 300) {
      activateBomb();
      e.preventDefault();
    }
    lastTap = currentTime;
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const targetX = e.clientX - rect.left - player.scaledWidth / 2;
    const speedMult = 1 + (permanentSpeedLevel * 0.5);
    player.x += (targetX - player.x) * 0.5 * speedMult;
    if (player.x < 0) player.x = 0;
    if (player.x + player.scaledWidth > canvas.width) {
      player.x = canvas.width - player.scaledWidth;
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
      activateBomb();
    }
  });
}

function activateBomb() {
  if (bombCount > 0) {
    bombCount--;
    for (let i = blobs.length - 1; i >= 0; i--) {
      blobs[i].health -= 100;
      if (blobs[i].health <= 0) {
        handleEnemyKill(blobs[i]);
        blobs.splice(i, 1);
      }
    }
    if (boss) {
      boss.health -= 100;
    }
    bombFlashTimer = 10;
  }
}

function handleEnemyKill(enemy) {
  killStreak++;
  maxKillStreak = Math.max(maxKillStreak, killStreak);
  totalHits++;
  lastKillTime = Date.now();

  let basePoints = 10;
  if (killStreak >= 5) basePoints *= 1.2;
  if (killStreak >= 15) basePoints *= 1.5;
  if (killStreak >= 30) basePoints *= 2;

  let accuracy = totalHits / totalShots;
  if (accuracy > 0.8) basePoints *= 1.3;

  score += Math.floor(basePoints);

  if (killStreak % 5 === 0) skillPoints++;
  if (enemy.isSpinner) skillPoints += 2;

  let requiredKills = [50, 150, 300, 500][weaponEvolution];
  if (weaponEvolution < 4 && totalHits >= requiredKills) {
    weaponEvolution++;
    temporaryBoosts.set('weaponEvolved', Date.now() + 3000);
  }

  checkAbilityUnlocks();
}

function checkAbilityUnlocks() {
  if (skillPoints >= 10 && !hasRapidPowerUp) {
    hasRapidPowerUp = true;
    console.log("Rapid Fire UNLOCKED!");
  }

  if (skillPoints >= 20 && !hasShieldPowerUp) {
    hasShieldPowerUp = true;
    permanentShieldLevel = 1;
    playerShield += 2;
    console.log("Shield UNLOCKED!");
  }
}

// Update game state
function update() {
  updatePowerUpDecay();
  
  let effectiveRapid = 1 + permanentRapidLevel;
  let bulletInterval = Math.max(10 / effectiveRapid, 2);
  bulletFireTimer++;
  
  if (bulletFireTimer > bulletInterval) {
    fireBullets();
    bulletFireTimer = 0;
    totalShots++;
  }

  updateBlobSpawning();
  updateBullets();
  updateBoxCollisions();
  updateLevelProgression();
  updateBlobs();
  updateBoss();
  updateBulletEnemyCollisions();
}

function fireBullets() {
  const bulletSpeed = 7;
  const bulletDamage = 1 + permanentBulletLevel;
  const bulletColor = permanentBulletLevel > 0 ? "cyan" : "yellow";

  let waveCount = 1 + permanentMultiLevel;
  for (let wave = 0; wave < waveCount; wave++) {
    setTimeout(() => {
      if (permanentSprayLevel > 0) {
        const numBullets = 1 + permanentSprayLevel;
        if (numBullets === 1) {
          createBullet(player.x + player.scaledWidth / 2, player.y, 0, -bulletSpeed, bulletDamage, bulletColor);
        } else if (numBullets === 2) {
          createBullet(player.x + player.scaledWidth / 2 - player.scaledWidth / 4, player.y, 0, -bulletSpeed, bulletDamage, bulletColor);
          createBullet(player.x + player.scaledWidth / 2 + player.scaledWidth / 4, player.y, 0, -bulletSpeed, bulletDamage, bulletColor);
        } else {
          createSprayBullets(numBullets, bulletSpeed, bulletDamage, bulletColor);
        }
      } else {
        createBullet(player.x + player.scaledWidth / 2, player.y, 0, -bulletSpeed, bulletDamage, bulletColor);
      }
    }, wave * 50);
  }
}

function createBullet(x, y, vx, vy, damage, color) {
  bullets.push({
    x: x,
    y: y,
    radius: 5 * mobileScale,
    vx: vx,
    vy: vy,
    damage: damage,
    color: color
  });
}

function createSprayBullets(numBullets, bulletSpeed, bulletDamage, bulletColor) {
  const maxAngle = 0.3;
  let angles = [];
  
  if (numBullets % 2 === 1) {
    const half = Math.floor(numBullets / 2);
    for (let i = -half; i <= half; i++) {
      angles.push(i * (maxAngle / half));
    }
  } else {
    for (let i = 0; i < numBullets; i++) {
      let angle = -maxAngle + i * (2 * maxAngle / (numBullets - 1));
      angles.push(angle);
    }
    let closestIndex = 0;
    let minAbs = Math.abs(angles[0]);
    for (let i = 1; i < angles.length; i++) {
      if (Math.abs(angles[i]) < minAbs) {
        minAbs = Math.abs(angles[i]);
        closestIndex = i;
      }
    }
    angles[closestIndex] = 0;
  }
  
  angles.forEach(angle => {
    createBullet(
      player.x + player.scaledWidth / 2,
      player.y,
      bulletSpeed * Math.sin(angle),
      -bulletSpeed * Math.cos(angle),
      bulletDamage,
      bulletColor
    );
  });
}

function updateBlobSpawning() {
  blobSpawnTimer++;
  const elapsedTime = Date.now() - startTime;
  const activePowerUps = (hasRapidPowerUp ? 1 : 0) + (hasSprayPowerUp ? 1 : 0) + (hasBulletPowerUp ? 1 : 0) + (hasShieldPowerUp ? 1 : 0) + (hasSpeedPowerUp ? 1 : 0) + (hasMultiPowerUp ? 1 : 0);
  let spawnFactor = activePowerUps > 3 ? 0.6 : 1;
  const diffSettings = getDifficultySettings();
  const baseInterval = elapsedTime < 60000 ? diffSettings.spawnInterval : Math.floor(diffSettings.spawnInterval * 0.25);
  
  if (blobSpawnTimer > baseInterval * spawnFactor) {
    spawnCluster();
    blobSpawnTimer = 0;
  }
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].x += bullets[i].vx;
    bullets[i].y += bullets[i].vy;
    if (bullets[i].y < 0) {
      bullets.splice(i, 1);
    }
  }
}

function updateBoxCollisions() {
  for (let i = boxes.length - 1; i >= 0; i--) {
    let box = boxes[i];
    const doorHeight = box.height * 0.2;
    const doorY = box.y + box.height - doorHeight;
    
    for (let j = bullets.length - 1; j >= 0; j--) {
      if (bullets[j].x >= box.x && bullets[j].x <= box.x + box.width &&
          bullets[j].y >= doorY && bullets[j].y <= box.y + box.height) {
        box.health -= bullets[j].damage;
        bullets.splice(j, 1);

        score += 5;
        totalShots++;
        totalHits++;

        if (box.health <= 0) {
          handlePowerUpBoxDestroyed(box, i);
        }
        break;
      }
    }
  }
}

function handlePowerUpBoxDestroyed(box, index) {
  score += 25;

  const powerUpActions = {
    "rapid": () => {
      if (1 + permanentRapidLevel < 10) {
        permanentRapidLevel++;
        hasRapidPowerUp = true;
        powerUpDecayTimers.rapid = Date.now();
        setPowerUpDecayInterval('rapid');
      }
    },
    "spray": () => {
      if (1 + permanentSprayLevel < 10) {
        permanentSprayLevel++;
        hasSprayPowerUp = true;
        powerUpDecayTimers.spray = Date.now();
        setPowerUpDecayInterval('spray');
      }
    },
    "bullet": () => {
      if (1 + permanentBulletLevel < 2) {
        permanentBulletLevel++;
        hasBulletPowerUp = true;
        powerUpDecayTimers.bullet = Date.now();
        setPowerUpDecayInterval('bullet');
      }
    },
    "shield": () => {
      if (1 + permanentShieldLevel < 10) {
        permanentShieldLevel++;
        hasShieldPowerUp = true;
        playerShield = Math.min(playerShield + 2, permanentShieldLevel * 2);
        powerUpDecayTimers.shield = Date.now();
        setPowerUpDecayInterval('shield');
      }
    },
    "speed": () => {
      if (1 + permanentSpeedLevel < 5) {
        permanentSpeedLevel++;
        hasSpeedPowerUp = true;
        powerUpDecayTimers.speed = Date.now();
        setPowerUpDecayInterval('speed');
      }
    },
    "multi": () => {
      if (1 + permanentMultiLevel < 3) {
        permanentMultiLevel++;
        hasMultiPowerUp = true;
        powerUpDecayTimers.multi = Date.now();
        setPowerUpDecayInterval('multi');
      }
    },
    "bomb": () => {
      bombCount = Math.min(bombCount + 1, 10);
    }
  };

  const action = powerUpActions[box.type];
  if (action) action();

  boxes.splice(index, 1);
  
  if (boxes.length < 5) {
    const wouldBeMaxLevel = checkIfMaxLevel(box.type);
    if (wouldBeMaxLevel) {
      setTimeout(() => {
        if (boxes.length < 5) {
          spawnRandomBox();
        }
      }, 3000);
    } else {
      spawnRandomBox();
    }
  }
}

function updateLevelProgression() {
  if (score >= getNextLevelScore(currentLevel + 1) && bossDefeatedThisLevel) {
    levelUp();
  }
}

function updateBlobs() {
  for (let i = blobs.length - 1; i >= 0; i--) {
    const blob = blobs[i];
    blob.movementTimer++;
    
    // Update position based on movement type
    switch (blob.movement) {
      case 'straight':
        blob.y += blob.speed;
        break;
        
      case 'zigzag':
        blob.y += blob.speed;
        blob.x += Math.sin(blob.movementTimer * 0.1) * 2;
        break;
        
      case 'weave':
        blob.y += blob.speed;
        blob.x += Math.sin(blob.movementTimer * blob.frequency) * blob.amplitude * 0.02;
        break;
        
      case 'spin':
        blob.y += blob.speed;
        blob.rotation += 0.1;
        blob.pulsatePhase += 0.15;
        blob.x += Math.cos(blob.movementTimer * 0.05) * 1.5;
        break;
        
      case 'swoop':
        if (blob.y < blob.swoopStartY + 200) {
          blob.y += blob.speed;
          blob.x += blob.swoopDirection * Math.sin(blob.movementTimer * 0.08) * 3;
        } else {
          blob.y += blob.speed * 0.5;
          blob.x += blob.swoopDirection * 4;
        }
        break;
        
      default:
        blob.y += blob.speed;
    }

    // Keep enemies within screen bounds horizontally
    if (blob.x < blob.radius) blob.x = blob.radius;
    if (blob.x > canvas.width - blob.radius) blob.x = canvas.width - blob.radius;

    if (blob.y + blob.radius >= player.y) {
      if (playerShield > 0) {
        playerShield--;
        blobs.splice(i, 1);
      } else {
        gameOver = true;
        return;
      }
    }
    if (blob.y - blob.radius > canvas.height) {
      blobs.splice(i, 1);
    }
  }
}

function updateBoss() {
  if (boss) {
    boss.movementTimer++;
    
    // Update position based on boss movement type
    switch (boss.movement) {
      case 'straight':
        boss.y += boss.speed;
        break;
        
      case 'weave':
        boss.y += boss.speed;
        boss.x = boss.centerX + Math.sin(boss.movementTimer * boss.frequency) * boss.amplitude;
        break;
        
      case 'circle':
        boss.y += boss.speed * 0.5;
        const circleRadius = 80;
        boss.x = boss.centerX + Math.cos(boss.movementTimer * 0.03) * circleRadius;
        break;
        
      case 'pulse':
        boss.y += boss.speed;
        boss.pulsePhase += 0.05;
        const pulseOffset = Math.sin(boss.pulsePhase) * 20;
        boss.x = boss.centerX + pulseOffset;
        break;
        
      default:
        boss.y += boss.speed;
    }
    
    // Keep boss within screen bounds
    if (boss.x < boss.radius) boss.x = boss.radius;
    if (boss.x > canvas.width - boss.radius) boss.x = canvas.width - boss.radius;
    
    if (boss.y + boss.radius >= player.y) {
      if (playerShield > 0) {
        playerShield -= 10;
        if (playerShield < 0) playerShield = 0;
        boss.y -= 50;
      } else {
        gameOver = true;
        return;
      }
    }
    
    for (let i = bullets.length - 1; i >= 0; i--) {
      const dx = boss.x - bullets[i].x;
      const dy = boss.y - bullets[i].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < boss.radius + bullets[i].radius) {
        boss.health -= bullets[i].damage;
        bullets.splice(i, 1);
        if (boss.health <= 0) {
          const bossPoints = boss.bossType === 'leviathan' ? 1500 : 
                           boss.bossType === 'colossus' ? 1000 : 
                           boss.bossType === 'titan' ? 750 : 500;
          boss = null;
          bossDefeatedThisLevel = true;
          score += bossPoints;
          if (hasRapidPowerUp && permanentRapidLevel < 10) permanentRapidLevel++;
          if (hasSprayPowerUp && permanentSprayLevel < 10) permanentSprayLevel++;
          if (hasShieldPowerUp) playerShield += 4;
        }
        break;
      }
    }
  } else {
    if (score >= nextBossScore) {
      spawnBoss();
      nextBossScore += 3500;
    }
  }
}

function updateBulletEnemyCollisions() {
  for (let i = blobs.length - 1; i >= 0; i--) {
    for (let j = bullets.length - 1; j >= 0; j--) {
      const dx = blobs[i].x - bullets[j].x;
      const dy = blobs[i].y - bullets[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < blobs[i].radius + bullets[j].radius) {
        blobs[i].health -= bullets[j].damage;
        bullets.splice(j, 1);
        if (blobs[i].health <= 0) {
          handleEnemyKill(blobs[i]);
          blobs.splice(i, 1);
        }
        break;
      }
    }
  }
}

// Draw game objects
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawPlayer();
  drawBullets();
  drawBlobs();
  drawBoss();
  drawBoxes();
  drawHUD();
  drawLevelUpWave();
  drawLevelUpDisplay();
  drawBombFlash();
  drawGameOver();
}

// Main game loop
function gameLoop() {
  if (!gameOver) {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  } else {
    draw();
    tryAgainBtn.style.display = 'block';
  }
}

// Difficulty selection event listeners
easyBtn.addEventListener('click', () => {
  difficulty = 'easy';
  startGame();
});

mediumBtn.addEventListener('click', () => {
  difficulty = 'medium';
  startGame();
});

hardBtn.addEventListener('click', () => {
  difficulty = 'hard';
  startGame();
});

function startGame() {
  difficultySelection.style.display = 'none';
  startGameBtn.style.display = 'none';
  gameStarted = true;
  resetGame();
  gameLoop();
}

// Button event listeners
startGameBtn.addEventListener('click', startGame);

tryAgainBtn.addEventListener('click', () => {
  tryAgainBtn.style.display = 'none';
  difficultySelection.style.display = 'block';
});

// Initialize input handlers
setupInputHandlers();

// Initial setup
spawnBoxes();
