const RE_1 = /:\/\/jwsys\.gdpu\.edu\.cn\/kbcx\/xskbcx_cxXskbcxIndex\.html/;
const RE_2 =
  /<option value="(\d{4})" selected="selected">(\d{4}-\d{4})<\/option>/;
const RE_3 = /<option value="(\d+)" selected="selected">(\d+)<\/option>/;

async function getPage() {
  return fetch(
    "http://jwsys.gdpu.edu.cn/kbcx/xskbcx_cxXskbcxIndex.html?gnmkdm=N2151",
    {
      method: "GET",
    }
  ).then((resp) => resp.text());
}

async function getKcb(xnm = "2020", xqm = "3") {
  return fetch("http://jwsys.gdpu.edu.cn/kbcx/xskbcx_cxXsKb.html", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `xnm=${xnm}&xqm=${xqm}`,
  }).then((resp) => resp.json());
}

async function getJc(xnm = "2020", xqm = "3", xqh = "0") {
  var jcs = await fetch("http://jwsys.gdpu.edu.cn/kbcx/xskbcx_cxRjc.html", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `xnm=${xnm}&xqm=${xqm}&xqh_id=${xqh}`,
  }).then((resp) => resp.json());
  var result = [];
  var i = 1;
  for (let jc of jcs) {
    result.push({
      section: i,
      startTime: jc.qssj.replace(/:..$/, ""),
      endTime: jc.jssj.replace(/:..$/, ""),
    });
    i++;
  }
  return result;
}

async function scheduleTimer({ providerRes, parserRes } = {}) {
  await loadTool("AIScheduleTools");

  let page = await getPage();
  let xn = RE_2.exec(page);
  let xq = RE_3.exec(page);

  let defaultKcb = await getKcb(xn[1], xq[1]);

  let sections = await getJc(xn[1], xq[1], defaultKcb.kbList[0].xqh_id);

  const showWeekend = await AIScheduleSelect({
    titleText: "请选择",
    contentText: "是否显示周末？",
    selectList: ["是", "否"],
  });

  return {
    totalWeek: 20, // 总周数：[1, 30]之间的整数
    startSemester: "", // 开学时间：时间戳，13位长度字符串，推荐用代码生成
    startWithSunday: false, // 是否是周日为起始日，该选项为true时，会开启显示周末选项
    showWeekend: showWeekend === "是", // 是否显示周末
    forenoon: 4,
    afternoon: 4,
    night: 3,
    sections: sections,
  };
}
