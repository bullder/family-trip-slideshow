# Windows setup guide for beginners

This guide takes you from a plain Windows 10 or 11 PC to your first finished slideshow
video. You don't need any programming experience. Plan for about 30 minutes of setup;
after that, each video takes about 20–40 minutes, mostly waiting while it renders.

You will install three free programs, then the skill itself:

| # | Program | Why it's needed |
|---|---|---|
| 1 | **Claude Desktop** | the app you talk to; its **Code** tab runs the skill on your PC |
| 2 | **Node.js** (LTS) | runs the skill's tools and the video renderer |
| 3 | **Git for Windows** | Claude Code on Windows uses it to run commands; also used to install and update the skill |

> **Account:** the Code tab (Claude Code) needs a paid Claude plan (Pro or higher).

---

## Step 1: Install Claude Desktop

1. Go to **https://claude.ai/download** and click **Download for Windows**.
2. Run the downloaded installer and follow the prompts.
3. Open **Claude** from the Start menu and sign in with your Claude account.
4. At the top of the app, find the **Code** tab; you'll use it in Step 6. If you don't
   see it, update the app (Help › Check for updates) and make sure your plan includes
   Claude Code.

## Step 2: Install Node.js

1. Go to **https://nodejs.org** and download the **LTS** version (the button labelled
   "LTS", **Windows Installer (.msi)**).
2. Run it and click **Next** through every screen; the default options are right.
   If you see a checkbox "Automatically install the necessary tools", you can leave it
   unticked.
3. Finish the installer.

## Step 3: Install Git for Windows

1. Go to **https://git-scm.com/download/win**. The download starts automatically, or
   click **Click here to download**.
2. Run the installer and click **Next** through every screen; the defaults are right.
3. Finish the installer.

> **Shortcut for experienced users:** Steps 2 and 3 in one PowerShell command:
> `winget install OpenJS.NodeJS.LTS Git.Git`

## Step 4: Restart and check

**Restart your PC.** This makes Windows see the newly installed programs. Then:

1. Press **Start**, type **PowerShell**, and open **Windows PowerShell**.
2. Type each line below and press **Enter**. Each should print a version number:

   ```powershell
   node -v
   npm -v
   git --version
   ```

   For example, `v22.11.0`, `10.9.0`, `git version 2.47.0.windows.1`. If you get *"is
   not recognized"*, see [Troubleshooting](#troubleshooting).

## Step 5: Install the skill

Still in PowerShell, paste this line and press **Enter**:

```powershell
git clone https://github.com/bullder/family-trip-slideshow.git "$env:USERPROFILE\.claude\skills\family-trip-slideshow"
```

It downloads the skill into the folder Claude looks in for skills
(`C:\Users\<you>\.claude\skills\family-trip-slideshow`).

<details>
<summary>Alternative: install with the skills command</summary>

```powershell
npx skills add bullder/family-trip-slideshow -g -a claude-code
```

Type `y` if it asks to install the `skills` package.
</details>

**To update the skill later**, run:

```powershell
cd "$env:USERPROFILE\.claude\skills\family-trip-slideshow"
git pull
```

## Step 6: Get your photos and music ready

- Put the trip photos in **one folder**, e.g. `C:\Users\Anna\Pictures\Crete 2027`.
  JPEG and PNG work. **iPhone HEIC photos must be converted to JPEG first.** You can
  open them in the Photos app and use **Save as**, or on the iPhone set Settings ›
  Camera › Formats › **Most Compatible** before your next trip.
- Have the song as a file, e.g. `C:\Users\Anna\Music\summer.mp3`. A track of 2–3
  minutes works best.
- Know everyone's names, and how to tell them apart in the photos ("Sofia: yellow
  dress", "Max: blue cap").
- Free disk space: about 2 GB.

## Step 7: Make your first video

1. Open **Claude Desktop** and switch to the **Code** tab.
2. Choose a folder to work in when asked. Your user folder (`C:\Users\<you>`) is fine.
3. Type a request in your own words, for example:

   > Make a family slideshow from the photos in `C:\Users\Anna\Pictures\Crete 2027`
   > with the music `C:\Users\Anna\Music\summer.mp3`. It's the five of us: Anna,
   > Pavel, Sofia, Max and Lea, in Crete in 2027.

4. Claude asks a few questions (how to recognise each person, which formats you want)
   and then works on its own. When it asks permission to run commands (such as
   `npm install`, `node tools/...` or rendering), click **Allow**. The first run
   downloads about 500 MB of tools.
5. When it's done, Claude tells you where the videos are, usually
   `C:\Users\<you>\crete-2027-slideshow\slideshow\out\`:
   - `Crete-2027-family-slideshow.mp4`: for TV, YouTube or sending to family
   - `Crete-2027-reels-9x16.mp4`: for Instagram Reels
   - `Crete-2027-reels-cover.jpg`: choose this as the Reel's cover in the Instagram app

Want changes? Just say so in the same chat: *"use a different photo for the pool
slide"*, *"Max's title should be funnier"*, *"make it 90 seconds"*.

---

## Troubleshooting

**`'node' is not recognized` / `'git' is not recognized`**
Restart the PC after installing; Windows only picks up new programs after that. If it
still fails, reinstall the program and keep the default "Add to PATH" options.

**`npx : File ... npx.ps1 cannot be loaded because running scripts is disabled`**
PowerShell blocks scripts by default. Run this once, then try again:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Type `Y` to confirm. Or just use the `git clone` install from Step 5, which doesn't
need `npx`.

**The Code tab is missing in Claude Desktop**
Update the app (Help › Check for updates) and check that you're signed in with a plan
that includes Claude Code (Pro or higher).

**Claude Code says it needs Git Bash**
Git for Windows (Step 3) isn't installed or isn't found. Reinstall it with default
options and restart Claude Desktop.

**The first video takes a long time**
The first run downloads the video renderer and a headless browser (~500 MB), and then
renders two 2-minute videos. 20–40 minutes in total is normal. Later videos are faster.

**Some photos were skipped**
They were probably HEIC files. Convert them to JPEG (see Step 6) and ask Claude to
redo the video.

**A name is on the wrong person**
Tell Claude who is who ("Lea is the one in the yellow dress"); it fixes the titles and
re-renders.

**Windows Defender or SmartScreen warnings**
The downloads come from claude.ai, nodejs.org and git-scm.com and are safe to allow.
The skill itself is plain text and JavaScript you can read on GitHub.
