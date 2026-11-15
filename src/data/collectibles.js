/** Описание на всички предмети за събиране и специални бонуси. */
export const ITEM_TYPES = {
  star: { label: 'Коледна звезда', points: 100, kind: 'star', size: 30, sound: 'star' },
  gift: { label: 'Малък подарък', points: 50, kind: 'gift', size: 28, sound: 'gift' },
  goldGift: { label: 'Златен подарък', points: 250, kind: 'gift', size: 32, sound: 'gift' },
  candy: { label: 'Захарно бастунче', points: 25, kind: 'candy', size: 26, sound: 'candy' },
  snowflake: { label: 'Магическа снежинка', points: 150, kind: 'snowflake', size: 30, sound: 'star' },
  key: { label: 'Ледено ключе', points: 50, kind: 'key', size: 30, sound: 'powerup' },

  life: { label: 'Допълнителен живот', points: 0, kind: 'powerup', size: 32, sound: 'life' },
  speed: { label: 'Ускорение', points: 0, kind: 'powerup', size: 32, sound: 'powerup', duration: 8 },
  shield: { label: 'Защита', points: 0, kind: 'powerup', size: 32, sound: 'powerup' },
  superjump: { label: 'Супер скок', points: 0, kind: 'powerup', size: 32, sound: 'powerup', duration: 10 },
  magnet: { label: 'Магнит', points: 0, kind: 'powerup', size: 32, sound: 'powerup', duration: 10 },
};

export const POWERUP_INFO = {
  speed: { icon: '⚡', label: 'Ускорение' },
  superjump: { icon: '🦘', label: 'Супер скок' },
  magnet: { icon: '🧲', label: 'Магнит' },
  shield: { icon: '🛡️', label: 'Защита' },
};

/** Скритите предмети (Ниво 4) носят двойни точки. */
export const HIDDEN_MULTIPLIER = 2;
