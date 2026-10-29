import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const context = { window: {} };
vm.runInNewContext(
  fs.readFileSync(new URL("../content.js", import.meta.url), "utf8"),
  context,
);
vm.runInNewContext(
  fs.readFileSync(new URL("../core.js", import.meta.url), "utf8"),
  context,
);
vm.runInNewContext(
  fs.readFileSync(new URL("../enrichment.js", import.meta.url), "utf8"),
  context,
);
const { GUIDE: G, YX: C } = context.window;
test("校库、任务、官方来源和图片引用完整", () => {
  assert.equal(G.schools.length, 12);
  assert.equal(new Set(G.schools.map((s) => s.id)).size, 12);
  assert.equal(new Set(G.tasks.map((t) => t.id)).size, G.tasks.length);
  for (const s of G.schools) {
    assert.ok(G.photos[s.photo], s.id + " 图片缺失");
    for (const key of ["url", "admission", "academic", "fee"])
      assert.equal(new URL(s[key]).protocol, "https:");
    for (const key of [
      "summary",
      "fit",
      "watch",
      "testing",
      "cost",
      "deadline",
    ])
      assert.ok(typeof s[key] === "string" && s[key].trim(), s.id + " " + key);
    assert.ok(
      s.photo === "campus" ||
        s.id === "andover" ||
        s.id === "exeter" ||
        s.illustrative,
    );
  }
  for (const a of Object.values(G.articles)) {
    assert.ok(a.sections.length >= 4);
    assert.ok(a.sources.length);
  }
  assert.equal(G.schools.find((s) => s.id === "exeter").rank, 1);
  assert.equal(G.schools.find((s) => s.id === "choate").rank, 6);
});
test("用户备份经过验证：拒绝未知 ID、非法年份、重复值与多余对比", () => {
  const result = C.normalize(
    {
      year: 100,
      grade: "9",
      saved: ["exeter", "evil", "exeter"],
      compare: ["exeter", "andover", "choate", "cate"],
      done: ["talk", "fake", "talk"],
      essay: { draft: 123, parent: "真实草稿" },
      quiz: { 0: "maybe", 1: "yes" },
    },
    G,
  );
  assert.equal(result.year, 2028);
  assert.equal(result.grade, 10);
  assert.deepEqual([...result.saved], ["exeter"]);
  assert.equal(result.compare.length, 3);
  assert.deepEqual([...result.done], ["talk"]);
  assert.equal(result.essay.draft, "");
  assert.equal(result.essay.parent, "真实草稿");
  assert.equal(result.quiz[0], undefined);
  assert.equal(result.quiz[1], "yes");
  assert.equal(C.normalize(null, G).view, "parent");
});
test("入学年更新时间线，保留正确的申请学年", () => {
  const stages = C.timeline(2028);
  assert.equal(stages.length, 5);
  assert.match(stages[2].date, /2027/);
  assert.match(stages[3].date, /2028/);
  assert.match(C.timeline(2030)[4].date, /2030/);
});
test("学校筛选可组合地区、课程、关键词和收藏", () => {
  assert.equal(C.filterSchools(G.schools, { query: "Exeter" }).length, 1);
  assert.equal(C.filterSchools(G.schools, { query: "加利福尼亚" }).length, 1);
  assert.equal(
    C.filterSchools(G.schools, { style: "IB 路径" })[0].id,
    "george",
  );
  assert.equal(
    C.filterSchools(G.schools, { style: "英语支持" })[0].id,
    "cushing",
  );
  assert.equal(
    C.filterSchools(G.schools, { savedOnly: true, saved: [] }).length,
    0,
  );
  assert.equal(
    C.filterSchools(G.schools, { query: "库欣", region: "美国西部" }).length,
    0,
  );
  const sorted = C.filterSchools(G.schools, { sort: "rank" });
  assert.equal(sorted[0].id, "exeter");
  assert.equal(sorted.at(-1).rank, null);
});
test("全站检索支持中文、英文以及正文中的主题", () => {
  assert.ok(C.search(G, "托福").some((r) => r.route === "#guide/exams"));
  assert.ok(C.search(G, "想家").length > 0);
  assert.ok(C.search(G, "ANDOVER").some((r) => r.school === "andover"));
  assert.equal(C.search(G, "   ").length, 0);
  assert.equal(C.search(G, "不可能存在的随机词testxyz").length, 0);
});
test("预算金额不能为负数或非数值，多年合计计算正确", () => {
  const result = C.budget([80000, 3500, 6000, 8000, 5000, 7500]);
  assert.equal(result.annual, 110000);
  assert.equal(result.threeYears, 330000);
  assert.equal(result.fourYears, 440000);
  assert.equal(C.budget([-50, "bad", 100]).annual, 100);
});
test("PWA 预缓存引用的核心文件都存在，图标尺寸与 manifest 一致", () => {
  const source = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");
  const list = vm.runInNewContext(source + ";CORE;", {
    self: { addEventListener() {} },
  });
  for (const file of list)
    assert.ok(
      fs.existsSync(
        new URL("../" + (file === "./" ? "index.html" : file), import.meta.url),
      ),
      file,
    );
  for (const n of [192, 512]) {
    const data = fs.readFileSync(
      new URL(`../assets/icon-${n}.png`, import.meta.url),
    );
    assert.equal(data.readUInt32BE(16), n);
    assert.equal(data.readUInt32BE(20), n);
  }
});

test("第二版可从旧备份迁移，拒绝非法日期、字段与笔记 ID", () => {
  const old = C.normalize(
    {
      saved: ["cate"],
      done: ["talk"],
      essay: { draft: "preserve" },
      taskMeta: {
        talk: { who: "invalid", date: "2026-02-31", note: "note" },
        evil: { note: "x" },
      },
      schoolNotes: {
        cate: { like: "喜欢", questions: "问一问" },
        evil: { like: "bad" },
      },
      reading: { exams: 999 },
      font: "large",
    },
    G,
  );
  assert.equal(old.essay.draft, "preserve");
  assert.equal(old.taskMeta.talk.date, "");
  assert.equal(old.taskMeta.talk.who, "全家");
  assert.equal(old.taskMeta.evil, undefined);
  assert.equal(old.schoolNotes.evil, undefined);
  assert.equal(old.schoolNotes.cate.like, "喜欢");
  assert.equal(old.reading.exams, undefined);
  assert.equal(old.font, "large");
  assert.equal(old.profile.hours, 3);
});
test("12 所学校逐项事实有来源与状态，不将未来轮次伪装为已核实", () => {
  for (const s of G.schools) {
    assert.equal(G.schoolFacts[s.id].length, 8);
    for (const f of G.schoolFacts[s.id]) {
      assert.ok(
        ["verified", "unverified", "estimate", "unpublished"].includes(
          f.status,
        ),
      );
      assert.equal(new URL(f.source).protocol, "https:");
      assert.ok(f.checked);
      assert.ok(f.year);
      assert.ok(f.text);
    }
    assert.equal(G.schoolFacts[s.id][0].status, "unverified");
  }
  assert.match(G.schools.find((s) => s.id === "mercersburg").testing, /9\/10/);
  assert.match(
    G.schoolFacts.cushing.find((f) => f.label === "面试安排").text,
    /12 月 1 日/,
  );
});
test("本周最多三项，已完成项排除，家庭日期优先", () => {
  const state = C.normalize(
    {
      done: ["talk"],
      taskMeta: { offers: { date: "2026-11-01", who: "全家" } },
    },
    G,
  );
  const tasks = C.nextTasks(state, G);
  assert.equal(tasks.length, 3);
  assert.equal(tasks[0].id, "offers");
  assert.ok(!tasks.some((t) => t.id === "talk"));
  assert.ok(C.suggestions(state).every((x) => x.reason));
});
