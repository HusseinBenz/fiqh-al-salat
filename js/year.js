/* Fiqh al-Salat — the five prayer times across a whole year.
   Times come from the standard astronomical formulas (solar declination and
   equation of time, as in PrayTimes.org), for the city chosen, with the
   calculation method used locally. ʿAṣr follows the madhhab selected on the
   page (Ḥanafī: shadow ×2, others: ×1). Daylight saving comes from the
   browser's time-zone data. */
var YearChart = (function () {
  'use strict';

  var METHODS = {
    makkah:  { en: 'Umm al-Qura, Makkah (Fajr 18.5°, ʿIshāʾ 90 min after Maghrib)', ar: 'أم القرى بمكة (الفجر ١٨٫٥°، والعشاء بعد المغرب بتسعين دقيقة)', fajr: 18.5, ishaMin: 90 },
    egypt:   { en: 'Egyptian General Authority of Survey (Fajr 19.5°, ʿIshāʾ 17.5°)', ar: 'الهيئة المصرية العامة للمساحة (الفجر ١٩٫٥°، والعشاء ١٧٫٥°)', fajr: 19.5, isha: 17.5 },
    mwl:     { en: 'Muslim World League (Fajr 18°, ʿIshāʾ 17°)', ar: 'رابطة العالم الإسلامي (الفجر ١٨°، والعشاء ١٧°)', fajr: 18, isha: 17 },
    isna:    { en: 'Islamic Society of North America (Fajr 15°, ʿIshāʾ 15°)', ar: 'الجمعية الإسلامية لأمريكا الشمالية (الفجر ١٥°، والعشاء ١٥°)', fajr: 15, isha: 15 },
    karachi: { en: 'University of Islamic Sciences, Karachi (Fajr 18°, ʿIshāʾ 18°)', ar: 'جامعة العلوم الإسلامية بكراتشي (الفجر ١٨°، والعشاء ١٨°)', fajr: 18, isha: 18 },
    diyanet: { en: 'Diyanet, Türkiye (Fajr 18°, ʿIshāʾ 17°)', ar: 'رئاسة الشؤون الدينية التركية (الفجر ١٨°، والعشاء ١٧°)', fajr: 18, isha: 17 },
    dubai:   { en: 'Dubai (Fajr 18.2°, ʿIshāʾ 18.2°)', ar: 'دبي (الفجر ١٨٫٢°، والعشاء ١٨٫٢°)', fajr: 18.2, isha: 18.2 },
    qatar:   { en: 'Qatar (Fajr 18°, ʿIshāʾ 90 min after Maghrib)', ar: 'قطر (الفجر ١٨°، والعشاء بعد المغرب بتسعين دقيقة)', fajr: 18, ishaMin: 90 },
    kuwait:  { en: 'Kuwait (Fajr 18°, ʿIshāʾ 17.5°)', ar: 'الكويت (الفجر ١٨°، والعشاء ١٧٫٥°)', fajr: 18, isha: 17.5 },
    jordan:  { en: 'Jordan (Fajr 18°, ʿIshāʾ 18°)', ar: 'الأردن (الفجر ١٨°، والعشاء ١٨°)', fajr: 18, isha: 18 },
    morocco: { en: 'Morocco, Ministry of Habous (Fajr 19°, ʿIshāʾ 17°)', ar: 'وزارة الأوقاف المغربية (الفجر ١٩°، والعشاء ١٧°)', fajr: 19, isha: 17 },
    algeria: { en: 'Algeria (Fajr 18°, ʿIshāʾ 17°)', ar: 'الجزائر (الفجر ١٨°، والعشاء ١٧°)', fajr: 18, isha: 17 },
    tunisia: { en: 'Tunisia (Fajr 18°, ʿIshāʾ 18°)', ar: 'تونس (الفجر ١٨°، والعشاء ١٨°)', fajr: 18, isha: 18 },
    kemenag: { en: 'Kemenag, Indonesia (Fajr 20°, ʿIshāʾ 18°)', ar: 'وزارة الشؤون الدينية الإندونيسية (الفجر ٢٠°، والعشاء ١٨°)', fajr: 20, isha: 18 },
    jakim:   { en: 'JAKIM, Malaysia (Fajr 20°, ʿIshāʾ 18°)', ar: 'جاكيم ماليزيا (الفجر ٢٠°، والعشاء ١٨°)', fajr: 20, isha: 18 },
    uoif:    { en: 'UOIF, France (Fajr 12°, ʿIshāʾ 12°)', ar: 'اتحاد المنظمات الإسلامية بفرنسا (الفجر ١٢°، والعشاء ١٢°)', fajr: 12, isha: 12 },
    russia:  { en: 'Spiritual Administration of Muslims of Russia (Fajr 16°, ʿIshāʾ 15°)', ar: 'الإدارة الدينية لمسلمي روسيا (الفجر ١٦°، والعشاء ١٥°)', fajr: 16, isha: 15 }
  };

  // country: city, latitude, longitude, IANA time zone, method
  var PLACES = [
    ['sa', 'Saudi Arabia', 'السعودية', 'Makkah', 'مكة المكرمة', 21.4225, 39.8262, 'Asia/Riyadh', 'makkah'],
    ['eg', 'Egypt', 'مصر', 'Cairo', 'القاهرة', 30.0444, 31.2357, 'Africa/Cairo', 'egypt'],
    ['ma', 'Morocco', 'المغرب', 'Rabat', 'الرباط', 34.0209, -6.8416, 'Africa/Casablanca', 'morocco'],
    ['dz', 'Algeria', 'الجزائر', 'Algiers', 'الجزائر العاصمة', 36.7538, 3.0588, 'Africa/Algiers', 'algeria'],
    ['tn', 'Tunisia', 'تونس', 'Tunis', 'تونس العاصمة', 36.8065, 10.1815, 'Africa/Tunis', 'tunisia'],
    ['tr', 'Türkiye', 'تركيا', 'Istanbul', 'إسطنبول', 41.0082, 28.9784, 'Europe/Istanbul', 'diyanet'],
    ['ae', 'United Arab Emirates', 'الإمارات', 'Dubai', 'دبي', 25.2048, 55.2708, 'Asia/Dubai', 'dubai'],
    ['qa', 'Qatar', 'قطر', 'Doha', 'الدوحة', 25.2854, 51.5310, 'Asia/Qatar', 'qatar'],
    ['kw', 'Kuwait', 'الكويت', 'Kuwait City', 'مدينة الكويت', 29.3759, 47.9774, 'Asia/Kuwait', 'kuwait'],
    ['jo', 'Jordan', 'الأردن', 'Amman', 'عمّان', 31.9454, 35.9284, 'Asia/Amman', 'jordan'],
    ['ps', 'Palestine', 'فلسطين', 'Al-Quds', 'القدس', 31.7683, 35.2137, 'Asia/Hebron', 'egypt'],
    ['iq', 'Iraq', 'العراق', 'Baghdad', 'بغداد', 33.3152, 44.3661, 'Asia/Baghdad', 'mwl'],
    ['pk', 'Pakistan', 'باكستان', 'Karachi', 'كراتشي', 24.8607, 67.0011, 'Asia/Karachi', 'karachi'],
    ['in', 'India', 'الهند', 'Delhi', 'دلهي', 28.6139, 77.2090, 'Asia/Kolkata', 'karachi'],
    ['bd', 'Bangladesh', 'بنغلاديش', 'Dhaka', 'دكا', 23.8103, 90.4125, 'Asia/Dhaka', 'karachi'],
    ['id', 'Indonesia', 'إندونيسيا', 'Jakarta', 'جاكرتا', -6.2088, 106.8456, 'Asia/Jakarta', 'kemenag'],
    ['my', 'Malaysia', 'ماليزيا', 'Kuala Lumpur', 'كوالالمبور', 3.1390, 101.6869, 'Asia/Kuala_Lumpur', 'jakim'],
    ['ng', 'Nigeria', 'نيجيريا', 'Lagos', 'لاغوس', 6.5244, 3.3792, 'Africa/Lagos', 'mwl'],
    ['sn', 'Senegal', 'السنغال', 'Dakar', 'داكار', 14.7167, -17.4677, 'Africa/Dakar', 'mwl'],
    ['gb', 'United Kingdom', 'المملكة المتحدة', 'London', 'لندن', 51.5072, -0.1276, 'Europe/London', 'mwl'],
    ['fr', 'France', 'فرنسا', 'Paris', 'باريس', 48.8566, 2.3522, 'Europe/Paris', 'uoif'],
    ['de', 'Germany', 'ألمانيا', 'Berlin', 'برلين', 52.5200, 13.4050, 'Europe/Berlin', 'mwl'],
    ['se', 'Sweden', 'السويد', 'Stockholm', 'ستوكهولم', 59.3293, 18.0686, 'Europe/Stockholm', 'mwl'],
    ['us', 'United States', 'الولايات المتحدة', 'New York', 'نيويورك', 40.7128, -74.0060, 'America/New_York', 'isna'],
    ['ca', 'Canada', 'كندا', 'Toronto', 'تورنتو', 43.6532, -79.3832, 'America/Toronto', 'isna'],
    ['au', 'Australia', 'أستراليا', 'Sydney', 'سيدني', -33.8688, 151.2093, 'Australia/Sydney', 'mwl'],
    ['za', 'South Africa', 'جنوب أفريقيا', 'Cape Town', 'كيب تاون', -33.9249, 18.4241, 'Africa/Johannesburg', 'mwl'],
    ['ru', 'Russia', 'روسيا', 'Moscow', 'موسكو', 55.7558, 37.6173, 'Europe/Moscow', 'russia']
  ].map(function (r) { return { id: r[0], en: r[1], ar: r[2], cityEn: r[3], cityAr: r[4], lat: r[5], lng: r[6], tz: r[7], method: r[8] }; });

  var PRAYERS = [
    { key: 'fajr', en: 'Fajr', ar: 'الفجر', color: 'var(--jawaz)' },
    { key: 'sunrise', en: 'Sunrise', ar: 'الشروق', color: 'var(--text-3)', dashed: true },
    { key: 'dhuhr', en: 'Dhuhr', ar: 'الظهر', color: 'var(--fadl)' },
    { key: 'asr', en: 'ʿAṣr', ar: 'العصر', color: 'var(--karaha)' },
    { key: 'maghrib', en: 'Maghrib', ar: 'المغرب', color: 'var(--darura)' },
    { key: 'isha', en: 'ʿIshāʾ', ar: 'العشاء', color: 'var(--forbid)' }
  ];

  /* ---------- astronomy (PrayTimes.org formulas) ---------- */
  var rad = function (d) { return d * Math.PI / 180; };
  var deg = function (r) { return r * 180 / Math.PI; };
  var fix = function (a, b) { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a; };
  function julian(y, m, d) {
    if (m <= 2) { y -= 1; m += 12; }
    var A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
  }
  function sunPosition(jd) {
    var D = jd - 2451545.0;
    var g = fix(357.529 + 0.98560028 * D, 360);
    var q = fix(280.459 + 0.98564736 * D, 360);
    var L = fix(q + 1.915 * Math.sin(rad(g)) + 0.020 * Math.sin(rad(2 * g)), 360);
    var e = 23.439 - 0.00000036 * D;
    var RA = deg(Math.atan2(Math.cos(rad(e)) * Math.sin(rad(L)), Math.cos(rad(L)))) / 15;
    return { decl: deg(Math.asin(Math.sin(rad(e)) * Math.sin(rad(L)))), eqt: q / 15 - fix(RA, 24) };
  }
  function times(y, m, d, place, asrFactor, method) {
    var jd = julian(y, m, d) - place.lng / (15 * 24);
    var lat = place.lat;
    function midDay(t) { return fix(12 - sunPosition(jd + t).eqt, 24); }
    function angleTime(angle, t, ccw) {
      var decl = sunPosition(jd + t).decl, noon = midDay(t);
      var c = (-Math.sin(rad(angle)) - Math.sin(rad(decl)) * Math.sin(rad(lat))) / (Math.cos(rad(decl)) * Math.cos(rad(lat)));
      if (c > 1 || c < -1) return NaN;
      var T = deg(Math.acos(c)) / 15;
      return noon + (ccw ? -T : T);
    }
    function asrTime(factor, t) {
      var decl = sunPosition(jd + t).decl;
      var angle = -deg(Math.atan(1 / (factor + Math.tan(rad(Math.abs(lat - decl))))));
      return angleTime(angle, t);
    }
    var r = {
      fajr: angleTime(method.fajr, 5 / 24, true),
      sunrise: angleTime(0.833, 6 / 24, true),
      dhuhr: midDay(12 / 24),
      asr: asrTime(asrFactor, 13 / 24),
      maghrib: angleTime(0.833, 18 / 24)
    };
    r.isha = method.ishaMin ? r.maghrib + method.ishaMin / 60 : angleTime(method.isha, 18 / 24);
    // High latitudes: the angle-based rule keeps Fajr and ʿIshāʾ inside the night
    var night = fix(r.sunrise - r.maghrib, 24);
    var fajrLimit = method.fajr / 60 * night;
    if (isNaN(r.fajr) || fix(r.sunrise - r.fajr, 24) > fajrLimit) r.fajr = r.sunrise - fajrLimit;
    if (!method.ishaMin) {
      var ishaLimit = method.isha / 60 * night;
      if (isNaN(r.isha) || fix(r.isha - r.maghrib, 24) > ishaLimit) r.isha = r.maghrib + ishaLimit;
    }
    var shift = -place.lng / 15;
    Object.keys(r).forEach(function (k) { r[k] += shift; });
    return r;
  }
  function offsetFormatter(tz) {
    try {
      return new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return null; }
  }
  function tzOffset(fmt, y, m, d) {
    if (!fmt) return 0;
    var at = Date.UTC(y, m - 1, d, 12);
    var p = {};
    fmt.formatToParts(new Date(at)).forEach(function (x) { p[x.type] = parseInt(x.value, 10); });
    return (Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute) - at) / 3600000;
  }
  function yearData(place, asrFactor, year) {
    var method = METHODS[place.method] || METHODS.mwl;
    var fmt = offsetFormatter(place.tz);
    var days = [];
    var d0 = Date.UTC(year, 0, 1);
    var n = (Date.UTC(year + 1, 0, 1) - d0) / 86400000;
    for (var i = 0; i < n; i++) {
      var dt = new Date(d0 + i * 86400000);
      var y = dt.getUTCFullYear(), m = dt.getUTCMonth() + 1, d = dt.getUTCDate();
      var tz = tzOffset(fmt, y, m, d);
      var t = times(y, m, d, place, asrFactor, method);
      var row = { date: dt };
      Object.keys(t).forEach(function (k) { row[k] = fix(t[k] + tz, 24); });
      days.push(row);
    }
    return days;
  }

  /* ---------- drawing ---------- */
  var state = { place: null, lang: 'en', mz: 'hanafi', hidden: {}, custom: null };
  var AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
  function num(s) { return state.lang === 'ar' ? String(s).replace(/\d/g, function (d) { return AR_DIGITS[d]; }) : String(s); }
  function hhmm(h) {
    if (h == null || isNaN(h)) return '—';
    var mins = Math.round(h * 60) % 1440;
    return num(String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0'));
  }
  function T(en, ar) { return state.lang === 'ar' ? ar : en; }
  var $ = function (id) { return document.getElementById(id); };

  var W = 1000, H = 520, M = { top: 20, right: 70, bottom: 44, left: 70 };
  var data = [];

  function xOf(i, n) {
    var t = i / (n - 1);
    var plot = W - M.left - M.right;
    return state.lang === 'ar' ? W - M.right - t * plot : M.left + t * plot;
  }
  function yOf(h) { return M.top + (1 - h / 24) * (H - M.top - M.bottom); }

  function draw() {
    var svg = $('yearSvg');
    if (!svg || !state.place) return;
    var year = new Date().getFullYear();
    data = yearData(state.place, state.mz === 'hanafi' ? 2 : 1, year);
    var n = data.length, rtl = state.lang === 'ar';
    var g = '';
    // hour grid and labels
    for (var h = 0; h <= 24; h += 2) {
      var y = yOf(h);
      g += '<line class="yc-grid' + (h % 6 ? '' : ' yc-grid--major') + '" x1="' + M.left + '" x2="' + (W - M.right) + '" y1="' + y + '" y2="' + y + '"/>';
      g += '<text class="yc-ylab" x="' + (rtl ? W - M.right + 10 : M.left - 10) + '" y="' + (y + 4) + '" text-anchor="' + (rtl ? 'start' : 'end') + '">' + hhmm(h === 24 ? 23.9999 : h).replace(/23:59|٢٣:٥٩/, num('24:00')) + '</text>';
    }
    // months
    var monthFmt = new Intl.DateTimeFormat(rtl ? 'ar' : 'en', { month: 'short', timeZone: 'UTC' });
    data.forEach(function (row, i) {
      if (row.date.getUTCDate() !== 1) return;
      var x = xOf(i, n);
      g += '<line class="yc-month" x1="' + x + '" x2="' + x + '" y1="' + M.top + '" y2="' + (H - M.bottom) + '"/>';
      var mid = xOf(Math.min(n - 1, i + 14), n);
      g += '<text class="yc-xlab" x="' + mid + '" y="' + (H - M.bottom + 26) + '" text-anchor="middle">' + monthFmt.format(row.date) + '</text>';
    });
    // lines (break a line where it wraps past midnight)
    PRAYERS.forEach(function (p) {
      if (state.hidden[p.key]) return;
      var dPath = '', prev = null;
      data.forEach(function (row, i) {
        var v = row[p.key];
        if (v == null || isNaN(v)) { prev = null; return; }
        var x = xOf(i, n).toFixed(1), y = yOf(v).toFixed(1);
        dPath += (prev == null || Math.abs(v - prev) > 6 ? 'M' : 'L') + x + ' ' + y;
        prev = v;
      });
      g += '<path class="yc-line' + (p.dashed ? ' yc-line--dash' : '') + '" style="stroke:' + p.color + '" d="' + dPath + '"/>';
    });
    // today
    var now = new Date(), todayIdx = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(year, 0, 1)) / 86400000);
    if (todayIdx >= 0 && todayIdx < n) {
      var tx = xOf(todayIdx, n);
      g += '<line class="yc-today" x1="' + tx + '" x2="' + tx + '" y1="' + M.top + '" y2="' + (H - M.bottom) + '"/>';
      g += '<text class="yc-today-lab" x="' + tx + '" y="' + (M.top + 14) + '" text-anchor="middle">' + T('Today', 'اليوم') + '</text>';
    }
    g += '<g id="ycHover" class="yc-hover" style="display:none"><line id="ycHoverLine" y1="' + M.top + '" y2="' + (H - M.bottom) + '"/></g>';
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.innerHTML = g;
    svg.setAttribute('aria-label', T('Prayer times through the year for ', 'مواقيت الصلاة على مدار العام في ') + placeName());
    renderMeta();
  }

  function placeName() {
    var p = state.place;
    if (p.custom) return T('your location', 'موقعك');
    return T(p.cityEn + ', ' + p.en, p.cityAr + '، ' + p.ar);
  }

  function renderMeta() {
    var p = state.place, method = METHODS[p.method] || METHODS.mwl;
    var asr = state.mz === 'hanafi' ? T('ʿAṣr: shadow ×2 (Ḥanafī)', 'العصر: ظل المثلين (الحنفية)') : T('ʿAṣr: shadow ×1 (majority)', 'العصر: ظل المثل (الجمهور)');
    $('yearMeta').textContent = placeName() + ' · ' + (state.lang === 'ar' ? method.ar : method.en) + ' · ' + asr;
  }

  function renderLegend() {
    var box = $('yearLegend');
    box.innerHTML = '';
    PRAYERS.forEach(function (p) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'yc-key';
      b.setAttribute('aria-pressed', state.hidden[p.key] ? 'false' : 'true');
      b.innerHTML = '<i style="background:' + p.color + (p.dashed ? ';opacity:.6' : '') + '"></i>' + T(p.en, p.ar);
      b.addEventListener('click', function () { state.hidden[p.key] = !state.hidden[p.key]; renderLegend(); draw(); });
      box.appendChild(b);
    });
  }

  function renderSelect() {
    var sel = $('yearCountry');
    var current = state.place && !state.place.custom ? state.place.id : sel.value;
    var sorted = PLACES.slice().sort(function (a, b) { return (state.lang === 'ar' ? a.ar : a.en).localeCompare(state.lang === 'ar' ? b.ar : b.en, state.lang); });
    sel.innerHTML = (state.custom ? '<option value="custom">' + T('My location', 'موقعي') + '</option>' : '') +
      sorted.map(function (p) { return '<option value="' + p.id + '">' + (state.lang === 'ar' ? p.ar + ' — ' + p.cityAr : p.en + ' — ' + p.cityEn) + '</option>'; }).join('');
    sel.value = state.place && state.place.custom ? 'custom' : current;
  }

  function hover(ev) {
    var svg = $('yearSvg');
    if (!data.length) return;
    var box = svg.getBoundingClientRect();
    var x = (ev.clientX - box.left) / box.width * W;
    var plot = W - M.left - M.right;
    var t = state.lang === 'ar' ? (W - M.right - x) / plot : (x - M.left) / plot;
    if (t < 0 || t > 1) { leave(); return; }
    var i = Math.round(t * (data.length - 1)), row = data[i];
    var hv = $('ycHover'), line = $('ycHoverLine'), xx = xOf(i, data.length);
    hv.style.display = '';
    line.setAttribute('x1', xx); line.setAttribute('x2', xx);
    hv.querySelectorAll('circle').forEach(function (c) { c.remove(); });
    var dateFmt = new Intl.DateTimeFormat(state.lang === 'ar' ? 'ar' : 'en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });
    var html = '<b>' + dateFmt.format(row.date) + '</b>';
    PRAYERS.forEach(function (p) {
      if (state.hidden[p.key]) return;
      var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', xx); c.setAttribute('cy', yOf(row[p.key])); c.setAttribute('r', 4.5);
      c.setAttribute('style', 'fill:' + p.color);
      hv.appendChild(c);
      html += '<span><i style="background:' + p.color + '"></i>' + T(p.en, p.ar) + '<em>' + hhmm(row[p.key]) + '</em></span>';
    });
    var tip = $('yearTip');
    tip.innerHTML = html;
    tip.hidden = false;
    var wrap = $('yearChart').getBoundingClientRect();
    var px = ev.clientX - wrap.left, left = px + 16;
    if (left + 200 > wrap.width) left = px - 216;
    tip.style.left = Math.max(0, left) + 'px';
    tip.style.top = Math.max(0, ev.clientY - wrap.top - 60) + 'px';
  }
  function leave() {
    var hv = $('ycHover');
    if (hv) hv.style.display = 'none';
    $('yearTip').hidden = true;
  }

  function locate() {
    if (!navigator.geolocation) return;
    var btn = $('yearLocate');
    btn.disabled = true;
    navigator.geolocation.getCurrentPosition(function (pos) {
      btn.disabled = false;
      var tz = 'UTC';
      try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) { /* keep UTC */ }
      state.custom = { id: 'custom', custom: true, lat: pos.coords.latitude, lng: pos.coords.longitude, tz: tz, method: 'mwl' };
      state.place = state.custom;
      renderSelect();
      draw();
    }, function () {
      btn.disabled = false;
      if (window.Sakina) Sakina.toast(T('Location unavailable — choose a country instead', 'تعذّر تحديد الموقع — اختر بلدًا بدلًا من ذلك'));
    }, { timeout: 10000, maximumAge: 3600000 });
  }

  var wired = false;
  function wire() {
    if (wired) return;
    wired = true;
    $('yearCountry').addEventListener('change', function () {
      var v = this.value;
      state.place = v === 'custom' ? state.custom : PLACES.filter(function (p) { return p.id === v; })[0];
      try { localStorage.setItem('fs-country', v === 'custom' ? 'sa' : v); } catch (e) { /* private mode */ }
      draw();
    });
    $('yearLocate').addEventListener('click', locate);
    if (!navigator.geolocation) $('yearLocate').hidden = true;
    var svg = $('yearSvg');
    svg.addEventListener('pointermove', hover);
    svg.addEventListener('pointerdown', hover);
    svg.addEventListener('pointerleave', leave);
  }

  function guessCountry() {
    try {
      var saved = localStorage.getItem('fs-country');
      if (saved) return saved;
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      var hit = PLACES.filter(function (p) { return p.tz === tz; })[0];
      if (hit) return hit.id;
    } catch (e) { /* fall through */ }
    return 'sa';
  }

  function render(lang, mz) {
    state.lang = lang === 'ar' ? 'ar' : 'en';
    state.mz = mz;
    if (!state.place) {
      var id = guessCountry();
      state.place = PLACES.filter(function (p) { return p.id === id; })[0] || PLACES[0];
    }
    wire();
    renderSelect();
    renderLegend();
    draw();
  }

  return { render: render, times: times, PLACES: PLACES, METHODS: METHODS };
})();
