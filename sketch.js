let bgImage; // 儲存背景圖片 bg/3.png
let bgOffsetX = 0; // 記錄背景水平捲動偏移量（負值代表背景往左移動）
let characterSprite; // 儲存角色一的精靈圖
let walkSprite; // 儲存角色一的走路精靈圖
let magicSprite; // 儲存角色一的施法精靈圖
let magicEffectSprite; // 儲存角色一的魔法特效精靈圖
let characterX; // 儲存角色一目前的水平中心位置
let isWalking = false; // 記錄角色是否已切換為走路動畫
let facingDirection = 1; // 記錄角色朝向（1 為右，-1 為左）
let isCasting = false; // 記錄角色是否正在播放施法動畫
let magicStartFrame = 0; // 記錄施法動畫開始時的畫面計數
let magicDirection = 1; // 記錄施法時鎖定的方向
let spaceIsDown = false; // 記錄空白鍵是否已按住以避免重複觸發
let activeEffects = []; // 儲存目前畫面上飛行中的魔法特效

// 角色 2 相關變數
let char2StopFrames = []; // 儲存角色二站立動畫（2/stop/0.png ~ 7.png，共 8 張）
let char2WalkFrames = []; // 儲存角色二走路動畫（2/walk/0.png ~ 7.png，共 12 張）
let char2IsWalking = false; // 記錄角色二目前是否處於靠近切換的走路狀態
let char2FacingDirection = 1; // 記錄角色二朝向（1 為右，-1 為左）

const char2StopCount = 8; // 角色二站立圖片張數（0.png ~ 7.png）
const char2WalkCount = 12; // 角色二走路圖片張數（0.png ~ 7.png 檔名序列，共 12 張）
const proximityThreshold = 220; // 角色一與角色二觸發切換走路動畫的水平距離門檻（像素）

// 數學選擇題與特效相關變數
let currentQuestion = null; // 目前顯示的加法選擇題物件
let optionButtons = []; // 儲存四個選項按鈕的座標與數值
let answerFeedback = ""; // 作答提示文字（答對 / 答錯）
let hasAnsweredCurrent = false; // 是否已作答目前這一題
let wasNearChar2 = false; // 記錄上一幀是否靠近角色二
let fireworkEndFrame = 0; // 煙火特效結束的影格編號（60fps 下 3 秒 = 180 影格）
let lightningEndFrame = 0; // 閃電特效結束的影格編號（60fps 下 3 秒 = 180 影格）
let fireworks = []; // 儲存煙火粒子

const frameCountInSprite = 10; // 設定精靈圖包含的影格數
const frameWidth = 139.5; // 設定每個影格的寬度（1395 除以 10）
const frameHeight = 196; // 設定每個影格的高度
const walkFrameCount = 9; // 設定走路精靈圖包含的影格數
const walkFrameWidth = 1246 / walkFrameCount; // 計算走路動畫每格的寬度
const walkFrameHeight = 198; // 設定走路動畫每格的高度
const magicFrameCount = 4; // 設定施法精靈圖包含的影格數
const magicFrameWidth = 1039 / magicFrameCount; // 計算施法動畫每格的寬度
const magicFrameHeight = 146; // 設定施法動畫每格的高度
const effectFrameCount = 5; // 設定魔法特效精靈圖包含的影格數
const effectFrameWidth = 740 / effectFrameCount; // 計算魔法特效每格的寬度
const effectFrameHeight = 19; // 設定魔法特效每格的高度
const framesPerStep = 8; // 設定動畫每隔幾個畫面更新一格

function preload() { // 在畫布建立前載入圖片資源
  bgImage = loadImage("bg/3.png"); // 載入背景圖片 bg/3.png
  characterSprite = loadImage("1/stop/stop.png"); // 載入角色一的十格精靈圖
  walkSprite = loadImage("1/walk/walk.png"); // 載入角色一的九格走路精靈圖
  magicSprite = loadImage("1/magic/magic.png"); // 載入角色一的四格施法精靈圖
  magicEffectSprite = loadImage("1/magic_effect/magic_effect.png"); // 載入五格魔法特效精靈圖

  // 載入角色二站立動畫（2/stop/0.png ~ 7.png，共 8 張）
  for (let i = 0; i < char2StopCount; i++) {
    char2StopFrames.push(loadImage(`2/stop/${i}.png`));
  }

  // 載入角色二走路動畫（2/walk/0.png ~ 7.png 路徑，共 12 張）
  for (let i = 0; i < char2WalkCount; i++) {
    const fileIndex = i % 8;
    char2WalkFrames.push(loadImage(`2/walk/${fileIndex}.png`));
  }
} // 結束圖片載入函式

function setup() { // 初始化畫布與繪圖模式
  createCanvas(windowWidth, windowHeight); // 建立符合視窗尺寸的畫布
  imageMode(CENTER); // 讓座標代表影格的中心點
  characterX = (width * 2) / 3; // 將角色初始位置設在畫布寬度的三分之二處
  frameRate(60); // 將動畫更新速率設定為每秒六十格
} // 結束初始化函式

function draw() { // 每個畫面更新一次背景與角色
  background("#87CEEB"); // 預設底色避免圖片載入前空白

  // 計算單張背景圖片依畫布高度等比例縮放後的寬度（確保至少與畫布同寬以完整覆蓋畫面）
  const bgAspect = bgImage && bgImage.height > 0 ? bgImage.width / bgImage.height : 1;
  const singleBgWidth = max(width, height * bgAspect);
  const singleBgHeight = height;

  // 計算三張背景串接後的可捲動範圍
  const minBgOffset = width - singleBgWidth * 2;
  const maxBgOffset = singleBgWidth;
  const anchorX = (width * 2) / 3; // 角色在捲動模式下的基準水平位置

  const movingRight = keyIsDown(RIGHT_ARROW); // 檢查右方向鍵目前是否按住
  const movingLeft = keyIsDown(LEFT_ARROW); // 檢查左方向鍵目前是否按住
  isWalking = movingRight || movingLeft; // 沒有按住左右鍵時切回站立動畫
  const movementStep = constrain(width * 0.004, 2, 8); // 依畫布寬度計算適合不同裝置的移動速度

  // 維持角色高度為畫布高度的 1/3，寬度依原圖寬高比等比例縮放
  const characterScale = (height / 3) / frameHeight;
  const characterWidth = frameWidth * characterScale; // 計算角色基本顯示寬度
  const characterHeight = height / 3;

  if (movingRight) { // 按住右方向鍵
    isWalking = true; // 切換至走路動畫
    facingDirection = 1; // 設定角色朝向右方
    if (characterX < anchorX) {
      characterX = min(anchorX, characterX + movementStep);
    } else if (bgOffsetX > minBgOffset) {
      bgOffsetX = max(minBgOffset, bgOffsetX - movementStep);
    } else {
      characterX += movementStep; // 讓角色向右移動
    }
  } else if (movingLeft) { // 按住左方向鍵
    isWalking = true; // 切換至走路動畫
    facingDirection = -1; // 設定角色朝向左方
    if (characterX > anchorX) {
      characterX = max(anchorX, characterX - movementStep);
    } else if (bgOffsetX < maxBgOffset) {
      bgOffsetX = min(maxBgOffset, bgOffsetX + movementStep);
    } else {
      characterX -= movementStep; // 讓角色向左移動
    }
  }

  // 限制角色中心避免超出畫布左右邊界
  characterX = constrain(characterX, characterWidth / 2, width - characterWidth / 2);

  // 繪製三張左右串接的背景圖片（左：i=-1，中：i=0，右：i=1）
  if (bgImage) {
    push();
    imageMode(CORNER); // 背景使用左上角座標對齊無縫串接
    for (let i = -1; i <= 1; i++) {
      const drawX = bgOffsetX + i * singleBgWidth;
      image(bgImage, drawX, 0, singleBgWidth, singleBgHeight);
    }
    pop();
  }

  // 計算角色二的位置：位於最左邊背景圖（i = -1）的正中央，並隨背景捲動
  const leftmostBgCenterX = bgOffsetX - singleBgWidth * 0.5;
  const char2ScreenX = leftmostBgCenterX;

  // 判斷角色一與角色二的距離，決定角色二播放走路或站立動畫
  const distanceToChar1 = abs(characterX - char2ScreenX);
  char2IsWalking = distanceToChar1 <= proximityThreshold;
  char2FacingDirection = characterX >= char2ScreenX ? 1 : -1;

  // 處理靠近角色二時的出題與狀態切換
  if (char2IsWalking) {
    if (!wasNearChar2 || !currentQuestion) {
      generateAdditionQuestion();
    }
    wasNearChar2 = true;
  } else {
    if (wasNearChar2) {
      // 離開角色二後重置題目狀態，下次靠近重新出題
      currentQuestion = null;
      optionButtons = [];
      answerFeedback = "";
      hasAnsweredCurrent = false;
    }
    wasNearChar2 = false;
  }

  // 繪製角色二
  const char2Frames = char2IsWalking ? char2WalkFrames : char2StopFrames;
  const char2Count = char2IsWalking ? char2WalkCount : char2StopCount;
  const char2FrameIndex = floor(frameCount / framesPerStep) % char2Count;
  const char2CurrentImg = char2Frames[char2FrameIndex];

  if (char2CurrentImg && char2CurrentImg.height > 0) {
    const char2Scale = characterHeight / char2CurrentImg.height;
    const char2DrawWidth = char2CurrentImg.width * char2Scale;
    const char2DrawHeight = characterHeight;
    const char2ScreenY = height - char2DrawHeight / 2;

    push();
    translate(char2ScreenX, char2ScreenY);
    scale(char2FacingDirection, 1);
    image(char2CurrentImg, 0, 0, char2DrawWidth, char2DrawHeight);
    pop();
  }

  if (isCasting && frameCount - magicStartFrame >= magicFrameCount * framesPerStep) { // 檢查施法動畫是否已完整播放一次
    isCasting = false; // 結束施法動畫並恢復一般角色動作
    activeEffects.push({ x: characterX + magicDirection * characterWidth / 2, y: height - characterHeight * 0.58, direction: magicDirection }); // 在角色前方建立朝施法方向飛行的特效
  } // 結束施法動畫完成判斷

  const activeSprite = isCasting ? magicSprite : isWalking ? walkSprite : characterSprite; // 根據角色狀態選擇施法、走路或站立精靈圖
  const activeFrameCount = isCasting ? magicFrameCount : isWalking ? walkFrameCount : frameCountInSprite; // 取得目前精靈圖的影格總數
  const activeFrameWidth = isCasting ? magicFrameWidth : isWalking ? walkFrameWidth : frameWidth; // 取得目前精靈圖每格的寬度
  const activeFrameHeight = isCasting ? magicFrameHeight : isWalking ? walkFrameHeight : frameHeight; // 取得目前精靈圖每格的高度
  const elapsedMagicFrames = frameCount - magicStartFrame; // 計算施法動畫已播放的畫面數
  const frameIndex = isCasting ? floor(elapsedMagicFrames / framesPerStep) : floor(frameCount / framesPerStep) % activeFrameCount; // 計算目前要顯示的精靈影格
  const sourceX = frameIndex * activeFrameWidth; // 計算目前影格在精靈圖中的水平起點
  const activeWidth = activeFrameWidth * characterScale; // 計算目前角色影格的顯示寬度
  const activeHeight = activeFrameHeight * characterScale; // 計算目前角色影格的顯示高度
  const characterY = height - activeHeight / 2; // 將目前角色影格底部對齊畫布底部

  push(); // 暫存目前的繪圖座標轉換狀態
  translate(characterX, characterY); // 將繪圖原點移至角色中心
  scale(isCasting ? magicDirection : facingDirection, 1); // 依施法或角色朝向決定是否水平翻轉
  image(activeSprite, 0, 0, activeWidth, activeHeight, sourceX, 0, activeFrameWidth, activeFrameHeight); // 裁切並繪製目前角色影格
  pop(); // 還原繪圖座標轉換狀態

  const effectScale = characterScale; // 使用角色縮放倍率讓特效適應不同畫布
  const effectWidth = effectFrameWidth * effectScale; // 計算特效影格的顯示寬度
  const effectHeight = effectFrameHeight * effectScale; // 計算特效影格的顯示高度
  const effectSpeed = max(6, width * 0.008); // 依畫布寬度計算特效飛行速度
  for (let effectIndex = activeEffects.length - 1; effectIndex >= 0; effectIndex--) { // 由後往前更新所有飛行中的特效
    const effect = activeEffects[effectIndex]; // 取得目前更新的特效資料
    effect.x += effect.direction * effectSpeed; // 依特效方向更新水平位置
    if (effect.x > width || effect.x < 0) { // 判斷特效是否已抵達畫布左右邊緣
      activeEffects.splice(effectIndex, 1); // 移除已飛出畫布的特效
      continue; // 略過已移除特效的繪製
    } // 結束特效邊界判斷
    const effectFrameIndex = floor(frameCount / framesPerStep) % effectFrameCount; // 計算特效目前播放的影格
    push(); // 暫存目前的繪圖座標轉換狀態
    translate(effect.x, effect.y); // 將繪圖原點移至特效中心
    scale(effect.direction, 1); // 依飛行方向翻轉特效影格
    image(magicEffectSprite, 0, 0, effectWidth, effectHeight, effectFrameIndex * effectFrameWidth, 0, effectFrameWidth, effectFrameHeight); // 裁切並繪製目前特效影格
    pop(); // 還原繪圖座標轉換狀態
  } // 結束飛行中特效更新迴圈

  // 若角色一接近角色二，在畫布上方顯示透明度為 90 的黃色數學加法選擇題方框
  if (char2IsWalking && currentQuestion) {
    drawMathQuizBox();
  }

  // 繪製 3 秒煙火特效（答對時觸發）
  if (frameCount < fireworkEndFrame) {
    updateAndDrawFireworks();
  } else {
    fireworks = [];
  }

  // 繪製 3 秒閃電特效（答錯時觸發）
  if (frameCount < lightningEndFrame) {
    drawLightningEffect();
  }
} // 結束繪圖函式

// 產生一題數學加法選擇題與四個選項
function generateAdditionQuestion() {
  const a = floor(random(1, 21));
  const b = floor(random(1, 21));
  const answer = a + b;
  const choicesSet = new Set([answer]);

  while (choicesSet.size < 4) {
    const offset = floor(random(-6, 7));
    const candidate = answer + offset;
    if (candidate >= 0 && candidate !== answer) {
      choicesSet.add(candidate);
    }
  }

  const options = shuffle(Array.from(choicesSet));
  currentQuestion = {
    text: `${a} + ${b} = ?`,
    answer: answer,
    options: options
  };
  hasAnsweredCurrent = false;
  answerFeedback = "";
}

// 繪製透明度為 90 的黃色方框與四個選項按鈕
function drawMathQuizBox() {
  const boxW = width / 3; // 方框寬為整個畫布寬的 1/3
  const boxH = height / 2; // 方框高為整個畫布高的 1/2
  const boxX = (width - boxW) / 2; // 方框中間對準畫布中間
  const boxY = max(12, height * 0.02); // 方框上方靠近畫布上方

  push();
  // 黃色方框（透明度 90）
  fill(255, 230, 0, 90);
  stroke(180, 140, 0, 200);
  strokeWeight(2);
  rect(boxX, boxY, boxW, boxH, 16);

  // 題目文字
  noStroke();
  fill(30, 30, 30);
  textAlign(CENTER, CENTER);
  const questionFontSize = constrain(min(boxW * 0.11, boxH * 0.16), 18, 36);
  textSize(questionFontSize);
  textStyle(BOLD);
  text(currentQuestion.text, boxX + boxW / 2, boxY + boxH * 0.22);

  // 四個選項按鈕（2x2 排列在方框下半部）
  optionButtons = [];
  const cols = 2;
  const rows = 2;
  const padX = boxW * 0.08;
  const gapX = boxW * 0.06;
  const gapY = boxH * 0.05;
  const btnW = (boxW - padX * 2 - gapX) / cols;
  const btnH = (boxH * 0.44 - gapY) / rows;
  const gridStartY = boxY + boxH * 0.36;
  const btnFontSize = constrain(min(btnW * 0.32, btnH * 0.55), 14, 24);

  for (let i = 0; i < 4; i++) {
    const col = i % cols;
    const row = floor(i / cols);
    const bx = boxX + padX + col * (btnW + gapX);
    const by = gridStartY + row * (btnH + gapY);
    const optVal = currentQuestion.options[i];

    const isHovered = mouseX >= bx && mouseX <= bx + btnW && mouseY >= by && mouseY <= by + btnH;

    if (hasAnsweredCurrent && optVal === currentQuestion.answer) {
      fill(70, 200, 100, 235);
    } else if (isHovered && !hasAnsweredCurrent) {
      fill(255, 255, 255, 245);
    } else {
      fill(255, 255, 255, 210);
    }

    stroke(90, 75, 0);
    strokeWeight(1.5);
    rect(bx, by, btnW, btnH, 10);

    noStroke();
    fill(20);
    textSize(btnFontSize);
    textStyle(BOLD);
    text(str(optVal), bx + btnW / 2, by + btnH / 2);

    optionButtons.push({
      x: bx,
      y: by,
      w: btnW,
      h: btnH,
      value: optVal
    });
  }

  // 作答結果提示
  if (answerFeedback) {
    textSize(constrain(min(boxW * 0.075, boxH * 0.1), 14, 22));
    fill(hasAnsweredCurrent && answerFeedback.includes("對") ? color(0, 130, 40) : color(200, 20, 20));
    text(answerFeedback, boxX + boxW / 2, boxY + boxH * 0.9);
  }
  pop();
}

// 觸發 3 秒煙火特效
function triggerFireworks() {
  fireworkEndFrame = frameCount + 180; // 60fps * 3秒 = 180 影格
  fireworks = [];
  spawnFireworkBurst(width * 0.3, height * 0.35);
  spawnFireworkBurst(width * 0.7, height * 0.35);
  spawnFireworkBurst(width * 0.5, height * 0.28);
}

function spawnFireworkBurst(cx, cy) {
  const palette = [
    color(255, 80, 80),
    color(255, 220, 60),
    color(80, 220, 255),
    color(140, 255, 120),
    color(255, 130, 255)
  ];
  for (let i = 0; i < 45; i++) {
    const angle = (TWO_PI * i) / 45 + random(-0.08, 0.08);
    const speed = random(2.5, 8.5);
    fireworks.push({
      x: cx,
      y: cy,
      vx: cos(angle) * speed,
      vy: sin(angle) * speed,
      life: random(60, 120),
      col: random(palette)
    });
  }
}

function updateAndDrawFireworks() {
  // 3 秒期間內每隔一段時間補充新的煙火爆點
  if (frameCount % 35 === 0 && fireworkEndFrame - frameCount > 25) {
    spawnFireworkBurst(random(width * 0.2, width * 0.8), random(height * 0.18, height * 0.5));
  }

  push();
  for (let i = fireworks.length - 1; i >= 0; i--) {
    const p = fireworks[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.08; // 模擬重力下墜
    p.vx *= 0.985;
    p.life--;

    if (p.life <= 0) {
      fireworks.splice(i, 1);
      continue;
    }

    const alphaVal = map(p.life, 0, 120, 0, 255);
    noStroke();
    fill(red(p.col), green(p.col), blue(p.col), alphaVal);
    circle(p.x, p.y, 7);
  }
  pop();
}

// 繪製 3 秒閃電特效
function drawLightningEffect() {
  push();
  // 每隔幾格閃爍一次閃電，持續整整 3 秒
  if (frameCount % 6 < 4) {
    fill(255, 255, 180, 45);
    noStroke();
    rect(0, 0, width, height);

    const boltXStarts = [width * 0.25, width * 0.5, width * 0.75];
    for (let b = 0; b < boltXStarts.length; b++) {
      let curX = boltXStarts[b] + random(-30, 30);
      let curY = 0;
      const segments = 8;
      const stepY = height / segments;

      stroke(255, 255, 120, 230);
      strokeWeight(6);
      noFill();
      beginShape();
      vertex(curX, curY);
      for (let s = 1; s <= segments; s++) {
        curX += random(-45, 45);
        curY = s * stepY;
        vertex(curX, curY);
      }
      endShape();

      stroke(255, 255, 255, 255);
      strokeWeight(2.5);
      beginShape();
      curX = boltXStarts[b] + random(-30, 30);
      curY = 0;
      vertex(curX, curY);
      for (let s = 1; s <= segments; s++) {
        curX += random(-45, 45);
        curY = s * stepY;
        vertex(curX, curY);
      }
      endShape();
    }
  }
  pop();
}

function mousePressed() { // 點擊選項按鈕進行作答
  if (char2IsWalking && currentQuestion && !hasAnsweredCurrent) {
    for (let i = 0; i < optionButtons.length; i++) {
      const btn = optionButtons[i];
      if (mouseX >= btn.x && mouseX <= btn.x + btn.w && mouseY >= btn.y && mouseY <= btn.y + btn.h) {
        hasAnsweredCurrent = true;
        if (btn.value === currentQuestion.answer) {
          answerFeedback = "答對了！施放 3 秒煙火！";
          lightningEndFrame = 0;
          triggerFireworks();
        } else {
          answerFeedback = `答錯了！正確答案是 ${currentQuestion.answer}（3 秒閃電）`;
          fireworkEndFrame = 0;
          lightningEndFrame = frameCount + 180; // 3 秒閃電
        }
        break;
      }
    }
  }
}

function keyPressed() { // 按下方向鍵時切換角色狀態與朝向
  if (keyCode === RIGHT_ARROW) { // 判斷是否按下右方向鍵
    isWalking = true; // 啟用走路動畫
    facingDirection = 1; // 讓角色面向右方
    return false; // 防止方向鍵捲動網頁
  } // 結束右方向鍵判斷
  if (keyCode === LEFT_ARROW) { // 判斷是否按下左方向鍵
    isWalking = true; // 啟用走路動畫
    facingDirection = -1; // 讓角色面向左方
    return false; // 防止方向鍵捲動網頁
  } // 結束左方向鍵判斷
  if (keyCode === 32) { // 判斷是否按下空白鍵
    if (!spaceIsDown && !isCasting) { // 僅在空白鍵新按下且角色未施法時觸發
      isCasting = true; // 開始播放施法動畫
      magicStartFrame = frameCount; // 記錄施法動畫的起始畫面
      magicDirection = facingDirection; // 鎖定施法當下角色面向
    } // 結束施法啟動判斷
    spaceIsDown = true; // 記錄空白鍵已按住以避免連續觸發
    return false; // 防止空白鍵捲動網頁
  } // 結束空白鍵判斷
} // 結束按鍵事件處理函式

function keyReleased() { // 鍵盤按鍵放開時更新按鍵狀態
  if (keyCode === 32) { // 判斷放開的是否為空白鍵
    spaceIsDown = false; // 允許下次按空白鍵重新施法
  } // 結束空白鍵放開判斷
} // 結束按鍵放開事件處理函式

function windowResized() { // 視窗尺寸改變時重新調整畫布
  resizeCanvas(windowWidth, windowHeight); // 將畫布同步為新的視窗尺寸
  characterX = constrain(characterX, 1, width - 1); // 將角色位置限制在縮放後畫布內
} // 結束視窗縮放處理函式