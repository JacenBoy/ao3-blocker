# ao3-blocker
A userscript to block works on [AO3](https://archiveofourown.org/) based on various conditions. A fork of [ao3 savior](https://greasyfork.org/en/scripts/3579-ao3-savior)

## What does this script do?
AO3 Blocker allows you to easily and globally filter works from your AO3 searches based on tags, authors, titles, and summaries.

## What makes this any different from ao3 savior?
This userscript is a fork of [ao3 savior](https://greasyfork.org/en/scripts/3579-ao3-savior) by [tuff](https://greasyfork.org/en/users/3831-tuff). While an excellent script, it has the major drawback of requiring an additional script to hold the config, which is inconvenient and cluttery. AO3 Blocker uses [GM_config](https://github.com/sizzlemctwizzle/GM_config) to store the config, which means you don't need to manually edit a script to update your settings, and also means that you automatically receive any new settings that might be added in a future update. Additionally, on the backend, the script is being converted to utilize JQuery, and single-quotes are changed to double-quotes because double-quotes are just better looking.

## Known Issues
- Tags, titles, and terms with commas cannot be filtered.

## TODOs
- Finsh transitioning to JQuery
- Make the settings page look better
- Fix commas issue
