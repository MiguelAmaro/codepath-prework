class gamestate {
  GamePlaying;
  Progress;
  GuessCounter;
  TimesWon;
  TimesLost;

  Pattern;
  LastButton;
  ButtonCount;
  TonePlaying;
  ToneSequencePlaying;

  constructor() {
    this.TimesWon = 0;
    this.TimesLost = 0;
    this.Pattern = [];
    this.Button = 0;
    this.Progress = 0;
    this.GamePlaying = false;
    this.TonePlaying = false;
    this.GuessCounter = 0;
    this.ToneSequencePlaying = false;
  }
}

class audiosynth {
  AudioContext;
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


//Tone Sequencing Consts
const c = 0.2;
const clueHoldTime = 1000 * c;
const cluePauseTime = 333 * c;
const nextClueWaitTime = 1000 * c;
var freq = [null]; //Index 0 must be null


//App Components
var gGameState = new gamestate();
var gAudioSynth = new audiosynth();


/**************************************************
 *   !!!ENTRYPOINT!!!
 **************************************************/
function main() {
  console.log("entering main");
  GameInitResources(gGameState);
  OpenglMain();
  gAudioSynth.Start();
  return;
}


/**************************************************
 *   HELPERS
 **************************************************/
function Clamp(value, low, high, margin) {
  console.assert(low < high, "Clamp function high and a low parameters are in wrong order");
  return (value < low) ? low + margin : (value > high) ? high - margin : value;
}


/**************************************************
 *   SQUID STUFF
 **************************************************/
//Squid Stuff
var Squid = false;
const SquidBeat = 480.0 * 4.0 * 1.0; //125BPM * 1/60,000ms
const SquidPWM = 0.8; //misnomer
const SquidItvl = { "whole": 1.0, "quarter": 0.25, "eighth": 0.125 };
const SquidNote = { b: 246.94, d: 293.66, e: 329.63 };
const SquidSheet =
  [
    ["b", "eighth"],
    ["e", "eighth"],
    ["e", "quarter"],
    ["e", "quarter"],
    ["d", "quarter"],
    ["e", "eighth"],
    ["e", "eighth"],
    ["b", "eighth"],
    ["b", "eighth"],
    ["d", "quarter"],
  ];
var SquidButtonTable = [null, "b", "e", "d"];

function SquidPrompt() {
  //var descP = document.getElementById("desc");
  var result = "yes" == prompt("Would you like to go another round and earn more " +
    "money than you can spend in your lifetime at the risk " +
    "of loosing all your hard work up to this moment? " +
    "type <yes> to accept");
  return result;
}

function SquidSequence() {
  guessCounter = 0;
  toneSequencePlaying = true;
  audioCtx.resume()
  let delay = 0.0;
  for (let i = 0; i < squidSheet.length; i++) {
    var note = squidSheet[i][1];
    var tone = squidSheet[i][0];
    var hold = squidBeat * squidPWM * squidItvl[note];
    var release = squidBeat * (1.0 - squidPWM) * squidItvl[note];
    setTimeout(squidPlayTone, delay, tone, hold);
    delay += release;
    delay += hold;
  }
  toneSequencePlaying = false;
}

function SquidButtonfromNote(note) {
  var result = 0;
  for (var i = 0; i < squidButtonTable.length; i++) {
    if (squidButtonTable[i] == note) { result = i; break; }
  }
  return result;
}

function SquidPlayTone(note, duration) {
  var Button = squidButtonfromNote(note);
  console.assert(Button > 0, "invalid button number used");
  lightButton(Button);

  Oscillator.frequency.value = squidNote[note];
  Gain.gain.setTargetAtTime(volume, audioCtx.currentTime + 0.05, 0.025);
  audioCtx.resume();

  tonePlaying = true;
  setTimeout(function () { pregameStopTone(); }, duration);

  setTimeout(clearButton, duration, Button);
}

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
    console.assert(rnd > 0 && rnd < PatternCount, "Error: pattern generated contains an invalid number");
    NewPattern.push(rnd);
  }

  return NewPattern;
}

function GameStartRound(GameState, Audio) {
  console.assert(GameState != undefined && Audio != undefined, "pass the state you animal");
  GameState.Progress = 0;
  GameState.GamePlaying = true;
  squid = false;

  document.getElementById("startButton").classList.add("hidden");
  document.getElementById("stopButton").classList.remove("hidden");

  SequencePlay(Audio, GameState);
}

function GameInitResources(GameState) {
  console.assert(GameState != undefined, "pass the state you animal");
  //This is called from main after site resources are loaeded.
  //Range of audible frequencies 20 Hz to 20 kHz.
  // original frequencies 261.6, 329.6, 392.0, 466.2;
  var ButtonCount = document.getElementById("gameButtonArea").childElementCount;

  var BaseFreq = Clamp(200 + (Math.random() * 100.0), 200.0, 300.0, 0.0);
  var FreqSpaceing = 120.0;

  GameState.ButtonCount = ButtonCount;
  GameState.Pattern = GamePatternGenerator(GameState.ButtonCount, GameState.TimesWon);

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

  return;
}

function GameEnd(GameState) {
  console.assert(GameState != undefined, "pass the state you animal");
  Squid = false;
  GameState.GamePlaying = false;

  SquidButtonTable[1] = "b";
  SquidButtonTable[2] = "e";
  SquidButtonTable[3] = "d";

  document.getElementById("startButton").classList.remove("hidden");
  document.getElementById("stopButton").classList.add("hidden");
  var Button1 = document.getElementById("Button01");
  var Button2 = document.getElementById("Button02");
  var Button3 = document.getElementById("Button03");
  Button1.style.background = "";
  Button2.style.background = "";
  Button3.style.background = "";
  return;
}

function GameDisplayResult(Win) {
  if (Win == true && squid == false) {
    alert("Game Over. You Won!.");
    let Div = document.createElement("div");
    let Para = document.createElement("p");
    Div.append(Para);
  }
  else if (win == true && squid == true) {
    alert("you win the monies!");
  }
  else {
    alert("Game Over. You lost.");
  }

  GameEnd();
}

function GameUpdate(GameState, Audio, Button) {
  console.assert(GameState != undefined && Audio != undefined, "pass the state you animal");

  console.assert(Button > 0, "invalid button number used");
  if (!GameState.GamePlaying) {
    return;
  }

  //TODO():Disable buttons on squence play
  if (GameState.ToneSequencePlaying == true) {
    alert("listen to the tone");
    return;
  }

  const win = true;
  if (GameIsGuessCorrect(GameState, Button, GameState.GuessCounter, squid)) {
    if (GameIsRoundOver(GameState, squid, GameState.GuessCounter)) {
      if (squid) {
        GameResult(win);
        GameState.TimesWon++;
      }
      else if (GameState.Progress == GameState.Pattern.length - 1) {
        if (!squid) {
          squid = SquidPrompt();
          if (squid) {
            SquidSequence();
          }
          else {
            GameResult(win);
            GameState.timesWon++;
          }
        }
      } else {
        GameState.progress++;

        SequencePlay(Audio, GameState);

      }
    } else {
      gGameState.guessCounter++;
      if (squid) {
        SquidButtonRotate();
      }
    }
  } else {
    if (gGameState.timesLost < 3) {
      GameResult(!win);
    }
    else {
      gGameState.timesLost++;
    }
  }

}

function GameIsGuessCorrect(GameState, Button, GuessCount, Squid) {
  console.assert(Button > 0, "invalid button number used");
  var ButtonTone = SquidButtonTable[Button];
  var SquidTone = SquidSheet[GuessCount][0];
  var ExpectedButton = GameState.Pattern[GuessCount];

  var Result = Squid ? SquidTone == ButtonTone : ExpectedButton == Button;
  return Result;
}

function GameIsRoundOver(GameState, Squid, GuessCounter) {
  var Result = Squid ?
    GuessCounter == (SquidSheet.length - 1) :
    GuessCounter == GameState.Progress;

  return Result;
}



/**************************************************
 *   STYLING CONTROL
 **************************************************/
function LightButton(Button) {
  console.assert(Button > 0, "invalid button number used");
  document.getElementById("Button0" + Button).classList.add("lit");
  return
}

function ClearButton(Button) {
  console.assert(Button > 0, "invalid button number used");
  document.getElementById("Button0" + Button).classList.remove("lit");
  return;
}


/**************************************************
 *   HTML - JS INTERFACE
 **************************************************/
function SoundButtonClickHandler(Button) {
  GameUpdate(gGameState, gAudioSynth, Button)
  return;
}

function SoundButtonPressHandler(Button) {
  console.assert(Button > 0, "invalid button number used");

  var GameState = gGameState;
  var ButtonTone = SquidButtonTable[Button];
  var Freq = Squid ? SquidNote[ButtonTone] : freq[Button];

  if (!GameState.TonePlaying) {
    AudioPlayTone(gAudioSynth, Freq);
    GameState.TonePlaying = true;
  }

  GameState.button = Button;
  return;
}

function SoundButtonReleaseHandler(Button) {
  AudioPauseTone(gAudioSynth, gGameState);
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

function AudioPauseTone(Audio) {
  Audio.Gain.gain.setTargetAtTime(0, Audio.Context.currentTime + 0.05, 0.025);
}



/**************************************************
 *   SEQUENCING
 **************************************************/
function SequenceBegin(Audio, Button, GamePlaying, HoldTime) {
  var Freq = freq[Button];
  if (GamePlaying) {
    LightButton(Button);
    SequencePlayTone(Audio, Freq, HoldTime);
    setTimeout(ClearButton, HoldTime, Button);
  }
}
function SequencePlayTone(Audio, Freq, Duration) {
  console.assert(Audio != undefined, "pass the state you animal");
  Audio.Oscillator.frequency.value = Freq;
  Audio.Gain.gain.setTargetAtTime(Audio.Volume, Audio.Context.currentTime + 0.05, 0.025);
  Audio.Context.resume();

  setTimeout(AudioPauseTone, Duration, Audio);
}

function SequencePlay(Audio, GameState) {
  console.assert(GameState != undefined && Audio != undefined, "pass the state you animal");
  GameState.guessCounter = 0;
  GameState.toneSequencePlaying = true;
  Audio.Context.resume()

  var Delay = nextClueWaitTime;
  for (let i = 0; i <= GameState.Progress; i++) {
    setTimeout(SequenceBegin, Delay, Audio,
      GameState.Pattern[i],
      GameState.GamePlaying,
      clueHoldTime);

    Delay += clueHoldTime;
    Delay += cluePauseTime;
  }

  GameState.ToneSequencePlaying = false;
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
    void main()
    {
      //TODO(): Clean all of this stuff up...
      vec2 uv  = (gl_FragCoord.xy-0.5*u_resolution.xy)/u_resolution.y;
      vec3 col = vec3(0.8, 0.5, 0.5);
  
      if(false) {}
      else if(u_button == 1) { col = vec3(0.3, 0.5, 0.3); }
      else if(u_button == 2) { col = vec3(0.3, 0.4, 0.5); }
      else if(u_button == 3) { col = vec3(1.0, 0.8, 0.0); }
      else if(u_button == 4) { col = vec3(1.0, 0.0, 0.0); }

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
        //uv *= Shear(0.0, 0.0);
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
        //        the grid colors and the truchet line. less jank
        //col.r = Grid(gv);
        col -= Hash(CellId);
        col.gb += Hash(-CellId) + Mask * 0.003;
        col += Mask;

        col-= 0.6;
      }
      else
      {    
        col -= 0.3;
        
        uv.y += 0.2;
        vec2 normal = vec2(0.0);
        uv *= 1.5;
        uv.x = abs(uv.x);
        uv.x -= 0.5;
        //2.0*PI32/3.0
        normal = GetNormal(13.0*PI32/6.0);
        
        uv -= normal * max(0.0, dot(uv, normal)) * 2.0;
        

        float line = length(uv - vec2(clamp(uv.x, -1.3, 1.0), 0.0));
        line = min(1.0, line); //NOTE(): Original line
        col += 10.0 * smoothstep(0.01, 0.0099, 0.15*line);
        vec3 grid = vec3(0.1);
        //grid.rg -= smoothstep(1.0, 0.8, 1.0 - fract(uv * 10.0) + 0.01);
        col += grid;
      }
      
      gl_FragColor=vec4(col, 1.0);
    }
    `;

  console.log(vertexShaderSource);

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
    gl.uniform1i(UIdSquid, gGameState.squid);
    gl.uniform1i(UIdButton, gGameState.button);
    gl.uniform2fv(UIdResolution, new Float32Array(resolution));
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 3;

    gl.drawArrays(primitiveType, offset, count);

    requestAnimationFrame(drawScene);
  }

}

window.onload = main;