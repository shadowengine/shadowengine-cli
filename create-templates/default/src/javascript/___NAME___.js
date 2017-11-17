import {Game, Logger} from "shadowengine";

import {{{ NAME }}}Scene from "./Scenes/{{{ NAME }}}Scene";

export default class {{{ NAME }}} extends Game {

  GAME_NAME    = "{{{ FULL_NAME }}}";
  GAME_VERSION = "{{{ VERSION }}}";

  constructor(engine) {
    super(engine);
    Logger.info("{{{ NAME }}}", "hello from my game :)");

    this.getSceneHandler().switchScene({{{ NAME }}}Scene);
  }

}
