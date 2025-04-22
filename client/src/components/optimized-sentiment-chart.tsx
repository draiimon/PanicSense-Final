// Draw Total in center
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = textColor;
  ctx.font = '16px system-ui';
  const totalText = `Total: ${total}`;
  const metrics = ctx.measureText(totalText);
  ctx.fillText(totalText, centerX - metrics.width/2, centerY);