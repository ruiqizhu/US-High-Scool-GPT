/* 无依赖的规划与筛选逻辑，也供 Node 测试。 */
(function (root) {
  "use strict";
  const defaults = {
    year: 2028,
    grade: 10,
    view: "parent",
    saved: [],
    compare: [],
    done: [],
    essay: {},
    quiz: {},
  };
  function normalize(raw, guide) {
    const value = raw && typeof raw === "object" ? raw : {};
    const schoolIds = new Set(guide.schools.map((s) => s.id));
    const taskIds = new Set(guide.tasks.map((t) => t.id));
    const unique = (list, ids) =>
      Array.isArray(list) ? [...new Set(list.filter((id) => ids.has(id)))] : [];
    const essay = {};
    for (const key of ["moment", "action", "reflection", "draft", "parent"]) {
      essay[key] =
        typeof value.essay?.[key] === "string"
          ? value.essay[key].slice(0, 30000)
          : "";
    }
    const quiz = {};
    guide.quiz.forEach((_, i) => {
      if (["yes", "unsure", "no"].includes(value.quiz?.[i]))
        quiz[i] = value.quiz[i];
    });
    const clean = (v, max = 3000) =>
      typeof v === "string" ? v.slice(0, max) : "";
    const taskMeta = {},
      schoolNotes = {},
      reading = {};
    const date = (v) =>
      typeof v === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(v) &&
      !isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v
        ? v
        : "";
    for (const id of taskIds) {
      const m = value.taskMeta?.[id];
      if (m)
        taskMeta[id] = {
          who: ["妈妈", "妹妹", "全家"].includes(m.who)
            ? m.who
            : guide.tasks.find((t) => t.id === id).who,
          date: date(m.date),
          note: clean(m.note),
        };
    }
    for (const id of schoolIds) {
      const n = value.schoolNotes?.[id];
      if (n)
        schoolNotes[id] = {
          like: clean(n.like),
          concern: clean(n.concern),
          questions: clean(n.questions),
        };
    }
    for (const [id, n] of Object.entries(value.reading || {})) {
      if (
        guide.articles[id] &&
        Number.isInteger(n) &&
        n >= 0 &&
        n < guide.articles[id].sections.length
      )
        reading[id] = n;
    }
    const level = (v) =>
      ["developing", "practicing", "ready"].includes(v) ? v : "";
    return {
      year:
        Number.isInteger(value.year) && value.year >= 2027 && value.year <= 2032
          ? value.year
          : defaults.year,
      grade: value.grade === 9 ? 9 : 10,
      view: value.view === "student" ? "student" : "parent",
      saved: unique(value.saved, schoolIds),
      compare: unique(value.compare, schoolIds).slice(0, 3),
      done: unique(value.done, taskIds),
      essay,
      quiz,
      profile: {
        reading: level(value.profile?.reading),
        discussion: level(value.profile?.discussion),
        interests: clean(value.profile?.interests, 500),
        hours: [3, 6, 10].includes(value.profile?.hours)
          ? value.profile.hours
          : 3,
      },
      taskMeta,
      schoolNotes,
      reading,
      font: value.font === "large" ? "large" : "standard",
      lastBackup: clean(value.lastBackup, 50),
    };
  }
  function timeline(year) {
    return [
      {
        title: "认识自己，打好基础",
        date: `现在 — ${year - 1} 年 2 月`,
        label: "启程",
        desc: "了解美高、诊断英语、比较年级，开始持续的兴趣探索。",
      },
      {
        title: "探索学校，积累能力",
        date: `${year - 1} 年 3 — 8 月`,
        label: "探索",
        desc: "建立校单，提升阅读写作，规划预算与必要的体验。",
      },
      {
        title: "启动申请，准备材料",
        date: `${year - 1} 年 9 — 11 月`,
        label: "准备",
        desc: "核对当轮政策、预约面试、考试送分并联系老师。",
      },
      {
        title: "完成文书，递交申请",
        date: `${year - 1} 年 12 月 — ${year} 年 2 月`,
        label: "申请",
        desc: "按各校日期提交，确认成绩、推荐与送分都已收到。",
      },
      {
        title: "选择学校，准备出发",
        date: `${year} 年 3 — 8 月`,
        label: "出发",
        desc: "比较结果、确定就读，再办理签证、住宿和行前事项。",
      },
    ];
  }
  function filterSchools(
    schools,
    {
      query = "",
      region = "全部",
      style = "全部",
      savedOnly = false,
      saved = [],
      sort = "featured",
    } = {},
  ) {
    const q = query.trim().toLocaleLowerCase();
    const result = schools.filter(
      (s) =>
        (!q ||
          [s.name, s.en, s.state, s.city, ...s.tags]
            .join(" ")
            .toLocaleLowerCase()
            .includes(q)) &&
        (region === "全部" || s.region === region) &&
        (style === "全部" ||
          (style === "英语支持"
            ? s.support === "设有 ESL 课程"
            : s.style === style)) &&
        (!savedOnly || saved.includes(s.id)),
    );
    if (sort === "rank")
      result.sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999));
    if (sort === "name") result.sort((a, b) => a.en.localeCompare(b.en));
    return result;
  }
  function search(guide, query) {
    const q = query.trim().toLocaleLowerCase();
    if (!q) return [];
    return [
      ...Object.entries(guide.articles).map(([id, a]) => ({
        kind: "指南",
        title: a.title,
        text: [
          a.intro,
          ...a.sections.map(
            (s) =>
              s.title + " " + (s.text || "") + " " + (s.list || []).join(" "),
          ),
        ].join(" "),
        route: "#guide/" + id,
      })),
      ...guide.schools.map((s) => ({
        kind: "学校",
        title: s.name + " · " + s.en,
        text: [
          s.state,
          s.city,
          s.summary,
          s.support,
          s.testing,
          s.watch,
          s.tags.join(" "),
        ].join(" "),
        school: s.id,
      })),
      ...guide.videos.map((v, i) => ({
        kind: "视频与资源",
        title: v.title,
        text: v.desc,
        video: i,
      })),
      ...guide.glossary.map((g) => ({
        kind: "术语",
        title: g[0] + " · " + g[1],
        text: g[2],
        route: "#resources",
      })),
      ...guide.quiz.map((q) => ({
        kind: "家庭探索",
        title: q.topic,
        text: q.q + " " + q.action,
        route: "#quiz",
      })),
      ...(guide.lifeLessons || []).map((l) => ({
        kind: "校园生活",
        title: l.title,
        text: [
          l.summary,
          ...l.points,
          l.practice,
          guide.lifeSearchText?.[l.id] || "",
        ].join(" "),
        route: "#life/" + l.id,
      })),
    ]
      .filter((item) =>
        (item.title + " " + item.text).toLocaleLowerCase().includes(q),
      )
      .slice(0, 30)
      .map((item) => {
        const at = item.text.toLocaleLowerCase().indexOf(q);
        return {
          ...item,
          excerpt: item.text.slice(
            Math.max(0, at - 35),
            Math.max(0, at - 35) + 160,
          ),
        };
      });
  }
  function budget(values) {
    const numbers = values.map((v) =>
      Math.max(0, Math.min(500000, Number(v) || 0)),
    );
    const annual = numbers.reduce((a, b) => a + b, 0);
    return { annual, threeYears: annual * 3, fourYears: annual * 4 };
  }
  function suggestions(state) {
    const p = state.profile,
      result = [];
    if (!p.reading || !p.discussion)
      result.push({
        title: "先了解自己的英语起点",
        reason: "阅读与讨论自评还未填写。先做能力诊断，再决定备考量。",
        task: "english",
      });
    if (p.reading === "developing")
      result.push({
        title: "从能读懂的短文开始",
        reason: "你选择了阅读仍需支持：每次 15 分钟，标注一个观点和两条证据。",
        task: "reading",
      });
    if (p.discussion === "developing" || p.discussion === "practicing")
      result.push({
        title: "每周练习一次自然讨论",
        reason: "根据你的讨论自评，先练习提问和回应；不急着背面试稿。",
        task: "english",
      });
    if (p.interests)
      result.push({
        title: "把一个兴趣变成持续行动",
        reason:
          "你记录了「" +
          p.interests.slice(0, 55) +
          "」。选一件每周能推进的小事，保存过程与反思。",
        task: "activity",
      });
    result.push({
      title: "比较两条年级路线",
      reason:
        state.grade === 10
          ? "目标是 10 年级：优先问清新生名额、学分和适应支持。"
          : "目标是 9 年级：优先核实年龄条件，并比较多一年时间与费用。",
      task: "grade",
    });
    result.push({
      title: "给本周留一点余量",
      reason:
        "每周约 " +
        p.hours +
        " 小时：" +
        (p.hours === 3
          ? "以英语基础和一项小任务为主。"
          : "把时间分给英语、兴趣与学校研究，保留休息。"),
      task: "talk",
    });
    return result;
  }
  function nextTasks(state, guide) {
    return guide.tasks
      .filter((t) => !state.done.includes(t.id))
      .sort((a, b) => {
        const da = state.taskMeta[a.id]?.date,
          db = state.taskMeta[b.id]?.date;
        return da && db
          ? da.localeCompare(db)
          : da
            ? -1
            : db
              ? 1
              : a.stage - b.stage;
      })
      .slice(0, 3);
  }
  root.YX = {
    defaults,
    normalize,
    timeline,
    filterSchools,
    search,
    budget,
    suggestions,
    nextTasks,
  };
})(typeof window === "undefined" ? globalThis : window);
