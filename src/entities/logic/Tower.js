import { selectTarget } from '../../systems/targeting.js';

export class Tower {
  constructor({ def, x, y, targetingMode = 'first' }) {
    this.def = def;
    this.x = x;
    this.y = y;
    this.targetingMode = targetingMode;
    this.level = 1;
    this.cooldownRemaining = 0;
    this.abilityCooldownRemaining = 0;
  }

  get damage() {
    return this.def.levels[this.level - 1].damage;
  }

  get range() {
    return this.def.levels[this.level - 1].range;
  }

  get cooldownTicks() {
    return this.def.levels[this.level - 1].cooldownTicks;
  }

  tick(dt, world) {
    this.cooldownRemaining = Math.max(0, this.cooldownRemaining - dt);
    this.abilityCooldownRemaining = Math.max(0, this.abilityCooldownRemaining - dt);

    if (this.cooldownRemaining === 0) {
      const target = selectTarget(this, world.enemies, this.targetingMode, world);
      if (target != null) {
        this.def.fire(world, this, target);
        this.cooldownRemaining = this.cooldownTicks;
      }
    }
  }

  upgrade(world) {
    if (this.level >= this.def.levels.length) return false;
    const cost = this.def.levels[this.level].upgradeCost;
    if (world.spend(cost)) {
      this.level++;
      return true;
    }
    return false;
  }

  canActivate() {
    return this.abilityCooldownRemaining === 0 && this.def.ability != null;
  }

  activate(rng, world) {
    if (!this.canActivate()) return false;
    this.def.ability.execute(rng, world, this);
    this.abilityCooldownRemaining = this.def.ability.cooldownTicks;
    return true;
  }
}
