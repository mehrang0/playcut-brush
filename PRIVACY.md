# Privacy Policy: Playcut Brush

Last updated: September 27, 2026

Playcut Brush ("Brush") is a free, open-source plugin made by Mehran G, from the makers of
Playcut. This policy covers the Brush plugin only.

## What Brush collects

Nothing. Brush does not collect, store, or send any personal data. It has no accounts, no
analytics, no telemetry, and no tracking.

## What runs on your device

When your AI agent shows a design, Brush runs a small script on your own computer that:

- starts a local server at `127.0.0.1:2673`, reachable only from your machine, which refuses
  requests from other websites
- opens your default browser to show the design
- saves a PNG snapshot of each design to a `playcut-brush` folder in your operating system's
  temporary directory, so the agent can check its work
- shuts itself down after 30 idle minutes with no browser tab open

It makes no other network requests. The design files themselves are saved wherever your agent
writes them.

When Brush runs in a cloud environment instead, such as a hosted chat, it does not start a
server; the design is shown in the conversation.

## Your AI provider

Your prompts and designs are processed by the AI model or agent you use, such as OpenAI or
Anthropic, under that provider's own privacy policy. Brush does not receive, see, or share them.

## Sharing

Brush shares no data with anyone, including its author and Playcut.

## Retention

The author retains no data about you. Local snapshots stay in your temporary folder until your
operating system clears it or you delete them.

## Your controls

- Delete the `playcut-brush` folder in your temporary directory at any time.
- Uninstall the plugin to remove Brush completely.
- Read the source: every line Brush runs is public at
  https://github.com/mehrang0/playcut-brush.

## Children

Brush is not directed at children.

## Contact

Questions or concerns: open an issue at https://github.com/mehrang0/playcut-brush/issues.

## Changes

Any change to this policy is published in this file with a new "Last updated" date.
