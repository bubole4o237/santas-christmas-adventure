const KEY_MAP = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  Space: 'jump',
};

/** Събира състоянието на клавиатурата и виртуалните (touch) бутони. */
export default class Input {
  constructor() {
    this.keys = { left: false, right: false, up: false, down: false, jump: false };
    this.virtual = { left: false, right: false, up: false, down: false, jump: false };
    this.jumpPressed = false; // фронт на натискане, изчиства се от engine-а
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onBlur = this.onBlur.bind(this);
  }

  attach() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  detach() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
  }

  onKeyDown(e) {
    const action = KEY_MAP[e.code];
    if (!action) return;
    const target = e.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
    e.preventDefault();
    if (action === 'jump' && !this.keys.jump) this.jumpPressed = true;
    this.keys[action] = true;
  }

  onKeyUp(e) {
    const action = KEY_MAP[e.code];
    if (!action) return;
    e.preventDefault();
    this.keys[action] = false;
  }

  onBlur() {
    this.reset();
  }

  setVirtual(action, pressed) {
    if (action === 'jump' && pressed && !this.virtual.jump) this.jumpPressed = true;
    this.virtual[action] = pressed;
  }

  isDown(action) {
    return this.keys[action] || this.virtual[action];
  }

  consumeJump() {
    const p = this.jumpPressed;
    this.jumpPressed = false;
    return p;
  }

  reset() {
    Object.keys(this.keys).forEach((k) => {
      this.keys[k] = false;
      this.virtual[k] = false;
    });
    this.jumpPressed = false;
  }
}
