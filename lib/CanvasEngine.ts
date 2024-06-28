import CanvasObject from "./CanvasObject";

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
      return;
    }

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

  destroy = () => {
    this.#canvasObjects = {};
    this.#canvas?.remove();
  };
}

export default CanvasEngine;
