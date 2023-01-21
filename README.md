# AO3 Blocker
A userscript to block works on [AO3](https://archiveofourown.org/) based on various conditions. A fork of [ao3 savior](https://greasyfork.org/en/scripts/3579-ao3-savior)

## What does this script do?
AO3 Blocker allows you to easily and globally filter works from your AO3 searches based on tags, authors, titles, and summaries.

## What makes this any different from ao3 savior?
This userscript is a fork of [ao3 savior](https://greasyfork.org/en/scripts/3579-ao3-savior) by [tuff](https://greasyfork.org/en/users/3831-tuff). While an excellent script, it has the major drawback of requiring an additional script to hold the config, which is inconvenient and cluttery. AO3 Blocker uses [GM_config](https://github.com/sizzlemctwizzle/GM_config) to store the config, which means you don't need to manually edit a script to update your settings, and also means that you automatically receive any new settings that might be added in a future update. Additionally, on the backend, the script is being converted to utilize JQuery, and single-quotes are changed to double-quotes because double-quotes are just better looking.

## How do I install the script?
You will need an extension to run the userscript. [Tampermonkey](https://www.tampermonkey.net/) is a popular choice if you don't already have a preferred extension.

Once you have the extension, the easiest install method is to install from [Greasy Fork](https://greasyfork.org/en/scripts/409956-ao3-blocker). All you need to do is click the install button and the script will be automatically be imported, and will automatically check for any updates.

Alternatively, you can manually install [the latest version from here](https://github.com/JacenBoy/ao3-blocker/releases/latest). You can also [view and download older versions here](https://github.com/JacenBoy/ao3-blocker/releases). These will not automatically update, so you will need to manually download and install any updates if you choose to install manually.

## What if I have issues with the script?
You can [open an issue](https://github.com/JacenBoy/ao3-blocker/issues) using GitHub and I'll take a look at it.

## Known Issues
- Tags, titles, and terms with commas cannot be filtered.

## TODOs
- Make the settings page look better
- Fix commas issue
