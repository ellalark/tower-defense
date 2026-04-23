import { pointAtDistance } from '../../systems/pathing.js';

export class Enemy {
  constructor({ hp, speed, path, armor, flags, baseDamage, archetype }) {
    this.hp = hp;
    this.speed = speed;
    this.path = path;
    this.armor = armor;
    this.flags = flags;
    this.baseDamage = baseDamage;
    this.archetype = archetype;
    this.distanceTravelled = 0;
    this.effects = [];
    const pos = pointAtDistance(path, 0);
    this.x = pos.x;
    this.y = pos.y;
  }

  tick(dt, world) {
    const activeEffects = this.effects.slice();
    for (const effect of activeEffects) {
      effect.tick(this, world);
    }
    this.effects = this.effects.filter((e) => !e.isExpired());

    if (this.hp <= 0) {
      return;
    }

    const stun = activeEffects.find((e) => e.type === 'stun');
    if (!stun) {
      const slow = activeEffects.find((e) => e.type === 'slow');
      const effectiveSpeed = this.speed * (slow ? slow.factor : 1);
      this.distanceTravelled += effectiveSpeed * dt;
    }

    const pos = pointAtDistance(this.path, this.distanceTravelled);
    this.x = pos.x;
    this.y = pos.y;

    if (this.distanceTravelled >= this.path.totalLength) {
      world.onBaseHit(this);
    }
  }

  applyDamage(amount, _type, world) {
    this.hp -= amount;
    if (this.hp <= 0) {
      world.onEnemyKilled(this);
    }
  }
}
