// ==UserScript==
// @name          AO3 Blocker
// @description   Fork of ao3 savior; blocks works based on certain conditions
// @author        JacenBoy
// @namespace     https://github.com/JacenBoy/ao3-blocker#readme
// @license       Apache-2.0; http://www.apache.org/licenses/LICENSE-2.0
// @include       http*://archiveofourown.org/*
// @version       2.0
// @require       https://openuserjs.org/src/libs/sizzle/GM_config.js
// @require       https://ajax.googleapis.com/ajax/libs/jquery/1.9.0/jquery.min.js
// @grant         GM_getValue
// @grant         GM_setValue
// @run-at        document-end
// ==/UserScript==



(function () {
  "use strict";

  GM_config.init({
    "id": "ao3Blocker",
    "title": "AO3 Blocker",
    "fields": {
      "tagBlacklist": {
        "label": "Tag Blacklist",
        "type": "text",
        "default": ""
      },
      "tagWhitelist": {
        "label": "Tag Whitelist",
        "type": "text",
        "default": ""
      },
      "authorBlacklist": {
        "label": "Author Blacklist",
        "type": "text",
        "default": ""
      },
      "titleBlacklist": {
        "label": "Title Blacklist",
        "type": "text",
        "default": ""
      },
      "summaryBlacklist": {
        "label": "Summary Blacklist",
        "type": "text",
        "default": ""
      },
      "showReasons": {
        "label": "Show Block Reason",
        "type": "checkbox",
        "default": true
      },
      "showPlaceholders": {
        "label": "Show Work Placeholder",
        "type": "checkbox",
        "default": true
      },
      "alertOnVisit": {
        "label": "Alert When Opening Blocked Work",
        "type": "checkbox",
        "default": false
      }
    }
  });

  var STYLE = "\n  html body .ao3-blocker-hidden {\n    display: none;\n  }\n  \n  .ao3-blocker-cut {\n    display: none;\n  }\n  \n  .ao3-blocker-cut::after {\n    clear: both;\n    content: '';\n    display: block;\n  }\n  \n  .ao3-blocker-reason {\n    margin-left: 5px;\n  }\n  \n  .ao3-blocker-hide-reasons .ao3-blocker-reason {\n    display: none;\n  }\n  \n  .ao3-blocker-unhide .ao3-blocker-cut {\n    display: block;\n  }\n  \n  .ao3-blocker-fold {\n    align-items: center;\n    display: flex;\n    justify-content: flex-start;\n  }\n  \n  .ao3-blocker-unhide .ao3-blocker-fold {\n    border-bottom: 1px dashed;\n    margin-bottom: 15px;\n    padding-bottom: 5px;\n  }\n  \n  button.ao3-blocker-toggle {\n    margin-left: auto;\n  }\n";

  function addMenu() {
    var headerMenu = $("ul.primary.navigation.actions");
    var blockerMenu = $("<li class=\"dropdown\"></li>").html("<a>AO3 Blocker</a>");
    headerMenu.find("li.search").before(blockerMenu);
    var dropMenu = $("<ul class=\"menu dropdown-menu\"></ul>");
    blockerMenu.append(dropMenu);

    var reasonButton = $("<li></li>").html(`<a>${GM_config.get("showReasons") ? "Hide" : "Show"} Block Reason</a>`);
    reasonButton.on("click", () => {
      if (GM_config.get("showReasons")) {
        GM_config.set("showReasons", false);
      } else {
        GM_config.set("showReasons", true);
      }
      GM_config.save();
      reasonButton.html(`<a>${GM_config.get("showReasons") ? "Hide" : "Show"} Block Reason</a>`);
    });
    dropMenu.append(reasonButton);

    var placeholderButton = $("<li></li>").html(`<a>${GM_config.get("showPlaceholders") ? "Hide" : "Show"} Work Placeholder</a>`);
    placeholderButton.on("click", () => {
      if (GM_config.get("showPlaceholders")) {
        GM_config.set("showPlaceholders", false);
      } else {
        GM_config.set("showPlaceholders", true);
      }
      GM_config.save();
      placeholderButton.html(`<a>${GM_config.get("showPlaceholders") ? "Hide" : "Show"} Work Placeholder</a>`);
    });
    dropMenu.append(placeholderButton);

    var alertButton = $("<li></li>").html(`<a>${GM_config.get("alertOnVisit") ? "Don't Show" : "Show"} Blocked Work Alerts</a>`);
    alertButton.on("click", () => {
      if (GM_config.get("alertOnVisit")) {
        GM_config.set("alertOnVisit", false);
      } else {
        GM_config.set("alertOnVisit", true);
      }
      GM_config.save();
      alertButton.html(`<a>${GM_config.get("alertOnVisit") ? "Don't Show" : "Show"} Blocked Work Alerts</a>`);
    });
    dropMenu.append(alertButton);

    var settingsButton = $("<li></li>").html("<a>All Settings</a>");
    settingsButton.on("click", () => {GM_config.open();});
    dropMenu.append(settingsButton);
  }

  var CSS_NAMESPACE = "ao3-blocker";

  function addStyle() {
    var style = $(`<style class="${CSS_NAMESPACE}"></style>`).html(STYLE);

    $("head").append(style);
  }

  function getCut(work) {
    var cut = $(`<div class="${CSS_NAMESPACE}-cut"></div>`);

    $.makeArray(work.children()).forEach(function (child) {
      return cut.append(child);
    });

    return cut;
  }

  function getFold(reason) {
    var fold = $(`<div class="${CSS_NAMESPACE}-fold"></div>`);
    var note = $(`<span class="${CSS_NAMESPACE}-note"</span>`).text("This work is hidden! ");

    fold.html(note);
    fold.append(getReasonSpan(reason));
    fold.append(getToggleButton());

    return fold;
  }

  function getToggleButton() {
    var button = $(`<button class="${CSS_NAMESPACE}-toggle"></button>`).text("Unhide");
    var unhideClassFragment = `${CSS_NAMESPACE}-unhide`;

    button.on("click", function (event) {
      var work = $(event.target).closest(`.${CSS_NAMESPACE}-work`);

      if (work.hasClass(unhideClassFragment)) {
        work.removeClass(unhideClassFragment);
        work.find(`.${CSS_NAMESPACE}-note`).text("This work is hidden.");
        $(event.target).text("Unhide");
      } else {
        work.addClass(unhideClassFragment);
        work.find(`.${CSS_NAMESPACE}-note`).text("ℹ️ This work was hidden.");
        $(event.target).text("Hide");
      }
    });

    return button;
  }

  function getReasonSpan(reason) {
    var span = $(`<span class="${CSS_NAMESPACE}-reason"></span>`);

    var text = undefined;

    if (reason.tag) {
      text = `tags include <strong>${reason.tag}</strong>`;
    } else if (reason.author) {
      text = `authors include <strong>${reason.author}</strong>`;
    } else if (reason.title) {
      text = `title is <strong>${reason.title}</strong>`;
    } else if (reason.summary) {
      text = `summary includes <strong>${reason.summary}</strong>`;
    }

    if (text) {
      span.html(`(Reason: ${text}.)`);
    }

    return span;
  }

  function blockWork(work, reason, config) {
    if (!reason) return;

    if (config.showPlaceholders) {
      var fold = getFold(reason);
      var cut = getCut(work);

      work.addClass(`${CSS_NAMESPACE}-work`);
      work.html(fold);
      work.append(cut);

      if (!config.showReasons) {
        work.addClass(`${CSS_NAMESPACE}-hide-reasons`);
      }
    } else {
      work.addClass(`${CSS_NAMESPACE}-hidden`);
    }
  }

  function matchTermsWithWildCard(term0, pattern0) {
    var term = term0.toLowerCase();
    var pattern = pattern0.toLowerCase();

    if (term === pattern) return true;
    if (pattern.indexOf("*") === -1) return false;

    var lastMatchedIndex = pattern.split("*").filter(Boolean).reduce(function (prevIndex, chunk) {
      var matchedIndex = term.indexOf(chunk);
      return prevIndex >= 0 && prevIndex <= matchedIndex ? matchedIndex : -1;
    }, 0);

    return lastMatchedIndex >= 0;
  }

  function isTagWhitelisted(tags, whitelist) {
    var whitelistLookup = whitelist.reduce(function (lookup, tag) {
      lookup[tag.toLowerCase()] = true;
      return lookup;
    }, {});

    return tags.some(function (tag) {
      return !!whitelistLookup[tag.toLowerCase()];
    });
  }

  function findBlacklistedItem(list, blacklist, comparator) {
    var matchingEntry = void 0;

    list.some(function (item) {
      blacklist.some(function (entry) {
        var matched = comparator(item.toLowerCase(), entry.toLowerCase());

        if (matched) matchingEntry = entry;

        return matched;
      });
    });

    return matchingEntry;
  }

  function equals(a, b) {
    return a === b;
  }
  function contains(a, b) {
    return a.indexOf(b) !== -1;
  }

  function getBlockReason(_ref, _ref2) {
    var _ref$authors = _ref.authors,
      authors = _ref$authors === undefined ? [] : _ref$authors,
      _ref$title = _ref.title,
      title = _ref$title === undefined ? "" : _ref$title,
      _ref$tags = _ref.tags,
      tags = _ref$tags === undefined ? [] : _ref$tags,
      _ref$summary = _ref.summary,
      summary = _ref$summary === undefined ? "" : _ref$summary;
    var _ref2$authorBlacklist = _ref2.authorBlacklist,
      authorBlacklist = _ref2$authorBlacklist === undefined ? [] : _ref2$authorBlacklist,
      _ref2$titleBlacklist = _ref2.titleBlacklist,
      titleBlacklist = _ref2$titleBlacklist === undefined ? [] : _ref2$titleBlacklist,
      _ref2$tagBlacklist = _ref2.tagBlacklist,
      tagBlacklist = _ref2$tagBlacklist === undefined ? [] : _ref2$tagBlacklist,
      _ref2$tagWhitelist = _ref2.tagWhitelist,
      tagWhitelist = _ref2$tagWhitelist === undefined ? [] : _ref2$tagWhitelist,
      _ref2$summaryBlacklis = _ref2.summaryBlacklist,
      summaryBlacklist = _ref2$summaryBlacklis === undefined ? [] : _ref2$summaryBlacklis;


    if (isTagWhitelisted(tags, tagWhitelist)) {
      return null;
    }

    var blockedTag = findBlacklistedItem(tags, tagBlacklist, matchTermsWithWildCard);
    if (blockedTag) {
      return { tag: blockedTag };
    }

    var author = findBlacklistedItem(authors, authorBlacklist, equals);
    if (author) {
      return { author: author };
    }

    var blockedTitle = findBlacklistedItem([title.toLowerCase()], titleBlacklist, matchTermsWithWildCard);
    if (blockedTitle) {
      return { title: blockedTitle };
    }

    var summaryTerm = findBlacklistedItem([summary.toLowerCase()], summaryBlacklist, contains);
    if (summaryTerm) {
      return { summary: summaryTerm };
    }

    return null;
  }

  var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

  function getText(element) {
    return $(element).text().replace(/^\s*|\s*$/g, "");
  }
  function selectTextsIn(root, selector) {
    return $.makeArray($(root).find(selector)).map(getText);
  }

  function selectFromWork(container) {
    return _extends({}, selectFromBlurb(container), {
      title: selectTextsIn(container, ".title")[0],
      summary: selectTextsIn(container, ".summary .userstuff")[0]
    });
  }

  function selectFromBlurb(blurb) {
    return {
      authors: selectTextsIn(blurb, "a[rel=author]"),
      tags: [].concat(selectTextsIn(blurb, "a.tag"), selectTextsIn(blurb, ".required-tags .text")),
      title: selectTextsIn(blurb, ".header .heading a:first-child")[0],
      summary: selectTextsIn(blurb, "blockquote.summary")[0]
    };
  }

  function checkWorks () {
    var debugMode = false;
    var config = {
      "showReasons": GM_config.get("showReasons"),
      "showPlaceholders": GM_config.get("showPlaceholders"),
      "alertOnVisit": GM_config.get("alertOnVisit"),
      "authorBlacklist": GM_config.get("authorBlacklist").split(/,(?:\s)?/g).map(i=>i.trim()),
      "titleBlacklist": GM_config.get("titleBlacklist").split(/,(?:\s)?/g).map(i=>i.trim()),
      "tagBlacklist": GM_config.get("tagBlacklist").split(/,(?:\s)?/g).map(i=>i.trim()),
      "tagWhitelist": GM_config.get("tagWhitelist").split(/,(?:\s)?/g).map(i=>i.trim()),
      "summaryBlacklist": GM_config.get("summaryBlacklist").split(/,(?:\s)?/g).map(i=>i.trim())
    };
    var workContainer = $("#main.works-show") || $("#main.chapters-show");
    var blocked = 0;
    var total = 0;

    if (debugMode) {
      console.groupCollapsed("AO3 BLOCKER");

      if (!config) {
        console.warn("Exiting due to missing config.");
        return;
      }
    }

    addMenu();

    addStyle();

    $.makeArray($("li.blurb")).forEach(function (blurb) {
      blurb = $(blurb);
      var blockables = selectFromBlurb(blurb);
      var reason = getBlockReason(blockables, config);

      total++;

      if (reason) {
        blockWork(blurb, reason, config);
        blocked++;

        if (debugMode) {
          console.groupCollapsed("- blocked " + blurb.attr("id"));
          console.log(blurb.html(), reason);
          console.groupEnd();
        }
      } else if (debugMode) {
        console.groupCollapsed("  skipped " + blurb.attr("id"));
        console.log(blurb.html());
        console.groupEnd();
      }
    });

    if (config.alertOnVisit && workContainer && document.referrer.indexOf("//archiveofourown.org") === -1) {

      var blockables = selectFromWork(workContainer);
      var reason = getBlockReason(blockables, config);

      if (reason) {
        blocked++;
        blockWork(workContainer, reason, config);
      }
    }

    if (debugMode) {
      console.log("Blocked " + blocked + " out of " + total + " works");
      console.groupEnd();
    }
  }

  setTimeout(checkWorks, 10);

}());
