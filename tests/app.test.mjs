import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { JSDOM, VirtualConsole } from "jsdom";
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const sources = [
  "content.js",
  "enrichment.js",
  "assets/photo-index.js",
  "core.js",
  "app.js",
].map((file) =>
  fs.readFileSync(new URL("../" + file, import.meta.url), "utf8"),
);
const tick = () => new Promise((resolve) => setTimeout(resolve, 15));
function setup(initial = {}, serviceWorker = null) {
  const errors = [];
  const console = new VirtualConsole();
  console.on("jsdomError", (e) => errors.push(e));
  const dom = new JSDOM(html, {
    url: "http://localhost:3000",
    runScripts: "outside-only",
    virtualConsole: console,
  });
  const w = dom.window;
  if (serviceWorker)
    Object.defineProperty(w.navigator, "serviceWorker", {
      value: serviceWorker,
    });
  w.scrollTo = () => {};
  w.matchMedia = () => ({ matches: false });
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  w.HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
    this.dispatchEvent(new w.Event("close"));
  };
  w.URL.createObjectURL = () => "blob:local-test";
  w.URL.revokeObjectURL = () => {};
  w.localStorage.setItem("yuanxing.v1", JSON.stringify(initial));
  sources.forEach((s) => w.eval(s));
  const q = (s) => w.document.querySelector(s),
    qa = (s) => [...w.document.querySelectorAll(s)];
  const click = (s) => {
    assert.ok(q(s), "未找到控件 " + s);
    q(s).click();
  };
  const change = (s, value) => {
    assert.ok(q(s), "未找到控件 " + s);
    const el = q(s);
    if (el.type === "checkbox" || el.type === "radio") el.checked = value;
    else el.value = value;
    el.dispatchEvent(new w.Event("change", { bubbles: true }));
  };
  const input = (s, value) => {
    const el = q(s);
    assert.ok(el, "未找到输入 " + s);
    el.value = value;
    el.dispatchEvent(new w.Event("input", { bubbles: true }));
  };
  const route = async (hash) => {
    w.location.hash = hash;
    await tick();
  };
  const data = () => JSON.parse(w.localStorage.getItem("yuanxing.v1"));
  return { dom, w, q, qa, click, change, input, route, data, errors };
}
test("首页及全部路由可渲染，中文导航与内容无脚本异常", async () => {
  const t = setup();
  try {
    assert.match(t.q("h1").textContent, /更大的/);
    assert.equal(t.qa(".journey-card").length, 4);
    for (const route of [
      "life",
      "guide",
      "schools",
      "activities",
      "essays",
      "plan",
      "resources",
      "quiz",
      "guide/exams",
      "guide/college",
      "guide/route",
      "unknown",
    ]) {
      await t.route(route);
      assert.ok(t.q("#main h1"), route + " 无标题");
      assert.equal(t.qa("#main script").length, 0);
      for (const a of t.qa('a[target="_blank"]'))
        assert.ok(a.rel.includes("noopener"));
    }
    assert.deepEqual(t.errors, []);
  } finally {
    t.dom.window.close();
  }
});
test("学校库搜索与筛选、收藏、三校限制及对比表可操作", async () => {
  const t = setup();
  try {
    await t.route("schools");
    assert.equal(t.qa(".school-card").length, 12);
    t.input("#school-search", "Exeter");
    assert.equal(t.qa(".school-card").length, 1);
    t.input("#school-search", "");
    t.change("#style-filter", "IB 路径");
    assert.equal(t.qa(".school-card").length, 1);
    t.change("#style-filter", "全部");
    t.click('[data-action="save-school"][data-id="exeter"]');
    assert.deepEqual(t.data().saved, ["exeter"]);
    t.click('[data-action="saved-filter"]');
    assert.equal(t.qa(".school-card").length, 1);
    t.click('[data-action="saved-filter"]');
    for (const id of ["exeter", "andover", "choate", "cate"])
      t.click(`[data-action="compare-add"][data-id="${id}"]`);
    assert.equal(t.data().compare.length, 3);
    assert.equal(t.q('[data-action="compare"]').disabled, false);
    t.click('[data-action="compare"]');
    assert.ok(t.q("#modal").open);
    assert.equal(t.qa(".compare-table thead th").length, 4);
    t.click('[data-action="close"]');
    t.click('[data-action="school"][data-id="exeter"]');
    assert.match(t.q("#modal").textContent, /71,797/);
    assert.deepEqual(t.errors, []);
  } finally {
    t.dom.window.close();
  }
});
test("任务勾选会持久化，筛选生效，改变年份会更新计划", async () => {
  const t = setup();
  try {
    await t.route("plan");
    assert.equal(t.qa("[data-task]").length, 18);
    t.change('[data-task="talk"]', true);
    assert.deepEqual(t.data().done, ["talk"]);
    t.click('[data-action="plan-filter"][data-id="pending"]');
    assert.equal(t.qa("[data-task]").length, 17);
    t.click('[data-action="plan-filter"][data-id="妈妈"]');
    assert.equal(t.q('[data-task="english"]'), null);
    assert.ok(t.q('[data-task="budget"]'));
    t.click('[data-action="profile"]');
    t.q('[name="year"]').value = "2030";
    t.q('[name="grade"]').value = "9";
    t.q("#profile-form").dispatchEvent(
      new t.w.Event("submit", { bubbles: true, cancelable: true }),
    );
    assert.equal(t.data().year, 2030);
    assert.equal(t.data().grade, 9);
    assert.match(t.q(".page-heading").textContent, /2030/);
    assert.match(t.q(".plan-timeline").textContent, /2029/);
    assert.deepEqual(t.errors, []);
  } finally {
    t.dom.window.close();
  }
});
test("文书草稿保存、计词并转义用户 HTML，家长陈述可切换", async () => {
  const t = setup();
  try {
    await t.route("essays");
    t.input(
      '[data-essay="draft"]',
      "My real story has five words. <img src=x onerror=alert(1)>",
    );
    t.input('[data-essay="moment"]', "真实细节");
    t.w.dispatchEvent(new t.w.Event("pagehide"));
    assert.match(t.data().essay.draft, /My real story/);
    assert.match(t.q("#word-count").textContent, /英文词/);
    t.click('[data-action="essay-tab"][data-id="parent"]');
    t.input('[data-essay="parent"]', "妈妈看到她学会了倾听。");
    t.click('[data-action="essay-tab"][data-id="student"]');
    assert.match(t.q('[data-essay="draft"]').value, /<img/);
    assert.equal(t.q(".essay-editor img"), null);
    assert.equal(t.q('[data-essay="moment"]').value, "真实细节");
    assert.equal(t.data().essay.parent, "妈妈看到她学会了倾听。");
    assert.deepEqual(t.errors, []);
  } finally {
    t.dom.window.close();
  }
});
test("家庭探索根据未确定项生成下一步，不给录取分数", async () => {
  const t = setup();
  try {
    await t.route("quiz");
    for (let i = 0; i < 5; i++)
      t.change(
        `[name="quiz-${i}"][value="${i === 0 ? "unsure" : "yes"}"]`,
        true,
      );
    assert.match(t.q("#quiz-result").textContent, /自己的意愿/);
    assert.match(t.q("#quiz-result h2").textContent, /多一点时间/);
    assert.equal(Object.keys(t.data().quiz).length, 5);
    assert.ok(t.q("#quiz-result .button"));
    assert.deepEqual(t.errors, []);
  } finally {
    t.dom.window.close();
  }
});
test("全局检索、术语搜索、预算及移动导航可操作", async () => {
  const t = setup();
  try {
    t.click('[data-action="search"]');
    t.input("#global-search", "托福");
    assert.match(t.q("#search-results").textContent, /考试怎么选/);
    t.click(".search-result");
    await tick();
    assert.match(t.q("#main h1").textContent, /考试/);
    await t.route("resources");
    t.input("#glossary-search", "ESL");
    assert.equal(t.qa(".glossary-row").length, 1);
    await t.route("plan");
    t.click('[data-action="budget"]');
    assert.match(t.q("#budget-totals").textContent, /110,000/);
    t.input("#budget-tuition", "90000");
    assert.match(t.q("#budget-totals").textContent, /120,000/);
    t.click('[data-action="close"]');
    t.click(".mobile-menu");
    assert.ok(t.w.document.body.classList.contains("nav-open"));
    await t.route("home");
    assert.ok(!t.w.document.body.classList.contains("nav-open"));
    t.click('[data-action="view"]');
    assert.equal(t.data().view, "student");
    assert.match(t.q(".home-welcome").textContent, /属于你/);
    assert.deepEqual(t.errors, []);
  } finally {
    t.dom.window.close();
  }
});
test("损坏的数据不会阻止启动，图片失败时逐级回退", () => {
  const t = setup({ saved: ["x"], done: ["bad"], essay: { draft: 4 } });
  try {
    assert.ok(t.q("#main h1"));
    const img = t.q("[data-remote]");
    img.dispatchEvent(new t.w.Event("error"));
    assert.ok(img.src.startsWith("https://"));
    img.dispatchEvent(new t.w.Event("error"));
    assert.ok(img.src.endsWith("assets/photo-fallback.svg"));
    assert.deepEqual(t.errors, []);
  } finally {
    t.dom.window.close();
  }
});
test("本机备份经过确认后恢复，异常文件不覆盖记录", async () => {
  const t = setup({ saved: ["exeter"] });
  try {
    t.click('[data-action="data"]');
    const file = {
      size: 100,
      text: async () =>
        JSON.stringify({
          app: "yuanxing",
          version: 1,
          data: {
            year: 2030,
            saved: ["cate"],
            done: ["talk"],
            essay: { draft: "Restored story." },
          },
        }),
    };
    Object.defineProperty(t.q("#import-data"), "files", { value: [file] });
    t.q("#import-data").dispatchEvent(
      new t.w.Event("change", { bubbles: true }),
    );
    await tick();
    assert.match(t.q("#modal").textContent, /确认恢复/);
    assert.deepEqual(t.data().saved, ["exeter"]);
    t.click("#confirm-import");
    assert.deepEqual(t.data().saved, ["cate"]);
    assert.equal(t.data().year, 2030);
    assert.equal(t.data().essay.draft, "Restored story.");
    t.click('[data-action="data"]');
    Object.defineProperty(t.q("#import-data"), "files", {
      value: [{ size: 10, text: async () => "{broken json" }],
    });
    t.q("#import-data").dispatchEvent(
      new t.w.Event("change", { bubbles: true }),
    );
    await tick();
    assert.deepEqual(t.data().saved, ["cate"]);
    assert.match(t.q("#toast").textContent, /无法读取/);
    assert.deepEqual(t.errors, []);
  } finally {
    t.dom.window.close();
  }
});
test("样式能被 CSS 解析器读取，包含手机与减少动态效果布局", () => {
  const t = setup();
  try {
    const css = fs.readFileSync(
      new URL("../styles.css", import.meta.url),
      "utf8",
    );
    const style = t.w.document.createElement("style");
    style.textContent = css;
    t.w.document.head.append(style);
    assert.ok(style.sheet.cssRules.length > 100);
    assert.match(css, /max-width:\s*560px/);
    assert.match(css, /prefers-reduced-motion/);
    assert.deepEqual(t.errors, []);
  } finally {
    t.dom.window.close();
  }
});

test("准备档案建议说明原因，旧记录和草稿保留", async () => {
  const t = setup({
    saved: ["exeter"],
    done: ["talk"],
    essay: { draft: "Old story" },
  });
  try {
    t.click('[data-action="profile"]');
    t.q('[name="reading"]').value = "developing";
    t.q('[name="discussion"]').value = "practicing";
    t.q('[name="interests"]').value = "绘画与观察";
    t.q('[name="hours"]').value = "6";
    t.q("#profile-form").dispatchEvent(
      new t.w.Event("submit", { bubbles: true, cancelable: true }),
    );
    assert.equal(t.data().profile.hours, 6);
    assert.deepEqual(t.data().saved, ["exeter"]);
    assert.equal(t.data().essay.draft, "Old story");
    assert.deepEqual(t.data().done, ["talk"]);
    assert.match(t.q(".profile-suggestions").textContent, /阅读仍需支持/);
    assert.equal(t.qa("#dashboard-tasks [data-task]").length, 3);
    assert.equal(t.q('#dashboard-tasks [data-task="talk"]'), null);
  } finally {
    t.dom.window.close();
  }
});
test("家庭任务支持负责人、目标日期和备注，勾选不丢失焦点", async () => {
  const t = setup();
  try {
    await t.route("plan");
    t.click('[data-action="task-edit"][data-id="talk"]');
    t.q('[name="who"]').value = "妹妹";
    t.q('[name="date"]').value = "2027-03-20";
    t.q('[name="note"]').value = "先写下三件期待";
    t.q("#task-form").dispatchEvent(
      new t.w.Event("submit", { bubbles: true, cancelable: true }),
    );
    assert.equal(t.data().taskMeta.talk.who, "妹妹");
    assert.equal(t.data().taskMeta.talk.date, "2027-03-20");
    assert.match(t.q(".plan-timeline").textContent, /家庭目标：2027-03-20/);
    const checkbox = t.q('[data-task="talk"]');
    checkbox.focus();
    checkbox.click();
    assert.strictEqual(t.q('[data-task="talk"]'), checkbox);
    assert.strictEqual(t.w.document.activeElement, checkbox);
    assert.match(checkbox.closest(".task-item").className, /complete/);
    assert.equal(t.data().done[0], "talk");
    assert.equal(t.data().taskMeta.talk.note, "先写下三件期待");
  } finally {
    t.dom.window.close();
  }
});
test("选校笔记自动保存并转义；逐项事实标明来源、适用年份与状态", async () => {
  const t = setup();
  try {
    await t.route("schools");
    t.click('[data-action="school"][data-id="nmh"]');
    assert.equal(t.qa(".school-fact").length, 8);
    assert.match(t.q(".school-facts").textContent, /InitialView/);
    assert.match(t.q(".school-facts").textContent, /尚未核实/);
    t.input(
      '[data-school-note="questions"]',
      "假期如何安排？ <img src=x onerror=alert(1)>",
    );
    assert.match(t.data().schoolNotes.nmh.questions, /假期/);
    t.click('[data-action="close"]');
    t.click('[data-action="school"][data-id="nmh"]');
    assert.match(t.q('[data-school-note="questions"]').value, /<img/);
    assert.equal(t.q(".school-notebook img"), null);
  } finally {
    t.dom.window.close();
  }
});
test("生活搜索直达小节，长指南记住展开位置并支持大字号", async () => {
  const t = setup();
  try {
    t.click('[data-action="search"]');
    t.input("#global-search", "室友");
    const target = t
      .qa(".search-result")
      .find((e) => e.dataset.route === "#life/boarding");
    assert.ok(target);
    target.click();
    await tick();
    assert.equal(t.w.location.hash, "#life/boarding");
    assert.match(t.q(".life-learning-sheet").textContent, /宿舍/);
    t.click('[data-action="life-tab"][data-id="weekend"]');
    await tick();
    assert.equal(t.w.location.hash, "#life/weekend");
    assert.match(t.q(".life-learning-sheet h2").textContent, /周末/);
    await t.route("guide/exams");
    const chapter = t.q("#section-3");
    chapter.open = true;
    chapter.dispatchEvent(new t.w.Event("toggle"));
    assert.equal(t.data().reading.exams, 3);
    t.click('[data-action="font"]');
    assert.equal(t.w.document.documentElement.dataset.font, "large");
    assert.equal(t.data().font, "large");
    await t.route("home");
    await t.route("guide/exams");
    assert.equal(t.q("#section-3").open, true);
    assert.ok(
      t
        .qa(".reader-toolbar button")
        .some((b) => b.textContent.includes("继续上次")),
    );
  } finally {
    t.dom.window.close();
  }
});
test("每次输入立即保存；存储失败明确提示且保留输入", async () => {
  const t = setup();
  try {
    await t.route("essays");
    t.input('[data-essay="draft"]', "Saved immediately.");
    assert.equal(t.data().essay.draft, "Saved immediately.");
    t.w.Storage.prototype.setItem = function () {
      throw Error("quota");
    };
    t.input('[data-essay="draft"]', "Keep this unsaved text.");
    assert.equal(t.q('[data-essay="draft"]').value, "Keep this unsaved text.");
    assert.match(t.q("#save-status").textContent, /保存失败/);
    assert.match(t.q("#toast").textContent, /本次打开/);
  } finally {
    t.dom.window.close();
  }
});

test("新版等待用户确认，保存成功才发送接管消息", async () => {
  let windowRef,
    messages = [];
  const registration = {
    waiting: {
      postMessage(message) {
        messages.push(message.type);
        assert.equal(
          JSON.parse(windowRef.localStorage.getItem("yuanxing.v1")).essay.draft,
          "Before update.",
        );
      },
    },
    addEventListener() {},
  };
  const t = setup(
    {},
    {
      controller: {},
      register: async () => registration,
      addEventListener() {},
    },
  );
  windowRef = t.w;
  try {
    await t.route("essays");
    assert.ok(t.q("#update-banner"));
    assert.equal(messages.length, 0);
    t.input('[data-essay="draft"]', "Before update.");
    t.click("#update-banner button");
    assert.deepEqual(messages, ["ACTIVATE_UPDATE"]);
    messages = [];
    t.w.Storage.prototype.setItem = function () {
      throw Error("quota");
    };
    t.click("#update-banner button");
    assert.equal(messages.length, 0);
    assert.match(t.q("#toast").textContent, /保存未成功/);
  } finally {
    t.dom.window.close();
  }
});
test("生活页返回默认课堂，探索回答不重建输入节点", async () => {
  const t = setup();
  try {
    await t.route("life");
    t.click('[data-action="life-tab"][data-id="help"]');
    await tick();
    assert.match(t.q(".life-learning-sheet h2").textContent, /困难/);
    await t.route("life");
    assert.match(t.q(".life-learning-sheet h2").textContent, /课堂/);
    await t.route("quiz");
    const radio = t.q('[name="quiz-0"][value="yes"]');
    radio.focus();
    radio.click();
    assert.strictEqual(t.q('[name="quiz-0"][value="yes"]'), radio);
    assert.strictEqual(t.w.document.activeElement, radio);
  } finally {
    t.dom.window.close();
  }
});
