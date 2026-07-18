# demo.tape — polished promo for ghostty-config-cli
#
# Render:  vhs demo.tape        → demo.webm (share this), demo.gif (README)
# Requires: vhs + ttyd + ffmpeg
#
# Note: Fedora's ffmpeg has no libx264, so .mp4 output fails. WebM (VP9) looks
# great and is smaller. If you specifically need an .mp4, see the notes below.
#
# Tip: WebM looks far better than GIF at this resolution. For the README,
# down-scale the gif so it isn't huge:
#   ffmpeg -i demo.webm -vf "fps=24,scale=1000:-1:flags=lanczos" demo.gif

Require ghostty-config-cli

Output demo.webm
Output demo.gif

# --- look & feel: a crisp, floating terminal window on a soft backdrop ---
Set Shell "bash"
Set FontFamily "JetBrainsMono Nerd Font"
Set FontSize 26
Set Width 1920
Set Height 1080
Set Padding 28
Set Margin 48
Set MarginFill "#16161e"
Set BorderRadius 14
Set WindowBar Colorful
Set WindowBarSize 46
Set Theme "TokyoNight"
Set CursorBlink true

# --- motion: fast, smooth, professional ---
Set TypingSpeed 22ms
Set Framerate 60
Set LoopOffset 22%

# ============================ scene ============================

# Launch
Type "ghostty-config-cli"
Sleep 300ms
Enter
Sleep 1.4s

# 1) Theme browser — filter + scroll with the live color preview (the hook)
Enter
Sleep 500ms
Type "cat"
Sleep 450ms
Down@420ms 3
Sleep 500ms
Enter
Sleep 800ms

# 2) Font family — type-to-filter picker
Down
Enter
Sleep 400ms
Type "mono"
Sleep 400ms
Down@300ms 2
Enter
Sleep 600ms

# 3) Font size — slider (↑/↓ big steps, →/← fine)
Down
Enter
Sleep 300ms
Up@200ms 3
Sleep 300ms
Down@200ms 1
Enter
Sleep 500ms

# 4) Background — hex input with a live swatch
Down
Enter
Sleep 300ms
Type "#1a1b26"
Sleep 500ms
Enter
Sleep 600ms

# 5) Background opacity — 0.0–1.0 slider
Down 2
Enter
Sleep 300ms
Left@140ms 8
Sleep 350ms
Right@140ms 5
Enter
Sleep 500ms

# 6) Cursor style — cycle block / bar / underline (preview glyph changes)
Down
Enter
Sleep 350ms
Right@450ms 2
Sleep 400ms
Enter
Sleep 500ms

# 7) Cursor blink — toggle
Down
Enter
Sleep 250ms
Right
Sleep 450ms
Enter
Sleep 500ms

# 8) Save — the "Saved ✓" toast
Type "s"
Sleep 1.8s

# out
Type "q"
Sleep 600ms
