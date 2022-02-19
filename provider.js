const common_msg =
  "您可加入下方QQ群反馈Bug或提建议≧∇≦\n" +
  "====================\n" +
  "小爱课程表-广东药科大学 v3.0\n" +
  "开发者（适配）：liziyi0914\n" +
  "Bug反馈QQ群：630201162\n" +
  "====================\n";
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

R = {
  fail: function () {
    return this._pack(404);
  },
  success: function (data = "", type = "html") {
    return this._pack(200, data, type);
  },
  _pack: function (state = 200, data = "", type = "html") {
    return `_liziyi0914_${JSON.stringify({
      state: state,
      type: type,
    })}_liziyi0914_${type === "json" ? JSON.stringify(data) : data}`;
  },
};

async function scheduleHtmlProvider(
  iframeContent = "",
  frameContent = "",
  dom = document
) {
  await loadTool("AIScheduleTools");

  let h5 = dom.getElementsByTagName("h5");
  if (h5.length != 0 && h5[0].textContent == "用户登录") {
    await AIScheduleAlert(
      "课程表获取失败！QAQ\n" +
        "请先登录教学综合信息服务平台。-_-\n" +
        common_msg
    );
    return R.fail();
  }

  let page = await getPage();
  let xn = RE_2.exec(page);
  let xq = RE_3.exec(page);

  let defaultKcb = await getKcb(xn[1], xq[1]);

  if (!RE_1.exec(window.location.href)) {
    if (defaultKcb.kbList.length != 0) {
      await AIScheduleAlert(
        `
        当前为 ${xn[2]} 学年第 ${xq[2]} 学期
        默认课程表获取完成！^_^
        如需切换学期或更准确地导入课程表，请尝试打开“学生课表查询”页面再导入。（信息查询>>学生课表查询）
        ${common_msg}`
      );
      return R.success(defaultKcb, "json");
    } else {
      await AIScheduleAlert(
        `
        当前为 ${xn[2]} 学年第 ${xq[2]} 学期
        默认课程表获取失败！QAQ
        如需切换学期或更准确地导入课程表，请尝试打开“学生课表查询”页面再导入。（信息查询>>学生课表查询）
        ${common_msg}`
      );
      return R.fail();
    }
  }

  let nodata = dom.getElementsByClassName("nodata");

  if (nodata.length != 0) {
    await AIScheduleAlert(
      `
      当前为 ${xn[2]} 学年第 ${xq[2]} 学期
      课程表获取失败！QAQ
      失败原因：${nodata[0].textContent}
      如需切换学期或更准确地导入课程表，请尝试打开“学生课表查询”页面再导入。（信息查询>>学生课表查询）
      ${common_msg}`
    );
    return R.fail();
  }

  await AIScheduleAlert("课程表获取完成！^_^\n" + common_msg);
  return R.success(dom.getElementById("kbgrid_table_0").innerHTML, "html");
}
