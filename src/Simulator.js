import React, { useState, useEffect } from "react";
import * as PIXI from "pixi.js";
import toLoad from "./load.json";

console.log(toLoad);
function importAll(r) {
  let images = {};
  r.keys().map((item, index) => {
    images[item.replace("./", "")] = r(item);
  });
  return images;
}

const images = importAll(require.context("./asset/BlackPart", false, /\.svg$/));

function Simulator() {
  const [app, setApp] = useState(undefined);

  useEffect(() => {
    setApp(pixiInitialize(app));
  });

  return (
    <div className="Simulator">
      <div id="main_stage"></div>
    </div>
  );
}

function pixiInitialize(check) {
  if (check === undefined) {
    const app = new PIXI.Application({ width: 1024, height: 1024 });
    document.getElementById("main_stage").appendChild(app.view);
    return app;
  } else return check;
}

function pixiLoader(app) {
  let sprites;
  const blackpart = toLoad["BlackPart"];

  blackpart.forEach((name) => {
    app.loader.add(name, images[name]);
  });

  app.loader.load((loader, resources) => {
    sprites = onAssetsLoaded();
  });

  app.loader.onComplete.add(() => {
    console.log(123);
    console.log(sprites, 123);
  });

  function onAssetsLoaded() {
    const Textures = {};
    const sprites = {};
    blackpart.forEach((name) => (Textures[name] = PIXI.Texture.from(name)));

    Object.keys(Textures).forEach((name) => {
      const newSprite = new PIXI.Sprite(Textures[name]);
      sprites[name] = newSprite;
    });
    console.log(sprites);
    return sprites;
  }

  return sprites;
}

function place_component(app, sprite, x = 0, y = 0) {
  sprite.x = x;
  sprite.y = y;
  app.stage.addChild(sprite);
}

export default Simulator;
