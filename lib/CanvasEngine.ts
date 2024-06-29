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
 *       <div id="canvas-id" style={{ width: `100%`, height: `100%` }}></div>
 *    </body>
 * </html>
 * ```
 */
class CanvasEngine {
  #document: Document;
  #camera: CanvasObject;
  #canvas: HTMLElement | null = null;
  #canvasObjects: { [id: string]: CanvasObject } = {};

  constructor(canvasId: string, document: Document) {
    this.#document = document;

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

  destroy = (): void => {
    this.#canvasObjects = {};
    this.#canvas?.remove();
  };
}

export default CanvasEngine;
