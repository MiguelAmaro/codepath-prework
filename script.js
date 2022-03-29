class sequence {
  //no sharps/flats
  static PitchToFreqTable = {
    "null": 0.0,
    "c3": 130.81,
    "d3": 146.83,
    "e3": 164.81,
    "f3": 174.61,
    "g3": 196.00,
    "a3": 220.00,
    "b3": 246.94,

    "c4": 261.63,
    "d4": 293.66,
    "e4": 329.63,
    "f4": 349.23,
    "g4": 392.00,
    "a4": 440.00,
    "b4": 293.88,

    "c5": 523.25,
    "d5": 587.33,
    "e5": 659.25,
    "f5": 698.46,
    "g5": 783.99,
    "a5": 880.00,
    "b5": 987.77,

    "c6": 1046.50,
    "d6": 1174.66,
    "e6": 1318.51,
    "f6": 1396.91,
    "g6": 1567.98,
    "a6": 1760.00,
    "b6": 1975.53,
  };

  BeatMs;
  Articulation; //Range [0.0, 1.0]
  Sheet;
  ButtonTable;
  OldButtonTable;
  IsPlaying;

  constructor(BeatMs, Articulation, Sheet, ButtonTable) {
    console.assert(0.0 <= Articulation && Articulation <= 1.0, "Articulation must be in range [0.0, 1.0]");
    this.IsPlaying = false;
    this.BeatMs = BeatMs;
    this.Articulation = Articulation;
    this.Sheet = Sheet;
    this.ButtonTable = ButtonTable;
    this.OldButtonTable = ButtonTable;
  }
}

const PROGRESS_START_INDEX = 1;
class gamestate {
  GamePlaying;
  GameWon;
  Progress;
  GuessCount;
  TimesWon;
  TimesLost;
  Squid;
  SquidPrompted;
  StatusElm;

  LastButton;
  LastButtonColor;
  ButtonCount;

  constructor() {
    this.GamePlaying = false;
    this.GameWon = false;
    this.Progress = 1;
    this.GuessCount = 0;
    this.TimesWon = 0;
    this.TimesLost = 0;
    this.Squid = false;
    this.SquidPrompted = false;
    this.LastButton = 0;
    this.StatusElm = null;
  }
}

class audiosynth {
  ContextType;
  Context;
  Oscillator;
  Gain;
  Volume;

  constructor() {
    this.ContextType = window.AudioContext || window.webkitAudioContext;
    this.Context = new AudioContext();
    this.Oscillator = this.Context.createOscillator();
    this.Gain = this.Context.createGain();
    this.Volume = 0.5;
  }

  Start() {
    //Audio Synth Initializaion
    this.Gain.connect(this.Context.destination);
    this.Gain.gain.setValueAtTime(0, this.Context.currentTime);
    this.Oscillator.connect(this.Gain);
    this.Oscillator.start(0);
  }
}

//App Components
var gGameState = new gamestate();
var gAudioSynth = new audiosynth();
var GameSequence = new sequence(800.0, 0.8,
  [
    ["e4", 1 / 4],
    ["b3", 1 / 4],
  ], [null, "b3", "e4", "c5", "c4", "b4", "f4"]);
var SquidSequence = new sequence((480.0 * 4.0), 0.8,
  [
    ["b3", 1 / 8],
    ["e4", 1 / 8],
    ["e4", 1 / 4],
    ["e4", 1 / 4],
    ["d4", 1 / 4],
    ["e4", 1 / 8],
    ["e4", 1 / 8],
    ["b3", 1 / 8],
    ["b3", 1 / 8],
    ["d4", 1 / 8],
  ], [null, "b3", "e4", "d4", "null", "null", "null"]);

/**************************************************
 *   !!!ENTRYPOINT!!!
 **************************************************/
function main() {
  console.log("Entering main() ...");
  GameInit(gGameState);
  OpenglMain();
  gAudioSynth.Start();
  return;
}


/**************************************************
 *   HELPERS
 **************************************************/
function Clamp(Value, Low, High, Margin) {
  console.assert(low < high, " Clamp High & Low parameters in wrong order");
  return (Value < Low) ? Low + Margin : (Value > High) ? High - Margin : Value;
}

function GetButtonColorString(Button) {
  var Result;
  var Button = document.getElementById("Button0" + Button);
  var ButtonStyle = window.getComputedStyle(Button);
  Result = ButtonStyle.getPropertyValue("background");
  return Result;
}

function GetButtonColorAsFloat3(Button) {
  var Result;
  var RegExtactRGB8 = new RegExp("[a-z]|[(]|[)]|[0-9]+[%]|[ ]", "g");
  var ButtonColor = GetButtonColorString(Button);
  var ColorRGB8 = ButtonColor.replace(RegExtactRGB8, "").split(",");
  Result = new Array(ColorRGB8[0] / 255.0,
    ColorRGB8[1] / 255.0,
    ColorRGB8[2] / 255.0);
  return Result;
}

/**************************************************
 *   GAME STUFF
 **************************************************/
function GamePatternGenerator(ButtonCount, TimesWon) {
  var InitialOffset = 7;
  var MaxPatternCount = 20;
  var PatternCount = InitialOffset + ((TimesWon) % (MaxPatternCount - InitialOffset));
  var NewPattern = [];
  for (var i = 0; i < PatternCount; i++) {
    //NOTE(): buttonscount is hard coded! wrong!
    var num = Math.floor(Math.random() * 100) % ButtonCount;
    var rnd = Clamp(num, 1, 6, 0.0);
    console.assert(rnd > 0 && rnd < PatternCount, " Pattern Generator produced invalid number");
    NewPattern.push(rnd);
  }

  return NewPattern;
}

function GameStartRound(GameState, Audio) {
  console.assert(GameState != undefined && Audio != undefined,
    " Game or Audio state missing");

  //NOTE(): Should button generation be dependent on a sequence length?
  //        Sequeence can genereate an arbitrary set of notes which need
  //        their respective buttons. Also squid round only requires 3 buttons.
  //        sequences have all the data to create and remove buttons easily...
  //
  if (GameState.Squid) {
    GameDisplayStatus(GameState, "Squid Round!!!", false);
    GameState.GamePlaying = true;
    GameState.GameWon = false;
    GameState.Progress = SquidSequence.Sheet.length;
    GameState.GuessCount = 0;
    //GameState.TimesLost = 0;
    //GameState.SquidPrompted = false
    GameState.LastButton = 0;

    document.getElementById("startButton").classList.add("hidden");
    document.getElementById("stopButton").classList.remove("hidden");

    GameSequence.IsPlaying = false;
    SequencePlay(SquidSequence, Audio, GameState.Progress);
  }
  else {
    GameDisplayStatus(GameState, "New Round!!!", false);
    GameState.GamePlaying = true;
    GameState.GameWon = false;
    GameState.Progress = PROGRESS_START_INDEX;
    GameState.GuessCount = 0;
    GameState.TimesLost = 0;
    GameState.Squid = false;
    GameState.SquidPrompted = false
    GameState.LastButton = 0;

    document.getElementById("startButton").classList.add("hidden");
    document.getElementById("stopButton").classList.remove("hidden");

    GameSequence.IsPlaying = false;
    SequencePlay(GameSequence, Audio, GameState.Progress);
  }

  return;
}

function GameInit(GameState) {
  console.assert(GameState != undefined, " Game state missing");
  GameState.ButtonCount = document.getElementById("gameButtonArea").childElementCount;
  GameState.StatusElm = document.getElementById("gameStatus");
  //This is called from main after site resources are loaeded.

  return;
}

function GameEnd(GameState) {


  document.getElementById("startButton").classList.remove("hidden");
  document.getElementById("stopButton").classList.add("hidden");

  GameState.Squid = false;
  GameState.GamePlaying = false;

  //TODO(): Make this generic!!!
  SquidSequence.ButtonTable = SquidSequence.OldButtonTable;
  var Button1 = document.getElementById("Button01");
  var Button2 = document.getElementById("Button02");
  var Button3 = document.getElementById("Button03");
  Button1.style.background = "";
  Button2.style.background = "";
  Button3.style.background = "";
  return;
}

function GamePromptYesNo(GameState, Question) {
  //very squid specific function...
  console.assert(GameState.StatusElm != undefined, "There is no handle to StatusElm");
  GameDisplayStatus(GameState, Question, false);
  var YesButton = document.createElement("button");
  var NoButton = document.createElement("button");
  YesButton.setAttribute("id", "SYB");
  NoButton.setAttribute("id", "SNB");
  YesButton.innerHTML = "Accept";
  NoButton.innerHTML = "Decline";
  YesButton.onclick = function () {
    gGameState.Squid = true;
    GameUpdate(gGameState, gAudioSynth, 0);
    gGameState.SquidPrompted = false;
    gGameState.StatusElm.removeChild(document.getElementById("SYB"));
    gGameState.StatusElm.removeChild(document.getElementById("SNB"));
    GameDisplayStatus(gGameState, "", true);
  };
  NoButton.onclick = function () {
    gGameState.Squid = false;
    GameUpdate(gGameState, gAudioSynth, 0);
    gGameState.SquidPrompted = false;
    gGameState.StatusElm.removeChild(document.getElementById("SYB"));
    gGameState.StatusElm.removeChild(document.getElementById("SNB"));
    GameDisplayStatus(gGameState, "", true);
  }
  GameState.StatusElm.appendChild(YesButton);
  GameState.StatusElm.appendChild(NoButton);
  console.assert(GameState.StatusElm.childElementCount <= 3, "There are too many children in gameStatus! Expected 3.")
  return;
}

function GameDisplayResult(GameState) {
  if (GameState.Squid) {
    if (GameState.SquidWon) {
      GameDisplayTempStatus(GameState, 2000, "you win the monies! jk no moniess :(", true, "");
    }
    else {
      GameDisplayTempStatus(GameState, 2000, "you lose you life. jk", true, "");
    }
  }
  else {
    if (GameState.GameWon) {
      GameDisplayTempStatus(GameState, 2000, "Game Over. You Won!.", true, "");
    }
    else {
      GameDisplayTempStatus(GameState, 2000, "Game Over. You lost.", true, "");
    }
  }
  return;
}

function GameDisplayStatus(GameState, Status, Hide) {
  var StatusElm = GameState.StatusElm;
  console.assert(GameState.StatusElm != undefined,
    "There is no handle to StatusElm");

  console.assert(Status != undefined, "Status undefined. How to handle this?")
  if (Hide) {
    StatusElm.classList.add("hidden");
    return;
  }

  var Header;
  if (StatusElm.childElementCount == 0) {
    Header = document.createElement("h1");
    StatusElm.appendChild(Header);
  }
  else {
    Header = StatusElm.firstChild;
    console.assert(Header.tagName == "H1", "First child of gameStatus is not a header.");
  }

  Header.innerHTML = Status;

  StatusElm.classList.remove("hidden");
  return;
}

function GameDisplayTempStatus(GameState, HoldMs, TempStatus, HideAtTimeout, RestoreStatus) {
  var StatusElm = GameState.StatusElm;
  console.assert(GameState.StatusElm != undefined,
    "There is no handle to StatusElm");

  //document.getElementById("startButton").classList.add("hidden");
  var Header;
  if (StatusElm.childElementCount == 0) {
    Header = document.createElement("h1");
    StatusElm.appendChild(Header);
  }
  else {
    Header = StatusElm.firstChild;
    console.assert(Header.tagName == "H1", "First child of gameStatus is not a header.");
  }
  //Its okay for this to be undefined
  if (RestoreStatus == undefined) {
    RestoreStatus = Header.innerHTML;
  }
  //NOTE(): If "hidden" doesnt exist is it a problem.
  Header.innerHTML = TempStatus;
  StatusElm.classList.remove("hidden");

  setTimeout(GameDisplayStatus, HoldMs, GameState, RestoreStatus, HideAtTimeout);

}

function GameUpdate(GameState, Audio, Button) {
  console.assert(GameState != undefined && Audio != undefined, " Game or Audio state missing");
  var Sequence = GameState.Squid ? SquidSequence : GameSequence;

  if (Sequence.IsPlaying) {
    GameDisplayTempStatus(GameState, 1200,
      "Wait... Listen to the clues!");
    return;
  }

  if (GameState.GamePlaying) {
    if (GameIsGuessCorrect(GameState, Sequence, Button)) {
      if (GameIsRoundOver(GameState, Sequence, GameState.Progress)) {
        if (GameIsFinish(GameState, Sequence)) {
          if (GameState.Squid) {
            GameState.SquidWon = true;
          }
          else {
            GameState.GameWon = true;
            GameState.TimesWon++;
          }
          GameState.GamePlaying = false;
        }
        else {
          GameState.Progress++;
          GameState.GuessCount = 0;
          //NOTE(): careful with squid length
          SequencePlay(Sequence, Audio, GameState.Progress);
        }
      } else {
        GameState.GuessCount++;
        if (GameState.Squid) {
          SequenceButtonRotate(SquidSequence);
        }
      }
    } else {
      if (GameState.Squid || GameState.TimesLost == 3) {
        GameState.GameWon = false;
        GameState.GamePlaying = false;
        GameDisplayResult(GameState);
        GameEnd(GameState);
      }
      else {
        console.assert(!GameState.Squid, "GameState Squid State set in an invalid code path.");

        GameState.GuessCount = 0;
        GameState.TimesLost++;
        GameDisplayStatus(GameState,
          "Try it again from the begining! " +
          "You still have " +
          (3 - GameState.TimesLost) +
          " more tries!!!");
      }
    }
  }
  if (!GameState.GamePlaying) {
    if (GameState.GameWon &&
      !GameState.Squid &&
      !GameState.SquidPrompted) {
      GamePromptYesNo(GameState,
        "Would you like to win all the moniesss but " +
        "suffer a horrible fate if you loose? ");

      //NOTE(): Will this always be set to true before the user replies?
      GameState.SquidPrompted = true;
      return;
    }
    if (GameState.Squid && GameState.GameWon) {
      //Start Squid Round
      GameStartRound(GameState, Audio);
    }
    else if (GameState.Squid && GameState.SquidWon) {
      //End: Won Squid Game
      GameDisplayResult(GameState);
      GameEnd(GameState);
      GameState.TimesWon++;
    }
    else {
      //End: Lost Normal Game
      GameDisplayResult(GameState);
      GameEnd(GameState);
      GameState.TimesWon++;
    }

  }
  return;
}

function GameIsGuessCorrect(GameState, Sequence, Button) {
  var GuessCount = GameState.GuessCount;
  console.assert(0 < Button && Button < GameState.ButtonCount,
    " Invalid button number. Must be greater than 0 & less than button count");
  var ButtonPitch = Sequence.ButtonTable[Button];
  var SheetPitch = Sequence.Sheet[GuessCount][0];

  var Result = ButtonPitch == SheetPitch;
  return Result;
}

function GameIsRoundOver(GameState, Sequence, EndCount) {
  var GuessCount = GameState.GuessCount;
  var Result = 0;

  if (EndCount == undefined) {
    Result = GuessCount == (Sequence.Sheet.length - 1)
  }
  else {
    //NOTE: EndCount is typically Gamestate.Progress which starts
    //      at 1 therefore will be equal to sheet length for last
    //      tone.
    console.assert(EndCount <= Sequence.Sheet.length,
      "Guess count out of bounds");
    Result = !(GuessCount < (EndCount - 1));
  }

  return Result;
}

function GameIsFinish(GameState, Sequence) {
  //NOTE(): GameStaet.Progress starts at 1 so (sheet.len-1) 
  //        will exlude last tone of the sequence.
  var Result = GameState.Progress == Sequence.Sheet.length;
  return Result;
}


/**************************************************
 *   STYLING CONTROL
 **************************************************/
//NOTE(): calling funcitons should validate button
function LightButton(Button) {
  document.getElementById("Button0" + Button).classList.add("lit");
  return
}

function ClearButton(Button) {
  document.getElementById("Button0" + Button).classList.remove("lit");
  return;
}


/**************************************************
 *   HTML - JS INTERFACE
 **************************************************/
function SoundButtonClickHandler(Button) {
  var GameState = gGameState;
  console.assert(0 < Button && Button <= GameState.ButtonCount,
    " Invalid button number. Must be greater than 0 & less than button count");
  if (GameState.GamePlaying) {
    GameUpdate(GameState, gAudioSynth, Button);
  }
  return;
}



function SoundButtonPressHandler(Button) {
  var GameState = gGameState;
  console.assert(0 < Button && Button <= GameState.ButtonCount,
    " Invalid button number. Must be greater than 0 & less than button count");
  GameState.LastButton = Button;
  GameState.LastButtonColor = GetButtonColorAsFloat3(Button);

  var Sequence = GameState.Squid ? SquidSequence : GameSequence;
  if (!Sequence.GamePlaying) {
    var Pitch = Sequence.ButtonTable[Button];

    var Freq = sequence.PitchToFreqTable[Pitch];
    console.assert(Freq != undefined,
      " Invalid lookup into PitchToFreqTable[]");
    AudioPlayTone(gAudioSynth, Freq);
  }

  return;
}

function SoundButtonReleaseHandler() {
  AudioPauseTone(gAudioSynth);
  return;
}

function StartButtonHandler() {
  console.assert(!gGameState.GamePlaying, "Start button handler called in an invalid state.")
  GameStartRound(gGameState, gAudioSynth);
  return;
}

function StopButtonHandler() {
  GameEnd(gGameState);
  return;
}



/**************************************************
 *   AUDIO
 **************************************************/
function AudioPlayTone(Audio, Freq) {
  Audio.Context.resume();
  Audio.Oscillator.frequency.value = Freq;
  Audio.Gain.gain.setTargetAtTime(Audio.Volume, Audio.Context.currentTime + 0.05, 0.025);
  Audio.Context.resume();

  return;
}

function AudioPauseTone(Audio, Callback) {
  Audio.Gain.gain.setTargetAtTime(0, Audio.Context.currentTime + 0.05, 0.025);
  if (Callback != undefined) {
    Callback(arguments[2], arguments[3], arguments[4]);
  }
  return;
}



/**************************************************
 *   SEQUENCING
 **************************************************/
//Pitch: is a letter coressponding to a frequency
//Duration: is a ratio of time that can be used to calc the time(ms) that a pitch is held
function SequenceBegin(Sequence, Audio, Index, NoteCount, Pitch, HoldMs, Button) {
  console.assert(Audio != undefined, "Audio state missing");

  var Freq = sequence.PitchToFreqTable[Pitch];
  LightButton(Button);

  Audio.Oscillator.frequency.value = Freq;
  Audio.Gain.gain.setTargetAtTime(Audio.Volume, Audio.Context.currentTime + 0.05, 0.025);
  Audio.Context.resume();

  setTimeout(AudioPauseTone, HoldMs,
    Audio,
    NotifySequenceEnd,
    Sequence,
    Index,
    NoteCount);
  setTimeout(ClearButton, HoldMs, Button);
  return;
}

function NotifySequenceEnd(Sequence, Index, NoteCount) {
  if (Index == (NoteCount - 1)) {
    Sequence.IsPlaying = false;
  }

  return;
}

function SequencePlay(Sequence, Audio, NoteCount) {
  console.assert(Audio != undefined, "Audio state missing");

  Audio.Context.resume()

  var Delay = 500.0; //Padding in Ms Between Sequence & Last Guess
  for (let Index = 0; Index < NoteCount; Index++) {
    var Pitch = Sequence.Sheet[Index][0];
    var Duration = Sequence.Sheet[Index][1];
    var HoldMs = Sequence.BeatMs * Duration * Sequence.Articulation;
    var ReleaseMs = Sequence.BeatMs * Duration * (1.0 - Sequence.Articulation);
    var Button = SequenceButtonFromPitch(Sequence, Pitch);

    setTimeout(SequenceBegin, Delay,
      Sequence,
      Audio,
      Index,
      NoteCount,
      Pitch,
      HoldMs,
      Button);

    Delay += ReleaseMs;
    Delay += HoldMs;
  }
  Sequence.IsPlaying = true;
  return;
}

function SequenceButtonFromPitch(Sequence, Pitch) {
  console.assert(Sequence != undefined,
    " Sequence missing");
  var Result = 0;
  for (var i = 0; i < Sequence.ButtonTable.length; i++) {
    if (Sequence.ButtonTable[i] == Pitch) { Result = i; break; }
  }
  return Result;
}

function SequenceButtonRotate(Sequence) {
  //Get style from load style sheet
  var Button1 = document.getElementById("Button01");
  var Button2 = document.getElementById("Button02");
  var Button3 = document.getElementById("Button03");
  var Button1Style = window.getComputedStyle(Button1);
  var Button2Style = window.getComputedStyle(Button2);
  var Button3Style = window.getComputedStyle(Button3);
  var Button1Color = Button1Style.getPropertyValue("background");
  var Button2Color = Button2Style.getPropertyValue("background");
  var Button3Color = Button3Style.getPropertyValue("background");

  var rnd = Math.floor(Math.random() * 1000) % 3;
  //TODO(): add support for arbitrary number of a button swaps.
  switch (rnd) {
    case 0:
      {
        Button1.style.background = Button2Color;
        Button2.style.background = Button1Color;
        var tmp = Sequence.ButtonTable[1];
        Sequence.ButtonTable[1] = Sequence.ButtonTable[2];
        Sequence.ButtonTable[2] = tmp;
      } break;
    case 1:
      {
        Button2.style.background = Button3Color;
        Button3.style.background = Button2Color;
        var tmp = Sequence.ButtonTable[2];
        Sequence.ButtonTable[2] = Sequence.ButtonTable[3];
        Sequence.ButtonTable[3] = tmp;
      } break;
    case 2:
      {
        Button1.style.background = Button3Color;
        Button3.style.background = Button1Color;
        var tmp = Sequence.ButtonTable[1];
        Sequence.ButtonTable[1] = Sequence.ButtonTable[3];
        Sequence.ButtonTable[3] = tmp;
      } break;
  }
}



/**************************************************
 *   WEB OPENGL
 **************************************************/
"use strict";

function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) return program;

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}

function createShader(gl, type, source) {
  var shader = gl.createShader(type);

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) return shader;

  console.log(source);
  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}

function OpenglMain() {
  const canvas = document.querySelector("#glCanvas");
  const gl = canvas.getContext("webgl");

  if (gl == null) {
    alert("Unnable to init WebGL.");
    return;
  }

  var vertexShaderSource =
    `
    attribute vec4 a_position;

    void main()
    {
        gl_Position = a_position;
    }
    `;

  var fragmentShaderSource =
    `
    precision mediump float;

    uniform float u_time;
    uniform vec2  u_resolution;
    uniform int  u_squid;
    uniform int  u_button;
    uniform vec3 u_buttoncolor;

    #define PI32 3.141592653589793238462

    vec2 GetNormal(float angle)
    {
        return vec2(sin(angle), cos(angle));
    }
    
    float Grid(vec2 gv)
    {
        float Result = 0.0;
        if(gv.x > .48  || gv.y > .48)
        { Result = 1.0; }
        return Result;
    }
   
    float Grid2(vec2 uv, float LineWidth, float Granularity)
    {
      vec2 Result = smoothstep(0.0, 0.00002, Granularity - fract(uv * LineWidth));
      return Result.x * Result.y - 0.1;
    }


    float Hash(vec2 In)
    {
        float Result;
        In  = fract(In * vec2(235.34, 434.345));
        In += dot(In, In + 34.23*u_time*0.0000001);
        Result = fract(In.x * In.y);
        return Result;
    }

    float GetLineDirection(vec2 CellId)
    {
        float Result = 1.0;
        if(Hash(CellId) < 0.5) Result = -1.0;
        return Result;
    }

    mat2 Shear(float X, float Y)
    {
        return mat2(1.0,   X,
                    Y  , 1.0);
    }

    mat2 Rotate(float x)
    {
      return mat2(cos(x), -sin(x),
                  sin(x),  cos(x));
    }

    float Circle(vec2 uv, float Radius)
    {
      vec2 Dist = uv-vec2(0.5,0.5);
      return 1.0-smoothstep(Radius+(Radius*-0.310),
                           Radius-(Radius*-1.390),
                           dot(Dist,Dist)*4.0);
    }

    float Triangle(vec2 uv)
    {
      float Result = 0.0;
      uv.y += 0.2;
      vec2 normal = vec2(0.0);
      uv *= 1.5;
      uv.x = abs(uv.x);
      uv.x -= 0.5;
      normal = GetNormal(13.0*PI32/6.0);
      uv -= normal * max(0.0, dot(uv, normal)) * 2.0;
      
      //Result += Grid2(uv, 0.001, 1.0); //For Debbugging
      float Line = length(uv - vec2(clamp(uv.x, -1.3, 1.0), 0.0));
      Line = min(1.0, Line); //NOTE(): Original line
      Line = smoothstep(0.01, 0.0099, 0.15*Line);
      Result += Line;
      return Result;
    }

    vec3 Circle(float OutDia, float InDia, vec2 uv, vec3 Color)
    {
      uv.y -= 0.1;
      float Delta = distance(uv, vec2(0.0));
      return vec3(step(InDia ,  Delta) *
                  step(-OutDia, -Delta) + Color.x,
                  step(InDia ,  Delta) *
                  step(-OutDia, -Delta) + Color.y,
                  step(InDia ,  Delta) *
                  step(OutDia, -Delta) + Color.z);
    }


    float Square(vec2 uv)
    {
      float Result = 0.0;
      #if 1
      uv.y -= 0.11;
      uv = abs(uv);

      float BS = 0.028;
      float SS = 0.038;
      float BigSquare = smoothstep(0.01, 0.0099, uv.x*BS) * smoothstep(0.01, 0.0099, uv.y*BS);
      float SmallSquare = smoothstep(0.01, 0.0099, uv.x*SS) * smoothstep(0.01, 0.0099, uv.y*SS);
      float Intersection = BigSquare - SmallSquare;
      Result =  Intersection;
      #else
      ///probably one of the worsts ways to make a square...
      vec2 st = uv;
      vec2 normal = vec2(0.0);

      uv.y += 0.33;
      uv *= 1.5;
      
      uv.x = abs(uv.x);
      uv.x -= 0.5;
      normal = GetNormal(PI32/4.0);
      uv -= normal * max(0.0, dot(uv, normal)) * 2.0;
      normal = GetNormal(PI32/50.0);
      
      
      float Line = length(uv - vec2(clamp(uv.x, -1.3, 1.0), 0.0));
      Line = min(1.0, Line); //NOTE(): Original line
      Line = smoothstep(0.01, 0.0099, 0.15*Line);
      Result += Line;
      
      normal = vec2(0.0);
      uv.y = abs(uv.y);
      uv = st;
      uv.y -= 0.33;
      uv *= 1.5;
      
      uv.x = abs(uv.x);
      uv.x -= 0.5;
      normal = GetNormal(3.0*PI32/4.0);
      uv -= normal * max(0.0, dot(uv, normal)) * 2.0;
      Line = length(uv - vec2(clamp(uv.x, -1.3, 1.0), 0.0));
      Line = min(1.0, Line); //NOTE(): Original line
      Line = smoothstep(0.01, 0.0099, 0.15*Line);
      Result += Line;
      Result += 1.0-Grid2(uv, 0.01, 1.0);
      #endif
      return Result;
    }

    void main()
    {
      //TODO(): Clean all of this stuff up...
      vec2 uv  = (gl_FragCoord.xy-0.5*u_resolution.xy)/u_resolution.y;
      vec3 Color = vec3(0.1, 0.1, 0.1);
  
      if(u_button > 0)
      {
        Color = u_buttoncolor-0.1;
      }
 

      if(u_squid == 0)
      {
       
        float Foward = 0.130+ sin(u_time*0.00001)*2.0;
        uv *= 1.0/Foward;
        uv*= Rotate(u_time*0.00008);
        //TODO(): Study this effect on uv space v
        //uv = vec2(2.0*atan(uv.x, uv.y), 0.002*length(uv*uv));
        
        //uv += u_time*0.0002;
        //TODO(): Understand why Shear(sin(t),0.0) makes the seem like its
        //        translating the uv space.
        uv *= 1.0/length(uv*uv);
        uv *= Shear(0.0, 0.0);
        vec2 gv = fract(uv)-0.5;
        vec2 CellId = floor(uv);
        
        gv.x *= GetLineDirection(CellId);
        float Width = 0.15;    
        
        //TODO(): Understand the abs(abs()) thing to to get the 2 lines in
        //        in each cell. Also how does gv.x+gv.y affect the uv space?
        //float Dist = abs(abs(gv.x+gv.y)-0.5);
        float Dist = length(gv-sign(gv.x+gv.y+0.001)*0.5)-0.5;
        //NOTE(): Why does changing the sign of the edge1 and edge2
        //        invert the result of smoothstep???
        float Mask = smoothstep(0.01, -0.01, abs(Dist) - Width);
        
        //TODO(): Keep the pattern as is but make a clear seperation betweeen
        //        the grid Colorors and the truchet line. less jank
        Color.r += Grid(gv)*Grid(gv);
        //Color -= Hash(CellId);
        Color += Hash(-CellId) + Mask * 0.003;
        Color += Mask;

        Color-= 0.6 + Circle(uv, 100.0);
      }
      else
      {    
        Color -= 0.3;

        float Shape = 0.0;

        float Where = mod(float(u_button), 3.0);
        if(Where == 1.0)
        {
          Shape = Square(uv);
        }
        else if(Where == 2.0)
        {
          Shape = Circle(0.35, 0.25, uv, vec3(0.1, 1.0, 1.0)).x;
        }
        else
        {
          Shape = Triangle(uv);
        }
        Color += Shape;
      }
      
      gl_FragColor=vec4(Color, 1.0);
    }
    `;

  var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  var program = createProgram(gl, vertexShader, fragmentShader);



  var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

  var UIdTime = gl.getUniformLocation(program, "u_time");
  var UIdResolution = gl.getUniformLocation(program, "u_resolution");
  var UIdSquid = gl.getUniformLocation(program, "u_squid");
  var UIdButton = gl.getUniformLocation(program, "u_button");
  var UIdButtonColor = gl.getUniformLocation(program, "u_buttoncolor");

  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  var positions =
    [
      -10.0 - 5.0, 10.0,
      10.0 - 5.0, 10.0,
      10.0 - 5.0, -10.0,
    ];

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  drawScene();

  function drawScene(now) {
    //const canvas = document.querySelector("#glCanvas");
    var NewWidth = gl.canvas.clientWidth;
    var NewHeight = gl.canvas.clientHeight;

    if (gl.canvas.width !== NewWidth ||
      gl.canvas.height !== NewHeight) {
      gl.canvas.width = NewWidth;
      gl.canvas.height = NewHeight;
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    }

    var resolution = [canvas.width, canvas.height];

    now *= 1.0;

    gl.clearColor(1.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);


    gl.useProgram(program);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    Uint32Array
    var size = 2;
    var type = gl.FLOAT;
    var normalize = false;
    var stride = 0;
    var offset = 0;
    gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

    gl.uniform1f(UIdTime, now);
    gl.uniform1i(UIdSquid, gGameState.Squid);
    gl.uniform1i(UIdButton, gGameState.LastButton);
    gl.uniform3fv(UIdButtonColor, new Float32Array(gGameState.LastButtonColor));
    gl.uniform2fv(UIdResolution, new Float32Array(resolution));
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 3;

    gl.drawArrays(primitiveType, offset, count);

    requestAnimationFrame(drawScene);
  }

}

window.onload = main;