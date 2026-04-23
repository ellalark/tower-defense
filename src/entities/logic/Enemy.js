import { pointAtDistance } from '../../systems/pathing.js';

export class Enemy {
  constructor({ hp, speed, path, armor, flags, baseDamage }) {
    this.hp = hp;
    this.speed = speed;
    this.path = path;
    this.armor = armor;
    this.flags = flags;
    this.baseDamage = baseDamage;
    this.distanceTravelled = 0;
    const pos = pointAtDistance(path, 0);
    this.x = pos.x;
    this.y = pos.y;
  }

  tick(dt, world) {
    this.distanceTravelled += this.speed * dt;
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
