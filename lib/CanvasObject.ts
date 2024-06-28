import CanvasEngine from "./CanvasEngine";

class CanvasObject {
  #id;
  #HTMLElement;
  #containerElement;
  #document;
  #isCamera;
  #position = { x: 0, y: 0 };
  #variables: { [key: string]: any } = {};
  #imageAnimElement: HTMLImageElement | null = null;
  #canvasForCamera: HTMLElement | null = null;
  #canvasEngine: CanvasEngine;
  #onCollisionTrigger: Record<
    string,
    (_this: CanvasObject, other: CanvasObject | null) => void
  > = {};

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

  setStyle = (style: { [key: string]: any }): CanvasObject => {
    Object.keys(style).forEach((styleKey, i) => {
      const value = Object.values(style)[i] as any;

      this.#HTMLElement.style[styleKey] = value;
      if (styleKey === "zIndex") {
        this.#containerElement.style.zIndex = value;
      }
      if (
        styleKey.toLowerCase() === "position" &&
        value.toLowerCase() === "fixed"
      ) {
        this.#containerElement.style.position = value;
      }
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

          this.#onCollisionTrigger[key](
            this,
            this.#canvasEngine.getCanvasObject(otherId)
          );
        }
      }
    });

    return this;
  };

  getPosition = (): { x: number; y: number } => {
    return { ...this.#position };
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

  setVariable = (key: string, value: any): CanvasObject => {
    this.#variables[key] = value;
    return this;
  };

  getVariable = (key: string) => {
    return this.#variables[key] ?? null;
  };

  onMouseEnter = (func: (canvasObject: CanvasObject) => void): CanvasObject => {
    this.#HTMLElement.removeEventListener("mouseenter", null);
    this.#HTMLElement.addEventListener("mouseenter", (e) => {
      func(this);
    });
    return this;
  };

  onMouseLeave = (func: (canvasObject: CanvasObject) => void): CanvasObject => {
    this.#HTMLElement.removeEventListener("mouseleave", null);
    this.#HTMLElement.addEventListener("mouseleave", () => {
      func(this);
    });
    return this;
  };

  onMouseClickGlobal = (
    func: (canvasObject: CanvasObject) => void
  ): CanvasObject => {
    this.#document.removeEventListener("mousedown", null);
    this.#document.addEventListener("mousedown", () => {
      func(this);
    });
    return this;
  };

  onMouseClickThis = (
    func: (canvasObject: CanvasObject) => void
  ): CanvasObject => {
    this.#HTMLElement.removeEventListener("mousedown", null);
    this.#HTMLElement.addEventListener("mousedown", () => {
      func(this);
    });
    return this;
  };

  onKeyDown = (
    func: (canvasObject: CanvasObject, key: string) => void
  ): CanvasObject => {
    this.#document.removeEventListener("keydown", null);
    this.#document.addEventListener("keydown", (e) => {
      func(this, e.key);
    });
    return this;
  };

  onKeyUp = (
    func: (canvasObject: CanvasObject, key: string) => void
  ): CanvasObject => {
    this.#document.removeEventListener("keyup", null);
    this.#document.addEventListener("keyup", (e) => {
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

  getTriggers = () => {
    return this.#onCollisionTrigger;
  };

  addClass = (className: string): CanvasObject => {
    this.#HTMLElement.classList.add(className);
    return this;
  };

  getClasses = () => {
    return this.#HTMLElement.classList;
  };

  getId = () => {
    return this.#id;
  };

  destroy = () => {
    this.#containerElement.remove();
  };
}

export default CanvasObject;
