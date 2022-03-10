/* RESOURCES:
https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
https://developer.mozilla.org/en-US/docs/Web/API/setTimeout
https://developer.mozilla.org/en-US/docs/Web/API/console/assert
*/

//Game State
var pattern = [2, 2, 4, 3, 2, 1, 4];
var progress = 0;
var gamePlaying = false;
var tonePlaying = false;
var guessCounter = 0;
var toneSequencePlaying = false;

//Audio Synth State
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioCtx = new AudioContext();
var Oscillator = audioCtx.createOscillator();
var Gain       = audioCtx.createGain();
var volume = 0.5;
//Audio Synth Initializaion
Gain.connect(audioCtx.destination);
Gain.gain.setValueAtTime(0, audioCtx.currentTime);
Oscillator.connect(Gain);
Oscillator.start(0);


//Tone Sequencing Consts
const c = 0.2;
const clueHoldTime = 1000*c;
const cluePauseTime = 333*c;
const nextClueWaitTime = 1000*c;
const freq = [ null, 261.6, 329.6, 392.0, 466.2 ];


//Squid Stuff
var   squid = false;
const squidBeat = 480.0 * 4.0 * 1.0; //125BPM * 1/60,000ms
const squidPWM  = 0.8;
const squidItvl = { "whole":1.0, "quarter":0.25, "eighth":0.125};
const squidNote = { b:246.94, d:293.66, e:329.63};
const squidSheet = 
[
  ["b","eighth"],
  ["e","eighth"],
  ["e","quarter"],
  ["e","quarter"],
  ["d","quarter"],
  ["e","eighth"],
  ["e","eighth"],
  ["b","eighth"],
  ["b","eighth"],
  ["d","quarter"],
];
var squidBtnTable = [null, "b", "e", "d"];

function squidPrompt()
{
  //var descP = document.getElementById("desc");
  var result = "yes"==prompt("Would you like to go another round and earn more " +
        "money than you can spend in your lifetime at the risk " +
        "of loosing all your hard work up to this moment? " +
                     "type <yes> to accept");  
  return result;
}

function squidSequence()
{
  guessCounter = 0;
  toneSequencePlaying = true;
  audioCtx.resume()
  let delay = 0.0  ;
  for(let i=0;i<squidSheet.length;i++)
  {
    var note = squidSheet[i][1];
    var tone = squidSheet[i][0];
    var hold = squidBeat*squidPWM*squidItvl[note];
    var release = squidBeat*(1.0-squidPWM)*squidItvl[note];
    setTimeout(squidPlayTone,delay, tone, hold); 
    delay += release;
    delay += hold;
  }
  toneSequencePlaying = false;
}

function squidBtnfromNote(note)
{
  var result = 0;
  for(var i=0; i<squidBtnTable.length;i++)
  {
    if(squidBtnTable[i]==note){ result=i; break; }
  }
  return result;
}

function squidPlayTone(note, duration)
{
  var btn = squidBtnfromNote(note);
  console.assert(btn>0, "invalid button number used");
  lightButton(btn);
   
  Oscillator.frequency.value = squidNote[note];
  Gain.gain.setTargetAtTime(volume, audioCtx.currentTime + 0.05, 0.025);
  audioCtx.resume();
  
  tonePlaying = true;
  setTimeout(function(){ pregameStopTone(); }, duration);
  
   setTimeout(clearButton, duration, btn);
}

function squidButtonRotate()
{
  //Get style from load style sheet
  var btn1 = document.getElementById("btn01");
  var btn2 = document.getElementById("btn02");
  var btn3 = document.getElementById("btn03");
  var btn1Style = window.getComputedStyle(btn1);
  var btn2Style = window.getComputedStyle(btn2);
  var btn3Style = window.getComputedStyle(btn3);
  var btn1Color = btn1Style.getPropertyValue("background");
  var btn2Color = btn2Style.getPropertyValue("background");
  var btn3Color = btn3Style.getPropertyValue("background");
  
  var rnd = Math.floor(Math.random()*1000)%3;
  //blah
  switch(rnd)
  {
    case 0:
    {
      btn1.style.background = btn2Color;
      btn2.style.background = btn1Color;
      var tmp = squidBtnTable[1];
      squidBtnTable[1] = squidBtnTable[2];
      squidBtnTable[2] = tmp;
    }break;
    case 1:
    {
      btn2.style.background = btn3Color;
      btn3.style.background = btn2Color;
      var tmp = squidBtnTable[2];
      squidBtnTable[2] = squidBtnTable[3];
      squidBtnTable[3] = tmp;
    }break;
    case 2:
    {
      btn1.style.background = btn3Color;
      btn3.style.background = btn1Color;
      var tmp = squidBtnTable[1];
      squidBtnTable[1] = squidBtnTable[3];
      squidBtnTable[3] = tmp;
    }break;
  }
}

//- Game
function initGame()
{
  progress = 0;
  gamePlaying = true;
  squid = false;
  
  document.getElementById("startbtn").classList.add("hidden");
  document.getElementById("stopbtn").classList.remove("hidden");
  sequencePlay();
}

function endGame()
{
  squid = 0;
  gamePlaying = false;
  
  squidBtnTable[1] = "b";
  squidBtnTable[2] = "e";
  squidBtnTable[3] = "d";

  document.getElementById("startbtn").classList.remove("hidden");
  document.getElementById("stopbtn").classList.add("hidden");
  var btn1 = document.getElementById("btn01");
  var btn2 = document.getElementById("btn02");
  var btn3 = document.getElementById("btn03");
  btn1.style.background = "";
  btn2.style.background = "";
  btn3.style.background = "";
}

function gameResult(win)
{
  if(win==true && squid==false)
  {
    alert("Game Over. You Won!.");
    let div = document.createElement("div")
    let p = document.createElement("p")
div.append(p)
  }
  else if(win==true && squid==true)
  {
    alert("you win the monies!");  
  }
  else
  {
    alert("Game Over. You lost.");     
  }

  endGame(); 
}

function isGuessCorrect(btn, guessCount, squid)
{
  console.assert(btn>0, "invalid button number used");
  var btnTone = squidBtnTable[btn];
  var squidTone = squidSheet[guessCount][0];
  var expectedBtn = pattern[guessCount];
  
  var result = squid? squidTone==btnTone:expectedBtn==btn;
  return result;
}

function isRoundOver(squid, guessCounter)
{
  var result = squid?
      guessCounter==(squidSheet.length-1):
      guessCounter==progress;

  return result;
}

//- Button Lighting
function lightButton(btn)
{
  console.assert(btn>0, "invalid button number used");
  console.log("button: " + "btn0"+btn);
  document.getElementById("btn0"+btn).classList.add("lit")
}

function clearButton(btn)
{
  console.assert(btn>0, "invalid button number used");
  document.getElementById("btn0"+btn).classList.remove("lit")
}

//- Free Audio
//Normal button press? not for sequence
function pregamePlayTone(btn)
{
  console.assert(btn>0, "invalid button number used");
  var btnTone = squidBtnTable[btn];

  if(!tonePlaying)
  {
    audioCtx.resume();
    Oscillator.frequency.value = squid?squidNote[btnTone]:freq[btn];
    Gain.gain.setTargetAtTime(volume, audioCtx.currentTime + 0.05, 0.025);
    audioCtx.resume();
    tonePlaying = true;
  }
}

function pregameStopTone(btn)
{
  Gain.gain.setTargetAtTime(0, audioCtx.currentTime + 0.05, 0.025);
  tonePlaying = false;
}


//- Tone Sequencing
function sequencePlayClueTone(btn)
{
  if(gamePlaying)
  {
    lightButton(btn);
    sequencePlayTone(btn,clueHoldTime);
    setTimeout(clearButton,clueHoldTime,btn);
  }
}

function sequencePlayTone(btn, duration)
{
  console.assert(btn>0, "invalid button number used");
  Oscillator.frequency.value = freq[btn];
  Gain.gain.setTargetAtTime(volume, audioCtx.currentTime + 0.05, 0.025);
  audioCtx.resume();
  tonePlaying = true;
  setTimeout(function()
  {
    pregameStopTone();
  }, duration);
}

function sequencePlay()
{
  guessCounter = 0;
  toneSequencePlaying = true;
  audioCtx.resume()
  let delay = nextClueWaitTime;
  for(let i=0;i<=progress;i++)
  {
    console.log("play single clue: " + pattern[i] + " in " + delay + "ms")
    setTimeout(sequencePlayClueTone,delay,pattern[i]);
    delay += clueHoldTime ;
    delay += cluePauseTime;
  }
  toneSequencePlaying = false;
}

function guess(btn)
{
  console.assert(btn>0, "invalid button number used");
  if(!gamePlaying)
  {
    return;
  }
  
  //TODO():Disable buttons on squence play
  if(toneSequencePlaying == true)
  {
    alert("listen to the tone");
    return;
  }
  
  const win = true;
  if(isGuessCorrect(btn, guessCounter, squid))
  {
    if(isRoundOver(squid, guessCounter))
    {
      if(squid)
      {
        gameResult(win);
      }
      else if(progress == pattern.length - 1)
      {
        if(!squid)
        {
          squid = squidPrompt();
          if(squid)
          {
            squidSequence();     
          }
          else
          {
             gameResult(win); 
          }
        }
      }else
      {
        progress++;
        sequencePlay();
      }
    }else
    {
      guessCounter++;
      if(squid)
      {
        squidButtonRotate();
      }
    }
  }else
  {
    gameResult(!win);
  }

}
