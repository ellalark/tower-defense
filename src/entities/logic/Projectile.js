export class Projectile {
  constructor({
    x,
    y,
    mode,
    speed,
    damage,
    damageType,
    hitRadius,
    lifetimeTicks,
    direction,
    target,
    splashRadius,
  }) {
    this.x = x;
    this.y = y;
    this.mode = mode;
    this.speed = speed;
    this.damage = damage;
    this.damageType = damageType;
    this.hitRadius = hitRadius;
    this.lifetimeTicks = lifetimeTicks;
    this.direction = direction;
    this.target = target;
    this.splashRadius = splashRadius ?? 0;
    this.removed = false;
  }

  tick(dt, world) {
    if (this.lifetimeTicks <= 0) {
      this.removed = true;
      return;
    }

    if (this.mode === 'homing') {
      if (this.target.hp <= 0) {
        this.removed = true;
        return;
      }
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0) {
        this.direction = { dx: dx / dist, dy: dy / dist };
      }
    }

    this.x += this.direction.dx * this.speed * dt;
    this.y += this.direction.dy * this.speed * dt;

    const inRadius = [];
    for (const enemy of world.enemies) {
      if (enemy.hp <= 0) continue;
      const d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (d <= this.hitRadius) {
        inRadius.push({ enemy, d });
      }
    }

    if (inRadius.length > 0) {
      inRadius.sort((a, b) => a.d - b.d);
      const hit = inRadius[0].enemy;

      if (this.splashRadius > 0) {
        const splashTargets = [];
        for (const enemy of world.enemies) {
          if (enemy.hp <= 0) continue;
          const d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
          if (d <= this.splashRadius) {
            splashTargets.push(enemy);
          }
        }
        for (const enemy of splashTargets) {
          enemy.applyDamage(this.damage, this.damageType, world);
        }
      } else {
        hit.applyDamage(this.damage, this.damageType, world);
      }

      this.removed = true;
      return;
    }

    this.lifetimeTicks -= dt;
  }
}
