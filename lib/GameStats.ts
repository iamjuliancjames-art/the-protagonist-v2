// lib/GameStats.ts

export interface GameStats {
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  xp: number;
  level: number;
}

export class GameState {
  stats: GameStats;

  constructor() {
    this.stats = {
      health: 100,
      maxHealth: 100,
      mana: 50,
      maxMana: 50,
      xp: 0,
      level: 1
    };
  }

  // Simple logic to parse AI response and update stats
  processResponse(text: string) {
    if (text.toLowerCase().includes("hurt") || text.toLowerCase().includes("damage")) {
      this.stats.health = Math.max(0, this.stats.health - 10);
    }
    if (text.toLowerCase().includes("success") || text.toLowerCase().includes("victory")) {
      this.stats.xp += 20;
      this.checkLevelUp();
    }
  }

  checkLevelUp() {
    if (this.stats.xp >= 100 * this.stats.level) {
      this.stats.level++;
      this.stats.maxHealth += 20;
      this.stats.health = this.stats.maxHealth; // Heal on level up
      this.stats.xp = 0;
      return true; // Leveled up!
    }
    return false;
  }
}