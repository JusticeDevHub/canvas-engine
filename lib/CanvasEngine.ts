// CanvasEngine.ts

import CanvasObject from "./CanvasObject.js";

interface MousePosition {
  x: number;
  y: number;
}

interface Point {
  x: number;
  y: number;
}

/**
 * Build game-like web applications with simple functions.
 *
 * Drop it into React, Vue, Svelte, or vanilla JS—it outputs regular DOM elements
 * that work with your existing styling and state management. No canvas to learn,
 * no special framework adapters needed.
 *
 * @example
 * const engine = new CanvasEngine("app", document);
 * const player = engine.createObject("hero");
 *
 * player.setImage("/avatar.png")
 *       .setPosition(100, 100)
 *       .onMouseClickThis((self) => self.setMoveToPosition(200, 200, 300));
 *
 * @remarks
 * Coordinate system: 0° points Up, +Y moves Up (clockwise rotation).
 */
class CanvasEngine {
  #document: Document;
  #canvasId: string;
  #container: HTMLElement;
  #scene: HTMLElement;
  #objects: Map<string, CanvasObject> = new Map();
  #mouse: MousePosition = { x: 0, y: 0 };
  #rafId: number = -1;
  #camera: CanvasObject;
  #lastTime: number = 0;

  /**
   * @param canvasId - ID of the HTML container element
   * @param document - Usually 'window.document'
   */
  constructor(canvasId: string, document: Document) {
    this.#document = document;
    this.#canvasId = canvasId;

    const container = document.getElementById(canvasId);
    if (!container) throw new Error(`No element with id "${canvasId}"`);

    this.#container = container;
    container.style.overflow = "hidden";
    container.style.position = container.style.position || "relative";

    // Create the movable scene layer
    this.#scene = document.createElement("div");
    this.#scene.style.cssText =
      "position:absolute;width:100%;height:100%;will-change:transform";
    container.appendChild(this.#scene);

    // Track mouse position relative to container
    document.addEventListener("mousemove", (e: MouseEvent) => {
      const rect = this.#container.getBoundingClientRect();
      this.#mouse = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    });

    // Create camera (moves the whole scene)
    this.#camera = new CanvasObject(
      `cam-${Math.random().toString(36).slice(2)}`,
      document,
      this,
      this.#scene,
      false,
      true,
    );

    this.#startLoop();
  }

  #startLoop(): void {
    const loop = (time: number) => {
      const dt = (time - this.#lastTime) / 1000;
      this.#lastTime = time;
      this.#objects.forEach((obj) => obj.update(dt));
      this.#rafId = requestAnimationFrame(loop);
    };
    this.#rafId = requestAnimationFrame(loop);
  }

  /**
   * Add a new game object to the scene.
   * @param id - Unique name (e.g., "player", "enemy-1")
   * @returns The created object
   */
  createObject(id: string): CanvasObject {
    if (this.#objects.has(id)) {
      console.warn(`Object "${id}" already exists`);
      return this.#objects.get(id)!;
    }

    const obj = new CanvasObject(
      id,
      this.#document,
      this,
      this.#scene,
      false,
      false,
    );
    this.#objects.set(id, obj);
    return obj;
  }

  /** Get any object by its ID. */
  getCanvasObject(id: string): CanvasObject | undefined {
    return this.#objects.get(id);
  }

  /** Get the camera object (move this to scroll the world). */
  getCameraObject(): CanvasObject {
    return this.#camera;
  }

  /** Get canvas container ID. */
  getCanvasId(): string {
    return this.#canvasId;
  }

  /** Get mouse position relative to the game container. */
  getMousePosition(): MousePosition {
    return { ...this.#mouse };
  }

  /** @internal Called automatically when objects are destroyed. */
  unregisterObject(id: string): void {
    this.#objects.delete(id);
  }

  /**
   * Math utilities.
   * Angles: 0° = Up, 90° = Right, 180° = Down, 270° = Left.
   */
  utils = {
    /** Distance between two points. */
    getDistanceBetweenTwoPoints: (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
    ): number => Math.hypot(x2 - x1, y2 - y1),

    /**
     * Angle from point A to point B in degrees.
     * Returns 0° for Up, 90° for Right.
     */
    getAngleBetweenTwoPoints: (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
    ): number => {
      const deg = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
      return (deg + 90 + 360) % 360;
    },

    /**
     * Find closest point to target.
     * @returns Index of closest point, or null if empty array.
     */
    getClosestToPoint: (points: Point[], target: Point): number | null => {
      if (!points.length) return null;
      let closest = 0;
      let minDist = Infinity;

      points.forEach((p, i) => {
        const d = Math.hypot(p.x - target.x, p.y - target.y);
        if (d < minDist) {
          minDist = d;
          closest = i;
        }
      });
      return closest;
    },

    /**
     * Get indices sorted by distance (closest first).
     * @returns Array of indices [0, 2, 1] etc.
     */
    getPointDistancesInOrdered: (points: Point[], target: Point): number[] =>
      points
        .map((p, i) => ({ i, d: Math.hypot(p.x - target.x, p.y - target.y) }))
        .sort((a, b) => a.d - b.d)
        .map((x) => x.i),
  };

  /** Stop the engine and remove all objects. */
  destroy(): void {
    if (this.#rafId >= 0) cancelAnimationFrame(this.#rafId);
    this.#objects.forEach((obj) => obj.destroy());
    this.#objects.clear();
    this.#scene.remove();
  }
}

export default CanvasEngine;
