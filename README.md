# CanvasEngine

### Descriptions:
1. CanvasEngine bridges HTML5 and game development practices. It provides abstractions for working with HTML5
2. CanvasEngine is a library

### How to import into project
- npm: ```npx jsr add @web-dev-library/canvas-engine```
- deno: ```deno add @web-dev-library/canvas-engine```
- yarn: ```yarn dlx @web-dev-library/canvas-engine```
- pnpm: ```pnpm dlx @web-dev-library/canvas-engine```
- bun: ```bunx @web-dev-library/canvas-engine```

### How to use
##### example:
```ts
import CanvasEngine from "@web-dev-library/canvas-engine";

const canvasEngine = new CanvasEngine("canvas-id", document);
const player = canvasEngine
    .createObject("player")
    .setImage(
      "https://24.media.tumblr.com/17eb94e890c10a75830675b5e67400a6/tumblr_mnalbu08a01rfjowdo1_1280.gif"
    )
    .setStyle({
      width: `200px`,
    });
```
```html
<html>
    <body>
        <div id="canvas-id" style={{ width: "100vw", height: "100vh" }}></div>
    </body>
</html>
```