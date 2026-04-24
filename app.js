// ===== FIREBASE CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyDT6xPjDxldqrmjWuG-VF7AVoot-RFUkH0",
  authDomain: "olymp-e7d79.firebaseapp.com",
  projectId: "olymp-e7d79",
  storageBucket: "olymp-e7d79.firebasestorage.app",
  messagingSenderId: "212523217131",
  appId: "1:212523217131:web:6acdbf9443cf4f22440eae",
  measurementId: "G-R134K8XESV"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ===== LOGIN =====
async function login() {
  const email = email.value;
  const pass = password.value;

  await auth.signInWithEmailAndPassword(email, pass);
}

// ===== ROLE CHECK =====
auth.onAuthStateChanged(async user => {
  if (!user) return;

  const doc = await db.collection("users").doc(user.uid).get();
  const data = doc.data();

  if (data.role === "mentor") showMentor();
  else showStudent(data.class);
});

// ===== BUILDER =====
let builder = [];

function addText() {
  const text = prompt("Текст");
  builder.push({ type: "text", text });
  renderBuilder();
}

function addImage() {
  const url = prompt("Ссылка на картинку");
  builder.push({ type: "image", url });
  renderBuilder();
}

function addQuestion() {
  const q = prompt("Вопрос");
  const correct = prompt("Ответ");

  builder.push({
    type: "question",
    q,
    correct,
    points: 1
  });

  renderBuilder();
}

function renderBuilder() {
  builderDiv.innerHTML = "";
  builder.forEach(i => {
    const d = document.createElement("div");
    d.className = "card";
    d.innerText = i.type;
    builderDiv.appendChild(d);
  });
}

// ===== PUBLISH =====
async function publishTask() {
  const title = taskTitle.value;
  const taskClass = taskClass.value;

  await db.collection("tasks").add({
    title,
    class: taskClass,
    content: builder
  });

  builder = [];
  renderBuilder();
}

// ===== STUDENT =====
async function showStudent(userClass) {
  loginPage.classList.add("hidden");
  studentPage.classList.remove("hidden");

  const snap = await db.collection("tasks")
    .where("class", "==", userClass).get();

  tasks.innerHTML = "";

  snap.forEach(doc => {
    const t = doc.data();

    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <b>${t.title}</b>
      <button onclick="startTask('${doc.id}')">Начать</button>
    `;
    tasks.appendChild(div);
  });
}

// ===== PLAYER =====
async function startTask(id) {
  const doc = await db.collection("tasks").doc(id).get();
  const task = doc.data();

  player.innerHTML = "";
  let score = 0;
  let max = 0;

  task.content.forEach(item => {
    const c = document.createElement("div");
    c.className = "card";

    if (item.type === "text") c.innerText = item.text;

    if (item.type === "image") {
      c.innerHTML = `<img src="${item.url}">`;
    }

    if (item.type === "question") {
      max += item.points;

      const input = document.createElement("input");
      input.onchange = () => {
        if (input.value === item.correct) {
          score += item.points;
        }
      };

      c.innerHTML = `<b>${item.q}</b>`;
      c.appendChild(input);
    }

    player.appendChild(c);
  });

  const btn = document.createElement("button");
  btn.innerText = "Завершить";

  btn.onclick = async () => {
    const percent = Math.round(score / max * 100);

    alert(`Баллы: ${score}/${max} (${percent}%)`);

    await db.collection("results").add({
      taskId: id,
      score,
      percent,
      user: auth.currentUser.uid
    });
  };

  player.appendChild(btn);
}

// ===== MENTOR =====
function showMentor() {
  loginPage.classList.add("hidden");
  mentorPage.classList.remove("hidden");

  loadStats();
}

// ===== STATS =====
async function loadStats() {
  const snap = await db.collection("results").get();

  stats.innerHTML = "";

  snap.forEach(doc => {
    const r = doc.data();

    const d = document.createElement("div");
    d.className = "card";
    d.innerText = `Баллы: ${r.score}, ${r.percent}%`;

    stats.appendChild(d);
  });
}
