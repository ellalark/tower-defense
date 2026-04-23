export class SlowEffect {
  constructor({ durationTicks, factor }) {
    this.type = 'slow';
    this.factor = factor;
    this.durationTicks = durationTicks;
  }

  tick(_enemy, _world) {
    this.durationTicks -= 1;
  }

  isExpired() {
    return this.durationTicks <= 0;
  }
}

export class StunEffect {
  constructor({ durationTicks }) {
    this.type = 'stun';
    this.durationTicks = durationTicks;
  }

  tick(_enemy, _world) {
    this.durationTicks -= 1;
  }

  isExpired() {
    return this.durationTicks <= 0;
  }
}

export class BurnEffect {
  constructor({ durationTicks, dps }) {
    this.type = 'burn';
    this.dps = dps;
    this.durationTicks = durationTicks;
  }

  tick(enemy, world) {
    enemy.applyDamage(this.dps, 'burn', world);
    this.durationTicks -= 1;
  }

  isExpired() {
    return this.durationTicks <= 0;
  }
}
