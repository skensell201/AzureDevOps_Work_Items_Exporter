# Contributing

Thanks for your interest in improving **Work Items Export**! This is a small, focused
Azure DevOps Server 2022 extension. The notes below keep changes consistent and easy to review.

## Getting started

```bash
git clone https://github.com/skensell201/AzureDevOps_Work_Items_Exporter.git
cd AzureDevOps_Work_Items_Exporter
npm install
npm test            # jest
npx tsc --noEmit    # type check
npm run build       # webpack production -> dist/
npm run package     # build + tfx -> out/local.workitems-export-<version>.vsix
```

**Requirements:** Node 18+. Dependency versions are intentionally pinned (React 16 and
`@testing-library/react` v12 are required by `azure-devops-ui` peer deps) — please don't
bump them casually.

To try a change on a server, build the `.vsix`, upload it to a collection's local gallery
(`{server}/_gallery/manage`), and install it. After an in-place update, fully uninstall and
reinstall to avoid `HostAuthorizationNotFound` (see the README troubleshooting section).

## Architecture & conventions

- **`src/hub.tsx` is the only file that touches the Azure DevOps SDK.** Everything else
  takes an injected `ApiClient` (or plain props) and is unit-tested with fixtures — no SDK,
  no network in tests.
- **Pure functions carry the test weight.** `RollupService`, `TableBuilder`, `ExportService`,
  `filter`, and `parseRelations` are pure `input → output` and should stay that way.
- **Components are plain React + `hub.css`** (only `azure-devops-ui` *core CSS* is imported).
  Style with the theme variables in `hub.css` (`var(--wie-*)`, backed by Azure DevOps palette
  vars) so the UI works in light / dark / high-contrast — avoid hardcoded colors.
- **TDD, please:** write a failing test, make it pass, keep it green. New behavior needs a test.
- **Keep CSV export formula-injection hardened** (`deFormula` in `ExportService`) — don't
  regress it.
- **Read-only by design.** Don't add write operations or scopes beyond `vso.work`,
  `vso.project`, `vso.identity`. In particular, do **not** declare `vso.extension_data` —
  Azure DevOps Server rejects mixing it with the uri-based `vso.*` scopes, and the in-page
  Extension Data Service works without it.

## Pull requests

1. Branch from `main` (e.g. `feature/…` or `fix/…`).
2. Make the change with tests. Run `npm test && npx tsc --noEmit && npm run build` — all green.
3. Keep PRs focused; describe what changed and why, and include a screenshot for UI changes.
4. Use clear commit messages (`feat:` / `fix:` / `docs:` / `chore:` / `refactor:` / `test:`).

## Don't commit private or environment-specific data

This repo is public. Never commit:

- internal hostnames, IP addresses, PATs/tokens, or real collection/project names
  (use neutral placeholders like `Contoso` in tests and docs);
- the built `.vsix` (`out/` is gitignored — attach it to a GitHub release instead).

## Reporting bugs / requesting features

Open a GitHub issue. For bugs, include: Azure DevOps Server version, what you did, what you
expected, the actual result, and (for UI issues) a screenshot. The extension surfaces server
errors verbatim — paste the exact message if one appears.

## Releases (maintainers)

Bump `version` in `vss-extension.json`, then:

```bash
npm run package
gh release create vX.Y.Z out/local.workitems-export-X.Y.Z.vsix \
  --repo skensell201/AzureDevOps_Work_Items_Exporter --title "vX.Y.Z — Work Items Export" --notes "…"
```

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
