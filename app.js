(function () {
  "use strict";
  const G = window.GUIDE,
    C = window.YX,
    KEY = "yuanxing.v1";
  let raw = {};
  try {
    raw = JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    /* 损坏或禁用的存储不阻止阅读 */
  }
  let state = C.normalize(raw, G);
  let filters = {
    query: "",
    region: "全部",
    style: "全部",
    sort: "featured",
    savedOnly: false,
  };
  let activeLife = "class",
    activeEssay = "student",
    activePlan = "all";
  let saveTimer, toastTimer, previousFocus;
  let storageFailed = false;
  const icons = {
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5Z"/>',
    book: '<path d="M12 5C8 2 3 4 3 4v15s5-2 9 1c4-3 9-1 9-1V4s-5-2-9 1Z"/><path d="M12 5v15"/>',
    school:
      '<path d="m2 9 10-6 10 6-10 6Z"/><path d="M6 12v6q6 5 12 0v-6M22 9v8"/>',
    leaf: '<path d="M20 3C9 2 2 7 4 15s15 7 16-12Z"/><path d="M4 21 15 10"/>',
    pen: '<path d="m16 3 5 5-12 12-6 1 1-6Z"/><path d="m13 6 5 5"/>',
    calendar:
      '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 11h18m-13 5h2m4 0h2"/>',
    play: '<path d="m9 6 10 6-10 6Z"/><circle cx="12" cy="12" r="10"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    external:
      '<path d="M14 3h7v7m0-7L11 13M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    heart:
      '<path d="M20 5c-3-3-7-1-8 1-2-3-6-4-9-1-6 7 9 15 9 15s14-9 8-15Z"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-11v1"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    globe:
      '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3q8 9 0 18-8-9 0-18Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l1.5 1.5m13 13L20 20M4 20l1.5-1.5m13-13L20 4"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    compare: '<path d="M7 4v16M17 4v16M3 8h8m2 8h8M4 4h6m4 16h6"/>',
    spark: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/>',
    money:
      '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M5 9h1m12 6h1"/>',
    coffee:
      '<path d="M4 8h13v9a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4ZM17 9h2a3 3 0 0 1 0 6h-2M7 2v3m5-3v3"/>',
  };
  const icon = (name, cls = "") =>
    `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.compass}</svg>`;
  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (ch) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[ch],
    );
  const ext = (url, label, cls = "source-link") =>
    `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label}${icon("external")}</a>`;
  function photo(name, cls = "", eager = false) {
    const p = G.photos[name] || G.photos.campus;
    const local = (window.PHOTO_LOCAL || []).includes(name);
    return `<img class="${cls}" src="${local ? `assets/photos/${name}.jpg` : esc(p.url)}" data-remote="${esc(p.url)}" data-attempted="${local ? "" : "true"}" alt="${esc(p.alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
  }
  const link = (route, label, cls = "text-link") =>
    `<a class="${cls}" href="#${route}">${label}${icon("arrow")}</a>`;
  const tags = (list) =>
    list.map((t) => `<span class="tag">${esc(t)}</span>`).join("");
  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      storageFailed = false;
      return true;
    } catch {
      if (!storageFailed)
        toast("浏览器未允许保存。当前修改仅在本次打开期间保留。");
      storageFailed = true;
      return false;
    }
  }
  function toast(message) {
    const el = document.getElementById("toast");
    el.textContent = message;
    el.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("visible"), 3200);
  }
  const nav = [
    ["home", "home", "启程首页"],
    ["life", "book", "认识美国高中"],
    ["guide", "compass", "申请全指南"],
    ["schools", "school", "探索学校"],
    ["activities", "leaf", "成长与活动"],
    ["essays", "pen", "文书工作室"],
    ["plan", "calendar", "我的准备计划"],
    ["resources", "play", "视频与资源"],
  ];
  function current() {
    const hash = location.hash.slice(1) || "home";
    const [page, sub] = hash.split("/");
    return {
      page: nav.some((n) => n[0] === page) || page === "quiz" ? page : "home",
      sub,
    };
  }
  function shell() {
    document.getElementById("app").innerHTML = `
      <aside class="sidebar" id="sidebar" aria-label="主导航">
        <a class="brand" href="#home"><img src="assets/icon.svg" width="39" height="39" alt=""><span>远行<small>美高成长指南</small></span></a>
        <div class="sidebar-caption">一起，准备下一段成长</div>
        <nav>${nav.map(([id, i, label]) => `<a href="#${id}" data-nav="${id}">${icon(i)}<span>${label}</span>${id === "plan" ? '<span class="nav-dot"></span>' : ""}</a>`).join("")}</nav>
        <div class="sidebar-bottom"><div class="sidebar-note">${icon("leaf")}<span>好的教育，<br>始于更了解自己。</span></div><button class="sidebar-help" data-action="article" data-id="parent">${icon("user")} 给妈妈的小指南 ${icon("chevron")}</button><p>中文内容 · 官方来源 · 用心陪伴</p></div>
      </aside>
      <button class="nav-scrim" data-action="menu" aria-label="关闭导航"></button>
      <div class="workspace"><header class="topbar"><div class="topbar-left"><button class="mobile-menu icon-button" data-action="menu" aria-label="打开导航" aria-controls="sidebar" aria-expanded="false">${icon("menu")}</button><a class="mobile-brand" href="#home">${icon("compass")}远行</a><div class="breadcrumb">我们的美高之旅 <span>/</span> <strong id="breadcrumb">启程首页</strong></div></div><div class="topbar-right"><button class="font-control" data-action="font" aria-label="切换阅读字号">${state.font === "large" ? "标准字" : "大字"}</button><button class="search-trigger" data-action="search" aria-label="搜索学校、申请与生活">${icon("search")}<span>搜一搜，找到答案</span><kbd>⌘ K</kbd></button><button class="view-switch" data-action="view" aria-label="切换家长或学生视角"><span class="avatar">${state.view === "parent" ? "妈" : "我"}</span><span id="view-label">${state.view === "parent" ? "家长视角" : "学生视角"}</span>${icon("down")}</button></div></header>
      <main id="main" tabindex="-1"></main><footer class="footer"><a class="footer-brand" href="#home">远行 <span>·</span> 和家人一起，看见更多可能。</a><div>资料核对：2026.10.28 <span>·</span><button data-action="sources">来源与使用说明</button><span>·</span><button data-action="data">本机数据</button></div></footer></div>
      <nav class="mobile-tabs" aria-label="手机快捷导航">${[
        ["home", "home", "首页"],
        ["schools", "school", "选校"],
        ["life", "book", "校园生活"],
        ["plan", "calendar", "计划"],
        ["resources", "play", "资源"],
      ]
        .map(
          ([id, i, t]) =>
            `<a href="#${id}" data-nav="${id}">${icon(i)}<span>${t}</span></a>`,
        )
        .join("")}</nav>`;
  }
  function heading(kicker, title, desc, aside = "") {
    return `<div class="page-heading"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1><p>${desc}</p></div>${aside}</div>`;
  }
  function sectionHeading(kicker, title, route, label = "查看全部") {
    return `<div class="section-heading"><div>${kicker ? `<span class="eyebrow">${kicker}</span>` : ""}<h2>${title}</h2></div>${route ? link(route, label) : ""}</div>`;
  }
  function note(text, kind = "sage") {
    return `<div class="note ${kind}">${icon("info")}<div>${text}</div></div>`;
  }
  function schoolCard(s, compact = false) {
    return `<article class="school-card ${compact ? "compact" : ""}"><div class="school-photo">${photo(s.photo)}<span class="photo-badge">${s.illustrative ? "学习氛围配图" : "校园实景"}</span><button class="save-school icon-button ${state.saved.includes(s.id) ? "saved" : ""}" data-action="save-school" data-id="${s.id}" aria-pressed="${state.saved.includes(s.id)}" aria-label="${state.saved.includes(s.id) ? "取消收藏" : "收藏"}${s.name}">${icon("heart")}</button></div><div class="school-card-body"><div class="school-location">${icon("pin")}${s.city} · ${s.abbr}${s.rank ? `<span class="rank">Niche #${s.rank}</span>` : ""}</div><button class="school-title" data-action="school" data-id="${s.id}"><h3>${s.name}</h3><span>${s.en}</span></button><div class="tags">${tags(s.tags.slice(0, 2))}</div>${compact ? "" : `<p>${s.summary}</p>`}<div class="school-card-footer"><button class="text-link" data-action="school" data-id="${s.id}">了解这所学校${icon("arrow")}</button><button class="compare-button ${state.compare.includes(s.id) ? "selected" : ""}" data-action="compare-add" data-id="${s.id}" aria-pressed="${state.compare.includes(s.id)}">${icon(state.compare.includes(s.id) ? "check" : "compare")}${state.compare.includes(s.id) ? "已加入" : "对比"}</button></div></div></article>`;
  }
  function taskItem(task, small = false) {
    const m = state.taskMeta[task.id] || {};
    return `<div class="task-row"><label class="task-item ${state.done.includes(task.id) ? "complete" : ""}"><input type="checkbox" data-task="${task.id}" ${state.done.includes(task.id) ? "checked" : ""}><span class="custom-check">${icon("check")}</span><span class="task-copy"><strong>${task.title}</strong>${small ? "" : `<span>${task.detail}</span>`}${m.date ? `<span class="family-date">家庭目标：${esc(m.date)}</span>` : ""}</span><span class="who">${m.who || task.who}</span></label><button class="task-edit" data-action="task-edit" data-id="${task.id}" aria-label="安排：${task.title}">${icon("pen")}<span>安排</span></button></div>`;
  }
  function home() {
    const done = state.done.length,
      percent = Math.round((done / G.tasks.length) * 100);
    return (
      dashboard() +
      `<div class="home-welcome"><div><span class="welcome-dot"></span> ${state.view === "parent" ? "给妈妈和妹妹的成长导航" : "属于你的下一段旅程"}</div><button data-action="profile">${icon("pin")}上海 <span>→</span> 美国${icon("down")}</button></div>
      <section class="hero"><div class="hero-copy"><span class="hero-kicker"><i></i> 去探索，也去成为自己</span><h1>让成长，在更大的<br>世界里<span>发生。</span></h1><p>${state.view === "parent" ? "从上海的课堂，到美国的校园。<br>陪她看清选择，也为每一步做好准备。" : "不只是换一间教室，而是发现新的自己。<br>先看看那里的日常，再决定你想要的成长。"}</p><div class="hero-actions">${link("plan", "开启我的准备计划", "button primary")}${link("life", "先看看美高生活", "button quiet")}</div><div class="hero-foot">${icon("check")}全中文指南 <span>·</span> 为你们的家庭量身梳理</div></div><div class="hero-image">${photo("campus", "", true)}<div class="hero-image-shade"></div><a class="hero-caption" href="${G.photos.campus.source}" target="_blank" rel="noopener noreferrer">${icon("pin")}Phillips Academy Andover <span>马萨诸塞州</span></a><a href="#life" class="hero-floating">${icon("play")}<span>在出发之前，先走进校园<small>发现真实的美高生活</small></span>${icon("arrow")}</a></div></section>
      <section class="profile-strip" aria-label="家庭准备档案"><div class="profile-intro">${icon("user")}<div><strong>我们的出发点</strong><span>每一条路线，都从自己开始</span></div></div><div><span>目前阶段</span><strong>上海 · 初二在读</strong></div><div><span>目标入学</span><strong>${state.year} 年秋季 <em>初三后赴美</em></strong></div><div><span>申请年级</span><strong>${state.grade} 年级 <small>可讨论调整</small></strong></div><div><span>年度预算</span><strong>US$100,000+</strong></div><button class="icon-button profile-edit" data-action="profile" aria-label="调整准备档案">${icon("pen")}</button></section>
      ${note('<strong>先想清楚一个关键选择：</strong>初三毕业后，申请 10 年级，还是从 9 年级开始？这会影响适应时间、申请名额与整体预算。<button class="inline-link" data-action="article" data-id="route">读懂两条路线 ' + icon("arrow") + "</button>", "sand")}
      <section class="section-block">${sectionHeading("YOUR NEXT CHAPTER", "从了解，到从容出发", "guide", "打开申请全指南")}<div class="journey-grid">${[
        [
          "life",
          "book",
          "01",
          "认识美高",
          "课堂、课程、宿舍与周末，<br>看看另一种学习与生活。",
          "sage",
        ],
        [
          "schools",
          "school",
          "02",
          "找到适合的学校",
          "读懂排名背后的差异，<br>从课程与支持出发选校。",
          "blue",
        ],
        [
          "guide/exams",
          "compass",
          "03",
          "准备申请",
          "考试、材料、面试和文书，<br>把复杂的事，一件件理清。",
          "sand",
        ],
        [
          "plan",
          "calendar",
          "04",
          "走好每一步",
          "一份可勾选的家庭计划，<br>让准备有方向，也有节奏。",
          "rose",
        ],
      ]
        .map(
          ([route, i, n, title, desc, color]) =>
            `<a class="journey-card" href="#${route}"><div class="journey-top"><span class="icon-tile ${color}">${icon(i)}</span><span class="step-number">${n}</span></div><h3>${title}${icon("arrow")}</h3><p>${desc}</p></a>`,
        )
        .join("")}</div></section>
      <div class="home-middle"><section class="life-teaser"><div class="life-teaser-photo">${photo("classroom")}<span class="photo-caption">Exeter · Harkness 讨论课堂</span></div><div class="life-teaser-copy"><span class="eyebrow">A DIFFERENT WAY TO LEARN</span><h2>课堂里，不只有<br>老师的声音。</h2><p>带着问题上课，在讨论中形成观点。<br>在美高，学会怎样学习，和学到什么一样重要。</p>${link("life", "走进美高的一天")}</div></section><section class="quiz-teaser"><span class="icon-tile sage">${icon("leaf")}</span><span class="eyebrow">先听听自己的声音</span><h2>美国高中，<br>适合我吗？</h2><p>5 个问题，和妹妹一起认真想一想。<br>没有标准答案，也不急着做决定。</p>${link("quiz", "开始家庭探索", "button outline")}<span class="tiny">约 3 分钟 · 无需注册</span></section></div>
      <section class="section-block">${sectionHeading("FIND YOUR PLACE", "好学校，更要适合她", "schools", "探索 12 所学校")}<div class="school-grid">${[G.schools[0], G.schools[1], G.schools[2]].map((s) => schoolCard(s, true)).join("")}</div><p class="source-note">排名：2027 Niche 全美寄宿高中榜，核对于 2026.10.28。此处为探索起点，非个性化录取评估。<button data-action="rankings">如何看排名？</button></p></section>
      <section class="home-plan section-block"><div class="home-plan-intro"><span class="eyebrow">SMALL STEPS, REAL PROGRESS</span><h2>不必一下子准备好一切。<br>先完成这周的小事。</h2><p>家长协助规划，妹妹慢慢学会自己出发。</p><div class="progress-label"><span>家庭准备进度</span><strong>${done}/${G.tasks.length}</strong></div><div class="progress-track"><span style="width:${percent}%"></span></div>${link("plan", "查看完整准备计划")}</div><div class="home-tasks">${G.tasks
        .slice(0, 3)
        .map((t) => taskItem(t, true))
        .join(
          "",
        )}<div class="local-save">${icon("check")}勾选自动保存在当前设备</div></div></section>
      <section class="parent-banner"><span class="icon-tile">${icon("coffee")}</span><div><h3>妈妈，不懂英文，也可以成为她最好的支持。</h3><p>把资料读懂，把节奏放稳，把表达留给她。</p></div><button class="button outline" data-action="article" data-id="parent">给妈妈的小指南${icon("arrow")}</button></section>`
    );
  }
  const lifeTabs = [
    ["class", "课堂与学习"],
    ["day", "美高的一天"],
    ["boarding", "寄宿与适应"],
    ["weekend", "周末与归属"],
    ["help", "遇到困难"],
    ["college", "通向美国大学"],
  ];
  function life() {
    activeLife = G.lifeLessons.some((l) => l.id === current().sub)
      ? current().sub
      : "class";
    return (
      heading(
        "LIFE, LEARNING & GROWTH",
        "先看看，她将怎样生活。",
        "美高不只是一个申请结果，更是接下来几年的每一天。",
      ) +
      `<div class="tabbar">${lifeTabs.map(([id, t]) => `<button class="${activeLife === id ? "active" : ""}" data-action="life-tab" data-id="${id}" aria-pressed="${activeLife === id}">${t}</button>`).join("")}</div>` +
      (activeLife === "class"
        ? lifeClass()
        : activeLife === "day"
          ? lifeDay()
          : activeLife === "boarding"
            ? lifeBoarding()
            : activeLife === "college"
              ? lifeCollege()
              : "") +
      lifeLesson(activeLife)
    );
  }
  function lifeClass() {
    return `<section class="editorial-split"><div>${photo("classroom")}<p class="source-note">Exeter 官方课堂实景；讨论形式因学校与课程而异。</p></div><div><span class="eyebrow">从“听懂”到“参与”</span><h2>你的问题，<br>也是课堂的一部分。</h2><p>课前阅读、课堂讨论、团队项目、论文和实验，常常和考试一起构成学习。你需要理解知识，也要用证据表达自己的想法。</p><button class="button primary" data-action="article" data-id="system">读懂美高课程${icon("arrow")}</button></div></section><div class="info-grid section-block">${[
      [
        "book",
        "走班与选课",
        "根据能力、毕业要求与兴趣安排课程，每个人的课表可能不同。",
      ],
      ["pen", "写作与讨论", "阅读原文，提出论点，用证据分析，听取不同观点。"],
      ["leaf", "实践与项目", "在实验、创作、研究与社区服务中应用知识。"],
      ["user", "主动求助", "顾问、老师答疑、写作中心是资源；先学会开口。"],
    ]
      .map(
        ([i, t, d]) =>
          `<article class="info-card"><span class="icon-tile sage">${icon(i)}</span><h3>${t}</h3><p>${d}</p></article>`,
      )
      .join(
        "",
      )}</div>${sectionHeading("A SMALL COMPARISON", "从熟悉的课堂，走向新的节奏")}<div class="table-scroll"><table><thead><tr><th>观察角度</th><th>你可能熟悉的学习方式</th><th>美高可能遇到的变化</th></tr></thead><tbody><tr><th>课表</th><td>以行政班、统一课程为主</td><td>按学科走班，选修与分层课程更多</td></tr><tr><th>课前</th><td>老师带领讲解新内容</td><td>可能要求先读材料，再带问题讨论</td></tr><tr><th>评价</th><td>较重视阶段考试</td><td>可能综合论文、实验、讨论、测验等</td></tr><tr><th>老师</th><td>统一安排学习进度</td><td>除课堂教学外，提供答疑与个别反馈</td></tr><tr><th>独立性</th><td>家庭与学校协助管理较多</td><td>学生需主动管理截止日与寻求支持</td></tr></tbody></table></div><p class="source-note">用于理解可能的差异，并非所有中国或美国学校都如此；请结合具体学校判断。</p><div class="section-block">${videoCard(G.videos[0], 0, true)}</div>${note("入学前先把英文阅读、短文写作和自然讨论练起来。数学进度领先，不等于所有科目都能轻松适应。")}`;
  }
  function lifeDay() {
    const schedule = [
      ["07:00", "起床、早餐与整理", "自己安排洗漱、衣物和当天材料。", "sun"],
      [
        "08:00",
        "英语课与数学课",
        "讨论课前阅读，解释解题思路；不只是抄笔记。",
        "book",
      ],
      [
        "10:30",
        "实验、历史或选修",
        "做实验、查资料或参加项目，课程组合因校而异。",
        "school",
      ],
      [
        "12:00",
        "午餐与同伴交流",
        "和不同同学吃饭，也可能参加学校集会。",
        "coffee",
      ],
      [
        "13:00",
        "继续上课、答疑或自主学习",
        "利用空堂准备作业，主动找老师解决疑问。",
        "pen",
      ],
      ["15:30", "运动、艺术与社团", "训练、排练、社区服务或兴趣项目。", "leaf"],
      ["18:00", "晚餐和宿舍相处", "和室友聊天，照顾自己的生活。", "user"],
      [
        "19:30",
        "晚自习与作业",
        "阅读、论文、实验报告；安排任务先后顺序。",
        "book",
      ],
      [
        "22:00",
        "回宿舍与休息",
        "按学校及年级规则签到、熄灯，保证睡眠。",
        "clock",
      ],
    ];
    return `<div class="day-intro">${photo("students")}<div><span class="eyebrow">A DAY IN BOARDING SCHOOL</span><h2>忙碌，但不只有功课。</h2><p>下面是帮助想象的一天，<strong>不是某所学校的正式作息</strong>。上课、晚自习、熄灯与周末安排都应查看学校手册。</p></div></div><div class="daily-timeline">${schedule.map(([time, t, d, i]) => `<div><time>${time}</time><span class="daily-dot">${icon(i)}</span><div><h3>${t}</h3><p>${d}</p></div></div>`).join("")}</div>${note("周末可能有比赛、排练、校内活动、外出或自习。能否自由出校、周六是否上课、假期是否关闭宿舍，必须逐校确认。")}`;
  }
  function lifeBoarding() {
    return `<div class="two-column"><section class="panel article-mini"><span class="icon-tile sage">${icon("home")}</span><h2>宿舍，是学习独立的地方。</h2><p>可能与同学共享房间、公共浴室和休息空间。需要遵守签到、访客、电子设备、安静时段与外出规则。学校宿舍管理不能等同于家长全天陪同。</p><h3>适应前，先练习这些小事</h3><ul class="good-list"><li>独立洗衣、收纳与管理个人物品。</li><li>用日历安排作业、训练与休息。</li><li>礼貌表达边界，与室友协商差异。</li><li>主动找老师、宿舍老师或顾问求助。</li></ul></section><section class="panel article-mini"><span class="icon-tile sand">${icon("heart")}</span><h2>支持要具体，才能让人安心。</h2><p>想家、语言挫败和交友困难都可能发生。先问学校支持如何运作，再约定家庭联系的节奏。出现持续困难时及时求助，也可以重新评估路线。</p><h3>选校时向学校问清楚</h3><ul class="good-list"><li>夜间值班、医疗与心理支持的具体流程。</li><li>英语支持、国际新生融入与费用。</li><li>假期住宿、机场接送与监护安排。</li><li>饮食、过敏、宗教、隐私及反霸凌机制。</li></ul></section></div><section class="section-block editorial-split"><div>${photo("sports")}</div><div><span class="eyebrow">LIFE BEYOND THE CLASSROOM</span><h2>运动、艺术与友谊，<br>也是成长的课程。</h2><p>尝试一项从没做过的运动，参加一场排练，和不同背景的人合作。课外活动不只是为了申请大学，也是发现自己喜欢什么。</p>${link("activities", "从现在开始探索兴趣")}</div></section><button class="button primary" data-action="article" data-id="parent">打开家长支持指南${icon("arrow")}</button>`;
  }
  function lifeCollege() {
    return `<section class="college-banner"><div><span class="eyebrow">THE JOURNEY CONTINUES</span><h2>美国大学是下一站，<br>扎实的成长才是连接。</h2><p>高中不会保证大学录取。把课程表现、持续兴趣与独立学习建立起来，才能更从容地选择下一段旅程。</p></div>${icon("school")}</section><div class="info-grid three section-block">${[
      [
        "入学第一年",
        "适应与基础",
        "完成分班和学分规划，练习阅读写作，建立求助习惯。",
      ],
      [
        "11 年级",
        "深化与探索",
        "合理选择有挑战的课，深化活动，了解大学并核对考试政策。",
      ],
      [
        "12 年级",
        "表达与选择",
        "和顾问完成文书、推荐与申请，比较录取和费用，保持成绩。",
      ],
    ]
      .map(
        ([n, t, d]) =>
          `<article class="info-card"><span class="eyebrow">${n}</span><h3>${t}</h3><p>${d}</p></article>`,
      )
      .join(
        "",
      )}</div>${note("<strong>美高毕业不自动变成“美国本土申请者”。</strong>大学的申请者分类、学费、助学金与英语考试豁免，要按国籍、身份和具体大学政策核实。", "sand")}<button class="button primary" data-action="article" data-id="college">阅读完整衔接指南${icon("arrow")}</button>`;
  }
  function guide(sub) {
    if (sub && G.articles[sub]) return articlePage(sub);
    return (
      heading(
        "THE APPLICATION HANDBOOK",
        "复杂的申请，一步步读懂。",
        "先确定路线，再准备考试、材料与面试。每一步，都有一个清楚的起点。",
      ) +
      `<div class="guide-feature"><div><span class="eyebrow">从这里开始</span><h2>初三毕业后，<br>申请几年级更合适？</h2><p>10 年级衔接与 9 年级起步，都值得认真讨论。一起比较适应时间、课程衔接与家庭预算。</p><button class="button primary" data-action="article" data-id="route">比较两条路线${icon("arrow")}</button></div><div class="grade-options"><div><strong>G10</strong><span>通常再读 3 年</span><small>更快进入高中主线</small></div><span>或</span><div><strong>G9</strong><span>通常再读 4 年</span><small>多一年适应与探索</small></div></div></div><div class="guide-grid section-block">${[
        ["exams", "compass", "考试与英语", "哪些必考？托福新分制怎么看？"],
        ["process", "calendar", "申请全过程", "材料、推荐、面试、录取与行前。"],
        ["activities", "leaf", "课外活动与经历", "从真实兴趣出发，长期投入。"],
        ["essays", "pen", "文书与家长陈述", "找到具体故事，写出自己的声音。"],
        ["parent", "heart", "给妈妈的支持指南", "家长做什么，哪些留给孩子。"],
        ["college", "school", "从美高到美国大学", "课程、升学与长期准备。"],
      ]
        .map(
          ([id, i, t, d], idx) =>
            `<button class="guide-card" data-action="article" data-id="${id}"><span class="guide-card-num">0${idx + 1}</span><span class="icon-tile ${idx % 2 ? "sand" : "sage"}">${icon(i)}</span><h3>${t}</h3><p>${d}</p><span class="text-link">开始阅读${icon("arrow")}</span></button>`,
        )
        .join(
          "",
        )}</div><div class="panel article-mini"><h2>两项常被忽略的核实</h2><p><strong>申请平台：</strong>按学校使用 Gateway、SAO 或本校系统；不要误用大学 Common App。</p><p><strong>签证与学校资质：</strong>如果以 F-1 身份长期就读，应核实学校的 SEVP 资质。F-1 公立高中通常累计最多 12 个月且需支付规定费用，不适合作为本项目的多年公立高中方案。私立学校、其他身份与签证类别规则不同。</p><div class="source-row">${ext("https://travel.state.gov/content/travel/en/us-visas/study/student-visa/foreign-students-in-public-schools.html", "美国国务院：公立学校规则")}${ext("https://studyinthestates.dhs.gov/school-search", "DHS 学校资质查询")}</div></div>`
    );
  }
  function articleContent(id) {
    const a = G.articles[id],
      resume = state.reading[id];
    return `<div class="article-head"><span class="eyebrow">${a.kicker}</span><h1>${a.title}</h1><p class="article-lead">${a.intro}</p><div class="reader-toolbar"><button class="button outline" data-action="font">${state.font === "large" ? "使用标准字号" : "使用更大字号"}</button>${Number.isInteger(resume) ? `<button class="button outline" data-action="scroll-section" data-id="section-${resume}">继续上次阅读</button>` : ""}</div><div class="article-meta">${icon("book")}约 ${Math.max(3, Math.round(JSON.stringify(a).length / 500))} 分钟 · 核对于 ${G.reviewed}</div></div><section class="takeaways"><strong>先记住这几件事</strong><ul>${a.sections
      .slice(0, 3)
      .map((x) => `<li>${x.title}</li>`)
      .join(
        "",
      )}</ul></section><div class="article-body">${a.sections.map((section, i) => `<details class="reading-section" id="section-${i}" data-reading="${id}" data-section="${i}" ${i === (resume ?? 0) ? "open" : ""}><summary><span>${String(i + 1).padStart(2, "0")}</span>${section.title}${icon("down")}</summary><div>${section.text ? `<p>${section.text}</p>` : ""}${section.list ? `<ul class="good-list">${section.list.map((x) => `<li>${x}</li>`).join("")}</ul>` : ""}</div></details>`).join("")}<div class="article-sources"><h3>继续核对官方信息</h3><p>政策、费用与日期可能变化；未来入学轮次以当年学校公布为准。</p>${a.sources.map(([t, u]) => ext(u, t)).join("")}</div><div class="reading-next"><h3>读完后，做一件小事</h3><p>记下仍不清楚的问题，在准备计划里为下一步安排负责人和家庭目标日期。</p>${link("plan", "去安排下一步", "button primary")}</div></div>`;
  }
  function articlePage(id) {
    return `<div class="article-layout"><div><a class="back-link" href="#guide">${icon("arrow")}返回申请指南</a>${articleContent(id)}</div><aside class="reading-aside"><span class="eyebrow">阅读这篇指南</span>${G.articles[id].sections.map((s, i) => `<a href="#" data-action="scroll-section" data-id="section-${i}">${s.title}</a>`).join("")}<a class="button primary" href="#plan">记下下一步${icon("arrow")}</a></aside></div>`;
  }
  function schools() {
    const list = C.filterSchools(G.schools, { ...filters, saved: state.saved });
    return (
      heading(
        "FIND YOUR PLACE",
        "好学校，值得慢慢认识。",
        "从课程、社区与支持出发，找到适合她成长的地方。",
        `<button class="button outline" data-action="rankings">${icon("info")}怎么看排名</button>`,
      ) +
      `<div class="school-tools"><label class="field-search">${icon("search")}<input id="school-search" type="search" placeholder="搜索学校、州、城市或兴趣…" value="${esc(filters.query)}" aria-label="搜索学校、州、城市或兴趣"></label><button class="button ${filters.savedOnly ? "primary" : "outline"}" data-action="saved-filter">${icon("heart")}我的收藏 <span>${state.saved.length}</span></button></div><div class="filter-row"><label>地区<select id="region-filter">${["全部", "新英格兰", "中大西洋", "美国西部"].map((v) => `<option ${filters.region === v ? "selected" : ""}>${v}</option>`).join("")}</select></label><label>课程与支持<select id="style-filter">${["全部", "自主课程", "IB 路径", "AP / 荣誉课程", "英语支持"].map((v) => `<option ${filters.style === v ? "selected" : ""}>${v}</option>`).join("")}</select></label><div class="filter-spacer"></div><label>排序<select id="sort-filter">${[
        ["featured", "编辑精选"],
        ["rank", "已核实排名"],
        ["name", "英文校名"],
      ]
        .map(
          ([v, t]) =>
            `<option value="${v}" ${filters.sort === v ? "selected" : ""}>${t}</option>`,
        )
        .join(
          "",
        )}</select></label></div>${note("这 12 所私立寄宿学校是<strong>起点校库</strong>，并非全美学校全集或录取概率预测。校库均为男女合校；可通过资源页扩展研究女校、其他地区和走读学校。")}<div id="school-results"><div class="result-count">找到 <strong>${list.length}</strong> 所学校 <span>· 逐校读懂差异，比只看名次更重要</span></div><div class="school-grid">${list.map((s) => schoolCard(s)).join("")}</div>${!list.length ? `<div class="empty-state">${icon("search")}<h3>${filters.savedOnly ? "还没有符合条件的收藏" : "没有找到符合条件的学校"}</h3><p>试试其他中文或英文关键词，或清除筛选条件。</p><button class="button primary" data-action="reset-filters">重置筛选</button></div>` : ""}</div><p class="source-note">已列名次为 2027 Niche 全美寄宿高中榜，核对于 ${G.reviewed}；未列名次表示此项目未核实具体名次，不能理解为未上榜。氛围配图均有标注。</p>${compareBar()}`
    );
  }
  function compareBar() {
    return `<div class="compare-tray ${state.compare.length ? "visible" : ""}" id="compare-tray"><div>${icon("compare")}<strong>学校对比</strong><span>${state.compare.length}/3 所</span></div><div class="compare-chips">${state.compare.map((id) => `<button data-action="compare-add" data-id="${id}" aria-label="移除${G.schools.find((s) => s.id === id).name}">${G.schools.find((s) => s.id === id).name}${icon("close")}</button>`).join("")}</div><button class="button primary" data-action="compare" ${state.compare.length < 2 ? "disabled" : ""}>开始对比${icon("arrow")}</button></div>`;
  }
  function schoolDetail(id) {
    const s = G.schools.find((s) => s.id === id);
    if (!s) return;
    const n = state.schoolNotes[id] || {};
    openModal(
      `<div class="school-detail-photo">${photo(s.photo)}<span>${s.illustrative ? "学习氛围配图，非该校实景" : "该校真实照片"}</span></div><div class="school-detail-head"><span class="eyebrow">${s.region} · 私立寄宿 · ${s.type}</span><h1>${s.name}</h1><p class="english-name">${s.en}</p><p>${icon("pin")}${s.city}，${s.state}</p><div class="tags">${tags(s.tags)}</div><p class="detail-summary">${s.summary}</p></div><div class="detail-actions"><button class="button outline" data-action="save-school" data-id="${id}">${icon("heart")}${state.saved.includes(id) ? "已收藏" : "收藏学校"}</button>${ext(s.admission, "官方申请入口", "button primary")}${ext("https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(s.en + " " + s.city), "查看位置", "button outline")}</div><section class="detail-section"><h2>先判断适合，再核对要求</h2><p><strong>本站研究建议：</strong>${s.fit}</p><p>${s.watch}</p><ul class="good-list">${s.features.map((t) => `<li>${t}</li>`).join("")}</ul></section>${note(`我们的目标是 <strong>${state.year} 年秋</strong>。下列已核实内容只适用于所标学年或当前官网规则；目标轮次是否公布、年龄、名额与豁免须重新确认。`)}<div class="school-facts">${G.schoolFacts[id].map((f) => `<section class="school-fact"><div><h3>${f.label}</h3><span class="fact-status ${f.status}">${{ verified: "已核实", unverified: "尚未核实", estimate: "家庭估算", unpublished: "尚未公布" }[f.status]}</span></div><p>${f.text}</p><div class="fact-meta">${esc(f.year)} · 核对 ${f.checked} ${ext(f.source, "核对来源")}</div></section>`).join("")}</div><div class="mini-callout"><h3>排名参考</h3><p>${s.rank ? `2027 Niche 全美寄宿高中第 ${s.rank} 名` : "本项目未核实具体名次"}。排名不能预测录取或代替个人适配判断。</p>${ext("https://www.niche.com/k12/search/best-boarding-schools/", "查看同年同类榜单")}</div><section class="panel school-notebook"><h2>我们家的选校笔记</h2><p>只存在本机；收藏和记录不会自动在妈妈与妹妹的设备间同步。</p>${[
        ["like", "喜欢的原因"],
        ["concern", "担心的问题"],
        ["questions", "要向学校询问的事项"],
      ]
        .map(
          ([key, title]) =>
            `<label class="essay-field"><span>${title}</span><textarea rows="3" maxlength="3000" data-school-note="${key}" data-school-id="${id}">${esc(n[key] || "")}</textarea></label>`,
        )
        .join(
          "",
        )}<span class="save-note-status" role="status">${storageFailed ? "仅本次打开保留" : "输入自动保存在当前设备"}</span></section><p class="source-note">${ext(G.photos[s.photo].source, "配图来源")} · 官网资料可能变化；学费之外需核实保险、假期、交通及个人开支。资料核对不代表校方合作或录取保证。</p>`,
      "wide",
    );
  }
  function activities() {
    return (
      heading(
        "GROW THROUGH WHAT YOU LOVE",
        "把喜欢的事，做得更深一点。",
        "不追求一张完美履历。让妹妹从真实的兴趣出发，积累行动、作品与思考。",
      ) +
      `<section class="editorial-split"><div>${photo("sports")}</div><div><span class="eyebrow">CURIOSITY → ACTION → REFLECTION</span><h2>活动的价值，<br>在她真正投入的过程里。</h2><p>喜欢运动，可以记录一次技术改进；喜欢科技，可以做一个解决身边小问题的工具。招生老师想了解的，是她怎样学习、合作和成长。</p><button class="button primary" data-action="article" data-id="activities">阅读活动准备指南${icon("arrow")}</button></div></section><div class="activity-grid section-block">${[
        [
          "book",
          "阅读与表达",
          "读一本原版书，做双语笔记，再和同学聊一个你不同意的观点。",
          "成果：读书笔记 / 校刊 / 讨论记录",
        ],
        [
          "spark",
          "科学与创造",
          "发现一个校园小问题，查资料、做原型、收反馈，并记录每次修改。",
          "成果：实验日志 / 代码 / 展示",
        ],
        [
          "pen",
          "艺术与运动",
          "把长期练习留下来：一次失败、一轮修改、一段演出或一次团队合作。",
          "成果：作品集 / 训练记录 / 演出",
        ],
        [
          "heart",
          "社区与服务",
          "先倾听真实需求，再做持续的小事，看看你的帮助是否带来改变。",
          "成果：服务记录 / 反馈 / 反思",
        ],
      ]
        .map(
          ([i, t, d, f]) =>
            `<article class="panel activity-card"><span class="icon-tile sage">${icon(i)}</span><h3>${t}</h3><p>${d}</p><span>${f}</span></article>`,
        )
        .join(
          "",
        )}</div><section class="panel article-mini"><h2>一个兴趣，六个月的成长路线</h2><div class="growth-track">${[
        ["1", "提出问题"],
        ["2", "学习工具"],
        ["3–4", "持续行动"],
        ["5", "反馈与修改"],
        ["6", "整理与反思"],
      ]
        .map(
          ([m, t]) => `<div><span>第 ${m} 月</span><strong>${t}</strong></div>`,
        )
        .join(
          "",
        )}</div><p>根据学业与中考安排调整投入。付费夏校或昂贵项目本身不代表竞争力，更不是录取保证。</p></section><div class="section-block">${note("让她每周记录四句话：我做了什么？遇到了什么困难？我怎样调整？下一步想试什么？这些真实细节，也会成为文书的素材。")}<a class="button primary" href="#essays">去整理我的故事${icon("arrow")}</a></div>`
    );
  }
  function essays() {
    return (
      heading(
        "YOUR VOICE, YOUR STORY",
        "好的故事，先从真实开始。",
        "给妹妹一个安静的地方，记下自己的经历；给妈妈一份适度参与的指南。",
      ) +
      `<div class="tabbar"><button data-action="essay-tab" data-id="student" class="${activeEssay === "student" ? "active" : ""}">学生故事与草稿</button><button data-action="essay-tab" data-id="parent" class="${activeEssay === "parent" ? "active" : ""}">家长陈述</button></div><div class="essay-layout"><div class="panel essay-editor"><div class="editor-heading"><span>${icon("pen")}${activeEssay === "student" ? "我的故事素材本" : "妈妈眼中的她"}</span><span id="save-status">${storageFailed ? "仅本次打开保留" : "保存在当前设备"}</span></div>${
        activeEssay === "student"
          ? [
              [
                "moment",
                "01 · 选一个具体的瞬间",
                "你曾改变想法、主动尝试，或做错后调整的一件事。先写中文也可以。",
                4,
              ],
              [
                "action",
                "02 · 我真正做了什么？",
                "写动作、对话和困难。不要只写“我很努力”。",
                4,
              ],
              [
                "reflection",
                "03 · 我现在怎样理解这件事？",
                "我学到了什么？什么仍没有解决？下次我会怎么做？",
                4,
              ],
              [
                "draft",
                "04 · 试着写一篇自己的英文草稿",
                "先核对学校题目和字数，再用自己的语言表达。这不是自动生成文书的工具。",
                10,
              ],
            ]
              .map(([id, t, p, r]) => essayField(id, t, p, r))
              .join("")
          : essayField(
              "parent",
              "用一件真实小事，介绍她的成长",
              "她有什么特点？仍在哪些方面成长？需要怎样的支持？为什么这所学校适合她？",
              15,
            )
      }<div class="editor-bottom"><span id="word-count"></span><button class="button outline" data-action="export-essay">${icon("download")}导出文字</button></div></div><aside class="essay-aside"><section class="mini-callout"><span class="eyebrow">写之前，先想一想</span><h3>小细节，比大形容词更动人。</h3><p>“我学会了合作”很抽象。写清你怎样听取同学意见、改变了哪个方案，读者才看得见你。</p><button class="text-link" data-action="article" data-id="essays">打开文书指南${icon("arrow")}</button></section><section class="panel article-mini"><h3>修改时，检查这四件事</h3><ul class="good-list"><li>回应了题目吗？</li><li>有具体的行动与反思吗？</li><li>还是我自己的声音吗？</li><li>字数、校名与格式对吗？</li></ul></section>${note("文书应由学生本人完成，遵守学校对指导、翻译和 AI 的规定。草稿只存本机，不会上传到服务器。")}</aside></div>`
    );
  }
  function essayField(id, title, placeholder, rows) {
    return `<label class="essay-field"><span>${title}</span><textarea id="essay-${id}" data-essay="${id}" rows="${rows}" maxlength="30000" placeholder="${placeholder}">${esc(state.essay[id] || "")}</textarea></label>`;
  }
  function plan() {
    const timeline = C.timeline(state.year),
      done = state.done.length;
    return (
      heading(
        "ONE STEP AT A TIME",
        "把远方，变成眼前的小步骤。",
        `为 ${state.year} 年秋季、${state.grade} 年级入学准备。全家一起推进，不必一次完成所有事。`,
        `<button class="button outline" data-action="profile">${icon("pen")}调整目标</button>`,
      ) +
      `<section class="plan-summary"><div><span class="eyebrow">我们的准备进度</span><h2>${done}<span> / ${G.tasks.length} 项</span></h2><p>每一个认真完成的小步骤，都算数。</p></div><div class="plan-progress"><div class="progress-label"><strong>${Math.round((done / G.tasks.length) * 100)}%</strong><span>自动保存在当前设备</span></div><div class="progress-track"><span style="width:${(done / G.tasks.length) * 100}%"></span></div></div><button class="button outline" data-action="export-plan">${icon("download")}导出计划</button></section>${note("下列月份是<strong>家庭规划窗口，不是学校官方截止日</strong>。2028 等未来入学轮次尚未公布的日期，需要在申请季逐校复核。", "sand")}<div class="plan-filters">${[
        ["all", "全家任务"],
        ["妈妈", "妈妈负责"],
        ["妹妹", "妹妹负责"],
        ["pending", "只看未完成"],
      ]
        .map(
          ([id, t]) =>
            `<button class="chip ${activePlan === id ? "active" : ""}" data-action="plan-filter" data-id="${id}">${t}</button>`,
        )
        .join("")}</div><div class="plan-timeline">${timeline
        .map((s, i) => {
          const tasks = G.tasks
            .filter((t) => t.stage === i)
            .filter(
              (t) =>
                activePlan === "all" ||
                (activePlan === "pending" && !state.done.includes(t.id)) ||
                (activePlan === "妈妈" &&
                  ((state.taskMeta[t.id]?.who || t.who) === "妈妈" ||
                    (state.taskMeta[t.id]?.who || t.who) === "全家")) ||
                (activePlan === "妹妹" &&
                  ((state.taskMeta[t.id]?.who || t.who) === "妹妹" ||
                    (state.taskMeta[t.id]?.who || t.who) === "全家")),
            );
          return `<section class="plan-stage"><div class="stage-marker">${String(i + 1).padStart(2, "0")}</div><div class="stage-content"><div class="stage-heading"><div><span class="eyebrow">${s.date}</span><h2>${s.title}</h2><p>${s.desc}</p></div><span class="tag">${s.label}</span></div><div class="stage-tasks">${tasks.length ? tasks.map((t) => taskItem(t)).join("") : '<p class="empty-small">这个阶段暂无符合筛选的任务。</p>'}</div></div></section>`;
        })
        .join(
          "",
        )}</div><section class="section-block budget-panel"><div><span class="eyebrow">PLAN WITH A CLEAR PICTURE</span><h2>预算充足，也要算清全貌。</h2><p>先用估算看三年与四年的区别。输入的是家庭规划值，不是学校报价。金额均为美元，不含大学费用，也未计未来涨价。</p><button class="text-link" data-action="budget">打开家庭预算计算器${icon("arrow")}</button></div><div class="budget-highlight"><span>年度预算</span><strong>$100,000+</strong><small>学费之外，别忘了保险、交通与假期</small></div></section>`
    );
  }
  function videoCard(v, index, wide = false) {
    return `<article class="video-card ${wide ? "wide-video" : ""}"><a class="video-photo" href="${v.url}" target="_blank" rel="noopener noreferrer" aria-label="打开外部资源：${v.title}">${photo(v.photo)}<span class="play-circle">${icon(v.kind.includes("视频") || v.kind === "课堂实录" ? "play" : "external")}</span><span class="video-kind">${v.kind}${["library", "study", "students", "sports"].includes(v.photo) ? " · 氛围配图" : ""}</span></a><div class="video-copy"><span class="eyebrow">${v.source}</span><h3>${v.title}</h3><p>${v.desc}</p><p class="media-availability">${v.availability}</p><details class="video-text"><summary>先看中文说明与观看问题</summary><p>以下为本站导读，不是视频逐字翻译。${v.desc}不能仅凭宣传画面判断适应程度，请结合课程、宿舍规则与支持服务一起核实。</p><ol>${v.questions.map((q) => `<li>${q}</li>`).join("")}</ol>${link(v.textRoute, "打不开视频？阅读中文替代内容")}</details>${ext(v.url, "打开官方资源", "text-link")}</div></article>`;
  }
  function resources() {
    return (
      heading(
        "SEE IT FOR YOURSELF",
        "用眼睛看见，才更容易理解。",
        "从学校官方视频、课堂实录和虚拟访校开始，和妹妹一起带着问题看。",
      ) +
      note(
        "链接会打开学校官网或外部媒体。部分视频平台在中国大陆可能无法直接播放；可优先阅读同页文字与中文说明，或向学校索取可访问的资料。视频通常为英文，可在播放器支持时开启字幕。",
      ) +
      `<div class="video-grid section-block">${G.videos.map((v, i) => videoCard(v, i)).join("")}</div>${sectionHeading("A LITTLE LESS CONFUSION", "常见英文，中文讲清楚")}<label class="field-search glossary-search">${icon("search")}<input id="glossary-search" type="search" placeholder="输入英文或中文术语…" aria-label="搜索术语"></label><div class="glossary-list" id="glossary-list">${glossaryRows(G.glossary)}</div><section class="panel article-mini section-block"><h2>继续查资料，从这些入口开始</h2><div class="resource-links">${[
        [
          "官方申请平台",
          "Gateway to Prep Schools",
          "https://www.gatewaytoprepschools.com/",
        ],
        [
          "官方申请平台",
          "SAO 标准在线申请",
          "https://www.admission.org/apply/standard-application-online-sao",
        ],
        ["中文考试资料", "SSAT 官方中文手册", "https://zh.ssat.org/handbook"],
        [
          "考试变化",
          "ETS 托福新版评分说明",
          "https://www.ets.org/toefl/test-takers/ibt/scores/understand-scores.html",
        ],
        [
          "排名与扩展选校",
          "Niche 全美寄宿高中榜",
          "https://www.niche.com/k12/search/best-boarding-schools/",
        ],
        [
          "大学长远规划",
          "EducationUSA 官方留学步骤",
          "https://educationusa.state.gov/your-5-steps-us-study",
        ],
        [
          "学校资质核实",
          "DHS SEVP 学校查询",
          "https://studyinthestates.dhs.gov/school-search",
        ],
        [
          "签证流程",
          "美国国务院学生签证",
          "https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html",
        ],
      ]
        .map(
          ([t, n, u]) =>
            `<a href="${u}" target="_blank" rel="noopener noreferrer"><span>${t}</span><strong>${n}</strong>${icon("external")}</a>`,
        )
        .join("")}</div></section>`
    );
  }
  function glossaryRows(rows) {
    return rows.length
      ? rows
          .map(
            ([en, zh, t]) =>
              `<div class="glossary-row"><div><strong>${en}</strong><span>${zh}</span></div><p>${t}</p></div>`,
          )
          .join("")
      : '<p class="empty-small">没有找到这个术语，试试其他关键词。</p>';
  }
  function quiz() {
    const answered = Object.keys(state.quiz).length;
    const complete = answered === G.quiz.length;
    return (
      heading(
        "IS THIS THE RIGHT PATH?",
        "先听听，自己的答案。",
        "和家人一起探索意愿、学习方式与支持条件。这不是录取测评，也不替你们做决定。",
      ) +
      `<div class="quiz-intro"><span class="icon-tile sage">${icon("leaf")}</span><p>每一题都可以回答“不确定”。<strong>没有分数，没有好坏。</strong><br>答案帮助你们找到下一次值得认真讨论的话题。</p><span>${answered}/${G.quiz.length} 已思考</span></div><div class="quiz-questions">${G.quiz
        .map(
          (q, i) =>
            `<fieldset class="quiz-question"><legend><span>0${i + 1}</span>${q.q}</legend><div class="quiz-options">${[
              ["yes", "愿意 / 已准备"],
              ["unsure", "还不确定"],
              ["no", "目前还没有"],
            ]
              .map(
                ([v, t]) =>
                  `<label class="${state.quiz[i] === v ? "selected" : ""}"><input type="radio" name="quiz-${i}" value="${v}" data-quiz="${i}" ${state.quiz[i] === v ? "checked" : ""}>${t}</label>`,
              )
              .join("")}</div></fieldset>`,
        )
        .join(
          "",
        )}</div><div class="quiz-result ${complete ? "ready" : ""}" id="quiz-result">${quizResult()}</div>`
    );
  }
  function quizResult() {
    if (Object.keys(state.quiz).length < G.quiz.length)
      return `<p>${icon("leaf")}完成 5 个问题后，这里会整理适合一起讨论的下一步。</p>`;
    const topics = G.quiz.map((q, i) => ({ ...q, answer: state.quiz[i] }));
    const uncertain = topics.filter((q) => q.answer !== "yes");
    return `<span class="eyebrow">属于你们的下一次对话</span><h2>${uncertain.length ? "先给这些问题，多一点时间。" : "已经有一些共识，可以开始体验和验证。"}</h2><p>这些回答不是去或不去的结论。真正的适应，还需要通过学习、独立生活练习和具体学校的信息验证。</p><div class="quiz-next">${(uncertain.length ? uncertain : topics.slice(0, 3)).map((q) => `<div><strong>${q.topic}</strong><p>${q.action}</p></div>`).join("")}</div><div class="quiz-result-actions"><a class="button primary" href="#plan">把讨论变成下一步${icon("arrow")}</a><button class="button outline" data-action="article" data-id="parent">一起读家长指南</button></div>`;
  }
  function render({ preserveScroll = false } = {}) {
    const { page, sub } = current();
    document.body.classList.remove("nav-open");
    document
      .querySelector(".mobile-menu")
      ?.setAttribute("aria-expanded", "false");
    const renderers = {
      home,
      life,
      guide: () => guide(sub),
      schools,
      activities,
      essays,
      plan,
      resources,
      quiz,
    };
    document.getElementById("main").innerHTML = renderers[page]();
    document.querySelectorAll("[data-nav]").forEach((el) => {
      const active = el.dataset.nav === page;
      el.classList.toggle("active", active);
      if (active) el.setAttribute("aria-current", "page");
      else el.removeAttribute("aria-current");
    });
    const title = nav.find((n) => n[0] === page)?.[2] || "适合我吗";
    document.getElementById("breadcrumb").textContent = title;
    document.title = `${sub && G.articles[sub] ? G.articles[sub].title : title} · 远行`;
    if (page === "essays") updateWords();
    document.documentElement.dataset.font = state.font;
    document
      .querySelectorAll(".article-body details[open]")
      .forEach((d) => (d.dataset.initial = "true"));
    if (!preserveScroll) window.scrollTo({ top: 0, behavior: "instant" });
  }
  function openModal(html, cls = "") {
    const modal = document.getElementById("modal");
    if (!modal.open) previousFocus = document.activeElement;
    modal.className = cls;
    modal.innerHTML = `<button class="modal-close icon-button" data-action="close" aria-label="关闭">${icon("close")}</button><div class="modal-content">${html}</div>`;
    if (!modal.open) modal.showModal();
    modal.scrollTop = 0;
    document.body.classList.add("modal-open");
    const title = modal.querySelector("h1,h2");
    if (title) {
      title.id = "modal-title";
      modal.setAttribute("aria-labelledby", "modal-title");
    }
  }
  function closeModal() {
    const modal = document.getElementById("modal");
    modal.close();
    document.body.classList.remove("modal-open");
    previousFocus?.focus?.();
  }
  function rankings() {
    openModal(
      `<span class="eyebrow">RANKINGS, WITH CONTEXT</span><h1>把排名当作一个线索。</h1><p class="article-lead">学校没有统一的美国官方“最佳高中”排名。榜单的类别、样本和方法不同，结果也不同。</p><div class="detail-section"><h2>本站采用了什么？</h2><p>学校卡片上带数字的名次来自 <strong>2027 Niche 全美寄宿高中榜</strong>，核对日期为 ${G.reviewed}。例如 Exeter #1、Andover #2、Choate #6。它们是同一榜单、同一年度的数字，不与走读或公立榜混排。</p><h2>这个数字看不到什么？</h2><p>它不能直接说明孩子的录取机会、10 年级名额、语言支持、宿舍关怀或个人适配。评价数据和统计也有局限，部分信息可能滞后。没有列名次的学校是本项目未核实数字，不能当作“未上榜”。</p><h2>更值得一起比较的五件事</h2><ul class="good-list"><li>课程选择、课堂方式与真实学术负荷。</li><li>英语、写作、心理与生活支持。</li><li>寄宿社区、假期安排与家校沟通。</li><li>气候、位置、交通和家庭总支出。</li><li>孩子自己的意愿与校园归属感。</li></ul></div><div class="source-row">${ext("https://www.niche.com/k12/search/best-boarding-schools/", "查看榜单与方法入口")}${ext("https://www.niche.com/about/methodology/best-boarding-high-schools/", "Niche 方法说明")}</div>`,
    );
  }
  function compare() {
    if (state.compare.length < 2) return;
    const schools = state.compare.map((id) =>
      G.schools.find((s) => s.id === id),
    );
    const rows = [
      ["位置", (s) => `${s.city} · ${s.state}`],
      [
        "家庭关注",
        (s) =>
          esc(
            [
              state.schoolNotes[s.id]?.like,
              state.schoolNotes[s.id]?.concern,
              state.schoolNotes[s.id]?.questions,
            ]
              .filter(Boolean)
              .join("；") || "还未记录，可在学校详情填写",
          ),
      ],
      ["课程与兴趣", (s) => s.tags.join(" / ")],
      ["适合重点研究的学生", (s) => s.fit],
      ["要认真确认", (s) => s.watch],
      ["英语支持", (s) => s.support],
      ["费用信息", (s) => s.cost],
      ["考试", (s) => s.testing],
      ["截止日", (s) => s.deadline],
      [
        "2027 Niche 寄宿榜",
        (s) => (s.rank ? "第 " + s.rank + " 名" : "本项目未核实具体名次"),
      ],
    ];
    openModal(
      `<span class="eyebrow">SIDE BY SIDE</span><h1>把学校放在一起，看看差异。</h1><p>左右滑动查看全部列。预算区间是本站规划估算，官方学费有单独标明。</p><div class="table-scroll compare-table"><table><thead><tr><th>比较维度</th>${schools.map((s) => `<th>${s.name}<small>${s.en}</small></th>`).join("")}</tr></thead><tbody>${rows.map(([label, fn]) => `<tr><th>${label}</th>${schools.map((s) => `<td>${fn(s)}</td>`).join("")}</tr>`).join("")}<tr><th>官方信息</th>${schools.map((s) => `<td>${ext(s.admission, "招生入口")}</td>`).join("")}</tr></tbody></table></div>`,
      "wide",
    );
  }
  function profile() {
    const level = (name, label) =>
      `<label class="form-field">${label}<select name="${name}">${[
        ["", "暂时不填"],
        ["developing", "仍需要较多支持"],
        ["practicing", "正在练习，偶尔需要帮助"],
        ["ready", "基本能独立完成"],
      ]
        .map(
          ([v, t]) =>
            `<option value="${v}" ${state.profile[name] === v ? "selected" : ""}>${t}</option>`,
        )
        .join("")}</select></label>`;
    openModal(
      `<span class="eyebrow">OUR STARTING POINT</span><h1>我们的准备档案</h1><p>所有自评均可跳过，只用于安排学习建议，不预测录取或决定是否留学。</p><form id="profile-form"><label class="form-field">目标入学年份<select name="year">${[2027, 2028, 2029, 2030, 2031, 2032].map((y) => `<option value="${y}" ${state.year === y ? "selected" : ""}>${y} 年秋季</option>`).join("")}</select></label><label class="form-field">申请年级<select name="grade"><option value="10" ${state.grade === 10 ? "selected" : ""}>10 年级 · 通常再读三年</option><option value="9" ${state.grade === 9 ? "selected" : ""}>9 年级 · 通常再读四年</option></select></label>${level("reading", "读英文短文、找出观点与证据")}${level("discussion", "用英语提问并回应不同意见")}<label class="form-field">她现在的兴趣（可留空）<input name="interests" maxlength="500" value="${esc(state.profile.interests)}" placeholder="例如：绘画、篮球、城市观察"></label><label class="form-field">每周可用于额外准备的时间<select name="hours">${[3, 6, 10].map((n) => `<option value="${n}" ${state.profile.hours === n ? "selected" : ""}>约 ${n} 小时</option>`).join("")}</select></label>${note("更改档案不会清空任务、笔记、收藏或草稿。年龄条件及学分须由具体学校确认。")}<button class="button primary" type="submit">保存准备档案${icon("check")}</button></form>`,
    );
  }
  function budgetModal() {
    openModal(
      `<span class="eyebrow">FAMILY BUDGET</span><h1>把总费用，算得更清楚。</h1><p>以下是可修改的家庭估算示例，不代表学校报价。金额单位为美元。请用学校正式账单逐项替换。</p><div class="budget-inputs">${[
        ["tuition", "寄宿学费与校内食宿", 80000],
        ["insurance", "保险与医疗预留", 3500],
        ["travel", "往返机票、接送", 6000],
        ["holidays", "假期住宿与监护安排", 8000],
        ["personal", "书本、用品、零用和活动", 5000],
        ["reserve", "应急预留", 7500],
      ]
        .map(
          ([id, t, v]) =>
            `<label class="form-field">${t}<span class="currency-input"><span>$</span><input type="number" id="budget-${id}" data-budget min="0" max="500000" step="100" value="${v}" inputmode="decimal"></span></label>`,
        )
        .join(
          "",
        )}</div><div class="budget-totals" id="budget-totals"></div><p class="source-note">多年合计按年度金额简单相乘，未计学费涨价、汇率变动、申请咨询和大学费用。年度预算“超过 10 万”没有固定上限，仍需结合实际账单判断。</p>`,
    );
    updateBudget();
  }
  function updateBudget() {
    const values = [...document.querySelectorAll("[data-budget]")].map(
      (el) => el.value,
    );
    const result = C.budget(values);
    document.getElementById("budget-totals").innerHTML = [
      ["年度总计", result.annual],
      ["三年合计", result.threeYears],
      ["四年合计", result.fourYears],
    ]
      .map(
        ([t, n]) =>
          `<div><span>${t}</span><strong>$${n.toLocaleString("en-US")}</strong></div>`,
      )
      .join("");
  }
  function sources() {
    openModal(
      `<span class="eyebrow">ABOUT THIS GUIDE</span><h1>有依据，也有边界。</h1><div class="detail-section"><h2>为谁准备？</h2><p>为上海中国体制内初中生与家长准备。默认初三毕业后、2028 年秋赴美，年度预算超过 10 万美元，未来希望申请美国大学。具体能力、年龄与兴趣尚未知，因此内容提供探索框架，不给出个性化录取概率。</p><h2>信息如何使用？</h2><p>资料于 ${G.reviewed} 核对。各学校详情与指南都附官方链接。未公布的未来申请轮次，不会作为已确定的截止日。考试、费用、签证与学校安排会变，行动前重新查官方信息。</p><h2>费用与排名</h2><p>除明确标为官方某学年学费的数字外，费用区间是家庭规划估算。排名仅采用同一年度、同一类别的 Niche 寄宿高中榜，并非教育主管机构评价。校库是 12 所学校的研究起点，非全美全集。</p><h2>照片和视频</h2><p>学校实景、官方课堂与氛围配图均区分标注；学校卡片采用外校图片时明确标为氛围配图。视频与资源是外部官方入口，不保证每个平台在中国大陆可访问。图片权利属于对应来源，本站引用不表示校方合作或认可。</p></div><div class="photo-credits">${Object.entries(
        G.photos,
      )
        .map(
          ([id, p]) =>
            `<div>${photo(id)}<span>${p.credit}</span>${ext(p.source, "原始来源")}</div>`,
        )
        .join(
          "",
        )}</div><div class="detail-section"><h2>手机与离线使用</h2><p>无需注册。已下载或缓存的核心中文内容可离线阅读；首次访问、外部图片与视频需要网络。HTTPS 或本机 localhost 可启用离线缓存及安装能力。在安卓 Chrome 中可使用菜单里的“添加到主屏幕”。局域网 HTTP 可阅读，但不能保证 PWA 离线安装。</p></div>`,
      "wide",
    );
  }
  function dataModal() {
    openModal(
      `<span class="eyebrow">ON THIS DEVICE</span><h1>你们的准备记录，留在本机。</h1><p>学校收藏、对比、任务勾选、探索答案和文书草稿保存在当前浏览器的 localStorage 中。不会发送到本站服务器；换手机、清除浏览器数据或使用无痕模式可能丢失。外部链接和图片受对应网站隐私政策约束。</p><p>最近导出备份：${state.lastBackup ? esc(new Date(state.lastBackup).toLocaleString("zh-CN")) : "尚未导出"}</p><div class="data-stats"><span>${state.saved.length} 所收藏学校</span><span>${state.done.length} 项已完成</span><span>${Object.keys(state.quiz).length} 个探索答案</span></div><div class="data-actions"><button class="button primary" data-action="export-data">${icon("download")}备份全部记录</button><label class="button outline import-label">导入备份<input type="file" id="import-data" accept="application/json,.json"></label></div><p class="source-note">备份包含文书草稿等个人记录，请妥善保存。导入会用备份替换本机记录，并先显示确认。</p>`,
    );
  }
  function searchModal() {
    openModal(
      `<span class="eyebrow">FIND YOUR ANSWER</span><h1>你想了解什么？</h1><label class="field-search modal-search">${icon("search")}<input type="search" id="global-search" placeholder="试试“托福”“10 年级”“想家”或学校名" autocomplete="off" autofocus aria-label="搜索全部内容"></label><div id="search-results"><p class="empty-small">学校、申请指南、校园生活和常见术语，都可以搜索。</p><div class="search-suggestions">${["托福", "10 年级", "文书", "英语支持", "假期"].map((t) => `<button class="chip" data-action="search-suggestion" data-id="${t}">${t}</button>`).join("")}</div></div>`,
    );
    document.getElementById("global-search").focus();
  }
  function updateSearch(query) {
    const matches = C.search(G, query);
    document.getElementById("search-results").innerHTML = query.trim()
      ? `<p class="result-count">找到 ${matches.length} 条相关内容</p>${matches.length ? matches.map((r) => `<button class="search-result" data-action="search-result" ${r.school ? `data-school="${r.school}"` : r.video !== undefined ? `data-video="${r.video}"` : `data-route="${r.route}"`}><span>${r.kind}</span><strong>${r.title}</strong><p>${esc(r.excerpt || r.text.slice(0, 100))}…</p>${icon("arrow")}</button>`).join("") : '<div class="empty-state"><h3>没有找到相关内容</h3><p>换一个关键词试试，例如“考试”“寄宿”或英文校名。</p></div>'}`
      : '<p class="empty-small">输入关键词，搜索全部指南。</p>';
  }
  function updateWords() {
    const el = document.getElementById("word-count");
    if (!el) return;
    const text =
      activeEssay === "parent" ? state.essay.parent : state.essay.draft;
    const words =
      (text || "").trim().match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || [];
    el.textContent =
      `${activeEssay === "parent" ? "家长陈述" : "英文草稿"}：${words.length} 个英文词 · ${(text || "").length} 字符` +
      "（以申请系统计数为准）";
  }
  function download(name, content, type = "text/plain;charset=utf-8") {
    const blob = new Blob([content], { type });
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("已生成下载文件，请在浏览器下载列表查看。");
  }
  function exportPlan() {
    const lines = [
      `远行 · ${state.year} 秋季 ${state.grade} 年级准备计划`,
      `导出日期：${new Date().toLocaleDateString("zh-CN")}`,
      "时间窗口为家庭规划，官方截止日请逐校核实。",
      "",
    ];
    C.timeline(state.year).forEach((stage, i) => {
      lines.push(stage.date + "｜" + stage.title);
      G.tasks
        .filter((t) => t.stage === i)
        .forEach((t) =>
          lines.push(
            `[${state.done.includes(t.id) ? "✓" : " "}] ${t.title}（${state.taskMeta[t.id]?.who || t.who}）\n    ${t.detail}\n    家庭目标：${state.taskMeta[t.id]?.date || "未安排"}\n    备注：${state.taskMeta[t.id]?.note || "无"}`,
          ),
        );
      lines.push("");
    });
    download(`远行-${state.year}准备计划.txt`, lines.join("\n"));
  }
  function refreshSchoolResults() {
    const container = document.getElementById("school-results");
    if (!container) return;
    const result = C.filterSchools(G.schools, {
      ...filters,
      saved: state.saved,
    });
    container.innerHTML = `<div class="result-count">找到 <strong>${result.length}</strong> 所学校 <span>· 逐校读懂差异，比只看名次更重要</span></div><div class="school-grid">${result.map((s) => schoolCard(s)).join("")}</div>${result.length ? "" : `<div class="empty-state">${icon("search")}<h3>没有找到符合条件的学校</h3><p>试试其他关键词或清除筛选条件。</p><button class="button primary" data-action="reset-filters">重置筛选</button></div>`}`;
  }
  function dashboard() {
    if (state.view === "student")
      return `<section class="family-dashboard student-dashboard"><div><span class="eyebrow">先体验，再做选择</span><h2>这段旅程，也要有你的答案。</h2><p>从一堂课、一次独立生活练习开始，看看自己想要怎样的高中。</p></div><div class="student-path">${link("life/class", "① 体验一堂课")}${link("quiz", "② 听自己的答案")}${link("activities", "③ 做深一个兴趣")}</div></section>`;
    const tasks = C.nextTasks(state, G),
      saved = G.schools.filter((s) => state.saved.includes(s.id));
    return `<section class="family-dashboard" id="family-dashboard"><div class="dashboard-top"><div><span class="eyebrow">妈妈的本周准备板</span><h2>本周，从三件小事开始。</h2><p>目标 ${state.year} 年秋 · ${state.grade} 年级 · 已完成 <span data-done-count>${state.done.length}</span>/${G.tasks.length}</p></div><button class="button outline" data-action="profile">完善准备档案${icon("pen")}</button></div><div id="dashboard-tasks">${tasks.length ? tasks.map((t) => taskItem(t, true)).join("") : "<p>这份清单已完成，可以继续复核学校当轮要求。</p>"}</div><div class="dashboard-schools"><strong>收藏学校待确认</strong>${
      saved.length
        ? saved
            .slice(0, 3)
            .map(
              (s) =>
                `<button data-action="school" data-id="${s.id}">${s.name}：${G.schoolFacts[s.id].filter((f) => f.status === "unverified").length} 项待核实${icon("arrow")}</button>`,
            )
            .join("")
        : "<p>先收藏感兴趣的学校，再记录年龄、语言支持与假期安排的问题。</p>"
    }</div></section><section class="profile-suggestions"><div><h3>根据准备档案的小建议</h3><button class="text-link" data-action="profile">自评可跳过 · 调整档案</button></div>${C.suggestions(
      state,
    )
      .slice(0, 3)
      .map(
        (x) =>
          `<article><strong>${esc(x.title)}</strong><p>${esc(x.reason)}</p></article>`,
      )
      .join("")}</section>`;
  }
  function lifeLesson(id) {
    const lesson = G.lifeLessons.find((l) => l.id === id) || G.lifeLessons[0];
    return `<section class="life-learning-sheet"><span class="eyebrow">给妹妹的体验学习单 · 本站编写</span><h2>${lesson.title}</h2><p>${lesson.summary}</p><ul class="good-list">${lesson.points.map((t) => `<li>${t}</li>`).join("")}</ul><div class="mini-callout"><strong>在上海，现在就能试试</strong><p>${lesson.practice}</p></div><div class="life-next">${lesson.next ? link("life/" + lesson.next, "继续探索下一站", "button primary") : link("guide/college", "了解大学衔接", "button primary")}${link("quiz", "记下我的感受")}</div></section>`;
  }
  function taskEditor(id) {
    const task = G.tasks.find((t) => t.id === id);
    if (!task) return;
    const m = state.taskMeta[id] || {};
    openModal(
      `<span class="eyebrow">FAMILY PLAN</span><h1>${task.title}</h1><p>下面是你们自己的安排，不是学校官方截止日。</p><form id="task-form" data-task-id="${id}"><label class="form-field">负责人<select name="who">${["妈妈", "妹妹", "全家"].map((v) => `<option ${v === (m.who || task.who) ? "selected" : ""}>${v}</option>`).join("")}</select></label><label class="form-field">家庭目标日期（可留空）<input name="date" type="date" value="${esc(m.date || "")}"></label><label class="essay-field"><span>备注与待确认问题</span><textarea name="note" rows="5" maxlength="3000">${esc(m.note || "")}</textarea></label><button type="submit" class="button primary">保存家庭安排${icon("check")}</button></form>`,
    );
  }
  function updateTaskProgress(input) {
    input.closest(".task-item")?.classList.toggle("complete", input.checked);
    const done = state.done.length,
      percent = Math.round((done / G.tasks.length) * 100);
    document
      .querySelectorAll("[data-done-count]")
      .forEach((el) => (el.textContent = done));
    document
      .querySelectorAll(".progress-track>span")
      .forEach((el) => (el.style.width = percent + "%"));
    const home = document.querySelector(".home-plan .progress-label strong");
    if (home) home.textContent = done + "/" + G.tasks.length;
    const summary = document.querySelector(".plan-summary h2");
    if (summary)
      summary.innerHTML = done + "<span> / " + G.tasks.length + " 项</span>";
    const label = document.querySelector(
      ".plan-summary .progress-label strong",
    );
    if (label) label.textContent = percent + "%";
    document
      .querySelectorAll(`[data-task="${input.dataset.task}"]`)
      .forEach((el) => {
        el.checked = input.checked;
        el.closest(".task-item")?.classList.toggle("complete", input.checked);
      });
    if (
      activePlan === "pending" &&
      current().page === "plan" &&
      input.checked
    ) {
      const row = input.closest(".task-row");
      const next =
        row.nextElementSibling?.querySelector("input") ||
        row.previousElementSibling?.querySelector("input");
      row.remove();
      next?.focus({ preventScroll: true });
    }
  }
  function updateQuizProgress() {
    document
      .querySelectorAll("[data-quiz]")
      .forEach((el) =>
        el.closest("label").classList.toggle("selected", el.checked),
      );
    const count = Object.keys(state.quiz).length;
    document.querySelector(".quiz-intro>span:last-child").textContent =
      count + "/" + G.quiz.length + " 已思考";
    const result = document.getElementById("quiz-result");
    result.innerHTML = quizResult();
    result.classList.toggle("ready", count === G.quiz.length);
  }
  function updateSavedCards(id) {
    const count = document.querySelector('[data-action="saved-filter"]>span');
    if (count) count.textContent = state.saved.length;
    if (filters.savedOnly && !state.saved.includes(id)) {
      const card = document
        .querySelector(
          `.school-card [data-action="save-school"][data-id="${id}"]`,
        )
        ?.closest(".school-card");
      const next =
        card?.nextElementSibling?.querySelector("button") ||
        card?.previousElementSibling?.querySelector("button");
      card?.remove();
      next?.focus({ preventScroll: true });
      const result = document.querySelector(
        "#school-results .result-count strong",
      );
      if (result)
        result.textContent = document.querySelectorAll(".school-card").length;
    }
  }
  function refreshCompare() {
    const tray = document.getElementById("compare-tray");
    if (tray) tray.outerHTML = compareBar();
    document.querySelectorAll('[data-action="compare-add"]').forEach((btn) => {
      if (btn.classList.contains("compare-button")) {
        const selected = state.compare.includes(btn.dataset.id);
        btn.classList.toggle("selected", selected);
        btn.setAttribute("aria-pressed", String(selected));
        btn.innerHTML =
          icon(selected ? "check" : "compare") + (selected ? "已加入" : "对比");
      }
    });
  }
  G.lifeSearchText = {};
  for (const [id, fn] of Object.entries({
    class: lifeClass,
    day: lifeDay,
    boarding: lifeBoarding,
    weekend: () => lifeLesson("weekend"),
    help: () => lifeLesson("help"),
    college: lifeCollege,
  }))
    G.lifeSearchText[id] = fn().replace(/<[^>]*>/g, " ");
  document.addEventListener(
    "toggle",
    (event) => {
      const d = event.target;
      if (d.dataset?.reading && d.open) {
        state.reading[d.dataset.reading] = Number(d.dataset.section);
        persist();
      }
    },
    true,
  );

  document.addEventListener("click", (event) => {
    if (event.target.closest(".skip-link")) {
      event.preventDefault();
      document.getElementById("main").focus();
      document.getElementById("main").scrollIntoView();
      return;
    }
    const target = event.target.closest("[data-action]");
    if (!target) {
      if (
        event.target.closest('a[href^="#"]') &&
        document.getElementById("modal").open
      )
        closeModal();
      return;
    }
    const action = target.dataset.action,
      id = target.dataset.id;
    event.preventDefault();
    if (action === "menu") {
      document.body.classList.toggle("nav-open");
      const open = document.body.classList.contains("nav-open");
      document
        .querySelector(".mobile-menu")
        .setAttribute("aria-expanded", String(open));
      return;
    }
    if (action === "close") return closeModal();
    if (action === "view") {
      state.view = state.view === "parent" ? "student" : "parent";
      persist();
      shell();
      render({ preserveScroll: true });
      toast(state.view === "parent" ? "已切换为家长视角" : "已切换为学生视角");
      return;
    }
    if (action === "task-edit") return taskEditor(id);
    if (action === "font") {
      state.font = state.font === "large" ? "standard" : "large";
      persist();
      document.documentElement.dataset.font = state.font;
      document
        .querySelectorAll('[data-action="font"]')
        .forEach(
          (button) =>
            (button.textContent = button.classList.contains("font-control")
              ? state.font === "large"
                ? "标准字"
                : "大字"
              : state.font === "large"
                ? "使用标准字号"
                : "使用更大字号"),
        );
      return;
    }
    if (action === "search") return searchModal();
    if (action === "school") return schoolDetail(id);
    if (action === "rankings") return rankings();
    if (action === "profile") return profile();
    if (action === "budget") return budgetModal();
    if (action === "sources") return sources();
    if (action === "data") return dataModal();
    if (action === "compare") return compare();
    if (action === "article") {
      if (document.getElementById("modal").open) closeModal();
      location.hash = "guide/" + id;
      if (current().sub === id) render();
      return;
    }
    if (action === "life-tab") {
      location.hash = "life/" + id;
      return;
    }
    if (action === "essay-tab") {
      clearTimeout(saveTimer);
      persist();
      activeEssay = id;
      return render({ preserveScroll: true });
    }
    if (action === "plan-filter") {
      activePlan = id;
      return render({ preserveScroll: true });
    }
    if (action === "saved-filter") {
      filters.savedOnly = !filters.savedOnly;
      return render({ preserveScroll: true });
    }
    if (action === "reset-filters") {
      filters = {
        query: "",
        region: "全部",
        style: "全部",
        sort: "featured",
        savedOnly: false,
      };
      return render({ preserveScroll: true });
    }
    if (action === "save-school") {
      state.saved = state.saved.includes(id)
        ? state.saved.filter((x) => x !== id)
        : [...state.saved, id];
      persist();
      const saved = state.saved.includes(id);
      document
        .querySelectorAll(`[data-action="save-school"][data-id="${id}"]`)
        .forEach((btn) => {
          btn.classList.toggle("saved", saved);
          btn.setAttribute("aria-pressed", String(saved));
          if (btn.classList.contains("icon-button"))
            btn.setAttribute(
              "aria-label",
              (saved ? "取消收藏" : "收藏") +
                G.schools.find((s) => s.id === id).name,
            );
          else btn.innerHTML = icon("heart") + (saved ? "已收藏" : "收藏学校");
        });
      toast(saved ? "已加入我的收藏" : "已取消收藏");
      updateSavedCards(id);
      return;
    }
    if (action === "compare-add") {
      if (state.compare.includes(id))
        state.compare = state.compare.filter((x) => x !== id);
      else if (state.compare.length < 3) state.compare.push(id);
      else return toast("最多同时对比 3 所学校，请先移除一所。");
      persist();
      refreshCompare();
      return;
    }
    if (action === "scroll-section") {
      const section = document.getElementById(id);
      if (section?.tagName === "DETAILS") section.open = true;
      section?.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
      });
      return;
    }
    if (action === "export-plan") return exportPlan();
    if (action === "export-essay") {
      const text =
        activeEssay === "parent"
          ? `家长陈述\n\n${state.essay.parent || ""}`
          : [
              "我的故事素材本",
              `具体瞬间\n${state.essay.moment || ""}`,
              `我的行动\n${state.essay.action || ""}`,
              `我的思考\n${state.essay.reflection || ""}`,
              `英文草稿\n${state.essay.draft || ""}`,
            ].join("\n\n");
      return download("远行-文书素材与草稿.txt", text);
    }
    if (action === "export-data") {
      state.lastBackup = new Date().toISOString();
      persist();
      return download(
        "远行-家庭准备备份.json",
        JSON.stringify(
          {
            app: "yuanxing",
            version: 2,
            exported: new Date().toISOString(),
            data: state,
          },
          null,
          2,
        ),
        "application/json",
      );
    }
    if (action === "search-suggestion") {
      document.getElementById("global-search").value = id;
      updateSearch(id);
      return;
    }
    if (action === "search-result") {
      if (target.dataset.school) return schoolDetail(target.dataset.school);
      if (target.dataset.video !== undefined) {
        const v = G.videos[Number(target.dataset.video)];
        return openModal(
          `<span class="eyebrow">${v.source}</span><h1>${v.title}</h1><p>${v.desc}</p><ul class="good-list">${v.questions.map((q) => `<li>${q}</li>`).join("")}</ul>${ext(v.url, "打开官方资源", "button primary")}`,
        );
      }
      closeModal();
      location.hash = target.dataset.route;
      return;
    }
  });
  document.addEventListener("input", (event) => {
    const target = event.target;
    if (target.id === "school-search") {
      filters.query = target.value;
      refreshSchoolResults();
    }
    if (target.id === "global-search") updateSearch(target.value);
    if (target.id === "glossary-search") {
      const q = target.value.trim().toLowerCase();
      document.getElementById("glossary-list").innerHTML = glossaryRows(
        G.glossary.filter((row) => row.join(" ").toLowerCase().includes(q)),
      );
    }
    if (target.hasAttribute("data-essay")) {
      state.essay[target.dataset.essay] = target.value;
      updateWords();
      const ok = persist();
      document.getElementById("save-status").textContent = ok
        ? "已保存在当前设备"
        : "保存失败：仅本次打开保留，请导出备份";
    }
    if (target.dataset.schoolNote) {
      const id = target.dataset.schoolId;
      state.schoolNotes[id] ||= { like: "", concern: "", questions: "" };
      state.schoolNotes[id][target.dataset.schoolNote] = target.value;
      const ok = persist();
      document.querySelector(".save-note-status").textContent = ok
        ? "已保存选校笔记"
        : "保存失败，请导出备份";
    }
    if (target.hasAttribute("data-budget")) updateBudget();
  });
  document.addEventListener("change", async (event) => {
    const target = event.target;
    if (target.dataset.task) {
      state.done = target.checked
        ? [...new Set([...state.done, target.dataset.task])]
        : state.done.filter((x) => x !== target.dataset.task);
      persist();
      updateTaskProgress(target);
    }
    if (target.dataset.quiz !== undefined) {
      state.quiz[target.dataset.quiz] = target.value;
      persist();
      updateQuizProgress();
    }
    if (target.id === "region-filter") {
      filters.region = target.value;
      refreshSchoolResults();
    }
    if (target.id === "style-filter") {
      filters.style = target.value;
      refreshSchoolResults();
    }
    if (target.id === "sort-filter") {
      filters.sort = target.value;
      refreshSchoolResults();
    }
    if (target.id === "import-data") {
      const file = target.files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024)
        return toast("备份文件过大，请选择小于 2 MB 的远行备份。");
      try {
        const imported = JSON.parse(await file.text());
        if (
          imported.app !== "yuanxing" ||
          ![1, 2].includes(imported.version) ||
          !imported.data
        )
          throw Error();
        const next = C.normalize(imported.data, G);
        const exported =
          typeof imported.exported === "string" &&
          imported.exported.length < 60 &&
          !isNaN(Date.parse(imported.exported))
            ? new Date(imported.exported).toLocaleString("zh-CN")
            : "旧备份未提供";
        openModal(
          `<span class="eyebrow">RESTORE A BACKUP</span><h1>确认恢复这份备份？</h1><p>将替换当前浏览器里的目标、收藏、任务、探索答案与文书草稿。</p><p>导出时间：${esc(exported)}</p><p>备份内容：${next.saved.length} 所收藏学校、${next.done.length} 项已完成任务；目标 ${next.year} 年秋。</p><p>需要保留当前内容时，请先取消并导出本机备份。</p><div class="detail-actions"><button class="button primary" id="confirm-import">确认恢复</button><button class="button outline" data-action="close">取消</button></div>`,
        );
        document.getElementById("confirm-import").addEventListener(
          "click",
          () => {
            state = next;
            const saved = persist();
            closeModal();
            shell();
            render();
            toast(
              saved
                ? "备份已恢复到当前设备。"
                : "恢复记录仅本次打开保留，请保留备份文件。",
            );
          },
          { once: true },
        );
      } catch {
        toast("无法读取。请选择远行导出的有效 JSON 备份。");
      }
    }
  });
  document.addEventListener("submit", (event) => {
    if (event.target.id === "task-form") {
      event.preventDefault();
      const form = new FormData(event.target),
        id = event.target.dataset.taskId;
      const candidate = {
        ...state,
        taskMeta: {
          ...state.taskMeta,
          [id]: {
            who: String(form.get("who")),
            date: String(form.get("date")),
            note: String(form.get("note")),
          },
        },
      };
      state = C.normalize(candidate, G);
      persist();
      closeModal();
      render({ preserveScroll: true });
      return;
    }
    if (event.target.id === "profile-form") {
      event.preventDefault();
      const form = new FormData(event.target);
      state.year = Number(form.get("year"));
      state.grade = Number(form.get("grade"));
      state.profile = {
        reading: String(form.get("reading") || ""),
        discussion: String(form.get("discussion") || ""),
        interests: String(form.get("interests") || "").slice(0, 500),
        hours: Number(form.get("hours") || 3),
      };
      persist();
      closeModal();
      render();
      toast("目标已更新，时间线已同步调整。");
    }
  });
  document.addEventListener(
    "error",
    (event) => {
      const el = event.target;
      if (el.tagName !== "IMG") return;
      if (el.dataset.remote && !el.dataset.attempted) {
        el.dataset.attempted = "true";
        el.src = el.dataset.remote;
      } else if (!el.dataset.fallback) {
        el.dataset.fallback = "true";
        el.src = "assets/photo-fallback.svg";
      }
    },
    true,
  );
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      searchModal();
    }
    if (event.key === "Escape") document.body.classList.remove("nav-open");
  });
  document.getElementById("modal").addEventListener("click", (event) => {
    if (event.target === event.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        closeModal();
    }
  });
  document
    .getElementById("modal")
    .addEventListener("close", () =>
      document.body.classList.remove("modal-open"),
    );
  window.addEventListener("pagehide", () => {
    clearTimeout(saveTimer);
    persist();
  });
  window.addEventListener("hashchange", () => {
    if (document.getElementById("modal").open) closeModal();
    render();
  });
  shell();
  render();
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    let requestedUpdate = false;
    function showUpdate(registration) {
      if (
        !registration.waiting ||
        !navigator.serviceWorker.controller ||
        document.getElementById("update-banner")
      )
        return;
      const banner = document.createElement("div");
      banner.id = "update-banner";
      banner.className = "update-banner";
      banner.setAttribute("role", "status");
      banner.innerHTML =
        '<span>新版已准备好。先保存当前记录，再更新页面。</span><button class="button primary" type="button">保存并更新</button>';
      banner.querySelector("button").addEventListener("click", () => {
        if (!persist()) {
          toast("保存未成功，请先导出备份，再尝试更新。");
          return;
        }
        requestedUpdate = true;
        registration.waiting?.postMessage({ type: "ACTIVATE_UPDATE" });
      });
      document.body.append(banner);
    }
    navigator.serviceWorker
      .register("./sw.js")
      .then((registration) => {
        showUpdate(registration);
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed") showUpdate(registration);
          });
        });
      })
      .catch(() => {});
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (requestedUpdate) location.reload();
    });
  }
})();
