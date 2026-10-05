/* ==========================================================================
   IDN Code 官网交互脚本
   1) 滚动显现  2) Hero 粒子  3) 下载版本清单与按钮  4) 订阅表单  5) 锚点滚动
   仅使用浏览器标准 API，无外部依赖。
   ========================================================================== */
(function () {
  "use strict";

  /* ---------------------------------------------------------------- 配置 */

  var CONFIG = {
    // 发布清单地址。可指向本仓库根目录的 releases.json，
    // 也可以改成官方 CDN 上的清单地址（例如 https://idncode.com/releases.json）。
    releasesUrl: "./data/releases.json",
    // 订阅接口。留空时使用 mailto 兜底；填入接口地址后会以 POST JSON 方式提交。
    waitlistEndpoint: "",
    supportEmail: "support@idncode.com"
  };

  var LANG = document.documentElement.lang === "en" ? "en" : "zh";
  var S = (window.IDNCODE_STRINGS || {})[LANG] || {};

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* --------------------------------------------------------- 滚动显现 */

  function initScrollReveal() {
    var items = $$(".scroll-reveal");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------ 粒子层 */

  function initParticles() {
    var field = $(".hero-particle-field");
    if (!field) return;
    var spots = [
      [7, 18], [13, 68], [19, 36], [24, 78], [31, 23], [38, 58], [45, 14], [49, 82],
      [56, 28], [61, 66], [67, 18], [72, 74], [78, 32], [83, 58], [88, 20], [92, 79],
      [10, 46], [28, 48], [52, 48], [74, 46], [16, 12], [43, 70], [64, 40], [86, 69]
    ];
    var frag = document.createDocumentFragment();
    spots.forEach(function (p, i) {
      var dot = document.createElement("i");
      dot.style.left = p[0] + "%";
      dot.style.top = p[1] + "%";
      dot.style.animationDelay = (i * 0.35).toFixed(2) + "s";
      frag.appendChild(dot);
    });
    field.appendChild(frag);
  }

  /* -------------------------------------------------- 下载清单与下载按钮 */

  var state = { release: null, loading: true, fallback: null };

  function key(d) { return d.platform + ":" + d.arch; }

  function pickDownload(k) {
    if (!state.release) return null;
    var list = state.release.downloads || [];
    for (var i = 0; i < list.length; i++) {
      if (key(list[i]) === k) return list[i];
    }
    return null;
  }

  function isReady(item) {
    return !!(item && item.available && item.url) && state.release && state.release.status === "published";
  }

  function formatSize(bytes) {
    if (!isFinite(bytes) || bytes <= 0) return "—";
    return (bytes / 1024 / 1024).toFixed(1) + " MB";
  }

  function shortSha(sha) {
    if (!sha) return "—";
    return sha.slice(0, 16) + "…";
  }

  function loadReleases() {
    return fetch(CONFIG.releasesUrl, { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("release manifest " + res.status);
        return res.json();
      })
      .then(function (json) {
        var rel = json && json.release ? json.release : json;
        if (!rel || !Array.isArray(rel.downloads)) throw new Error("bad manifest");
        return rel;
      });
  }

  function renderReleaseStatus() {
    var el = $("[data-release-status]");
    if (!el) return;
    if (state.loading) {
      el.innerHTML = "<i></i>" + (S.releaseLoading || "Loading");
      return;
    }
    var rel = state.release;
    if (rel && rel.status === "published" && rel.appVersion) {
      el.classList.add("ready");
      el.innerHTML = "<i></i>" + (S.releaseReady || "Latest") + "：" + rel.appVersion;
    } else {
      el.classList.remove("ready");
      el.innerHTML = "<i></i>" + (S.releaseUnavailable || "Not open yet");
    }
  }

  function renderReleaseDetails() {
    var rel = state.release;
    if (!rel) return;
    var versionEl = $("[data-release-version]");
    if (versionEl) versionEl.textContent = rel.appVersion || "—";

    var mac = pickDownload("mac:arm64");
    var sizeEl = $("[data-release-size]");
    if (sizeEl) sizeEl.textContent = formatSize(mac && mac.size);
    var shaEl = $("[data-release-sha]");
    if (shaEl) shaEl.textContent = shortSha(mac && mac.sha256);
    var notesEl = $("[data-release-notes]");
    if (notesEl && rel.releaseNotes) notesEl.textContent = rel.releaseNotes;
  }

  function renderPlatforms() {
    var targets = $$("[data-download-key]");
    targets.forEach(function (el) {
      var item = pickDownload(el.getAttribute("data-download-key"));
      var ready = isReady(item);
      var label = el.getAttribute("data-label") || "";
      var strong = $("strong", el);
      if (strong && label) {
        strong.textContent = ready ? label : (S.comingSoon || "Coming soon");
      }
    });

    var chipLinks = $$(".chip-menu a[data-download-key]");
    chipLinks.forEach(function (a) {
      var item = pickDownload(a.getAttribute("data-download-key"));
      if (isReady(item)) {
        a.setAttribute("href", item.url);
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
      } else {
        a.setAttribute("href", "#download");
        a.removeAttribute("target");
      }
    });

    // Mac 主按钮在可下载时直接下载 Apple Silicon 版本，否则用于展开芯片选择
    var macToggle = $("[data-mac-toggle]");
    if (macToggle) {
      var arm = isReady(pickDownload("mac:arm64"));
      var intel = isReady(pickDownload("mac:x64"));
      var strongEl = $("strong", macToggle);
      var anyMac = arm || intel;
      macToggle.setAttribute("data-download-key", arm || !intel ? "mac:arm64" : "mac:x64");
      macToggle.classList.toggle("mac-direct", !!anyMac);
      macToggle.setAttribute("aria-label", anyMac ? (S.macReady || "Download for macOS") : (S.macPick || "Choose Mac chip type"));
      if (strongEl) {
        strongEl.textContent = anyMac ? (S.macReady || "Download for macOS") : (LANG === "en" ? "Download for macOS" : "macOS 版下载");
      }
    }
  }

  function refreshDownloadUI() {
    renderReleaseStatus();
    renderReleaseDetails();
    renderPlatforms();
  }

  function focusWaitlist(platformKey) {
    var select = $("[data-waitlist-platform]");
    if (select && platformKey) select.value = platformKey;
    var email = $("[data-waitlist-email]");
    var band = $("#download");
    if (band) band.scrollIntoView({ behavior: "smooth", block: "start" });
    if (email) window.setTimeout(function () { email.focus({ preventScroll: true }); }, 420);
  }

  function initDownloadButtons() {
    var chipMenu = $("#mac-download-menu");
    var macBtn = $("[data-mac-toggle]");
    if (macBtn && chipMenu) {
      macBtn.setAttribute("aria-expanded", "false");
      macBtn.addEventListener("click", function () {
        if (macBtn.classList.contains("mac-direct")) return; // 直接下载，不展开菜单
        var open = chipMenu.classList.toggle("open");
        macBtn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }

    $$("button[data-download-key]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var k = btn.getAttribute("data-download-key");
        var item = pickDownload(k);
        if (isReady(item)) {
          window.location.href = item.url;
          return;
        }
        focusWaitlist(k);
      });
    });

    $$("a[data-download-key]").forEach(function (a) {
      a.addEventListener("click", function (ev) {
        var k = a.getAttribute("data-download-key");
        var item = pickDownload(k);
        if (isReady(item)) return; // 让浏览器直接下载
        ev.preventDefault();
        focusWaitlist(k);
      });
    });
  }

  function initCopyButtons() {
    $$("[data-copy]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var src = $(btn.getAttribute("data-copy"));
        if (!src) return;
        var text = src.textContent || "";
        var done = function () {
          var old = btn.textContent;
          btn.textContent = LANG === "en" ? "Copied" : "已复制";
          window.setTimeout(function () { btn.textContent = old; }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, done);
        } else {
          window.prompt(LANG === "en" ? "Copy this value" : "请复制以下内容", text);
        }
      });
    });
  }

  /* --------------------------------------------------------- 订阅表单 */

  function initWaitlist() {
    var form = $("[data-waitlist-form]");
    if (!form) return;
    var email = $("[data-waitlist-email]", form);
    var platform = $("[data-waitlist-platform]", form);
    var hint = $("[data-waitlist-hint]", form);

    function setHint(msg, kind) {
      if (!hint) return;
      hint.textContent = msg;
      hint.className = "form-hint" + (kind ? " " + kind : "");
    }

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var value = (email && email.value ? email.value : "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setHint(S.invalidEmail || "Invalid email", "error");
        return;
      }
      setHint(S.submitting || "Submitting…", "");

      var platformValue = platform ? platform.value : "";

      if (CONFIG.waitlistEndpoint) {
        fetch(CONFIG.waitlistEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: value, platform: platformValue, lang: LANG })
        }).then(function (res) {
          if (!res.ok) throw new Error("bad status");
          setHint((S.success || "") + CONFIG.supportEmail, "ok");
          form.reset();
        }).catch(function () {
          setHint(S.failed || "Failed", "error");
        });
        return;
      }

      var subject = encodeURIComponent(S.mailSubject || "IDN Code release notification");
      var body = encodeURIComponent(
        (S.mailBody || "Email: ") + value + "\n" + (S.mailBodyPlatform || "Platform: ") + platformValue
      );
      window.location.href = "mailto:" + CONFIG.supportEmail + "?subject=" + subject + "&body=" + body;
      setHint((S.success || "") + CONFIG.supportEmail, "ok");
      form.reset();
    });
  }

  /* ----------------------------------------------------------- 锚点滚动 */

  function initAnchors() {
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (ev) {
        var id = a.getAttribute("href").slice(1);
        if (!id) return;
        var target = document.getElementById(id);
        if (!target) return;
        ev.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", "#" + id);
      });
    });
  }

  /* ------------------------------------------------------------- 启动 */

  function boot() {
    document.documentElement.classList.remove("no-js");
    initParticles();
    initScrollReveal();
    initAnchors();
    initWaitlist();
    initCopyButtons();
    initDownloadButtons();
    refreshDownloadUI();

    loadReleases()
      .then(function (rel) { state.release = rel; })
      .catch(function () { state.release = { appVersion: "", status: "unavailable", downloads: [] }; })
      .then(function () { state.loading = false; refreshDownloadUI(); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
