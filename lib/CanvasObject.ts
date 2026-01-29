// CanvasObject.ts

import CanvasEngine from "./CanvasEngine.js";

interface Movement {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  speed: number;
  startTime: number;
  duration: number;
}

type CSSProperties = Partial<CSSStyleDeclaration>;

/**
 * An object that can move, collide, and interact.
 */
class CanvasObject {
  #id: string;
  #document: Document;
  #engine: CanvasEngine;
  #container: HTMLElement;
  #content: HTMLElement;
  #isCamera: boolean;

  #pos = { x: 0, y: 0 };
  #movement: Movement | null = null;
  #listeners = new Map<string, (e: Event) => void>();
  #collisionObserver: IntersectionObserver | null = null;
  #collisionHandlers = new Map<
    string,
    (self: CanvasObject, other: CanvasObject) => void
  >();
  #functions = new Map<string, (params?: any) => void>();
  #vars = new Map<string, any>();
  #imgEl: HTMLImageElement | null = null;
  #onDestroy: ((self: CanvasObject) => void) | null = null;

  constructor(
    id: string,
    document: Document,
    engine: CanvasEngine,
    parent: HTMLElement | null,
    isChild = false,
    isCamera = false,
  ) {
    this.#id = id;
    this.#document = document;
    this.#engine = engine;
    this.#isCamera = isCamera;
    const parentEl = parent || document.body;

    // Container handles positioning via transform
    this.#container = document.createElement("div");
    this.#container.style.cssText =
      "position:absolute;transform:translate(-50%,-50%);will-change:transform;width:fit-content";

    if (isChild) {
      this.#container.style.left = "50%";
      this.#container.style.top = "50%";
    }

    parentEl.appendChild(this.#container);

    // Content holds the image/text
    this.#content = document.createElement("div");
    this.#content.id = id;
    this.#content.style.position = "relative";
    this.#container.appendChild(this.#content);

    this.#setupCollisionObserver();
  }

  #setupCollisionObserver(): void {
    this.#collisionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.forEach((cls) => {
            const handler = this.#collisionHandlers.get(cls);
            if (!handler) return;

            const otherId = entry.target.id;
            const other = this.#engine.getCanvasObject(otherId);
            if (other) handler(this, other);
          });
        });
      },
      { threshold: 0 },
    );
  }

  /** @internal Called by the game loop every frame. */
  update(deltaTime: number): void {
    if (!this.#movement) return;

    const elapsed = (performance.now() - this.#movement.startTime) / 1000;

    if (elapsed >= this.#movement.duration) {
      this.setPosition(this.#movement.targetX, this.#movement.targetY);
      this.#movement = null;
      return;
    }

    const t = elapsed / this.#movement.duration;
    const x =
      this.#movement.startX +
      (this.#movement.targetX - this.#movement.startX) * t;
    const y =
      this.#movement.startY +
      (this.#movement.targetY - this.#movement.startY) * t;

    this.#applyPosition(x, y);
  }

  #applyPosition(x: number, y: number): void {
    this.#pos.x = x;
    this.#pos.y = y;

    if (this.#isCamera) {
      // Move scene opposite to camera
      (this.#container.parentElement as HTMLElement).style.transform =
        `translate(calc(-50% + ${-x}px), calc(-50% + ${y}px))`;
    } else {
      // Regular objects: translate3d for GPU acceleration
      // Note: -y because CSS Y is down, GameMaker Y is up
      this.#container.style.transform = `translate3d(${x}px, ${-y}px, 0) translate(-50%, -50%)`;
    }
  }

  /**
   * Set position immediately (stops any movement).
   * @param x - Horizontal position (0 = center, positive = right)
   * @param y - Vertical position (0 = center, positive = up)
   */
  setPosition(x: number, y: number): this {
    this.#movement = null;
    this.#applyPosition(x, y);
    return this;
  }

  getPosition(): { x: number; y: number } {
    return { ...this.#pos };
  }

  /** Apply CSS styles (width, height, backgroundColor, etc.). */
  setStyle(style: CSSProperties): this {
    Object.assign(this.#content.style, style);
    return this;
  }

  /**
   * Move to position over time.
   * @param speed - Pixels per second
   */
  setMoveToPosition(x: number, y: number, speed: number): this {
    if (speed <= 0) return this;
    const dist = Math.hypot(x - this.#pos.x, y - this.#pos.y);
    if (dist === 0) return this;

    this.#movement = {
      startX: this.#pos.x,
      startY: this.#pos.y,
      targetX: x,
      targetY: y,
      speed,
      startTime: performance.now(),
      duration: dist / speed,
    };
    return this;
  }

  /** Stop moving immediately. */
  setStopMovement(): this {
    this.#movement = null;
    return this;
  }

  /**
   * Move in a direction.
   * @param direction - Degrees: 0 = Up, 90 = Right, 180 = Down, 270 = Left
   * @param distance - How far to move in pixels
   * @param speed - Pixels per second
   */
  setMoveInDirection(direction: number, distance: number, speed: number): this {
    // Convert GameMaker angle (0=up) to standard math (0=right)
    const rad = (90 - direction) * (Math.PI / 180);
    const tx = this.#pos.x + Math.cos(rad) * distance;
    const ty = this.#pos.y + Math.sin(rad) * distance;
    return this.setMoveToPosition(tx, ty, speed);
  }

  /** Set an image. */
  setImage(src: string): this {
    if (!this.#imgEl) {
      this.#imgEl = this.#document.createElement("img");
      this.#imgEl.style.cssText =
        "display:block;max-width:100%;user-select:none";
      this.#content.appendChild(this.#imgEl);
    }
    this.#imgEl.src = src;
    return this;
  }

  /** Set text content. */
  setText(text: string | number): this {
    this.#content.textContent = String(text);
    return this;
  }

  /** Create a child object that moves with this one. */
  createChild(id: string): CanvasObject {
    return new CanvasObject(
      id,
      this.#document,
      this.#engine,
      this.#content,
      true,
      false,
    );
  }

  /**
   * Call when hitting objects with this CSS class.
   * @param targetClass - e.g., "enemy", "coin"
   */
  onCollisionTrigger(
    targetClass: string,
    callback: (self: CanvasObject, other: CanvasObject) => void,
  ): this {
    this.addClass(targetClass);
    this.#collisionHandlers.set(targetClass, callback);

    // Watch existing objects
    this.#document.querySelectorAll(`.${targetClass}`).forEach((el) => {
      if (el !== this.#content) this.#collisionObserver?.observe(el);
    });

    return this;
  }

  /** Add CSS class (for styling or collision tags). */
  addClass(className: string): this {
    this.#content.classList.add(className);
    return this;
  }

  /** Mouse enters this object. */
  onMouseEnter(
    callback: (self: CanvasObject, mouse: { x: number; y: number }) => void,
  ): this {
    return this.#on("mouseenter", this.#content, () =>
      callback(this, this.#engine.getMousePosition()),
    );
  }

  /** Mouse leaves this object. */
  onMouseLeave(
    callback: (self: CanvasObject, mouse: { x: number; y: number }) => void,
  ): this {
    return this.#on("mouseleave", this.#content, () =>
      callback(this, this.#engine.getMousePosition()),
    );
  }

  /** Clicked on this specific object. */
  onMouseClickThis(
    callback: (self: CanvasObject, mouse: { x: number; y: number }) => void,
  ): this {
    return this.#on("mousedown", this.#content, (e) => {
      e.stopPropagation();
      callback(this, this.#engine.getMousePosition());
    });
  }

  /** Clicked anywhere in the document. */
  onMouseClickGlobal(
    callback: (self: CanvasObject, mouse: { x: number; y: number }) => void,
  ): this {
    return this.#on("mousedown", this.#document, () =>
      callback(this, this.#engine.getMousePosition()),
    );
  }

  /** Key pressed (document level). */
  onKeyDown(callback: (self: CanvasObject, key: string) => void): this {
    return this.#on("keydown", this.#document, (e) =>
      callback(this, (e as KeyboardEvent).key),
    );
  }

  /** Key released. */
  onKeyUp(callback: (self: CanvasObject, key: string) => void): this {
    return this.#on("keyup", this.#document, (e) =>
      callback(this, (e as KeyboardEvent).key),
    );
  }

  /** Store a function callable via callFunction(). Useful for framework integration. */
  createFunction(name: string, fn: (params?: any) => void): this {
    this.#functions.set(name, fn);
    return this;
  }

  /** Call a function stored earlier. */
  callFunction(name: string, params?: any): this {
    const fn = this.#functions.get(name);
    if (fn) {
      try {
        fn(params);
      } catch (e) {
        console.error(`Error in ${name}:`, e);
      }
    }
    return this;
  }

  /** Store arbitrary data. */
  setVariable(key: string, value: any): this {
    this.#vars.set(key, value);
    return this;
  }

  getVariable(key: string): any {
    return this.#vars.get(key);
  }

  /** Callback when destroy() is called. */
  onDestroy(callback: (self: CanvasObject) => void): this {
    this.#onDestroy = callback;
    return this;
  }

  getId(): string {
    return this.#id;
  }

  /** Remove object and cleanup. */
  destroy(): void {
    this.#onDestroy?.(this);

    // Remove listeners
    this.#listeners.forEach((fn, key) => {
      const [event, target] = key.split("|");
      const el = target === "doc" ? this.#document : this.#content;
      el.removeEventListener(event, fn);
    });

    this.#collisionObserver?.disconnect();
    this.#engine.unregisterObject(this.#id);
    this.#container.remove();
  }

  #on(event: string, target: EventTarget, handler: (e: Event) => void): this {
    const key = `${event}|${target === this.#document ? "doc" : "el"}`;

    // Remove old listener if exists
    const old = this.#listeners.get(key);
    if (old) target.removeEventListener(event, old);

    target.addEventListener(event, handler);
    this.#listeners.set(key, handler);
    return this;
  }
}

export default CanvasObject;
