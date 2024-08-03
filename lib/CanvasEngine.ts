import getMousePosition from "../utils/getMousePosition.ts";
import CanvasObject from "./CanvasObject.ts";

/**
 * The `CanvasEngine` function acts as the central component of this library that bridges HTML5 and game development practices. It provides abstractions for working with HTML5
 *
 * @example
 * ```ts
 * import CanvasEngine from "@web-dev-library/canvas-engine";
 *
 * const canvasEngine = new CanvasEngine("canvas-id", document);
 * const player = canvasEngine.createObject("player");
 * ```
 *
 * ```html
 * <html>
 *    <body>
 *       <div id="canvas-id" style={{ width: "100vw", height: "100vh" }}></div>
 *    </body>
 * </html>
 * ```
 */
class CanvasEngine {
  #document: Document;
  #camera: CanvasObject;
  #canvasId: string;
  #canvas: HTMLElement | null = null;
  #canvasObjects: { [id: string]: CanvasObject } = {};
  #mousePosition: { x: number; y: number };

  constructor(canvasId: string, document: Document) {
    this.#document = document;
    this.#canvasId = canvasId;

    const canvasItem = document.getElementById(canvasId);
    if (canvasItem === null) {
      alert(`No HTML Element with id ${canvasId} Found on CanvasEngine Init`);
    }

    if (canvasItem) {
      canvasItem.style.overflow = "hidden";
      if (canvasItem.style.position === "") {
        canvasItem.style.position = "relative";
      }
      this.#canvas = document.createElement("div") as HTMLElement;
      this.#canvas.style.position = "absolute";
      this.#canvas.style.width = "100%";
      this.#canvas.style.height = "100%";
      this.#canvas.style.left = "50%";
      this.#canvas.style.top = "50%";
      canvasItem.appendChild(this.#canvas);
    }

    this.#camera = new CanvasObject(
      `camera-${Math.random()}.replace("0.", "")`,
      this.#document,
      this,
      this.#canvas,
      false,
      true
    );

    this.#document.addEventListener("mousemove", (e) => {
      this.#mousePosition = getMousePosition(this, this.#document, e);
    });

    return this;
  }

  createObject = (id: string): CanvasObject => {
    const newCanvasObject = new CanvasObject(
      id,
      this.#document,
      this,
      this.#canvas,
      false,
      false
    );

    if (this.#canvasObjects[id]) {
      // TODO: Should only alert this in debug mode
      alert(`CanvasObject with duplicate ids found: "${id}"`);
    }

    this.#canvasObjects[id] = newCanvasObject;
    return newCanvasObject;
  };

  getCanvasObject = (id: string): CanvasObject | null => {
    return this.#canvasObjects[id] ?? null;
  };

  getCameraObject = (): CanvasObject => {
    return this.#camera;
  };

  getCanvasId = (): string => {
    return this.#canvasId;
  };

  utils = {
    getDistanceBetweenTwoPoints: (
      x1: number,
      y1: number,
      x2: number,
      y2: number
    ): number => {
      return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    },
    getAngleBetweenTwoPoints: (
      fromX: number,
      fromY: number,
      toX: number,
      toY: number
    ): number => {
      const deltaY = toX - fromX;
      const deltaX = toY - fromY;
      const angleInRadians = Math.atan2(deltaY, deltaX);
      let angleInDegrees = angleInRadians * (180 / Math.PI);
      if (angleInDegrees < 0) {
        angleInDegrees += 360;
      }
      return angleInDegrees;
    },
    getMousePosition: (): { x: number; y: number } => {
      return this.#mousePosition;
    },
    /**
     * Returns index of closest point to target point
     * @param points number
     * @param point number
     * @returns
     */
    getClosestToPoint: (
      points: { x: number; y: number }[],
      point: { x: number; y: number }
    ): number | null => {
      let closestDistance = 0;
      let closestIndex: null | number = null;

      points.forEach((obj, i) => {
        if (i === 0) {
          closestIndex = i;
          closestDistance = this.utils.getDistanceBetweenTwoPoints(
            obj.x,
            obj.y,
            point.x,
            point.y
          );
        } else {
          const thisDistance = this.utils.getDistanceBetweenTwoPoints(
            obj.x,
            obj.y,
            point.x,
            point.y
          );

          if (thisDistance < closestDistance) {
            closestIndex = i;
            closestDistance = thisDistance;
          }
        }
      });

      return closestIndex;
    },
  };

  destroy = (): void => {
    this.#document.removeEventListener("mousemove", () => null);
    this.#canvasObjects = {};
    this.#canvas?.remove();
  };
}

export default CanvasEngine;
