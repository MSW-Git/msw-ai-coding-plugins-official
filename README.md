# MSW AI Coding Plugins

Public plugin repository for AI-assisted MapleStory Worlds (MSW) creation.

This repository provides a shared base skill set and optional content-specific
skills for building MSW worlds with AI coding tools.

## Included Plugins

### `msw-maker-base-skill`

Core MSW authoring guidance for:

- MSW platform and workspace rules
- `.mlua` scripting patterns
- entity, model, UI, avatar, package, and combat workflows
- resource search and application
- validation and debugging loops

### `msw-maker-content-skill`

Optional advanced content guidance. It currently provides
`maplestory-skill-maker` for reusable player attack-skill systems, including
targeting, judgment timing, damage presentation, knockback, casting locks, and
projectile behavior.

## Repository Layout

```text
plugins/
  msw-maker-base-skill/
    .claude-plugin/
    hooks/
    scripts/
    skills/
  msw-maker-content-skill/
    .claude-plugin/
    skills/
```

## Usage

Install or load this repository as a plugin source in your AI coding tool, then
enable `msw-maker-base-skill` for MSW projects. Install optional content skills
separately when the project needs them.

For best results, use the skill set inside a valid MapleStory Worlds local
workspace and follow the validation steps described by the skills.

## Status

This repository is maintained as the public release source for MSW maker base
and optional content skills.
