function scheduleHtmlParser(html) {
  var LOG = console.info;

  var RE = /_liziyi0914_(.*)_liziyi0914_/;
  var match = RE.exec(html);
  var obj = JSON.parse(match[1]);
  var jc = obj.jc;
  if (obj.state != 200) {
    return {
      courseInfos: [],
      sectionTimes: [],
    };
  }

  function isEven(num) {
    return num % 2 == 0;
  }

  function resolveRange(s) {
    let a = 0;
    let b = 0;
    let oddWeek = false;
    let evenWeek = false;
    if (s.indexOf("(单)") != -1) {
      oddWeek = true;
      s = s.replace("(单)", "");
    }
    if (s.indexOf("(双)") != -1) {
      evenWeek = true;
      s = s.replace("(双)", "");
    }
    let ret = [];
    if (s.indexOf("-") != -1) {
      let li = s.split("-");
      a = Number(li[0]);
      b = Number(li[1]);
      for (let i = a; i <= b; i++) {
        if (oddWeek) {
          if (!isEven(i)) {
            ret.push(i);
          }
        } else if (evenWeek) {
          if (isEven(i)) {
            ret.push(i);
          }
        } else {
          ret.push(i);
        }
      }
      return ret;
    } else {
      return [Number(s)];
    }
  }

  function parseWeeks(data) {
    return data
      .match(/\d+(-\d+)?周(\([单|双]\))?/g)
      .map((weeks) => weeks.replace("周", ""))
      .map(resolveRange)
      .reduce((a, b) => a.concat(b));
  }

  function parseSections(data) {
    return data
      .match(/\d+(-\d+)?节/g)
      .map((weeks) => weeks.replace("节", ""))
      .map(resolveRange)
      .reduce((a, b) => a.concat(b))
      .map((i) => ({ section: i }));
  }

  function strLength(str) {
    if (str == null) return 0;
    if (typeof str != "string") {
      str += "";
    }
    return str.replace(/[^\x00-\xff]/g, "01").length;
  }

  function fixCnLength(s, len) {
    let ret = "";
    let l = 0;
    for (let i = 0; i < s.length; i++) {
      let code = s.charCodeAt(i);
      if (code >= 0 && code <= 128) {
        l++;
      } else {
        l += 2;
      }
      if (l > len) {
        return ret;
      } else {
        ret += s[i];
      }
    }
    return ret;
  }

  function fixLength(item) {
    if (item.name.indexOf("毛泽东思想和中国特色社会主义理论体系概论") !== -1) {
      item.name = item.name.replace(
        "毛泽东思想和中国特色社会主义理论体系概论",
        "毛概"
      );
    }
    if (strLength(item.name) > 40) {
      item.name = fixCnLength(item.name, 40);
    }

    item.position = item.position.trim();
    if (strLength(item.position) > 19) {
      item.position = fixCnLength(item.position, 19);
    }

    item.teacher = item.teacher.trim();
    if (strLength(item.teacher) > 19) {
      item.teacher = fixCnLength(item.teacher, 19);
    }

    return item;
  }

  let result = [];

  if (obj.type == "json") {
    let json = JSON.parse(html.replace(match[0], ""));
    for (let i of json.kbList) {
      let re = { sections: [], weeks: [] };
      re.teacher = i.xm;
      re.name = i.kcmc;
      re.day = Number(i.xqj);
      re.position = i.cdmc;
      re.weeks = parseWeeks(i.zcd);
      re.sections = parseSections(i.jc);
      re = fixLength(re);
      result.push(re);
    }
  } else {
    let bbb = $(".timetable_con");

    for (let u = 0; u < bbb.length; u++) {
      let re = { sections: [], weeks: [] };
      let aaa = $(bbb[u]).find("span");
      let week = $(bbb[u]).parent("td")[0].attribs.id;
      if (week) {
        re.day = Number(week.split("-")[0]);
      }
      for (let i = 0; i < aaa.length; i++) {
        if (aaa[i].attribs.title == "上课地点") {
          for (let j = 0; j < $(aaa[i]).next()[0].children.length; j++) {
            re.position = $(aaa[i]).next()[0].children[j].data;
          }
        }
        if (aaa[i].attribs.title == "节/周") {
          for (let j = 0; j < $(aaa[i]).next()[0].children.length; j++) {
            let lesson = $(aaa[i]).next()[0].children[j].data;

            re.weeks = parseWeeks(lesson);

            re.sections = parseSections(lesson);
          }
        }

        if (aaa[i].attribs.title == "教师") {
          for (let j = 0; j < $(aaa[i]).next()[0].children.length; j++) {
            re.teacher = $(aaa[i]).next()[0].children[j].data;
          }
        }

        if (aaa[i].attribs.class == "title") {
          for (let j = 0; j < $(aaa[i]).children()[0].children.length; j++) {
            re.name = $(aaa[i]).children()[0].children[j].data;
          }
        }
      }
      re = fixLength(re);
      result.push(re);
    }
  }

  return result;
}
