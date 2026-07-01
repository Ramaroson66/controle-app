# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
A collection of unrelated projects: a beverage market-research analysis pipeline (with generated HTML/PowerPoint reports) and several static HTML/CSS frontend prototypes. All content is in French.

## Architecture

### Market research — `Etudes de marchés/Boissons/`
The source of truth is `Data-base-boissons.csv` (~404 respondents). Analysis lives under two folders:
- `Resultats partiels/` — older intermediate work (do not extend).
- `Resultats Final/` — the canonical pipeline:
  1. `final_analysis.py` — loads the CSV, normalizes brand spellings, computes awareness metrics, and writes intermediate CSVs (`awareness_stats.csv`, `cross_age.csv`, `cross_loc.csv`, `cross_sex.csv`) used as inputs to the report.
  2. `Rapport_Analyse_Boissons_Final.html` — hand-authored HTML report that consumes those CSVs.
  3. `generate_pptx.py` — builds `Presentation_Resultats_Boissons.pptx` by cloning `Mask Boissons.pptx` as a template. KPI numbers in the slides are hardcoded in the script, not pulled from data — if the CSV is updated, edit the strings in `generate_pptx.py` to match.

### Frontend prototypes
- `Landing page/` — four side-by-side landing page variations. `Site-Premium-Final/` is the most recent; the others (`Site A-Gemma 31B/`, `Site B-Claudesonnet/`, `Site B-Recreated/`) are historical versions kept for comparison.
- `Nlle article-Jeu de Briques/` — unrelated to the landing pages: a "create new article" blog form prototype (`index A.html`, `index B.html`).
- **Context7**: Utilise toujours context7 lorsque j'ai besoin de génération de code, d'étapes de configurationou d'installation, ou de documentation de bibliothèque/API. Celasignifie que tu dois automatiquement utiliser les outils MCP Context7 pour résoudre l'identifiant de bibliothèque et obtenir la documentation de bibliothèque sans que j'aille à le demander explicitement.

## Common Commands
- Run the full final analysis pipeline:
  ```
  cd "Etudes de marchés/Boissons/Resultats Final"
  python final_analysis.py
  python generate_pptx.py
  ```
- Run a single script: `python "path/to/script.py"`.
- Preview a frontend: open the `index.html` directly in a browser. Use the Playwright MCP tools (already allowlisted) to navigate, snapshot, and screenshot pages.

## Dependencies
- Python: `pandas` (data analysis) and `python-pptx` (PowerPoint generation). Install with `pip install pandas python-pptx` if not present.
- The Playwright MCP server is preconfigured (see `.claude/settings.local.json`).

## Development Guidelines
- **CSV reading**: always `sep=';'` with `encoding='cp1252'` (fall back to `latin1` if that fails). The first column of `Data-base-boissons.csv` is a row index — drop it with `df = df.iloc[:, 1:]`.
- **Brand standardization**: the `brand_map` dict in `final_analysis.py` and `analysis_script.py` is the source of truth. When adding new analysis, reuse `standardize_brand()` and extend the map (not the call sites) to keep brand grouping consistent across reports.
- **Path bug to watch for**: the older `analysis_script.py` and the original `final_analysis.py` hardcode the path as `E:/Traitements/Projets/claude-projects/...` (lowercase `claude-projects`). The real folder is `Claude-projects` (capital C). When running these scripts, either edit the path or `cd` into a directory layout that matches — the lowercase variant will fail on this machine.
- **Frontend**: vanilla HTML/CSS, no build step. Each landing page version is self-contained (`index.html` + `style.css` in its own folder); do not share assets across versions.
- **Outputs are committed**: regenerating `generate_pptx.py` or `final_analysis.py` will overwrite the `.pptx` and intermediate CSVs in the same folder. Commit the regenerated artifacts alongside the script change.

## Aperçu de l’objectif du projet
[À compléter]

## Aperçu de l’architecture globale
[À compléter]

## Style visuel
- Interface claire et minimaliste
- Pas de mode sombre pour le MVP

## Contraintes et politique
- NE JAMAIS exposer les clés API au client

## Dépendances UI
- Préférer les composants existants plutôt que d’ajouter de nouvelles bibliothèques UI

## Validation Interface Graphique
À la fin de chaque développement qui implique l’interface graphique :
- Tester avec `playwright-skill`, l’interface doit-être responsive, fonctionnel, et répondre au besoin développé.

## Documentation
- Voir [PRD.md](PRD.md) et [ARCHITECTURE.md](ARCHITECTURE.md)

## Utilisation de Context7
Utilise toujours context7 lorsque j’ai besoin de génération de code, d’étapes de configuration ou d’installation, ou de documentation de bibliothèque/API. Cela signifie que tu dois automatiquement utiliser les outils MCP Context7 pour résoudre l’identification de bibliothèque et obtenir la documentation de bibliothèque sans que j’aie à le demander explicitement.

## Spécifications et Langues
- Toutes les spécifications doivent être rédigées en français, y compris les specs de OpenSpec (section purpose et scénario).
- Seuls les titres de Requirements doivent être en anglais avec les mots-clés SHALL/MUST pour la validation OpenSpec.
