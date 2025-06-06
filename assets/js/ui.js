
// UI module - HUD, menus, and interface elements

window.drawHUD = function drawHUD() {
  ctx.save();

  drawScore();
  drawDifficultyBadge();
  drawLevelProgress();
  drawBombs();
  drawPowerUpIcons();
  drawVersionTag();

  ctx.restore();
}

function drawScore() {
  const scoreX = 15 * mobileScale;
  const scoreY = 40 * mobileScale;

  ctx.shadowColor = '#00FFFF';
  ctx.shadowBlur = 15 * mobileScale;
  ctx.fillStyle = '#FFD700';
  ctx.font = `bold ${42 * mobileScale}px Arial`;
  ctx.textAlign = 'left';
  ctx.fillText(score.toLocaleString(), scoreX, scoreY);
  ctx.shadowBlur = 0;
}

function drawDifficultyBadge() {
  // Position right next to the level text
  const levelTextWidth = ctx.measureText(`LEVEL ${currentLevel}`).width;
  const diffX = 15 * mobileScale + levelTextWidth + 20 * mobileScale;
  const diffY = 80 * mobileScale - 10 * mobileScale; // Align with level text center
  const radius = 8 * mobileScale; // Much smaller radius
  
  const colorMap = {
    'easy': { color: '#00FF00', glow: 'rgba(0, 255, 0, 0.6)' },
    'medium': { color: '#FFB000', glow: 'rgba(255, 165, 0, 0.6)' },
    'hard': { color: '#FF4444', glow: 'rgba(255, 0, 0, 0.6)' }
  };
  
  const colors = colorMap[difficulty];
  
  // Neon glow effect
  ctx.shadowColor = colors.color;
  ctx.shadowBlur = 12 * mobileScale;
  ctx.strokeStyle = colors.color;
  ctx.lineWidth = 2 * mobileScale;
  ctx.beginPath();
  ctx.arc(diffX, diffY, radius, 0, Math.PI * 2);
  ctx.stroke();
  
  // Inner glow
  ctx.shadowBlur = 6 * mobileScale;
  ctx.fillStyle = colors.glow;
  ctx.beginPath();
  ctx.arc(diffX, diffY, radius * 0.7, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.shadowBlur = 0;
}

function drawLevelProgress() {
  const currentLevelThreshold = currentLevel === 1 ? 0 : getNextLevelScore(currentLevel);
  const nextLevelThreshold = getNextLevelScore(currentLevel + 1);
  const pointsInLevel = score - currentLevelThreshold;
  const pointsNeeded = nextLevelThreshold - currentLevelThreshold;
  const levelProgress = Math.min(pointsInLevel / pointsNeeded, 1);
  const levelX = 15 * mobileScale;
  const levelY = 80 * mobileScale;

  // Level text with same font as score and neon glow
  ctx.shadowColor = '#00FFFF';
  ctx.shadowBlur = 15 * mobileScale;
  ctx.fillStyle = '#FFD700';
  ctx.font = `bold ${42 * mobileScale}px Arial`;
  ctx.textAlign = 'left';
  ctx.fillText(`LEVEL ${currentLevel}`, levelX, levelY);
  ctx.shadowBlur = 0;

  const barWidth = 200 * mobileScale;
  const barHeight = 12 * mobileScale;
  const barX = levelX;
  const barY = levelY + 15 * mobileScale;

  // Background bar with subtle glow
  ctx.shadowColor = '#333333';
  ctx.shadowBlur = 5 * mobileScale;
  ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
  ctx.fillRect(barX, barY, barWidth, barHeight);

  // Neon progress bar
  const progressGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
  progressGradient.addColorStop(0, '#00FF00');
  progressGradient.addColorStop(0.5, '#FFFF00');
  progressGradient.addColorStop(1, '#FF4500');
  
  ctx.shadowColor = '#00FFFF';
  ctx.shadowBlur = 10 * mobileScale;
  ctx.fillStyle = progressGradient;
  ctx.fillRect(barX, barY, barWidth * levelProgress, barHeight);

  // Neon border
  ctx.shadowBlur = 8 * mobileScale;
  ctx.strokeStyle = '#00FFFF';
  ctx.lineWidth = 2 * mobileScale;
  ctx.strokeRect(barX, barY, barWidth, barHeight);
  ctx.shadowBlur = 0;
}

function drawBombs() {
  const bombX = canvas.width - 30;
  const bombStartY = 30;

  for (let i = 0; i < Math.min(bombCount, 10); i++) {
    const bx = bombX;
    const by = bombStartY + i * 30;

    ctx.fillStyle = '#2B2B2B';
    ctx.beginPath();
    ctx.arc(bx, by, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(bx - 4, by - 4, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bx - 8, by - 8);
    ctx.lineTo(bx - 15, by - 15);
    ctx.stroke();

    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(bx - 15, by - 15, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(bx, by, 12, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawPowerUpIcons() {
  let powerUpX = 300;
  let powerUpY = 40;
  const iconSize = 35;
  const spacing = 45;

  const powerUps = [
    { condition: hasRapidPowerUp, level: permanentRapidLevel, max: 10, color: '#1E90FF', emoji: '⚡', type: 'rapid' },
    { condition: hasSprayPowerUp, level: permanentSprayLevel, max: 10, color: '#FFA500', emoji: '💥', type: 'spray' },
    { condition: hasBulletPowerUp, level: permanentBulletLevel, max: 2, color: '#32CD32', emoji: '🔥', type: 'bullet' },
    { condition: hasSpeedPowerUp, level: permanentSpeedLevel, max: 5, color: '#FF69B4', emoji: '🚀', type: 'speed' },
    { condition: hasMultiPowerUp, level: permanentMultiLevel, max: 3, color: '#DC143C', emoji: '🎯', type: 'multi' }
  ];

  powerUps.forEach(powerUp => {
    if (powerUp.condition) {
      drawPowerUpIcon(powerUpX, powerUpY, iconSize, powerUp.color, powerUp.emoji, 1 + powerUp.level, powerUp.max, powerUp.type);
      powerUpX += spacing;
    }
  });
}

function drawPowerUpIcon(x, y, size, color, emoji, level, maxLevel, powerUpType) {
  const currentTime = Date.now();
  const timeUntilDecay = powerUpDecayIntervals[powerUpType] - (currentTime - powerUpDecayTimers[powerUpType]);
  const decayProgress = level > 2 && powerUpDecayIntervals[powerUpType] > 0 && powerUpType !== 'shield' ? 
    1 - (timeUntilDecay / powerUpDecayIntervals[powerUpType]) : 0;

  // Safety checks for finite values
  const safeSize = isFinite(size) ? Math.max(size, 1) : 35;
  const safeX = isFinite(x) ? x : canvas.width / 2;
  const safeY = isFinite(y) ? y : canvas.height / 2;
  const radius = safeSize / 2;
  const vertices = 8;
  const irregularity = 0.3;

  ctx.save();
  ctx.translate(safeX, safeY);

  // Ensure all gradient parameters are finite
  const x1 = isFinite(-radius * 0.3) ? -radius * 0.3 : -10;
  const y1 = isFinite(-radius * 0.3) ? -radius * 0.3 : -10;
  const r1 = 0;
  const x2 = 0;
  const y2 = 0;
  const r2 = isFinite(radius) ? Math.max(radius, 1) : 17;

  const asteroidGradient = ctx.createRadialGradient(x1, y1, r1, x2, y2, r2);
  asteroidGradient.addColorStop(0, 'rgba(200, 200, 200, 0.9)');
  asteroidGradient.addColorStop(0.3, color);
  asteroidGradient.addColorStop(0.7, 'rgba(80, 80, 80, 0.8)');
  asteroidGradient.addColorStop(1, 'rgba(40, 40, 40, 0.9)');

  ctx.fillStyle = asteroidGradient;
  ctx.beginPath();
  for (let i = 0; i < vertices; i++) {
    const angle = (i / vertices) * Math.PI * 2;
    const variation = (Math.sin(angle * 3 + Date.now() / 2000) * irregularity + 1);
    const r = radius * variation;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(120, 120, 120, 0.7)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const startR = radius * 0.4;
    const endR = radius * 0.8;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * startR, Math.sin(angle) * startR);
    ctx.lineTo(Math.cos(angle) * endR, Math.sin(angle) * endR);
    ctx.stroke();
  }

  if (level > 1 && decayProgress > 0) {
    const depletionRadius = radius + 6;
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (2 * Math.PI * decayProgress);

    ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, depletionRadius, 0, Math.PI * 2);
    ctx.stroke();

    const depletionColor = decayProgress > 0.7 ? '#FF4500' : decayProgress > 0.4 ? '#FFD700' : '#00FF00';
    ctx.strokeStyle = depletionColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, depletionRadius, startAngle, endAngle);
    ctx.stroke();
  }

  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = 'white';
  ctx.font = `${radius * 0.8}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText(emoji, 0, radius * 0.2);

  ctx.restore();

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';

  if (level >= maxLevel) {
    ctx.fillText('MAX', x, y + radius + 20);
  } else {
    ctx.fillText(level, x, y + radius + 20);
  }
}

function drawVersionTag() {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'right';
  ctx.fillText('', canvas.width - 10, 25);
}
