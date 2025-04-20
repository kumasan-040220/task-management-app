// アプリケーションの状態管理
const state = {
  selectedColor: null,
  tasks: [],
  completedTasks: [],
  canvasData: [],
  dailyPointsLimit: 3,
  remainingPoints: 3, // デバッグ用の1000ポイントから実用的な値に変更
  canvasSize: 2, // デフォルトは2×2
  paletteColors: [], // パレットの色情報を保存
  isMouseDown: false, // マウスのドラッグ状態を追跡
  overrideAllowed: true, // 上書き許可フラグを常にtrueに設定
  galleryItems: [], // ギャラリーアイテムを保存
};

// ローカルストレージのキー
const STORAGE_KEYS = {
  TASKS: "task_app_tasks",
  COMPLETED_TASKS: "task_app_completed_tasks",
  CANVAS_DATA: "task_app_canvas",
  REMAINING_POINTS: "task_app_remaining_points",
  LAST_DATE: "task_app_last_date",
  PALETTE_COLORS: "task_app_palette_colors", // パレットの色情報を保存するキー
  OVERRIDE_ALLOWED: "task_app_override_allowed", // 上書き許可フラグのキー
  GALLERY_ITEMS: "task_app_gallery_items", // ギャラリーアイテムを保存するキー
  CANVAS_SIZE: "task_app_canvas_size", // キャンバスサイズを保存するキー
};

// DOM要素
const progressCanvas = document.getElementById("progress-canvas");
const colorPalette = document.getElementById("color-palette");
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const remainingPointsElement = document.getElementById("remaining-points");

// 初期化
function initApp() {
  loadDataFromStorage();

  // パレットの色がなければ新しく生成
  if (!state.paletteColors.length) {
    state.paletteColors = generateRandomColors(12);
    saveDataToStorage();
  }

  createCanvas();
  createColorPalette();
  renderTasks();
  updatePointsDisplay();
  checkForNewDay();

  // 画面ロード時にキャンバスが完成しているかチェック
  setTimeout(() => {
    checkCanvasInitialCompletion();
  }, 500);
}

// 新しい日付のチェック
function checkForNewDay() {
  const lastDate = localStorage.getItem(STORAGE_KEYS.LAST_DATE);
  const today = new Date().toLocaleDateString();

  if (lastDate !== today) {
    // 新しい日に残りポイントをリセット
    state.remainingPoints = state.dailyPointsLimit; // デバッグ用の1000ポイントから実際の上限値に変更
    // 残りの塗り回数は保持する（リセットしない）
    localStorage.setItem(STORAGE_KEYS.LAST_DATE, today);
    updatePointsDisplay();
  }
}

// ローカルストレージからデータを読み込む
function loadDataFromStorage() {
  const tasks = localStorage.getItem(STORAGE_KEYS.TASKS);
  const completedTasks = localStorage.getItem(STORAGE_KEYS.COMPLETED_TASKS);
  const canvasData = localStorage.getItem(STORAGE_KEYS.CANVAS_DATA);
  const remainingPoints = localStorage.getItem(STORAGE_KEYS.REMAINING_POINTS);
  const paletteColors = localStorage.getItem(STORAGE_KEYS.PALETTE_COLORS);
  const overrideAllowed = localStorage.getItem(STORAGE_KEYS.OVERRIDE_ALLOWED);
  const galleryItems = localStorage.getItem(STORAGE_KEYS.GALLERY_ITEMS);
  const canvasSize = localStorage.getItem(STORAGE_KEYS.CANVAS_SIZE);

  if (tasks) state.tasks = JSON.parse(tasks);
  if (completedTasks) state.completedTasks = JSON.parse(completedTasks);
  if (canvasData) state.canvasData = JSON.parse(canvasData);
  if (remainingPoints) state.remainingPoints = parseInt(remainingPoints);
  if (paletteColors) state.paletteColors = JSON.parse(paletteColors);
  if (overrideAllowed) state.overrideAllowed = overrideAllowed === "true";
  if (galleryItems) state.galleryItems = JSON.parse(galleryItems);
  if (canvasSize) state.canvasSize = parseInt(canvasSize);
}

// ローカルストレージにデータを保存
function saveDataToStorage() {
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(state.tasks));
  localStorage.setItem(
    STORAGE_KEYS.COMPLETED_TASKS,
    JSON.stringify(state.completedTasks)
  );
  localStorage.setItem(
    STORAGE_KEYS.CANVAS_DATA,
    JSON.stringify(state.canvasData)
  );
  localStorage.setItem(
    STORAGE_KEYS.REMAINING_POINTS,
    state.remainingPoints.toString()
  );
  localStorage.setItem(
    STORAGE_KEYS.PALETTE_COLORS,
    JSON.stringify(state.paletteColors)
  );
  localStorage.setItem(
    STORAGE_KEYS.GALLERY_ITEMS,
    JSON.stringify(state.galleryItems)
  );
  localStorage.setItem(STORAGE_KEYS.CANVAS_SIZE, state.canvasSize.toString());
}

// キャンバスの作成
function createCanvas() {
  progressCanvas.innerHTML = "";

  // キャンバスデータがなければ初期化
  if (!state.canvasData.length) {
    state.canvasData = Array(state.canvasSize * state.canvasSize).fill(null);
  }

  // グリッドのスタイルを動的に設定
  progressCanvas.style.gridTemplateColumns = `repeat(${state.canvasSize}, 1fr)`;
  progressCanvas.style.gridTemplateRows = `repeat(${state.canvasSize}, 1fr)`;

  // キャンバスのセルを作成
  for (let i = 0; i < state.canvasSize * state.canvasSize; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");

    // すでに色が設定されている場合は適用
    if (state.canvasData[i]) {
      cell.style.backgroundColor = state.canvasData[i];
    }

    cell.dataset.index = i;

    // マウスドラッグ時のイベントを追加
    cell.addEventListener("mousedown", handleCellClick);
    cell.addEventListener("mouseover", handleCellMouseOver);

    // 選択防止のための設定
    cell.addEventListener("dragstart", (e) => e.preventDefault());

    progressCanvas.appendChild(cell);
  }

  // キャンバス全体のマウスイベント
  progressCanvas.addEventListener("mousedown", () => {
    state.isMouseDown = true;
  });

  progressCanvas.addEventListener("mouseup", () => {
    state.isMouseDown = false;
  });

  progressCanvas.addEventListener("mouseleave", () => {
    state.isMouseDown = false;
  });
}

// カラーパレットの作成
function createColorPalette() {
  // パレットの色がない場合は生成
  if (!state.paletteColors.length) {
    state.paletteColors = generateRandomColors(12);
    saveDataToStorage();
  }

  colorPalette.innerHTML = "";

  state.paletteColors.forEach((color, index) => {
    const swatch = document.createElement("div");
    swatch.classList.add("color-swatch");
    swatch.style.backgroundColor = color;
    swatch.dataset.color = color;
    swatch.dataset.index = index;

    swatch.addEventListener("click", () => {
      // 他の選択済みスウォッチからクラスを削除
      document.querySelectorAll(".color-swatch.selected").forEach((el) => {
        el.classList.remove("selected");
      });

      // クリックされたスウォッチを選択状態に
      swatch.classList.add("selected");
      state.selectedColor = color;
    });

    colorPalette.appendChild(swatch);
  });
}

// ランダムな色を生成
function generateRandomColors(count) {
  const colors = [];
  const baseHues = [0, 30, 60, 120, 180, 210, 240, 270, 300, 330]; // 様々な色相

  for (let i = 0; i < count; i++) {
    const hue = baseHues[i % baseHues.length];
    const saturation = 70 + Math.random() * 30; // 70-100%
    const lightness = 40 + Math.random() * 20; // 40-60%

    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }

  return colors;
}

// セルクリックハンドラ
function handleCellClick(event) {
  if (!state.selectedColor) {
    alert("まず色を選択してください");
    return;
  }

  if (state.remainingPoints <= 0) {
    alert(
      "今日の残りポイントがありません。タスクを完了してポイントを獲得してください。"
    );
    return;
  }

  const index = event.target.dataset.index;

  // 既に色が塗られているセルの場合は上書き禁止
  // 上書き許可フラグがtrueの場合は上書きを許可
  if (state.canvasData[index] && !state.overrideAllowed) {
    return;
  }

  // 新しく色を塗る
  paintCell(event.target, index);
}

// マウスオーバーハンドラ (ドラッグ中のみ)
function handleCellMouseOver(event) {
  if (!state.isMouseDown || !state.selectedColor) return;

  if (state.remainingPoints <= 0) return;

  const index = event.target.dataset.index;

  // 既に色が塗られているセルの場合はスキップ
  // 上書き許可フラグがtrueの場合は上書きを許可
  if (state.canvasData[index] && !state.overrideAllowed) return;

  // 新しく色を塗る
  paintCell(event.target, index);
}

// セルに色を塗る共通関数
function paintCell(cell, index) {
  cell.style.backgroundColor = state.selectedColor;
  state.canvasData[index] = state.selectedColor;

  // ポイントを減らす
  state.remainingPoints -= 1;

  saveDataToStorage();

  // ポイント表示を更新
  updatePointsDisplay();

  // キャンバスが完成したかチェック
  checkCanvasCompletion();
}

// キャンバスが全て塗られたかチェック
function checkCanvasCompletion() {
  const isComplete = state.canvasData.every((cell) => cell !== null);

  console.log("キャンバスチェック:", isComplete, state.canvasData);

  if (isComplete) {
    console.log("キャンバス完成!");

    // 完成したキャンバスをギャラリーに保存
    saveCompletedCanvasToGallery();

    // 少し遅延させてUIの更新後にアラートを表示する
    setTimeout(() => {
      alert(
        "おめでとうございます！キャンバスが完成しました！\n翌日のポイントが倍になります！\nギャラリーに保存しました。\n\n新しいランダムサイズのキャンバスと新しいカラーパレットを生成します！"
      );

      resetCanvas();
    }, 100); // 100ミリ秒の遅延
  }
}

// 完成したキャンバスをギャラリーに保存
function saveCompletedCanvasToGallery() {
  const galleryItem = {
    id: Date.now(),
    canvasData: [...state.canvasData],
    canvasSize: state.canvasSize,
    date: new Date().toLocaleString(),
  };

  state.galleryItems.push(galleryItem);
  saveDataToStorage();

  console.log("キャンバスをギャラリーに保存しました", galleryItem);
}

// 画面ロード時のキャンバス完成チェック
function checkCanvasInitialCompletion() {
  // キャンバスデータが存在し、すべてのセルが塗られている場合
  if (
    state.canvasData.length > 0 &&
    state.canvasData.every((cell) => cell !== null)
  ) {
    console.log("ロード時にキャンバスが完成状態でした");
    // 少し遅延させてUIの更新後にアラートを表示する
    setTimeout(() => {
      alert(
        "おめでとうございます！キャンバスが完成しています！\n翌日のポイントが倍になります！\n\n新しいランダムサイズのキャンバスと新しいカラーパレットを生成します！"
      );

      resetCanvas();
    }, 100); // 100ミリ秒の遅延
  }
}

// ランダムなキャンバスサイズを生成する関数（2〜5のサイズ）
function generateRandomCanvasSize() {
  // 2から5までのランダムな数値を生成
  return Math.floor(Math.random() * 4) + 2;
}

// キャンバスのリセットと再生成
function resetCanvas() {
  state.dailyPointsLimit *= 2;

  // 前のキャンバスサイズを保存
  const oldSize = state.canvasSize;

  // 新しいキャンバスサイズをランダムに設定
  state.canvasSize = generateRandomCanvasSize();

  // サイズが変更されたことをコンソールに出力
  console.log(
    `キャンバスサイズが変更されました: ${oldSize}x${oldSize} → ${state.canvasSize}x${state.canvasSize}`
  );

  // キャンバスをリセット
  state.canvasData = Array(state.canvasSize * state.canvasSize).fill(null);

  // 新しいパレットを生成
  state.paletteColors = generateRandomColors(12);
  state.selectedColor = null; // 選択色をリセット

  createCanvas();
  createColorPalette();
  saveDataToStorage();

  // サイズが変更されたことをユーザーに通知
  alert(
    `新しいキャンバスサイズは ${state.canvasSize}x${state.canvasSize} になりました！\n新しいカラーパレットも生成されました！`
  );
}

// タスクフォームの送信ハンドラ
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const taskName = taskInput.value.trim();
  if (!taskName) return;

  // ラジオボタンから値を取得
  const importanceHigh = document.getElementById("importance-high");
  const urgencyHigh = document.getElementById("urgency-high");

  const importance = importanceHigh.checked ? "high" : "low";
  const urgency = urgencyHigh.checked ? "high" : "low";

  addTask(taskName, importance, urgency);

  taskInput.value = "";
});

// タスクの追加
function addTask(name, importance, urgency) {
  const task = {
    id: Date.now(),
    name,
    importance,
    urgency,
    createdAt: new Date(),
    completed: false,
  };

  state.tasks.push(task);
  saveDataToStorage();
  renderTasks();
}

// タスクの完了
function completeTask(taskId) {
  const taskIndex = state.tasks.findIndex((task) => task.id === taskId);
  if (taskIndex === -1) return;

  const task = state.tasks[taskIndex];

  // ポイントの計算
  let points = 0;
  if (task.importance === "high" && task.urgency === "high") {
    points = 3;
  } else if (task.importance === "high" && task.urgency === "low") {
    points = 2;
  } else if (task.importance === "low" && task.urgency === "high") {
    points = 1;
  }

  // タスクに完了日時を追加
  task.completed = true;
  task.completedAt = new Date();
  task.points = points;

  // タスクを完了済みリストに移動
  state.completedTasks.push(task);
  state.tasks.splice(taskIndex, 1);

  // ポイントを加算
  state.remainingPoints += points;

  saveDataToStorage();
  renderTasks();
  updatePointsDisplay();
}

// タスクの削除
function deleteTask(taskId) {
  const taskIndex = state.tasks.findIndex((task) => task.id === taskId);
  if (taskIndex === -1) return;

  state.tasks.splice(taskIndex, 1);
  saveDataToStorage();
  renderTasks();
}

// タスクのレンダリング
function renderTasks() {
  // 重要度と緊急性でタスクをソート
  const sortedTasks = [...state.tasks].sort((a, b) => {
    // 重要かつ緊急 > 重要だが緊急でない > 緊急だが重要でない > 重要でも緊急でもない
    const priorityA = getPriorityScore(a);
    const priorityB = getPriorityScore(b);

    return priorityB - priorityA;
  });

  taskList.innerHTML = "";

  if (sortedTasks.length === 0) {
    taskList.innerHTML = '<li class="no-tasks">タスクがありません</li>';
    return;
  }

  sortedTasks.forEach((task) => {
    const li = document.createElement("li");
    li.classList.add("task-item");

    // 重要度と緊急性に基づいてクラスを追加
    if (task.importance === "high" && task.urgency === "high") {
      li.classList.add("important-urgent");
    } else if (task.importance === "high" && task.urgency === "low") {
      li.classList.add("important-not-urgent");
    } else if (task.importance === "low" && task.urgency === "high") {
      li.classList.add("not-important-urgent");
    } else {
      li.classList.add("not-important-not-urgent");
    }

    // 重要度と緊急性に基づいたポイント
    let points = 0;
    if (task.importance === "high" && task.urgency === "high") {
      points = 3;
    } else if (task.importance === "high" && task.urgency === "low") {
      points = 2;
    } else if (task.importance === "low" && task.urgency === "high") {
      points = 1;
    }

    const taskMeta = `重要度: ${
      task.importance === "high" ? "高" : "低"
    } | 緊急性: ${task.urgency === "high" ? "高" : "低"} | ポイント: ${points}`;

    li.innerHTML = `
            <div class="task-content">
                <div class="task-name">${task.name}</div>
                <div class="task-meta">${taskMeta}</div>
            </div>
            <div class="task-actions">
                <button class="complete-btn">完了</button>
                <button class="delete-btn">削除</button>
            </div>
        `;

    // 完了ボタンのイベントリスナー
    li.querySelector(".complete-btn").addEventListener("click", () => {
      completeTask(task.id);
    });

    // 削除ボタンのイベントリスナー
    li.querySelector(".delete-btn").addEventListener("click", () => {
      deleteTask(task.id);
    });

    taskList.appendChild(li);
  });
}

// 優先度スコアの取得
function getPriorityScore(task) {
  if (task.importance === "high" && task.urgency === "high") return 3;
  if (task.importance === "high" && task.urgency === "low") return 2;
  if (task.importance === "low" && task.urgency === "high") return 1;
  return 0;
}

// ポイント表示の更新
function updatePointsDisplay() {
  remainingPointsElement.textContent = state.remainingPoints;
}

// アプリケーションの初期化
document.addEventListener("DOMContentLoaded", initApp);
