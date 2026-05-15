import { LegalPage } from "../components/LegalPage";

export function TermsPage() {
  return (
    <LegalPage eyebrow="Terms" title="Terms of Use" updated="May 2026">
      <p>
        LMCanvas is free, open-source software distributed under the
        MIT License. By downloading or running the application you agree
        to these terms.
      </p>

      <h2>License</h2>
      <p>
        The source code is released under the <strong>MIT License</strong>.
        You may use, copy, modify, merge, publish, distribute, sublicense,
        and/or sell copies of the software. The full license text is in
        the repository at{" "}
        <a href="https://github.com/max-lee-dev/local-lmcanvas/blob/main/LICENSE" target="_blank" rel="noopener">
          github.com/max-lee-dev/local-lmcanvas
        </a>.
      </p>

      <h2>No warranty</h2>
      <p>
        The software is provided <strong>"AS IS"</strong>, without warranty
        of any kind, express or implied, including but not limited to the
        warranties of merchantability, fitness for a particular purpose,
        and noninfringement.
      </p>
      <p>
        In no event shall the author be liable for any claim, damages, or
        other liability — whether in an action of contract, tort, or
        otherwise — arising from, out of, or in connection with the
        software or its use.
      </p>

      <h2>Third-party providers</h2>
      <p>
        LMCanvas integrates with provider CLIs that you install and
        authenticate separately. <strong>You are responsible for compliance
        with the terms of service of each provider you use</strong>,
        including but not limited to:
      </p>
      <ul>
        <li>Anthropic (Claude) — <a href="https://www.anthropic.com/legal/consumer-terms" target="_blank" rel="noopener">anthropic.com/legal/consumer-terms</a></li>
        <li>OpenAI (Codex) — <a href="https://openai.com/policies/terms-of-use" target="_blank" rel="noopener">openai.com/policies/terms-of-use</a></li>
        <li>Cursor (cursor-agent) — <a href="https://cursor.com/terms-of-service" target="_blank" rel="noopener">cursor.com/terms-of-service</a></li>
      </ul>
      <p>
        Token usage, rate limits, and billing are between you and each
        provider. LMCanvas does not act as a reseller or middleman.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Do not use the software to:
      </p>
      <ul>
        <li>Generate content that violates the acceptable-use policy of any provider you are signed into.</li>
        <li>Generate content that is illegal in your jurisdiction.</li>
        <li>Harass, defraud, or impersonate other people.</li>
        <li>Build automation that circumvents provider rate limits or terms.</li>
      </ul>
      <p>
        Provider abuse will result in the provider suspending your account
        with them — LMCanvas has no involvement in that process.
      </p>

      <h2>Code signing & notarization</h2>
      <p>
        macOS builds are signed with a Developer ID Application certificate
        and notarized by Apple. This guarantees the binary you downloaded
        was built by the listed author and has not been modified since
        notarization. It is <strong>not</strong> a guarantee that the
        software is bug-free or fit for any particular purpose.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        Updated terms will replace the contents of this page. Significant
        changes will be flagged in the release notes for the version that
        introduces them.
      </p>

      <h2>Contact</h2>
      <p>
        Issues, bug reports, security disclosures:{" "}
        <a href="https://github.com/max-lee-dev/local-lmcanvas/issues" target="_blank" rel="noopener">
          github.com/max-lee-dev/local-lmcanvas/issues
        </a>.
      </p>
    </LegalPage>
  );
}
