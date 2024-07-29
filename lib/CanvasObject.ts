import CanvasEngine from "./CanvasEngine.ts";
import type csstypes from "./csstypes.d.ts";
import getMousePosition from "../utils/getMousePosition.ts";

/**
 * CanvasObject allows you to create, configure, and store items. It is the fundamental object in `CanvasEngine`, which can represent characters, props, scenery, cameras and more.
 */
class CanvasObject {
  #id: string;
  #HTMLElement: HTMLElement;
  #containerElement: HTMLElement;
  #document: Document;
  #isCamera: boolean;
  #text: string | number | null;
  #imageAnimElement: HTMLImageElement | null = null;
  #canvasForCamera: HTMLElement | null = null;
  #canvasEngine: CanvasEngine;
  #variables: { [key: string]: any } = {};
  #functions: { [key: string]: (params?: any) => void } = {};
  #position: { x: number; y: number } = { x: 0, y: 0 };
  #moveToPosition: movementInterface | null = null;
  #onCollisionTrigger: {
    [key: string]: (_this: CanvasObject, other: CanvasObject) => void;
  } = {};

  constructor(
    id: string,
    document: Document,
    canvasEngine: CanvasEngine,
    parent: HTMLElement | null,
    isChild: boolean,
    isCamera: boolean
  ) {
    this.#id = id;
    this.#canvasEngine = canvasEngine;
    this.#document = document;
    this.#isCamera = isCamera;
    this.#containerElement = this.#document.createElement("div");
    this.#containerElement.style.position = "absolute";
    this.#containerElement.style.width = "fit-content";
    this.#containerElement.style.height = "fit-content";
    this.#containerElement.style.transform = "translate(-50%, -50%)";
    if (isChild) {
      this.#containerElement.style.left = "50%";
      this.#containerElement.style.top = "50%";
    }
    if (isCamera) {
      this.#canvasForCamera = parent;
    }
    parent === null
      ? this.#document.appendChild(this.#containerElement)
      : parent.appendChild(this.#containerElement);

    this.#HTMLElement = this.#document.createElement("div");
    this.#HTMLElement.id = id;
    this.#HTMLElement.style.position = "relative";
    this.#HTMLElement.style.width = "auto";
    this.#HTMLElement.style.height = "auto";
    this.#containerElement.appendChild(this.#HTMLElement);
    return this;
  }

  setStyle = (style: CSSProperties): CanvasObject => {
    Object.keys(style).forEach((styleKey, i) => {
      let value = Object.values(style)[i] as any;

      if (styleKey === "zIndex") {
        this.#containerElement.style.zIndex = value;
      }
      if (
        styleKey.toLowerCase() === "position" &&
        value.toLowerCase() === "fixed"
      ) {
        this.#containerElement.style.position = value;
      }
      if (
        styleKey.toLowerCase().includes("width") &&
        typeof value === "number"
      ) {
        value = value + "px";
      }
      if (
        styleKey.toLowerCase().includes("height") &&
        typeof value === "number"
      ) {
        value = value + "px";
      }

      this.#HTMLElement.style[styleKey] = value;
    });
    return this;
  };

  setPosition = (x: number, y: number): CanvasObject => {
    this.#position.x = x;
    this.#position.y = y;
    this.#containerElement.style.left = `${x}px`;
    this.#containerElement.style.top = `${-y}px`;

    if (this.#isCamera && this.#canvasForCamera) {
      this.#canvasForCamera.style.left = `calc(50% + ${-x}px)`;
      this.#canvasForCamera.style.top = `calc(50% + ${y}px)`;
    }

    Object.keys(this.#onCollisionTrigger).forEach((key) => {
      const _this = {
        x: this.#HTMLElement.getBoundingClientRect().x,
        y: this.#HTMLElement.getBoundingClientRect().y,
        width: this.#HTMLElement.getBoundingClientRect().width,
        height: this.#HTMLElement.getBoundingClientRect().height,
      };

      for (
        let elementIndex = 0;
        elementIndex < this.#document.getElementsByClassName(key).length;
        elementIndex++
      ) {
        const otherElement = this.#document
          .getElementsByClassName(key)
          [elementIndex].getBoundingClientRect();

        const other = {
          x: otherElement.x,
          y: otherElement.y,
          width: otherElement.width,
          height: otherElement.height,
        };

        const distance = {
          x: (_this.width + other.width) / 2,
          y: (_this.height + other.height) / 2,
        };

        if (
          Math.abs(_this.x - other.x) <= distance.x &&
          Math.abs(_this.y - other.y) <= distance.y
        ) {
          let otherId = "";
          for (
            let i = 0;
            i <
            this.#document.getElementsByClassName(key)[elementIndex].id.length;
            i++
          ) {
            let currentCharacter =
              this.#document.getElementsByClassName(key)[elementIndex].id[i];
            if (currentCharacter === " ") {
              break;
            }
            otherId += currentCharacter;
          }

          // TODO: the else statement below should never trigger because `otherId` should always exist, though should find a better way to handle this.
          this.#onCollisionTrigger[key](
            this,
            this.#canvasEngine.getCanvasObject(otherId) ??
              this.#canvasEngine.createObject(`${Math.random()}`)
          );
        }
      }
    });

    return this;
  };

  getPosition = (): { x: number; y: number } => {
    return { ...this.#position };
  };

  /**
   *
   * @param speed pixels per second
   * @param movementType currently just linear, will add more movement types
   */
  setMoveToPosition = (x: number, y: number, speed: number): CanvasObject => {
    if (this.#moveToPosition) {
      cancelAnimationFrame(this.#moveToPosition.loopId);
    }

    this.#moveToPosition = {
      startX: this.getPosition().x,
      startY: this.getPosition().y,
      targetX: x,
      targetY: y,
      speed,
      movementType: "linear",
      timestamp: Date.now(),
      loopId: -1,
    };

    const timeTillDestination =
      this.#canvasEngine.utils.getDistanceBetweenTwoPoints(
        this.getPosition().x,
        this.getPosition().y,
        x,
        y
      ) / speed;

    const loop = () => {
      if (this.#moveToPosition) {
        const timepassed = (Date.now() - this.#moveToPosition.timestamp) / 1000;

        if (timepassed > timeTillDestination) {
          this.setPosition(
            this.#moveToPosition.targetX,
            this.#moveToPosition.targetY
          );
          cancelAnimationFrame(this.#moveToPosition.loopId);
          return;
        }

        const currentPosition = {
          x:
            this.#moveToPosition.startX +
            ((this.#moveToPosition.targetX - this.#moveToPosition.startX) *
              timepassed) /
              timeTillDestination,
          y:
            this.#moveToPosition.startY +
            ((this.#moveToPosition.targetY - this.#moveToPosition.startY) *
              timepassed) /
              timeTillDestination,
        };

        this.setPosition(currentPosition.x, currentPosition.y);
        this.#moveToPosition.loopId = requestAnimationFrame(loop);
      }
    };

    loop();
    return this;
  };

  getMoveToPosition = (): movementInterface | null => {
    return this.#moveToPosition;
  };

  setStopMovement = () => {
    if (this.#moveToPosition !== null) {
      cancelAnimationFrame(this.#moveToPosition.loopId);
    }
    this.#moveToPosition = null;
    return this;
  };

  setMoveInDirection = (
    direction: number,
    distance: number,
    speed: number
  ): CanvasObject => {
    direction *= -1;
    direction += 90;
    direction *= Math.PI / 180;
    const pos = this.getPosition();
    pos.x = pos.x + Math.cos(direction) * distance;
    pos.y = pos.y + Math.sin(direction) * distance;
    this.setMoveToPosition(pos.x, pos.y, speed);
    return this;
  };

  setImage = (src: string): CanvasObject => {
    if (this.#imageAnimElement === null) {
      const imageElement = this.#document.createElement("img");
      imageElement.style.position = "relative";
      imageElement.style.left = "50%";
      // imageElement.style.top = "50%";
      imageElement.style.transform = "translateX(-50%)";

      this.#imageAnimElement = imageElement;
      this.#HTMLElement.appendChild(imageElement);
    }

    if (this.#imageAnimElement) {
      this.#imageAnimElement.src = src;
    }
    return this;
  };

  createChild = (id: string): CanvasObject => {
    // TODO: is not in the canvasEngine obj pool
    const childObj = new CanvasObject(
      id,
      this.#document,
      this.#canvasEngine,
      this.#HTMLElement,
      true,
      false
    );
    return childObj;
  };

  onMouseEnter = (
    func: (_this: CanvasObject, mousePosition: { x: number; y: number }) => void
  ): CanvasObject => {
    this.#HTMLElement.removeEventListener("mouseenter", () => null);
    this.#HTMLElement.addEventListener("mouseenter", (e) => {
      func(this, getMousePosition(this.#canvasEngine, this.#document, e));
    });
    return this;
  };

  onMouseLeave = (
    func: (_this: CanvasObject, mousePosition: { x: number; y: number }) => void
  ): CanvasObject => {
    this.#HTMLElement.removeEventListener("mouseleave", () => null);
    this.#HTMLElement.addEventListener("mouseleave", (e) => {
      func(this, getMousePosition(this.#canvasEngine, this.#document, e));
    });
    return this;
  };

  onMouseClickGlobal = (
    func: (_this: CanvasObject, mousePosition: { x: number; y: number }) => void
  ): CanvasObject => {
    this.#document.removeEventListener("mousedown", () => null);
    this.#document.addEventListener("mousedown", (e) => {
      func(this, getMousePosition(this.#canvasEngine, this.#document, e));
    });
    return this;
  };

  onMouseClickThis = (
    func: (_this: CanvasObject, mousePosition: { x: number; y: number }) => void
  ): CanvasObject => {
    this.#HTMLElement.removeEventListener("mousedown", () => null);
    this.#HTMLElement.addEventListener("mousedown", (e) => {
      func(this, getMousePosition(this.#canvasEngine, this.#document, e));
    });
    return this;
  };

  onMouseMove = (
    func: (_this: CanvasObject, mousePosition: { x: number; y: number }) => void
  ): CanvasObject => {
    this.#document.removeEventListener("mousemove", () => null);
    this.#document.addEventListener("mousemove", (e) => {
      func(this, getMousePosition(this.#canvasEngine, this.#document, e));
    });
    return this;
  };

  onKeyDown = (
    func: (_this: CanvasObject, key: string) => void
  ): CanvasObject => {
    this.#document.removeEventListener("keydown", () => null);
    this.#document.addEventListener("keydown", (e: KeyboardEvent) => {
      func(this, e.key);
    });
    return this;
  };

  onKeyUp = (
    func: (canvasObject: CanvasObject, key: string) => void
  ): CanvasObject => {
    this.#document.removeEventListener("keyup", () => null);
    this.#document.addEventListener("keyup", (e: KeyboardEvent) => {
      func(this, e.key);
    });
    return this;
  };

  onCollisionTrigger = (
    targetClass: string,
    func: (_this: CanvasObject, other: CanvasObject | null) => void
  ): CanvasObject => {
    this.#onCollisionTrigger[targetClass] = func;
    return this;
  };

  getCollisionTriggers = (): Record<
    string,
    (_this: CanvasObject, other: CanvasObject) => void
  > => {
    return this.#onCollisionTrigger;
  };

  setText = (str: string | number): CanvasObject => {
    if (this.#text === null) {
      this.#text = str;
    }
    this.#HTMLElement.innerText = `${str}`;
    return this;
  };

  getText = (): string | number | null => {
    return this.#text;
  };

  setVariable = (key: string, value: any): CanvasObject => {
    this.#variables[key] = value;
    return this;
  };

  getVariable = (key: string): any => {
    return this.#variables[key] ?? null;
  };

  createFunction = (
    functionName: string,
    func: (params?: any) => void
  ): CanvasObject => {
    this.#functions[functionName] = func;
    return this;
  };

  callFunction = (functionName: string, params?: any): CanvasObject => {
    const func: ((params?: any) => void) | null = this.#functions[functionName];
    if (!func) {
      return this;
    }
    func(params);
    return this;
  };

  addClass = (className: string): CanvasObject => {
    this.#HTMLElement.classList.add(className);
    return this;
  };

  getClasses = (): DOMTokenList => {
    return this.#HTMLElement.classList;
  };

  getId = (): string => {
    return this.#id;
  };

  destroy = (): void => {
    this.#containerElement.remove();
  };
}

interface CSSProperties extends csstypes.Properties<string | number> {}
export interface movementInterface {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  speed: number;
  movementType: "linear";
  timestamp: number;
  loopId: number;
}

export default CanvasObject;
