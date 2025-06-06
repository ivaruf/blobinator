
// Graphics module - All drawing and rendering functions

function drawPlayer() {
  ctx.save();

  const shipGradient = ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.height);
  shipGradient.addColorStop(0, '#E0E0E0');
  shipGradient.addColorStop(0.3, '#FFFFFF');
  shipGradient.addColorStop(0.7, '#C0C0C0');
  shipGradient.addColorStop(1, '#808080');

  ctx.fillStyle = shipGradient;
  ctx.fillRect(player.x, player.y, player.scaledWidth, player.scaledHeight);

  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.moveTo(player.x + player.scaledWidth / 2, player.y - 5 * mobileScale);
  ctx.lineTo(player.x + player.scaledWidth * 0.3, player.y + 5 * mobileScale);
  ctx.lineTo(player.x + player.scaledWidth * 0.7, player.y + 5 * mobileScale);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#FF4500';
  ctx.fillRect(player.x + 5 * mobileScale, player.y + player.scaledHeight, 8 * mobileScale, 6 * mobileScale);
  ctx.fillRect(player.x + player.scaledWidth - 13 * mobileScale, player.y + player.scaledHeight, 8 * mobileScale, 6 * mobileScale);

  ctx.fillStyle = '#4169E1';
  ctx.fillRect(player.x - 3 * mobileScale, player.y + 8 * mobileScale, 6 * mobileScale, 8 * mobileScale);
  ctx.fillRect(player.x + player.scaledWidth - 3 * mobileScale, player.y + 8 * mobileScale, 6 * mobileScale, 8 * mobileScale);

  ctx.fillStyle = '#00CED1';
  ctx.fillRect(player.x + player.scaledWidth/2 - 8 * mobileScale, player.y + 3 * mobileScale, 16 * mobileScale, 8 * mobileScale);

  drawPlayerShield();
  ctx.restore();
}

function drawPlayerShield() {
  if (playerShield > 0) {
    const shieldIntensity = Math.min(playerShield / 20, 1);
    const shieldRadius = (player.scaledWidth/2 + 8 + (shieldIntensity * 5)) * mobileScale;
    const shieldAlpha = 0.3 + (shieldIntensity * 0.5);

    for (let i = 0; i < 3; i++) {
      const ringRadius = shieldRadius - (i * 2 * mobileScale);
      const ringAlpha = shieldAlpha * (1 - i * 0.2);

      ctx.strokeStyle = `rgba(0, 255, 255, ${ringAlpha})`;
      ctx.lineWidth = (4 - i) * mobileScale;
      ctx.shadowColor = '#00FFFF';
      ctx.shadowBlur = (8 + (shieldIntensity * 12)) * mobileScale;
      ctx.beginPath();
      ctx.arc(player.x + player.scaledWidth/2, player.y + player.scaledHeight/2, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#00FFFF';
    ctx.font = `bold ${16 * mobileScale}px Arial`;
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3 * mobileScale;
    ctx.strokeText(playerShield, player.x + player.scaledWidth/2, player.y + player.scaledHeight/2 + shieldRadius + 20 * mobileScale);
    ctx.fillText(playerShield, player.x + player.scaledWidth/2, player.y + player.scaledHeight/2 + shieldRadius + 20 * mobileScale);
  }
}

function drawBullets() {
  bullets.forEach(bullet => {
    ctx.save();

    // Safety check for finite values
    const radius = isFinite(bullet.radius) ? Math.max(bullet.radius, 1) : 5;
    const x = isFinite(bullet.x) ? bullet.x : canvas.width / 2;
    const y = isFinite(bullet.y) ? bullet.y : canvas.height / 2;

    // Ensure all gradient parameters are finite
    const x1 = isFinite(x - 2) ? x - 2 : x;
    const y1 = isFinite(y - 2) ? y - 2 : y;
    const r1 = 0;
    const x2 = x;
    const y2 = y;
    const r2 = radius;

    const bulletGradient = ctx.createRadialGradient(x1, y1, r1, x2, y2, r2);

    if (bullet.color === 'cyan') {
      bulletGradient.addColorStop(0, '#FFFFFF');
      bulletGradient.addColorStop(0.3, '#00FFFF');
      bulletGradient.addColorStop(1, '#0080FF');
      ctx.shadowColor = '#00FFFF';
      ctx.shadowBlur = 8;
    } else {
      bulletGradient.addColorStop(0, '#FFFF00');
      bulletGradient.addColorStop(0.5, '#FFD700');
      bulletGradient.addColorStop(1, '#FFA500');
      ctx.shadowColor = '#FFFF00';
      ctx.shadowBlur = 4;
    }

    ctx.fillStyle = bulletGradient;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = `rgba(255, 255, 255, 0.6)`;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });
}

function drawBlobs() {
  blobs.forEach(blob => {
    switch (blob.enemyType) {
      case 'spinner':
        drawSpinnerBlob(blob);
        break;
      case 'giant':
        drawGiantBlob(blob);
        break;
      case 'small':
        drawSmallBlob(blob);
        break;
      case 'weaver':
        drawWeaverBlob(blob);
        break;
      case 'swooper':
        drawSwooperBlob(blob);
        break;
      default:
        drawRegularBlob(blob);
    }
  });
}

function drawSpinnerBlob(blob) {
  ctx.save();
  ctx.translate(blob.x, blob.y);
  ctx.rotate(blob.rotation);

  const pulsateSize = Math.sin(blob.pulsatePhase) * 5 + blob.radius;

  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, pulsateSize);
  gradient.addColorStop(0, '#FF00FF');
  gradient.addColorStop(0.5, '#8B00FF');
  gradient.addColorStop(1, '#4B0082');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x1 = Math.cos(angle) * pulsateSize;
    const y1 = Math.sin(angle) * pulsateSize;
    const x2 = Math.cos(angle + Math.PI / 8) * (pulsateSize * 0.7);
    const y2 = Math.sin(angle + Math.PI / 8) * (pulsateSize * 0.7);

    if (i === 0) ctx.moveTo(x1, y1);
    else ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * pulsateSize, Math.sin(angle) * pulsateSize);
    ctx.stroke();
  }

  ctx.shadowColor = '#FF00FF';
  ctx.shadowBlur = 15;
  const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, pulsateSize * 0.4);
  coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
  coreGradient.addColorStop(1, 'rgba(255, 0, 255, 0.3)');
  ctx.fillStyle = coreGradient;
  ctx.beginPath();
  ctx.arc(0, 0, pulsateSize * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.restore();

  drawHealthBar(blob, "orange");
  drawHealthText(blob);
}

function drawRegularBlob(blob) {
  ctx.save();

  // Safety check for finite values
  const radius = isFinite(blob.radius) ? Math.max(blob.radius, 1) : 20;
  const x = isFinite(blob.x) ? blob.x : canvas.width / 2;
  const y = isFinite(blob.y) ? blob.y : canvas.height / 2;

  // Ensure all gradient parameters are finite
  const x1 = isFinite(x - radius * 0.3) ? x - radius * 0.3 : x;
  const y1 = isFinite(y - radius * 0.3) ? y - radius * 0.3 : y;
  const r1 = 0;
  const x2 = x;
  const y2 = y;
  const r2 = radius;

  const gradient = ctx.createRadialGradient(x1, y1, r1, x2, y2, r2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
  gradient.addColorStop(0.3, blob.color);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
  ctx.fill();

  drawBlobTexture(blob);

  ctx.shadowColor = blob.color;
  ctx.shadowBlur = 5;
  ctx.strokeStyle = blob.color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(blob.x, blob.y, blob.radius + 1, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.restore();

  drawHealthBar(blob, "lime");
  drawHealthText(blob);
}

function drawBlobTexture(blob) {
  if (blob.health >= 3) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const innerRadius = blob.radius * 0.6;
      const outerRadius = blob.radius * 0.9;
      ctx.beginPath();
      ctx.moveTo(
        blob.x + Math.cos(angle) * innerRadius,
        blob.y + Math.sin(angle) * innerRadius
      );
      ctx.lineTo(
        blob.x + Math.cos(angle) * outerRadius,
        blob.y + Math.sin(angle) * outerRadius
      );
      ctx.stroke();
    }
  } else if (blob.health === 2) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const dotRadius = 2;
      const distance = blob.radius * 0.7;
      ctx.beginPath();
      ctx.arc(
        blob.x + Math.cos(angle) * distance,
        blob.y + Math.sin(angle) * distance,
        dotRadius, 0, Math.PI * 2
      );
      ctx.fill();
    }
  } else {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(blob.x, blob.y, blob.radius * 0.7, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawBoss() {
  if (!boss) return;

  ctx.save();

  // Safety check for finite values
  const radius = isFinite(boss.radius) ? Math.max(boss.radius, 1) : 80;
  const x = isFinite(boss.x) ? boss.x : canvas.width / 2;
  const y = isFinite(boss.y) ? boss.y : canvas.height / 2;

  const bossGradient = ctx.createRadialGradient(
    x - radius * 0.3, y - radius * 0.3, 0,
    x, y, radius
  );
  
  // Different gradients for different boss types
  switch (boss.bossType) {
    case 'titan':
      bossGradient.addColorStop(0, '#AA4444');
      bossGradient.addColorStop(0.3, '#8B0000');
      bossGradient.addColorStop(1, '#2F0000');
      break;
    case 'guardian':
      bossGradient.addColorStop(0, '#FF8844');
      bossGradient.addColorStop(0.3, '#FF4500');
      bossGradient.addColorStop(1, '#CC3300');
      break;
    case 'colossus':
      bossGradient.addColorStop(0, '#660000');
      bossGradient.addColorStop(0.3, '#4B0000');
      bossGradient.addColorStop(1, '#2F0000');
      break;
    case 'leviathan':
      bossGradient.addColorStop(0, '#440000');
      bossGradient.addColorStop(0.3, '#2F0000');
      bossGradient.addColorStop(1, '#1A0000');
      break;
    default: // destroyer
      bossGradient.addColorStop(0, '#FF6B6B');
      bossGradient.addColorStop(0.3, '#FF0000');
      bossGradient.addColorStop(0.6, '#8B0000');
      bossGradient.addColorStop(1, '#4B0000');
  }

  const pulsate = boss.bossType === 'leviathan' ? 
    Math.sin(Date.now() / 150) * 15 : Math.sin(Date.now() / 200) * 5;
  const currentRadius = radius + pulsate;

  ctx.fillStyle = bossGradient;
  ctx.beginPath();
  ctx.arc(x, y, currentRadius, 0, Math.PI * 2);
  ctx.fill();

  // Different decorations for different boss types
  ctx.strokeStyle = '#FFD700';
  const lineWidth = boss.bossType === 'colossus' || boss.bossType === 'leviathan' ? 5 : 3;
  ctx.lineWidth = lineWidth;
  
  const spikes = boss.bossType === 'leviathan' ? 16 : 
                boss.bossType === 'colossus' ? 12 : 8;
  
  for (let i = 0; i < spikes; i++) {
    const angle = (i / spikes) * Math.PI * 2 + Date.now() / 1000;
    const innerRadius = currentRadius * 0.7;
    const outerRadius = currentRadius * (boss.bossType === 'leviathan' ? 1.1 : 0.9);
    ctx.beginPath();
    ctx.moveTo(
      x + Math.cos(angle) * innerRadius,
      y + Math.sin(angle) * innerRadius
    );
    ctx.lineTo(
      x + Math.cos(angle) * outerRadius,
      y + Math.sin(angle) * outerRadius
    );
    ctx.stroke();
  }

  const coreGradient = ctx.createRadialGradient(x, y, 0, x, y, currentRadius * 0.4);
  coreGradient.addColorStop(0, '#FFFFFF');
  coreGradient.addColorStop(0.5, boss.color);
  coreGradient.addColorStop(1, boss.color);
  ctx.fillStyle = coreGradient;
  ctx.beginPath();
  ctx.arc(x, y, currentRadius * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Eyes scale with boss size
  const eyeSize = Math.max(8, radius * 0.1);
  const eyeOffset = Math.max(15, radius * 0.2);
  
  ctx.fillStyle = boss.color;
  ctx.beginPath();
  ctx.arc(x - eyeOffset, y - eyeOffset * 0.8, eyeSize, 0, Math.PI * 2);
  ctx.arc(x + eyeOffset, y - eyeOffset * 0.8, eyeSize, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(x - eyeOffset + 2, y - eyeOffset * 0.8 - 2, eyeSize * 0.4, 0, Math.PI * 2);
  ctx.arc(x + eyeOffset + 2, y - eyeOffset * 0.8 - 2, eyeSize * 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  let bossHealthFraction = boss.health / boss.maxHealth;
  ctx.beginPath();
  ctx.arc(x, y, radius + 8, -Math.PI / 2, -Math.PI / 2 + bossHealthFraction * 2 * Math.PI);
  ctx.strokeStyle = bossHealthFraction > 0.5 ? "#00FF00" : bossHealthFraction > 0.25 ? "#FFFF00" : "#FF0000";
  ctx.lineWidth = boss.bossType === 'leviathan' ? 10 : 6;
  ctx.stroke();

  ctx.fillStyle = 'white';
  const fontSize = boss.bossType === 'leviathan' ? 24 : 
                  boss.bossType === 'colossus' ? 20 : 18;
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 3;
  ctx.strokeText(boss.health, x, y + 6);
  ctx.fillText(boss.health, x, y + 6);
}

function drawBoxes() {
  boxes.forEach(box => {
    ctx.save();
    
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    const radius = Math.min(box.width, box.height) / 2;
    
    const floatOffset = Math.sin(Date.now() / 1000 + box.x * 0.01) * 3;
    const currentY = centerY + floatOffset;
    
    const vertices = 12;
    const irregularity = 0.3;
    const points = [];
    
    for (let i = 0; i < vertices; i++) {
      const angle = (i / vertices) * Math.PI * 2;
      const variation = (Math.sin(angle * 3 + box.x * 0.1) * irregularity + 1);
      const r = radius * variation;
      points.push({
        x: centerX + Math.cos(angle) * r,
        y: currentY + Math.sin(angle) * r
      });
    }
    
    const asteroidGradient = ctx.createRadialGradient(
      centerX - radius * 0.3, currentY - radius * 0.3, 0,
      centerX, currentY, radius
    );
    asteroidGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    asteroidGradient.addColorStop(0.3, box.boxColor);
    asteroidGradient.addColorStop(0.7, box.doorColor);
    asteroidGradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
    
    ctx.fillStyle = asteroidGradient;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fill();
    
    drawAsteroidDetails(centerX, currentY, radius);
    
    // Safety checks before calling drawPowerUpIcon
    const safeX = isFinite(centerX) ? centerX : canvas.width / 2;
    const safeY = isFinite(currentY) ? currentY : canvas.height / 2;
    drawPowerUpIconSimple(safeX, safeY, box.type);
    drawBoxHealth(centerX, currentY, radius, box.health);
    
    ctx.restore();
  });
}

function drawAsteroidDetails(centerX, currentY, radius) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const startR = radius * 0.4;
    const endR = radius * 0.8;
    const startX = centerX + Math.cos(angle) * startR;
    const startY = currentY + Math.sin(angle) * startR;
    const endX = centerX + Math.cos(angle) * endR;
    const endY = currentY + Math.sin(angle) * endR;
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const craterRadius = radius * 0.15;
    const distance = radius * 0.5;
    const craterX = centerX + Math.cos(angle) * distance;
    const craterY = currentY + Math.sin(angle) * distance;
    
    ctx.beginPath();
    ctx.arc(craterX, craterY, craterRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPowerUpIconSimple(centerX, currentY, type) {
  // Safety checks for finite values
  const safeX = isFinite(centerX) ? centerX : canvas.width / 2;
  const safeY = isFinite(currentY) ? currentY : canvas.height / 2;
  
  ctx.fillStyle = 'white';
  ctx.font = `bold ${24 * mobileScale}px Arial`;
  ctx.textAlign = 'center';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  
  const iconMap = {
    'rapid': '⚡', 'spray': '💥', 'bullet': '🔥', 'shield': '🛡️',
    'speed': '🚀', 'multi': '🎯', 'bomb': '💣'
  };
  
  const icon = iconMap[type] || '?';
  ctx.strokeText(icon, safeX, safeY + 3);
  ctx.fillText(icon, safeX, safeY + 3);
}

function drawBoxHealth(centerX, currentY, radius, health) {
  ctx.fillStyle = 'white';
  ctx.font = `bold ${16 * mobileScale}px Arial`;
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2 * mobileScale;
  ctx.strokeText(health, centerX, currentY + radius + 20 * mobileScale);
  ctx.fillText(health, centerX, currentY + radius + 20 * mobileScale);
}

function drawHealthBar(entity, color) {
  let healthFraction = entity.health / entity.maxHealth;
  const offset = entity.isSpinner ? 8 : 5;
  ctx.beginPath();
  ctx.arc(entity.x, entity.y, entity.radius + offset, -Math.PI / 2, -Math.PI / 2 + healthFraction * 2 * Math.PI);
  ctx.strokeStyle = color;
  ctx.lineWidth = entity.isSpinner ? 4 : 3;
  ctx.stroke();
}

function drawGiantBlob(blob) {
  ctx.save();
  
  const gradient = ctx.createRadialGradient(
    blob.x - blob.radius * 0.3, blob.y - blob.radius * 0.3, 0,
    blob.x, blob.y, blob.radius
  );
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
  gradient.addColorStop(0.3, blob.color);
  gradient.addColorStop(0.7, '#8B0000');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
  ctx.fill();

  // Draw spikes around giant enemies
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 3;
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const innerRadius = blob.radius * 0.8;
    const outerRadius = blob.radius * 1.1;
    ctx.beginPath();
    ctx.moveTo(
      blob.x + Math.cos(angle) * innerRadius,
      blob.y + Math.sin(angle) * innerRadius
    );
    ctx.lineTo(
      blob.x + Math.cos(angle) * outerRadius,
      blob.y + Math.sin(angle) * outerRadius
    );
    ctx.stroke();
  }

  ctx.restore();
  drawHealthBar(blob, "#FF4444");
  drawHealthText(blob);
}

function drawSmallBlob(blob) {
  ctx.save();
  
  const gradient = ctx.createRadialGradient(
    blob.x - blob.radius * 0.3, blob.y - blob.radius * 0.3, 0,
    blob.x, blob.y, blob.radius
  );
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
  gradient.addColorStop(0.4, blob.color);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
  ctx.fill();

  // Small energy trail
  ctx.strokeStyle = blob.color;
  ctx.lineWidth = 2;
  ctx.shadowColor = blob.color;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(blob.x, blob.y, blob.radius * 0.6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.restore();
  drawHealthBar(blob, "#00FF88");
  drawHealthText(blob);
}

function drawWeaverBlob(blob) {
  ctx.save();
  
  const gradient = ctx.createRadialGradient(
    blob.x - blob.radius * 0.3, blob.y - blob.radius * 0.3, 0,
    blob.x, blob.y, blob.radius
  );
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
  gradient.addColorStop(0.3, blob.color);
  gradient.addColorStop(1, 'rgba(255, 170, 0, 0.3)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
  ctx.fill();

  // Draw weaving pattern
  ctx.strokeStyle = '#FFAA00';
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + blob.movementTimer * 0.1;
    const waveRadius = blob.radius * 0.7;
    ctx.beginPath();
    ctx.arc(
      blob.x + Math.cos(angle) * waveRadius * 0.3,
      blob.y + Math.sin(angle) * waveRadius * 0.3,
      3, 0, Math.PI * 2
    );
    ctx.stroke();
  }

  ctx.restore();
  drawHealthBar(blob, "#FFAA00");
  drawHealthText(blob);
}

function drawSwooperBlob(blob) {
  ctx.save();
  
  const gradient = ctx.createRadialGradient(
    blob.x - blob.radius * 0.3, blob.y - blob.radius * 0.3, 0,
    blob.x, blob.y, blob.radius
  );
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
  gradient.addColorStop(0.3, blob.color);
  gradient.addColorStop(1, 'rgba(0, 170, 255, 0.3)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
  ctx.fill();

  // Draw swooping trails
  ctx.strokeStyle = '#00AAFF';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#00AAFF';
  ctx.shadowBlur = 10;
  
  for (let i = 1; i <= 3; i++) {
    const trailX = blob.x - blob.swoopDirection * i * 8;
    const trailY = blob.y + i * 5;
    const trailRadius = blob.radius * (1 - i * 0.2);
    ctx.beginPath();
    ctx.arc(trailX, trailY, trailRadius * 0.3, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  ctx.restore();
  drawHealthBar(blob, "#00AAFF");
  drawHealthText(blob);
}

function drawHealthText(entity) {
  ctx.fillStyle = 'white';
  const fontSize = entity.enemyType === 'giant' ? 16 : 
                   entity.enemyType === 'small' ? 10 : 
                   entity.isSpinner ? 14 : 12;
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  const yOffset = entity.isSpinner ? 6 : 4;
  ctx.strokeText(entity.health, entity.x, entity.y + yOffset);
  ctx.fillText(entity.health, entity.x, entity.y + yOffset);
}

function drawLevelUpWave() {
  if (levelUpWaveTimer > 0) {
    ctx.save();
    const waveProgress = (60 - levelUpWaveTimer) / 60;
    const waveRadius = waveProgress * Math.max(canvas.width, canvas.height) * 1.5;
    const waveAlpha = 1 - waveProgress;

    ctx.globalAlpha = waveAlpha;
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 8;
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 20;

    ctx.beginPath();
    ctx.arc(player.x + player.width/2, player.y + player.height/2, waveRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(player.x + player.width/2, player.y + player.height/2, waveRadius * 0.8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
    levelUpWaveTimer--;
  }
}

function drawLevelUpDisplay() {
  if (levelUpDisplay > 0) {
    ctx.save();
    const alpha = levelUpDisplay > 120 ? 1 : levelUpDisplay / 120;
    const scale = 1 + (180 - levelUpDisplay) / 60;

    ctx.globalAlpha = alpha;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(scale, scale);

    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`LEVEL ${currentLevel}`, 0, 0);

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'white';
    ctx.fillText(`LEVEL ${currentLevel}`, 0, 0);

    ctx.restore();
    levelUpDisplay--;
  }
}

function drawBombFlash() {
  if (bombFlashTimer > 0) {
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    bombFlashTimer--;
  }
}

function drawGameOver() {
  if (gameOver) {
    ctx.fillStyle = 'red';
    ctx.font = '50px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}
