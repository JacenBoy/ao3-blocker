// ==UserScript==
// @name          AO3 Blocker
// @description   Fork of ao3 savior; blocks works based on certain conditions
// @author        JacenBoy
// @namespace     https://github.com/JacenBoy/ao3-blocker#readme
// @license       Apache-2.0; http://www.apache.org/licenses/LICENSE-2.0
// @match         http*://archiveofourown.org/*
// @version       2.2
// @require       https://openuserjs.org/src/libs/sizzle/GM_config.js
// @require       https://ajax.googleapis.com/ajax/libs/jquery/1.9.0/jquery.min.js
// @grant         GM_getValue
// @grant         GM_setValue
// @run-at        document-end
// ==/UserScript==

/* globals $, GM_config */

(function () {
  "use strict";
  window.ao3Blocker = {};

  // Initialize GM_config options
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
    },
    "events": {
      "save": () => {
        window.ao3Blocker.updated = true;
        alert("Your changes have been saved.");
      },
      "close": () => {
        if (window.ao3Blocker.updated) location.reload();
      }
    },
    "css": ".config_var {display: grid; grid-template-columns: repeat(2, 0.7fr);}"
  });

  // Define the custom styles for the script
  const STYLE = "\n  html body .ao3-blocker-hidden {\n    display: none;\n  }\n  \n  .ao3-blocker-cut {\n    display: none;\n  }\n  \n  .ao3-blocker-cut::after {\n    clear: both;\n    content: '';\n    display: block;\n  }\n  \n  .ao3-blocker-reason {\n    margin-left: 5px;\n  }\n  \n  .ao3-blocker-hide-reasons .ao3-blocker-reason {\n    display: none;\n  }\n  \n  .ao3-blocker-unhide .ao3-blocker-cut {\n    display: block;\n  }\n  \n  .ao3-blocker-fold {\n    align-items: center;\n    display: flex;\n    justify-content: flex-start;\n  }\n  \n  .ao3-blocker-unhide .ao3-blocker-fold {\n    border-bottom: 1px dashed;\n    margin-bottom: 15px;\n    padding-bottom: 5px;\n  }\n  \n  button.ao3-blocker-toggle {\n    margin-left: auto;\n  }\n";

  // addMenu() - Add a custom menu to the AO3 menu bar to control our configuration options
  function addMenu() {
    // Define our custom menu and add it to the AO3 menu bar
    const headerMenu = $("ul.primary.navigation.actions");
    const blockerMenu = $("<li class=\"dropdown\"></li>").html("<a>AO3 Blocker</a>");
    headerMenu.find("li.search").before(blockerMenu);
    const dropMenu = $("<ul class=\"menu dropdown-menu\"></ul>");
    blockerMenu.append(dropMenu);

    // Add the "Toggle Block Reason" option to the menu
    const reasonButton = $("<li></li>").html(`<a>${GM_config.get("showReasons") ? "Hide" : "Show"} Block Reason</a>`);
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

    // Add the "Toggle Work Placeholder" option to the menu
    const placeholderButton = $("<li></li>").html(`<a>${GM_config.get("showPlaceholders") ? "Hide" : "Show"} Work Placeholder</a>`);
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

    // Add the "Toggle Block Alerts" option to the menu
    const alertButton = $("<li></li>").html(`<a>${GM_config.get("alertOnVisit") ? "Don't Show" : "Show"} Blocked Work Alerts</a>`);
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

    // Add an option to show the config dialog
    const settingsButton = $("<li></li>").html("<a>All Settings</a>");
    settingsButton.on("click", () => {GM_config.open();});
    dropMenu.append(settingsButton);
  }

  // Define the CSS namespace. All CSS classes are prefixed with this.
  const CSS_NAMESPACE = "ao3-blocker";

  // addStyle() - Apply the custom stylesheet to AO3
  function addStyle() {
    const style = $(`<style class="${CSS_NAMESPACE}"></style>`).html(STYLE);

    $("head").append(style);
  }

  // getCut(work) - Move standard AO3 work information (tags, summary, etc.) to a custom element for blocked works. This will be hidden by default on blocked works but can be shown if thre user chooses.
  function getCut(work) {
    const cut = $(`<div class="${CSS_NAMESPACE}-cut"></div>`);

    $.makeArray(work.children()).forEach((child) => {
      return cut.append(child);
    });

    return cut;
  }

  // getFold(reason) - Create the work placeholder for blocked works. Optionally, this will show why the work was blocked and give the user the option to unhide it.
  function getFold(reason) {
    const fold = $(`<div class="${CSS_NAMESPACE}-fold"></div>`);
    const note = $(`<span class="${CSS_NAMESPACE}-note"</span>`).text("This work is hidden! ");

    fold.html(note);
    fold.append(getReasonSpan(reason));
    fold.append(getToggleButton());

    return fold;
  }

  // getToggleButton() - Create a button that will show or hide the "cut" on blocked works.
  function getToggleButton() {
    const button = $(`<button class="${CSS_NAMESPACE}-toggle"></button>`).text("Unhide");
    const unhideClassFragment = `${CSS_NAMESPACE}-unhide`;

    button.on("click", (event) => {
      const work = $(event.target).closest(`.${CSS_NAMESPACE}-work`);

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

  // getReasonSpan(reason) - Create the element that holds the block reason information on blocked works.
  function getReasonSpan(reason) {
    const span = $(`<span class="${CSS_NAMESPACE}-reason"></span>`);

    let text = undefined;

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

  // blockWork(work, reason, config) - Replace the standard AO3 work information with the placeholder "fold", and place the "cut" below it, hidden.
  function blockWork(work, reason, config) {
    if (!reason) return;

    if (config.showPlaceholders) {
      const fold = getFold(reason);
      const cut = getCut(work);

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
    const term = term0.toLowerCase();
    const pattern = pattern0.toLowerCase();

    if (term === pattern) return true;
    if (pattern.indexOf("*") === -1) return false;

    const lastMatchedIndex = pattern.split("*").filter(Boolean).reduce((prevIndex, chunk) => {
      const matchedIndex = term.indexOf(chunk);
      return prevIndex >= 0 && prevIndex <= matchedIndex ? matchedIndex : -1;
    }, 0);

    return lastMatchedIndex >= 0;
  }

  function isTagWhitelisted(tags, whitelist) {
    const whitelistLookup = whitelist.reduce((lookup, tag) => {
      lookup[tag.toLowerCase()] = true;
      return lookup;
    }, {});

    return tags.some((tag) => {
      return !!whitelistLookup[tag.toLowerCase()];
    });
  }

  function findBlacklistedItem(list, blacklist, comparator) {
    let matchingEntry = void 0;

    list.some((item) => {
      blacklist.some((entry) => {
        const matched = comparator(item.toLowerCase(), entry.toLowerCase());

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
    const _ref$authors = _ref.authors,
      authors = _ref$authors === undefined ? [] : _ref$authors,
      _ref$title = _ref.title,
      title = _ref$title === undefined ? "" : _ref$title,
      _ref$tags = _ref.tags,
      tags = _ref$tags === undefined ? [] : _ref$tags,
      _ref$summary = _ref.summary,
      summary = _ref$summary === undefined ? "" : _ref$summary;
    const _ref2$authorBlacklist = _ref2.authorBlacklist,
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

    const blockedTag = findBlacklistedItem(tags, tagBlacklist, matchTermsWithWildCard);
    if (blockedTag) {
      return { tag: blockedTag };
    }

    const author = findBlacklistedItem(authors, authorBlacklist, equals);
    if (author) {
      return { author: author };
    }

    const blockedTitle = findBlacklistedItem([title.toLowerCase()], titleBlacklist, matchTermsWithWildCard);
    if (blockedTitle) {
      return { title: blockedTitle };
    }

    const summaryTerm = findBlacklistedItem([summary.toLowerCase()], summaryBlacklist, contains);
    if (summaryTerm) {
      return { summary: summaryTerm };
    }

    return null;
  }

  const _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

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

  // checkWorks() - Scan all works on the page and block them if they match one of the conditions set by the user.
  function checkWorks () {
    const debugMode = false; // Set to true to enable extra logging
    // Load our config information into a convenient JSON file.
    const config = {
      "showReasons": GM_config.get("showReasons"),
      "showPlaceholders": GM_config.get("showPlaceholders"),
      "alertOnVisit": GM_config.get("alertOnVisit"),
      "authorBlacklist": GM_config.get("authorBlacklist").split(/,(?:\s)?/g).map(i=>i.trim()),
      "titleBlacklist": GM_config.get("titleBlacklist").split(/,(?:\s)?/g).map(i=>i.trim()),
      "tagBlacklist": GM_config.get("tagBlacklist").split(/,(?:\s)?/g).map(i=>i.trim()),
      "tagWhitelist": GM_config.get("tagWhitelist").split(/,(?:\s)?/g).map(i=>i.trim()),
      "summaryBlacklist": GM_config.get("summaryBlacklist").split(/,(?:\s)?/g).map(i=>i.trim())
    };
    // If this is a work page, save the element for future use.
    const workContainer = $("#main.works-show") || $("#main.chapters-show");
    let blocked = 0;
    let total = 0;

    if (debugMode) {
      console.groupCollapsed("AO3 BLOCKER");

      if (!config) {
        console.warn("Exiting due to missing config.");
        return;
      }
    }

    // Loop through all works on the search page and check if they match one of the conditions.
    $.makeArray($("li.blurb")).forEach((blurb) => {
      blurb = $(blurb);
      const blockables = selectFromBlurb(blurb);
      const reason = getBlockReason(blockables, config);

      total++;

      if (reason) {
        blockWork(blurb, reason, config);
        blocked++;

        if (debugMode) {
          console.groupCollapsed(`- blocked ${blurb.attr("id")}`);
          console.log(blurb.html(), reason);
          console.groupEnd();
        }
      } else if (debugMode) {
        console.groupCollapsed(`  skipped ${blurb.attr("id")}`);
        console.log(blurb.html());
        console.groupEnd();
      }
    });

    // If this is a work page, the work was navigated to from another site (i.e. an external link), and the user had block alerts enabled, show a warning.
    if (config.alertOnVisit && workContainer && document.referrer.indexOf("//archiveofourown.org") === -1) {

      const blockables = selectFromWork(workContainer);
      const reason = getBlockReason(blockables, config);

      if (reason) {
        blocked++;
        blockWork(workContainer, reason, config);
      }
    }

    if (debugMode) {
      console.log(`Blocked ${blocked} out of ${total} works`);
      console.groupEnd();
    }
  }

  addMenu();
  addStyle();
  setTimeout(checkWorks, 10);

}());
