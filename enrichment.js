/* 第二版的逐项资料与中文学习单。未核实的条件保持显式未知。 */
(function (G) {
  for (const [id, p] of Object.entries(G.photos)) {
    p.allowCache = !["classroom", "harkness"].includes(id);
    p.license =
      id === "campus"
        ? "Public domain · Daderot"
        : id === "andover"
          ? "CC0 · NCD2004"
          : ["classroom", "harkness"].includes(id)
            ? "官方照片，缓存授权尚未确认"
            : "Unsplash License";
    p.licenseSource = ["campus", "andover", "classroom", "harkness"].includes(
      id,
    )
      ? p.source
      : "https://unsplash.com/license";
  }
  const checked = "2026-10-28";
  const fact = (
    label,
    text,
    source,
    status = "verified",
    year = "官网当前规则",
  ) => ({ label, text, source, status, year, checked });
  const rows = {
    exeter: {
      url: "https://exeter.edu/admissions/apply/",
      platform: "Exeter 官方申请门户；在门户提交学生文书、家长陈述并跟踪材料。",
      test: "申请 10/11 年级须交 SSAT、ISEE、PSAT NMSQT、SAT、PreACT 或 ACT 之一；非英语母语学生另核对英语测试与豁免条件。",
      interview: "所有申请者须参加面试；学校提供现场、线上或录制回应等方式。",
      deadline: "2027 秋入学当前截止 1 月 15 日。",
      year: "2027 秋入学",
    },
    andover: {
      url: "https://www.andover.edu/admission/apply",
      platform:
        "Gateway 提交 Candidate Profile，之后通过 Andover 门户预约与跟踪材料。",
      test: "须提交指定学术考试之一；非英语授课背景须关注 TOEFL、IELTS 或 Duolingo 英语要求，不自行套用豁免。",
      interview: "先提交 Gateway 档案，再在学校门户选择官网提供的面试选项。",
      deadline: "2027 秋入学申请截止 2027 年 2 月 1 日。",
      year: "2027 秋入学",
    },
    choate: {
      url: "https://www.choate.edu/admission/admission-process",
      platform:
        "先填 Inquiry，按学校当轮申请入口递交与跟踪；具体平台版本待核实。",
      platformStatus: "unverified",
      test: "学术测试可选；非英语母语或英语授课经历不足两年者，强烈建议交 TOEFL、IELTS 或 Duolingo。",
      interview: "强烈建议面试；当前仅线上面试，不提供现场招生面试。",
      deadline: "本项目尚未确认该申请轮次的最终截止日期。",
      deadlineStatus: "unverified",
    },
    lawrenceville: {
      url: "https://www.lawrenceville.org/admission/application-process",
      platform: "Gateway to Prep Schools；先完成 Candidate Profile。",
      test: "10 年级须交 SSAT、ISEE、PSAT、SAT 或 ACT；还须按个人背景核对英语测试。",
      interview: "寄宿申请者需在 1 月 15 日申请截止前完成面试；通过门户预约。",
      deadline: "官网当前申请截止为 1 月 15 日；目标入学年份须再核对。",
    },
    deerfield: {
      url: "https://deerfield.edu/admission/start-your-application",
      platform: "Gateway Candidate Profile 提交后进入 Deerfield 门户。",
      test: "2027–28 学年申请 9/10 年级须交 SSAT 或 ISEE。符合官网语言背景条件者另交 TOEFL、IELTS Academic 或 Duolingo。",
      interview: "面试为必需环节，可现场或线上；须先完成 Candidate Profile。",
      deadline: "当前轮申请截止 1 月 15 日。",
      year: "2027 秋入学",
    },
    cate: {
      url: "https://www.cate.org/admission/",
      platform:
        "先填 Inquiry；预约面试前须完成 Gateway Candidate Profile 并付申请费。",
      test: "当前国际生预约面试前须交 TOEFL；其他学术测试及豁免细项待招生办确认。",
      interview:
        "所有申请者须线上 Zoom 面试；当前说明约 45 分钟，另有家长交流。",
      deadline:
        "当前招生页列 1 月 15 日申请截止；页内时间线标注 2026–2027，适用入学年需再次核对。",
    },
    loomis: {
      url: "https://www.loomischaffee.org/admission/application-process/international-applicants",
      platform:
        "学校测试政策提到 SAO、Gateway 与校方门户；具体递交方式依当轮申请页。",
      test: "学术考试可选；未有至少两年沉浸英语教育经历者须证明英语能力。测试政策页列 TOEFL、IELTS、Duolingo；国际页对 Duolingo 写有条件，需确认。",
      testSource:
        "https://www.loomischaffee.org/admission/application-process/testing",
      interview: "国际生预约招生面试前须先证明英语能力。",
      deadline: "国际申请页当前列全部申请者 1 月 15 日截止。",
    },
    george: {
      url: "https://www.georgeschool.org/admission/how-to-apply/",
      platform:
        "使用 SAO；中国大陆家庭先按官网要求从 SSAT 中国入口建立账户及开始购买。",
      test: "2027 秋入学须提交标准化学术考试，接受 SSAT、ISEE、PSAT、SAT 或 ACT；个人英语与面试要求需另看国际生说明。",
      interview:
        "可预约校园面试，也提供 Zoom；非英语母语者需阅读国际申请额外要求。",
      deadline: "当前页面建议在 1 月 15 日申请截止前面试。",
      year: "2027 秋入学",
    },
    nmh: {
      url: "https://www.nmhschool.org/admission/how-to-apply",
      platform: "SAO 或 Gateway，两者择一。",
      test: "当前学术考试可选；非英语母语者仍需语言测试，官网也考虑 IELTS、EIKEN 或 Duolingo；英语授课满两年的豁免须由招生顾问确认。",
      interview:
        "中国与韩国申请者当前须 InitialView；至少在截止日前两周预约，包含现场非背稿面试和写作样本。",
      deadline: "2027–28 学年申请截止 2027 年 1 月 15 日。",
      year: "2027 秋入学",
    },
    mercersburg: {
      url: "https://www.mercersburg.edu/admission/how-to-apply",
      platform: "寄宿生可用 SAO 或 Gateway；走读生须 SAO。",
      test: "9/10 年级学术测试可选，申请学术择优资助需 SSAT/ISEE；非英语母语者按规则交 TOEFL、Duolingo 或 IELTS。",
      interview:
        "中国籍申请者当前须通过 Vericant 面试，该场次满足申请面试要求。",
      deadline: "官网当前申请与面试截止为 1 月 15 日。",
    },
    cushing: {
      url: "https://www.cushing.org/admissions/how-to-apply",
      platform: "SAO、Gateway 或 Cushing 自有申请，三者只交一种。",
      test: "SSAT 等学术成绩可选；国际生须交 TOEFL iBT 或 Duolingo 英语测试。",
      interview:
        "中国大陆申请者须于 12 月 1 日前通过 Vericant 验证，再预约校方招生面试；适用轮次应向学校确认。",
      deadline:
        "官网当前秋季申请截止 2 月 1 日；大陆申请者另注意 12 月 1 日 Vericant 前置日期。",
    },
    suffield: {
      url: "https://www.suffieldacademy.org/admission/apply",
      platform: "SAO 或 Gateway；早申请必须使用 SAO。",
      test: "学术标准化测试可选；国际生须交 TOEFL、Duolingo 或 IELTS。",
      interview: "通过学校招生办预约校园或线上面试，确认目标轮次的安排。",
      interviewSource: "https://www.suffieldacademy.org/admission",
      deadline:
        "2027 常规申请 1 月 15 日；早申请为 2026 年 12 月 12 日。合同与押金另有日期，不要与申请截止混用。",
      year: "2027 秋入学",
    },
  };
  G.schoolFacts = {};
  for (const s of G.schools) {
    const r = rows[s.id];
    s.admission = r.url;
    s.testing = r.test;
    s.deadline = r.deadline;
    G.schoolFacts[s.id] = [
      fact(
        "年级与年龄",
        "本项目尚未逐项核实 9/10 年级的年龄上限、重读条件和新生名额。请提供初三毕业时年龄，向招生办确认。",
        r.url,
        "unverified",
      ),
      fact(
        "申请入口",
        r.platform,
        r.url,
        r.platformStatus || "verified",
        r.year,
      ),
      fact("考试要求", r.test, r.testSource || r.url, "verified", r.year),
      fact(
        "面试安排",
        r.interview,
        r.interviewSource || r.url,
        "verified",
        r.year,
      ),
      fact(
        "当前截止日",
        r.deadline,
        r.url,
        r.deadlineStatus || "verified",
        r.year,
      ),
      fact(
        "学费与开支",
        s.cost,
        s.fee,
        s.cost.includes("2026–27") ? "verified" : "estimate",
        s.cost.includes("2026–27") ? "2026–27 学费" : "家庭规划估算",
      ),
      fact(
        "英语支持",
        s.id === "cushing"
          ? "设有不同水平的 ESL 阅读、写作、听说课程；费用、分班及毕业学分仍需确认。"
          : "学术答疑或国际生协调不等同于 ESL。本项目尚未确认适合她的语言课程、费用及退出标准。",
        s.id === "cushing" ? s.academic : r.url,
        s.id === "cushing" ? "verified" : "unverified",
      ),
      fact(
        "生活与升学支持",
        "须确认：假期是否关闭宿舍、机场接送与监护安排、夜间与医疗联系人、大学升学顾问如何支持 10 年级国际新生。",
        s.url,
        "unverified",
      ),
    ];
  }
  G.lifeLessons = [
    {
      id: "class",
      title: "课堂：从完成题目，到用证据表达",
      summary:
        "讨论式学习要求课前准备、倾听和表达；不是所有美高都采用同一课堂形式。",
      points: [
        "课前：读一篇短文，标记一句不理解的话和两处证据。",
        "课堂：先提出观点，再说明依据；回应同学时可以礼貌地不同意。",
        "课后：写出老师反馈与你准备修改的地方。",
      ],
      practice:
        "体验作业：选一篇英文短文，写 120–150 词“观点—证据—解释”。这是本站练习示例，不是学校实际招生题。",
      next: "day",
    },
    {
      id: "day",
      title: "一天：学会安排作业，也安排休息",
      summary: "课表、作业、运动和生活需要一起管理。示例作息不能代替学校手册。",
      points: [
        "用空堂完成一项短作业，避免把所有任务堆到晚自习。",
        "论文先拆成查资料、提纲、初稿、修改四步，分别安排时间。",
        "留出吃饭、运动、洗衣和睡眠，不把空闲时间全部填满。",
      ],
      practice: "体验任务：自己排一周课后日历，每天记录预估与实际用时。",
      next: "boarding",
    },
    {
      id: "boarding",
      title: "宿舍：独立生活，也要学会求助",
      summary:
        "想家、语言挫败和交友困难值得提前讨论。顾问和宿舍老师是支持网络的一部分。",
      points: [
        "与室友协商灯光、声音、访客和物品边界；先理解校规。",
        "生病或持续焦虑时联系学校成人支持，不独自硬撑。",
        "提前确认假期住宿、紧急联系人与中美通话时差。",
      ],
      practice:
        "体验任务：独立管理两周洗衣与物品整理，并写下三个可以求助的人。",
      next: "weekend",
    },
    {
      id: "weekend",
      title: "周末：找到课业之外的归属",
      summary:
        "比赛、排练、社团、朋友与休息都可能构成周末。能否出校和是否上课因校而异。",
      points: [
        "没有队伍经历也能问学校是否有初学者运动或非竞赛活动。",
        "参加一项新活动时先给自己几次尝试，不用立刻证明擅长。",
        "看宣传片之外，也询问普通周末安排、留校人数与外出规则。",
      ],
      practice:
        "体验任务：选一项想尝试的活动，再列一项能帮助自己恢复精力的休息方式。",
      next: "help",
    },
    {
      id: "help",
      title: "困难时：知道下一步去找谁",
      summary:
        "一次成绩下降、想家或与室友冲突，不必独自解决。支持流程要在选校时问清楚。",
      points: [
        "学术问题：先找任课老师或答疑时段，再与顾问讨论课程负荷。",
        "宿舍冲突：向宿舍老师说明具体事情与已尝试的沟通方式。",
        "持续失眠、孤立或明显压力：及时联系学校健康与心理支持，和家人商量下一步。",
      ],
      practice:
        "家庭练习：模拟一次“我需要帮助”的对话，约定求助顺序与固定联系时间。",
      next: "college",
    },
    {
      id: "college",
      title: "大学：先建立学习能力，再规划下一站",
      summary: "美高不会保证大学录取，也不会自动改变国际生身份。",
      points: [
        "入学第一年先确认毕业学分、分班、阅读写作与求助习惯。",
        "11 年级与升学顾问深化课程、活动与大学探索。",
        "12 年级按大学当时规则完成申请；国际生分类与资助逐校核实。",
      ],
      practice:
        "下一步：读“从美高到美国大学”，记下你希望升学顾问帮助解决的两个问题。",
      next: null,
    },
  ];
  G.videos.forEach((v) => {
    v.questions = [...v.questions, "看完后，我还想向这所学校确认什么？"];
    v.textRoute =
      v.kind === "课堂实录" || v.kind === "教学视频"
        ? "life/class"
        : v.kind === "项目资源"
          ? "activities"
          : v.kind === "校园资源"
            ? "life/weekend"
            : "life/boarding";
    v.availability = "外部资源；上海网络与字幕可用性未实测";
  });
})(window.GUIDE);
