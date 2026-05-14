import { Injectable } from '@angular/core';
import { NdaFormData } from '../models/nda-data.model';
import { mndaTermLabel, confidentialityTermLabel, formatNdaDate } from '../models/nda-labels';

@Injectable({ providedIn: 'root' })
export class NdaDownloadService {
  downloadAsHtml(data: NdaFormData): void {
    const html = this.buildHtmlDocument(data);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mutual-nda-${this.toSlug(data.party1.companyName)}-${this.toSlug(data.party2.companyName)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private toSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private buildHtmlDocument(data: NdaFormData): string {
    const e = (s: string) => this.escapeHtml(s);
    const p = e(data.purpose);
    const ed = formatNdaDate(data.effectiveDate);
    const mndaTerm = e(mndaTermLabel(data));
    const confTerm = e(confidentialityTermLabel(data));
    const gl = e(data.governingLaw);
    const jur = e(data.jurisdiction);
    const p1name = e(data.party1.companyName);
    const p2name = e(data.party2.companyName);
    const p1contact = e(data.party1.contactName);
    const p2contact = e(data.party2.contactName);
    const p1title = e(data.party1.title);
    const p2title = e(data.party2.title);
    const p1address = e(data.party1.noticeAddress);
    const p2address = e(data.party2.noticeAddress);
    const p1date = formatNdaDate(data.party1.signatureDate);
    const p2date = formatNdaDate(data.party2.signatureDate);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mutual Non-Disclosure Agreement – ${p1name} &amp; ${p2name}</title>
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; font-size: 11pt; line-height: 1.7; color: #111; max-width: 780px; margin: 40px auto; padding: 0 24px; }
    h1 { text-align: center; font-size: 14pt; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1.5em; }
    h2 { font-size: 12pt; text-transform: uppercase; text-align: center; letter-spacing: 0.05em; margin: 2em 0 1em; }
    p { margin-bottom: 1em; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 1.5em; font-size: 10pt; }
    th, td { border: 1px solid #999; padding: 8px 12px; vertical-align: top; text-align: left; }
    th { background: #f5f5f5; font-family: Arial, sans-serif; }
    thead th { font-weight: bold; }
    .row-label { background: #f5f5f5; font-family: Arial, sans-serif; font-size: 9pt; width: 120px; }
    .signature-cell { height: 44px; }
    .sub-label { font-size: 9pt; color: #555; font-style: italic; display: block; margin-bottom: 4px; }
    ol { padding-left: 1.5em; }
    li { margin-bottom: 1.2em; text-align: justify; }
    .field { background: #f3f0ff; padding: 0 3px; border-radius: 2px; font-style: italic; }
    .divider { border: none; border-top: 2px dashed #ccc; margin: 2em 0; }
    .footer { font-family: Arial, sans-serif; font-size: 9pt; color: #666; text-align: center; margin-top: 2em; }
    a { color: #5b21b6; }
    @media print {
      body { margin: 0; max-width: 100%; }
      .field { background: none; font-style: normal; font-weight: bold; }
    }
  </style>
</head>
<body>

  <h1>Mutual Non-Disclosure Agreement</h1>

  <p>This Mutual Non-Disclosure Agreement (the "<strong>MNDA</strong>") consists of: (1) this Cover Page ("<strong>Cover Page</strong>") and (2) the Common Paper Mutual NDA Standard Terms Version 1.0 ("<strong>Standard Terms</strong>") identical to those posted at <a href="https://commonpaper.com/standards/mutual-nda/1.0">commonpaper.com/standards/mutual-nda/1.0</a>. Any modifications of the Standard Terms should be made on the Cover Page, which will control over conflicts with the Standard Terms.</p>

  <table>
    <tbody>
      <tr>
        <th>Purpose</th>
        <td><span class="sub-label">How Confidential Information may be used</span>${p}</td>
      </tr>
      <tr>
        <th>Effective Date</th>
        <td>${ed}</td>
      </tr>
      <tr>
        <th>MNDA Term</th>
        <td><span class="sub-label">The length of this MNDA</span>${mndaTerm}</td>
      </tr>
      <tr>
        <th>Term of Confidentiality</th>
        <td><span class="sub-label">How long Confidential Information is protected</span>${confTerm}</td>
      </tr>
      <tr>
        <th>Governing Law &amp; Jurisdiction</th>
        <td><strong>Governing Law:</strong> ${gl}<br/><strong>Jurisdiction:</strong> ${jur}</td>
      </tr>
      <tr>
        <th>MNDA Modifications</th>
        <td><em>None</em></td>
      </tr>
    </tbody>
  </table>

  <p>By signing this Cover Page, each party agrees to enter into this MNDA as of the Effective Date.</p>

  <table>
    <thead>
      <tr>
        <th></th>
        <th>${p1name}</th>
        <th>${p2name}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="row-label">Signature</td>
        <td class="signature-cell"></td>
        <td class="signature-cell"></td>
      </tr>
      <tr>
        <td class="row-label">Print Name</td>
        <td>${p1contact}</td>
        <td>${p2contact}</td>
      </tr>
      <tr>
        <td class="row-label">Title</td>
        <td>${p1title}</td>
        <td>${p2title}</td>
      </tr>
      <tr>
        <td class="row-label">Company</td>
        <td>${p1name}</td>
        <td>${p2name}</td>
      </tr>
      <tr>
        <td class="row-label">Notice Address</td>
        <td>${p1address}</td>
        <td>${p2address}</td>
      </tr>
      <tr>
        <td class="row-label">Date</td>
        <td>${p1date}</td>
        <td>${p2date}</td>
      </tr>
    </tbody>
  </table>

  <p class="footer">Common Paper Mutual Non-Disclosure Agreement (Version 1.0) free to use under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.</p>

  <hr class="divider" />

  <h2>Standard Terms</h2>

  <ol>
    <li><strong>Introduction.</strong> This Mutual Non-Disclosure Agreement (which incorporates these Standard Terms and the Cover Page (defined below)) ("<strong>MNDA</strong>") allows each party ("<strong>Disclosing Party</strong>") to disclose or make available information in connection with the <span class="field">${p}</span> which (1) the Disclosing Party identifies to the receiving party ("<strong>Receiving Party</strong>") as "confidential", "proprietary", or the like or (2) should be reasonably understood as confidential or proprietary due to its nature and the circumstances of its disclosure ("<strong>Confidential Information</strong>"). Each party's Confidential Information also includes the existence and status of the parties' discussions and information on the Cover Page. Confidential Information includes technical or business information, product designs or roadmaps, requirements, pricing, security and compliance documentation, technology, inventions and know-how. To use this MNDA, the parties must complete and sign a cover page incorporating these Standard Terms ("<strong>Cover Page</strong>"). Each party is identified on the Cover Page and capitalized terms have the meanings given herein or on the Cover Page.</li>

    <li><strong>Use and Protection of Confidential Information.</strong> The Receiving Party shall: (a) use Confidential Information solely for the <span class="field">${p}</span>; (b) not disclose Confidential Information to third parties without the Disclosing Party's prior written approval, except that the Receiving Party may disclose Confidential Information to its employees, agents, advisors, contractors and other representatives having a reasonable need to know for the <span class="field">${p}</span>, provided these representatives are bound by confidentiality obligations no less protective of the Disclosing Party than the applicable terms in this MNDA and the Receiving Party remains responsible for their compliance with this MNDA; and (c) protect Confidential Information using at least the same protections the Receiving Party uses for its own similar information but no less than a reasonable standard of care.</li>

    <li><strong>Exceptions.</strong> The Receiving Party's obligations in this MNDA do not apply to information that it can demonstrate: (a) is or becomes publicly available through no fault of the Receiving Party; (b) it rightfully knew or possessed prior to receipt from the Disclosing Party without confidentiality restrictions; (c) it rightfully obtained from a third party without confidentiality restrictions; or (d) it independently developed without using or referencing the Confidential Information.</li>

    <li><strong>Disclosures Required by Law.</strong> The Receiving Party may disclose Confidential Information to the extent required by law, regulation or regulatory authority, subpoena or court order, provided (to the extent legally permitted) it provides the Disclosing Party reasonable advance notice of the required disclosure and reasonably cooperates, at the Disclosing Party's expense, with the Disclosing Party's efforts to obtain confidential treatment for the Confidential Information.</li>

    <li><strong>Term and Termination.</strong> This MNDA commences on the <span class="field">${ed}</span> and expires at the end of the <span class="field">${mndaTerm}</span> Either party may terminate this MNDA for any or no reason upon written notice to the other party. The Receiving Party's obligations relating to Confidential Information will survive for the <span class="field">${confTerm}</span>, despite any expiration or termination of this MNDA.</li>

    <li><strong>Return or Destruction of Confidential Information.</strong> Upon expiration or termination of this MNDA or upon the Disclosing Party's earlier request, the Receiving Party will: (a) cease using Confidential Information; (b) promptly after the Disclosing Party's written request, destroy all Confidential Information in the Receiving Party's possession or control or return it to the Disclosing Party; and (c) if requested by the Disclosing Party, confirm its compliance with these obligations in writing. As an exception to subsection (b), the Receiving Party may retain Confidential Information in accordance with its standard backup or record retention policies or as required by law, but the terms of this MNDA will continue to apply to the retained Confidential Information.</li>

    <li><strong>Proprietary Rights.</strong> The Disclosing Party retains all of its intellectual property and other rights in its Confidential Information and its disclosure to the Receiving Party grants no license under such rights.</li>

    <li><strong>Disclaimer.</strong> ALL CONFIDENTIAL INFORMATION IS PROVIDED "AS IS", WITH ALL FAULTS, AND WITHOUT WARRANTIES, INCLUDING THE IMPLIED WARRANTIES OF TITLE, MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.</li>

    <li><strong>Governing Law and Jurisdiction.</strong> This MNDA and all matters relating hereto are governed by, and construed in accordance with, the laws of the State of <span class="field">${gl}</span>, without regard to the conflict of laws provisions of such <span class="field">${gl}</span>. Any legal suit, action, or proceeding relating to this MNDA must be instituted in the federal or state courts located in <span class="field">${jur}</span>. Each party irrevocably submits to the exclusive jurisdiction of such <span class="field">${jur}</span> in any such suit, action, or proceeding.</li>

    <li><strong>Equitable Relief.</strong> A breach of this MNDA may cause irreparable harm for which monetary damages are an insufficient remedy. Upon a breach of this MNDA, the Disclosing Party is entitled to seek appropriate equitable relief, including an injunction, in addition to its other remedies.</li>

    <li><strong>General.</strong> Neither party has an obligation under this MNDA to disclose Confidential Information to the other or proceed with any proposed transaction. Neither party may assign this MNDA without the prior written consent of the other party, except that either party may assign this MNDA in connection with a merger, reorganization, acquisition or other transfer of all or substantially all its assets or voting securities. Any assignment in violation of this Section is null and void. This MNDA will bind and inure to the benefit of each party's permitted successors and assigns. Waivers must be signed by the waiving party's authorized representative and cannot be implied from conduct. If any provision of this MNDA is held unenforceable, it will be limited to the minimum extent necessary so the rest of this MNDA remains in effect. This MNDA (including the Cover Page) constitutes the entire agreement of the parties with respect to its subject matter, and supersedes all prior and contemporaneous understandings, agreements, representations, and warranties, whether written or oral, regarding such subject matter. This MNDA may only be amended, modified, waived, or supplemented by an agreement in writing signed by both parties. Notices, requests and approvals under this MNDA must be sent in writing to the email or postal addresses on the Cover Page and are deemed delivered on receipt. This MNDA may be executed in counterparts, including electronic copies, each of which is deemed an original and which together form the same agreement.</li>
  </ol>

  <p class="footer">Common Paper Mutual Non-Disclosure Agreement <a href="https://commonpaper.com/standards/mutual-nda/1.0/">Version 1.0</a> free to use under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.</p>

</body>
</html>`;
  }
}
