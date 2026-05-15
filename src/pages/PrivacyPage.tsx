import { LegalPage } from "../components/LegalPage";

export function PrivacyPage() {
  return (
    <LegalPage eyebrow="Privacy" title="Privacy Policy" updated="May 2026">
      <p>
        <strong>LMCanvas does not collect, transmit, store, or share
        any personal data on its own servers.</strong> There are no servers.
        This is a desktop application that runs entirely on your machine.
      </p>

      <h2>What stays on your device</h2>
      <p>
        Every conversation, canvas, setting, and attachment lives in plain
        JSON files inside <code>~/.local-lmcanvas/</code> on your computer.
        You can inspect, back up, delete, or move those files at any time —
        nothing else has access to them.
      </p>

      <h2>What leaves your device</h2>
      <p>
        Only the requests you make to AI providers. When you send a prompt
        on a canvas, LMCanvas spawns the provider's command-line tool
        (Claude Code, Codex, or cursor-agent) on your machine, and that
        tool — running under your existing subscription and credentials —
        communicates with its respective vendor.
      </p>
      <ul>
        <li><strong>Anthropic</strong> (Claude) — see <a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noopener">anthropic.com/legal/privacy</a></li>
        <li><strong>OpenAI</strong> (Codex) — see <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener">openai.com/policies/privacy-policy</a></li>
        <li><strong>Cursor</strong> (cursor-agent) — see <a href="https://cursor.com/privacy" target="_blank" rel="noopener">cursor.com/privacy</a></li>
      </ul>
      <p>
        LMCanvas is a thin shell around those CLIs. It does not
        intercept, log, or duplicate the traffic.
      </p>

      <h2>Telemetry</h2>
      <p>
        The settings panel exposes a <strong>telemetry</strong> toggle.
        It is reserved for future opt-out anonymous usage analytics
        (counts of provider launches, error rates). At present,
        <strong> nothing is transmitted</strong> — the toggle controls a
        flag that no code currently reads. If telemetry is ever wired up,
        the implementation will be open-source in the
        <a href="https://github.com/max-lee-dev/local-lmcanvas" target="_blank" rel="noopener"> public repository</a>,
        opt-in by default, and this page will be updated before the change
        ships.
      </p>

      <h2>Network connections initiated by the app itself</h2>
      <p>
        The application binary connects to:
      </p>
      <ul>
        <li>The provider CLIs you have installed locally — their network calls go to their respective vendors.</li>
        <li><strong>No analytics, crash reporting, update servers, or first-party endpoints.</strong></li>
      </ul>
      <p>
        You can verify this with Little Snitch or by inspecting the source
        code on GitHub.
      </p>

      <h2>Cookies / website analytics</h2>
      <p>
        This marketing website (the page you are reading) does not use
        cookies, fingerprinting, or third-party analytics scripts. It is
        a static page served from the GitHub-hosted release.
      </p>

      <h2>Contact</h2>
      <p>
        Questions or concerns: open an issue at{" "}
        <a href="https://github.com/max-lee-dev/local-lmcanvas/issues" target="_blank" rel="noopener">
          github.com/max-lee-dev/local-lmcanvas/issues
        </a>.
      </p>
    </LegalPage>
  );
}
