# Pre-work - _Memory Game_

**Memory Game** is a Light & Sound Memory game to apply for CodePath's SITE Program.

Submitted by: Miguel Amaro

Time spent: **20** hours spent in total

Link to project: https://ninth-nonstop-transport.glitch.me

## Required Functionality

The following **required** functionality is complete:

- [x] Game interface has a heading (h1 tag), a line of body text (p tag), and four buttons that match the demo app
- [x] "Start" button toggles between "Start" and "Stop" when clicked.
- [x] Game buttons each light up and play a sound when clicked.
- [x] Computer plays back sequence of clues including sound and visual cue for each button
- [x] Play progresses to the next turn (the user gets the next step in the pattern) after a correct guess.
- [x] User wins the game after guessing a complete pattern
- [x] User loses the game after an incorrect guess

The following **optional** features are implemented:

- [x] Any HTML page elements (including game buttons) has been styled differently than in the tutorial
- [x] Buttons use a pitch (frequency) other than the ones in the tutorial
- [x] More than 4 functional game buttons
- [x] Playback speeds up on each turn
- [x] Computer picks a different pattern each time the game is played
- [x] Player only loses after 3 mistakes (instead of on the first mistake)
- [ ] Game button appearance change goes beyond color (e.g. add an image)
- [x] Game button sound is more complex than a single tone (e.g. an audio file, a chord, a sequence of multiple tones)
- [ ] User has a limited amount of time to enter their guess on each turn

The following **additional** features are implemented:

- [x] Dynamic background textures using shaders
- [x] Random Button Rotation in Bonus found
- [x] Asking the user to wait for the sequence to finish if they pres button while it is playing
- [x] Random sequence generation
- []

## Video Walkthrough (GIF)

If you recorded multiple GIFs for all the implemented features, you can add them here:
![](https://github.com/MiguelAmaro/codepath-prework/blob/main/gifs/miss.gif?raw=true)
![](https://github.com/MiguelAmaro/codepath-prework/blob/main/gifs/squid.gif?raw=true)
![](gif3-link-here)
![](gif4-link-here)

## Reflection Questions

1. If you used any outside resources to help complete your submission (websites, books, people, etc) list them here.

- music stuff
  https://pages.mtu.edu/~suits/notefreqs.html
- css styling stufffs
  https://css-tricks.com/snippets/css/a-guide-to-flexbox/
  https://css-tricks.com/adding-stroke-to-web-text/
  https://www.sohamkamani.com/javascript/enums/
  https://stackoverflow.com/questions/1638895/how-do-i-make-a-div-move-up-and-down-when-im-scrolling-the-page
  https://www.w3schools.com/css/css3_buttons.asp
- querying the dom for child count, elms with some id/class ect..
  https://developer.mozilla.org/en-US/docs/Web/API/Document/
- removing and appending children
  https://developer.mozilla.org/en-US/docs/Web/API/Node/
- other api info
  https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
  https://developer.mozilla.org/en-US/docs/Web/API/setTimeout
  https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onclick
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
- firefox dugguger docs
  https://firefox-source-docs.mozilla.org/devtools-user/debugger/ui_tour/index.html#debugger-ui-tour-call-stack
- vargs and callbacks
  https://stackoverflow.com/questions/3458553/javascript-passing-parameters-to-a-callback-function
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments
- logs asertions, ect
  https://developer.mozilla.org/en-US/docs/Web/API/console/
- basic opengl
  https://webglfundamentals.org/webgl/lessons/webgl-how-it-works.html
  https://www.w3schools.com/jsref/met_win_setinterval.asp

2. What was a challenge you encountered in creating this submission (be specific)? How did you overcome it? (recommended 200 - 400 words)
   A challenge I faced was verifying assumptions on various aspects of the code and making sure that correct paths were taken as the state changeed. What
   helped a lot was using the Firefox debugger which allow me to breakpoint and step though various parts of the code which i thought could be problematic.
   An example would be writing the code to play the squid game song. I know the song is around 125bpm which is 480ms. I know that if i have for example 4 quarter notes
   then I'm dividing the 480ms into 4 giving me 120 for each note and if I want there to be small gaps between notes then I would have to subtract a percentage of all
   the notes in that 480ms interval. Therefore, if all is well the sum of all the hold and releases for all notes should be equal to 480ms. Going through the debugger
   was really convenienct in verfying that my data was being accessed and correctly and my varibles were correct. It was also helpful in modifying the update(guess())
   function so that the original game remained intact while giving the user and option to play the bonus round.

3. What questions about web development do you have after completing your submission? (recommended 100 - 300 words)

4. If you had a few more hours to work on this project, what would you spend them doing (for example: refactoring certain functions, adding additional features, etc). Be specific. (recommended 100 - 300 words)
   I would try to colapse the bonus(squid game) functions with the original functions and use some state to determine what sequence to choose. Better would be to standardize
   the format of the sequences so that all that would be needed is to set the sequence that should be played. Currently there is the format from the tutorial where the
   time invervals between the notes in the sequence is determined by one variable and the format where the each note in the sequence has associated time data.

## Interview Recording URL Link

[My 5-minute Interview Recording](your-link-here)

## License

    Copyright Miguel Amaro

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
