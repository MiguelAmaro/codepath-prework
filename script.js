class sequence {
  //no sharps/flats
  static PitchToFreqTable = {
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
  IsPlaying;

  constructor(BeatMs, Articulation, Sheet, ButtonTable) {
    console.assert(0.0 <= Articulation && Articulation <= 1.0, "Articulation must be in range [0.0, 1.0]")
    this.IsPlaying = false;
    this.BeatMs = BeatMs;
    this.Articulation = Articulation;
    this.Sheet = Sheet;
    this.ButtonTable = ButtonTable;
  }
}

class gamestate {
  GamePlaying;
  Progress;
  GuessCount;
  TimesWon;
  TimesLost;
  Squid;
  SquidPrompted;
  StatusElm;

  LastButton;
  ButtonCount;

  constructor() {
    this.GamePlaying = false;
    this.Progress = 1;
    this.GuessCount = 0;
    this.TimesWon = 0;
    this.TimesLost = 0;
    this.Squid = false;
    this.SquidPrompted = false;
    this.LastButton = 0;
    this.StatusElm = null;
  }

  Restart() {
    this.GamePlaying = true;
    this.Progress = 1;
    this.GuessCount = 0;
    this.TimesLost = 0;
    this.Squid = false;
    this.SquidPrompted = false
    this.LastButton = 0;
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
    ["b4", 1 / 4],
    ["e4", 1 / 4],
    ["c5", 1 / 4],
    ["b4", 1 / 4],
    ["f4", 1 / 4],
    ["c5", 1 / 4],
  ], [null, "b3", "e4", "c5", "c4", "b4", "f4"]);
var SquidSequence = new sequence((480.0 * 4.0), 0.8,
  [
    ["b3", 1 / 8],
    ["e4", 1 / 8],
    ["e4", 1 / 4],
    ["e4", 1 / 8],
    ["d4", 1 / 4],
    ["e4", 1 / 8],
    ["e4", 1 / 8],
    ["b3", 1 / 8],
    ["b3", 1 / 8],
    ["d4", 1 / 8],
  ], [null, "b3", "e4", "d4"]);

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


/**************************************************
 *   SQUID STUFF
 **************************************************/
function SquidButtonRotate() {
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
        var tmp = squidButtonTable[1];
        squidButtonTable[1] = squidButtonTable[2];
        squidButtonTable[2] = tmp;
      } break;
    case 1:
      {
        Button2.style.background = Button3Color;
        Button3.style.background = Button2Color;
        var tmp = squidButtonTable[2];
        squidButtonTable[2] = squidButtonTable[3];
        squidButtonTable[3] = tmp;
      } break;
    case 2:
      {
        Button1.style.background = Button3Color;
        Button3.style.background = Button1Color;
        var tmp = squidButtonTable[1];
        squidButtonTable[1] = squidButtonTable[3];
        squidButtonTable[3] = tmp;
      } break;
  }
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

  GameDisplayStatus(GameState, "New Round!!!");
  GameState.Restart();

  document.getElementById("startButton").classList.add("hidden");
  document.getElementById("stopButton").classList.remove("hidden");

  //TODO(): Writer a sheet music generator
  //GamePatternGenerator(GameState.ButtonCount, GameState.TimesWon);
  /*
  
  var BaseFreq = Clamp(200 + (Math.random() * 100.0), 200.0, 300.0, 0.0);
  var FreqSpaceing = 120.0;
  //TODO(): use frequencies of actual notes from a file of table or smthing
  for (var i = 1; i <= ButtonCount; i++) {
    var NewFreq = BaseFreq + (FreqSpaceing * i);
    freq[i] = NewFreq;
  }

  for (var i = 1; i <= ButtonCount; i++) {
    //random freq swapping
    var RndIndex = Clamp(Math.floor(Math.random() * 1000.0) % ButtonCount, 1, ButtonCount - 1, 0.0);
    var Temp = freq[RndIndex];
    freq[RndIndex] = freq[i];
    freq[i] = Temp;
  }
  */
  GameSequence.IsPlaying = false;
  SequencePlay(GameSequence, Audio, GameState.Progress);
}

function GameInit(GameState) {
  console.assert(GameState != undefined, " Game state missing");
  GameState.ButtonCount = document.getElementById("gameButtonArea").childElementCount;
  GameState.StatusElm = document.getElementById("gameStatus");
  //This is called from main after site resources are loaeded.

  return;
}

function GameEnd(GameState) {
  console.assert(GameState != undefined, "pass the state you animal");
  
  document.getElementById("startButton").classList.remove("hidden");
  document.getElementById("stopButton").classList.add("hidden");

  GameState.Squid = false;
  GameState.GamePlaying = false;

  SquidSequence.ButtonTable[1] = "b";
  SquidSequence.ButtonTable[2] = "e";
  SquidSequence.ButtonTable[3] = "d";
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
  GameDisplayStatus(GameState, Question);
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
    gGameState.StatusElm.classList.add("hidden");
    GameDisplayStatus(gGameState, "");
  };
  NoButton.onclick = function () {
    gGameState.Squid = false;
    GameUpdate(gGameState, gAudioSynth, 0); 
    gGameState.SquidPrompted = false;
    gGameState.StatusElm.removeChild(document.getElementById("SYB"));
    gGameState.StatusElm.removeChild(document.getElementById("SNB"));
    gGameState.StatusElm.classList.add("hidden");
    GameDisplayStatus(gGameState, "");
  }
  GameState.StatusElm.appendChild(YesButton);
  GameState.StatusElm.appendChild(NoButton);
  return;
}

function GameDisplayResult(GameState, Win) {
  if (Win == true && GameState.Squid == false) {
    GameDisplayTempStatus(GameState, 6000, "Game Over. You Won!.");
  }
  else if (Win == true && GameState.Squid == true) {
    GameDisplayTempStatus(GameState, 6000, "you win the monies!");
  }
  else {
    GameDisplayTempStatus(GameState, 6000, "Game Over. You lost.");
  }
}

function GameDisplayStatus(GameState, Status) {
  var StatusElm = GameState.StatusElm;
  console.assert(GameState.StatusElm != undefined,
    "There is no handle to StatusElm");

  if (Status == undefined) {
    StatusElm.classList.add("hidden");
    return;
  }
  var Para;
  if (StatusElm.childElementCount == 0) {
    Para = document.createElement("h1");
    StatusElm.appendChild(Para);
  }
  else {
    Para = StatusElm.firstChild;
  }

  Para.innerHTML = Status;

  StatusElm.classList.remove("hidden");
  return;
}

function GameDisplayTempStatus(GameState, HoldMs, Status) {
  var StatusElm = GameState.StatusElm;
  console.assert(GameState.StatusElm != undefined,
    "There is no handle to StatusElm");

  //document.getElementById("startButton").classList.add("hidden");
  var Para;
  if (StatusElm.childElementCount == 0) {
    Para = document.createElement("h1");
    StatusElm.appendChild(Para);
  }
  else {
    Para = StatusElm.firstChild;
  }

  var OldStatus = Para.innerHTML;
  Para.innerHTML = Status;

  setTimeout(GameDisplayStatus, HoldMs, GameState, OldStatus);

}

function GameUpdate(GameState, Audio, Button) {
  console.assert(GameState != undefined && Audio != undefined, " Game or Audio state missing");
  console.assert(Button > 0, "invalid button number used");
  if (!GameState.GamePlaying) {
    return;
  }
  
  var Sequence = GameState.Squid?SquidSequence:GameSequence;
  //TODO():Disable buttons on squence play
  if (Sequence.IsPlaying == true) {
    GameDisplayTempStatus(GameState, 1200,
      "Wait... Listen to the clues!");
    return;
  }
  var Win;
  if (GameIsGuessCorrect(GameState, Sequence, Button)) {
    if (GameIsRoundOver(GameState, Sequence, GameState.Progress)) {
      if (GameState.Progress == Sequence.Sheet.length - 1) {
        Win = true;
      }
      else {
        GameState.Progress++;
        GameState.GuessCount = 0;
        if (GameState.GamePlaying == true) {
          SequencePlay(Sequence, Audio, GameState.Progress);
        }
      }
    } else {
      GameState.GuessCount++;
      setInterval(function ()
      {
        
      }, 1000);
      if (GameState.Squid) {
        SquidButtonRotate();
      }
    }
  } else {
    if (GameState.TimesLost == 3) {
      Win = false;
      GameDisplayResult(GameState, Win);
      GameEnd(GameState);
    }
    else {
      GameState.GuessCount = 0;
      GameState.TimesLost++;
      GameDisplayStatus(GameState,
        "Try it again! You still have " +
        (3 - GameState.TimesLost) +
        " more tries!!!");
    }
  }
  if(Win)
  {
    if(!GameState.Squid && GameState.SquidPrompted == false) {
      GamePromptYesNo(GameState,
      "Would you like to go another round and earn more " +
      "money than you can spend in your lifetime at the risk " +
      "of loosing all your hard work up to this moment? " +
      "type to accept");

    GameState.SquidPrompted = true;
    return;
    }
    if (GameState.Squid) {
      GameDisplayStatus(GameState, "Squid Game");
      SequencePlay(Sequence, Audio, GameState);
    }
    else {
      GameDisplayResult(GameState, Win);
      GameEnd(GameState);
      GameState.TimesWon++;
    }
  }
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
    console.assert(EndCount < Sequence.Sheet.length,
      "Guess count out of bounds");
    Result = GuessCount == (EndCount - 1);
  }

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
  GameUpdate(gGameState, gAudioSynth, Button);
  return;
}

function SoundButtonPressHandler(Button) {
  var GameState = gGameState;
  console.assert(0 < Button && Button <= GameState.ButtonCount,
    " Invalid button number. Must be greater than 0 & less than button count");
  GameState.LastButton = Button;

  var Sequence = GameState.Squid ? SquidSequence : GameSequence;
  if (!Sequence.IsPlaying) {
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
  console.assert(Audio != undefined, "Pass Audio state");

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
    uniform int u_button;

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

    float Triangle(vec2 uv)
    {
      uv.y += 0.2;
      vec2 normal = vec2(0.0);
      uv *= 1.5;
      uv.x = abs(uv.x);
      uv.x -= 0.5;
      normal = GetNormal(13.0*PI32/6.0);
      uv -= normal * max(0.0, dot(uv, normal)) * 2.0;
      
      float line = length(uv - vec2(clamp(uv.x, -1.3, 1.0), 0.0));
      line = min(1.0, line); //NOTE(): Original line

      return smoothstep(0.01, 0.0099, 0.15*line);
    }
    void main()
    {
      //TODO(): Clean all of this stuff up...
      vec2 uv  = (gl_FragCoord.xy-0.5*u_resolution.xy)/u_resolution.y;
      vec3 Color = vec3(0.8, 0.5, 0.5);
  
      if(false) {}
      else if(u_button == 1) { Color = vec3(0.3, 0.5, 0.3); }
      else if(u_button == 2) { Color = vec3(0.3, 0.4, 0.5); }
      else if(u_button == 3) { Color = vec3(1.0, 0.8, 0.0); }
      else if(u_button == 4) { Color = vec3(1.0, 0.0, 0.0); }

      if(u_squid == 0)
      {
        uv.x *= 10.0;
        uv.y *= 10.0;
        //TODO(): Study this effect on uv space v
        //uv = vec2(2.0*atan(uv.x, uv.y), 0.002*length(uv*uv));
        
        uv += u_time*0.0002;
        //TODO(): Understand why Shear(sin(t),0.0) makes the seem like its
        //        translating the uv space.
        ///uv *= 1.0/length(uv*uv*uv);
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
        //Color.r = Grid(gv);
        Color -= Hash(CellId);
        Color.gb += Hash(-CellId) + Mask * 0.003;
        Color += Mask;

        Color-= 0.6;
      }
      else
      {    
        Color -= 0.3;
        
        Color += Triangle(uv);
        vec3 grid = vec3(0.1);
        Color += grid;

        //grid.rg -= smoothstep(0.0, 0.00001, 1.0 - fract(uv * 0.00001));
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
    gl.uniform2fv(UIdResolution, new Float32Array(resolution));
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 3;

    gl.drawArrays(primitiveType, offset, count);

    requestAnimationFrame(drawScene);
  }

}

window.onload = main;