import html
import os

import markdown as md_lib

TEMPLATES_DIR = os.environ.get(
    "TEMPLATES_DIR",
    os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "templates")),
)

DOC_SLUGS = [
    "mutual_nda",
    "csa",
    "design_partner",
    "sla",
    "psa",
    "dpa",
    "software_license",
    "partnership",
    "pilot",
    "baa",
    "ai_addendum",
]

SELECTION_GREETING = (
    "Hello! I can help you draft a legal document. Which type of document do you need? I support:\n\n"
    "• Mutual Non-Disclosure Agreement (NDA)\n"
    "• Cloud Service Agreement\n"
    "• Design Partner Agreement\n"
    "• Service Level Agreement\n"
    "• Professional Services Agreement\n"
    "• Data Processing Agreement (GDPR)\n"
    "• Software License Agreement\n"
    "• Partnership Agreement\n"
    "• Pilot Agreement\n"
    "• Business Associate Agreement (HIPAA)\n"
    "• AI Addendum\n\n"
    "Which would you like to create?"
)

SELECTION_SYSTEM_PROMPT = """\
You are a friendly legal assistant. Your first job is to identify which document type the user needs.

Supported document types:
- mutual_nda: Mutual Non-Disclosure Agreement (NDA/MNDA) — for two parties sharing confidential information
- csa: Cloud Service Agreement — for cloud SaaS subscriptions
- design_partner: Design Partner Agreement — for early product access in exchange for feedback
- sla: Service Level Agreement — for defining uptime targets, response times, and service credits
- psa: Professional Services Agreement — for professional services engagements
- dpa: Data Processing Agreement — GDPR-compliant DPA covering processor relationships
- software_license: Software License Agreement — for on-premise or self-hosted software licensing
- partnership: Partnership Agreement — for co-marketing and partner relationships
- pilot: Pilot Agreement — for a time-limited trial or pilot of a product
- baa: Business Associate Agreement — HIPAA-compliant BAA covering PHI handling
- ai_addendum: AI Addendum — addendum to a software agreement covering AI services

If the user's request matches one of the above, set document_type to the corresponding slug.
If the user's request does not match any supported document, set document_type to null and suggest the closest match.
Always be friendly and helpful. Always end your response with a question to guide the user.
"""

SELECTION_SCHEMA = {
    "type": "object",
    "properties": {
        "message": {"type": "string"},
        "document_type": {
            "anyOf": [
                {"type": "string", "enum": DOC_SLUGS},
                {"type": "null"},
            ]
        },
    },
    "required": ["message", "document_type"],
    "additionalProperties": False,
}


def _e(s: str) -> str:
    return html.escape(str(s))


def _null_str():
    return {"anyOf": [{"type": "string"}, {"type": "null"}]}


def _null_int():
    return {"anyOf": [{"type": "integer"}, {"type": "null"}]}


def _null_enum(*values: str):
    return {"anyOf": [{"type": "string", "enum": list(values)}, {"type": "null"}]}


def _row(label: str, value: str, sub: str = "") -> str:
    sub_html = f"<br><span style='font-size:11px;color:#888'>{_e(sub)}</span>" if sub else ""
    return (
        f"<tr>"
        f"<td style='padding:6px 12px;font-weight:600;white-space:nowrap;vertical-align:top;"
        f"border:1px solid #ddd;background:#f9f9f9'>{_e(label)}{sub_html}</td>"
        f"<td style='padding:6px 12px;border:1px solid #ddd'>{_e(value)}</td>"
        f"</tr>"
    )


def _html_doc(title: str, body: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{_e(title)}</title>
<style>
  body {{
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    line-height: 1.6;
    color: #222;
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 40px;
  }}
  h1 {{
    font-size: 20pt;
    color: #032147;
    text-align: center;
    margin-bottom: 4px;
    border-bottom: 2px solid #209dd7;
    padding-bottom: 8px;
  }}
  h2 {{
    font-size: 14pt;
    color: #032147;
    margin-top: 28px;
    margin-bottom: 8px;
  }}
  h3 {{
    font-size: 12pt;
    color: #032147;
    margin-top: 16px;
    margin-bottom: 4px;
  }}
  table.cover-table {{
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    font-size: 11pt;
  }}
  table.cover-table td {{
    padding: 6px 12px;
    border: 1px solid #ddd;
    vertical-align: top;
  }}
  table.cover-table td:first-child {{
    font-weight: 600;
    white-space: nowrap;
    background: #f9f9f9;
    width: 200px;
  }}
  table.sig-table {{
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    font-size: 11pt;
  }}
  table.sig-table th {{
    background: #032147;
    color: #fff;
    padding: 8px 12px;
    text-align: left;
    font-weight: 600;
  }}
  table.sig-table td {{
    padding: 8px 12px;
    border: 1px solid #ddd;
    vertical-align: top;
  }}
  .section-header {{
    font-weight: bold;
  }}
  .coverpage_link {{
    font-style: italic;
  }}
  .orderform_link {{
    font-style: italic;
  }}
  .keyterms_link {{
    font-style: italic;
  }}
  .header_2 {{
    font-weight: bold;
  }}
  .header_3 {{
    font-weight: bold;
  }}
  .standard-terms {{
    margin-top: 40px;
    border-top: 2px solid #209dd7;
    padding-top: 20px;
  }}
  .standard-terms-title {{
    font-size: 16pt;
    color: #032147;
    font-weight: bold;
    margin-bottom: 16px;
  }}
  p {{
    margin: 8px 0;
  }}
  ol, ul {{
    margin: 8px 0;
    padding-left: 24px;
  }}
  @media print {{
    body {{ padding: 20px; }}
  }}
</style>
</head>
<body>
{body}
</body>
</html>"""


def _md_to_html(text: str) -> str:
    return md_lib.markdown(text, extensions=["extra"])


def _read_template(filename: str) -> str:
    path = os.path.join(TEMPLATES_DIR, filename)
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def _party_schema_nullable():
    return {
        "type": "object",
        "properties": {
            "companyName": _null_str(),
            "contactName": _null_str(),
            "title": _null_str(),
            "noticeAddress": _null_str(),
            "signatureDate": _null_str(),
        },
        "required": ["companyName", "contactName", "title", "noticeAddress", "signatureDate"],
        "additionalProperties": False,
    }


def _party_schema_required():
    return {
        "type": "object",
        "properties": {
            "companyName": {"type": "string"},
            "contactName": {"type": "string"},
            "title": {"type": "string"},
            "noticeAddress": {"type": "string"},
            "signatureDate": {"type": "string"},
        },
        "required": ["companyName", "contactName", "title", "noticeAddress", "signatureDate"],
        "additionalProperties": False,
    }


def _provider_customer_nullable():
    obj = {
        "type": "object",
        "properties": {
            "companyName": _null_str(),
            "noticeAddress": _null_str(),
        },
        "required": ["companyName", "noticeAddress"],
        "additionalProperties": False,
    }
    return obj


def _provider_customer_required():
    return {
        "type": "object",
        "properties": {
            "companyName": {"type": "string"},
            "noticeAddress": {"type": "string"},
        },
        "required": ["companyName", "noticeAddress"],
        "additionalProperties": False,
    }


def _company_only_nullable():
    return {
        "type": "object",
        "properties": {
            "companyName": _null_str(),
        },
        "required": ["companyName"],
        "additionalProperties": False,
    }


def _company_only_required():
    return {
        "type": "object",
        "properties": {
            "companyName": {"type": "string"},
        },
        "required": ["companyName"],
        "additionalProperties": False,
    }


# ── mutual_nda ────────────────────────────────────────────────────────────────

_MUTUAL_NDA_SYSTEM_PROMPT = """\
You are a friendly legal assistant helping a user complete a Mutual Non-Disclosure Agreement (MNDA).

Your job is to have a natural conversation to collect all required information, asking one or two items at a time.

Fields to collect:
- Party 1: company name, contact person's full name, their title/role, notice address (email or postal), signature date
- Party 2: same fields as Party 1
- Purpose: how confidential information may be used
- Effective Date: when the agreement starts (YYYY-MM-DD format; default to today if not specified)
- MNDA Term: "one_year" (ask how many years) or "until_terminated"
- Term of Confidentiality: "one_year" (ask how many years) or "in_perpetuity"
- Governing Law: US state name (e.g. "Delaware")
- Jurisdiction: city/county and state (e.g. "New Castle, DE")

Keep track of all information shared so far and include it in partial_data.
Use null for fields not yet collected. Use YYYY-MM-DD for all dates.
For mndaTerm, use exactly "one_year" or "until_terminated".
For termOfConfidentiality, use exactly "one_year" or "in_perpetuity".
If you still need more information to complete all fields, ALWAYS end your response with a question. Never give a pure statement unless all required fields are confirmed.
"""

_MUTUAL_NDA_MSG_SCHEMA = {
    "type": "object",
    "properties": {
        "message": {"type": "string"},
        "partial_data": {
            "type": "object",
            "properties": {
                "party1": _party_schema_nullable(),
                "party2": _party_schema_nullable(),
                "purpose": _null_str(),
                "effectiveDate": _null_str(),
                "mndaTerm": _null_enum("one_year", "until_terminated"),
                "mndaTermYears": _null_int(),
                "termOfConfidentiality": _null_enum("one_year", "in_perpetuity"),
                "confidentialityYears": _null_int(),
                "governingLaw": _null_str(),
                "jurisdiction": _null_str(),
            },
            "required": [
                "party1", "party2", "purpose", "effectiveDate",
                "mndaTerm", "mndaTermYears", "termOfConfidentiality",
                "confidentialityYears", "governingLaw", "jurisdiction",
            ],
            "additionalProperties": False,
        },
    },
    "required": ["message", "partial_data"],
    "additionalProperties": False,
}

_MUTUAL_NDA_GEN_SCHEMA = {
    "type": "object",
    "properties": {
        "party1": _party_schema_required(),
        "party2": _party_schema_required(),
        "purpose": {"type": "string"},
        "effectiveDate": {"type": "string"},
        "mndaTerm": {"type": "string", "enum": ["one_year", "until_terminated"]},
        "mndaTermYears": _null_int(),
        "termOfConfidentiality": {"type": "string", "enum": ["one_year", "in_perpetuity"]},
        "confidentialityYears": _null_int(),
        "governingLaw": {"type": "string"},
        "jurisdiction": {"type": "string"},
    },
    "required": [
        "party1", "party2", "purpose", "effectiveDate",
        "mndaTerm", "mndaTermYears", "termOfConfidentiality",
        "confidentialityYears", "governingLaw", "jurisdiction",
    ],
    "additionalProperties": False,
}


def _render_mutual_nda(fields: dict) -> str:
    p1 = fields["party1"]
    p2 = fields["party2"]
    mnda_term = fields.get("mndaTerm", "")
    mnda_term_years = fields.get("mndaTermYears") or 1
    toc = fields.get("termOfConfidentiality", "")
    conf_years = fields.get("confidentialityYears") or 1

    if mnda_term == "one_year":
        mnda_term_display = f"{mnda_term_years} year(s)"
    else:
        mnda_term_display = "Until terminated"

    if toc == "one_year":
        toc_display = f"{conf_years} year(s)"
    else:
        toc_display = "In perpetuity"

    cover_rows = (
        _row("Effective Date", fields.get("effectiveDate", ""))
        + _row("Party 1 Company", p1.get("companyName", ""))
        + _row("Party 1 Contact", p1.get("contactName", ""))
        + _row("Party 1 Title", p1.get("title", ""))
        + _row("Party 1 Notice Address", p1.get("noticeAddress", ""))
        + _row("Party 2 Company", p2.get("companyName", ""))
        + _row("Party 2 Contact", p2.get("contactName", ""))
        + _row("Party 2 Title", p2.get("title", ""))
        + _row("Party 2 Notice Address", p2.get("noticeAddress", ""))
        + _row("Purpose", fields.get("purpose", ""))
        + _row("MNDA Term", mnda_term_display)
        + _row("Term of Confidentiality", toc_display)
        + _row("Governing Law", fields.get("governingLaw", ""))
        + _row("Jurisdiction", fields.get("jurisdiction", ""))
    )

    sig_rows = (
        f"<tr><td style='padding:6px 12px;font-weight:600;border:1px solid #ddd;background:#f9f9f9'>Print Name</td>"
        f"<td style='padding:6px 12px;border:1px solid #ddd'>{_e(p1.get('contactName', ''))}</td>"
        f"<td style='padding:6px 12px;border:1px solid #ddd'>{_e(p2.get('contactName', ''))}</td></tr>"
        f"<tr><td style='padding:6px 12px;font-weight:600;border:1px solid #ddd;background:#f9f9f9'>Title</td>"
        f"<td style='padding:6px 12px;border:1px solid #ddd'>{_e(p1.get('title', ''))}</td>"
        f"<td style='padding:6px 12px;border:1px solid #ddd'>{_e(p2.get('title', ''))}</td></tr>"
        f"<tr><td style='padding:6px 12px;font-weight:600;border:1px solid #ddd;background:#f9f9f9'>Company</td>"
        f"<td style='padding:6px 12px;border:1px solid #ddd'>{_e(p1.get('companyName', ''))}</td>"
        f"<td style='padding:6px 12px;border:1px solid #ddd'>{_e(p2.get('companyName', ''))}</td></tr>"
        f"<tr><td style='padding:6px 12px;font-weight:600;border:1px solid #ddd;background:#f9f9f9'>Notice Address</td>"
        f"<td style='padding:6px 12px;border:1px solid #ddd'>{_e(p1.get('noticeAddress', ''))}</td>"
        f"<td style='padding:6px 12px;border:1px solid #ddd'>{_e(p2.get('noticeAddress', ''))}</td></tr>"
        f"<tr><td style='padding:6px 12px;font-weight:600;border:1px solid #ddd;background:#f9f9f9'>Date</td>"
        f"<td style='padding:6px 12px;border:1px solid #ddd'>{_e(p1.get('signatureDate', ''))}</td>"
        f"<td style='padding:6px 12px;border:1px solid #ddd'>{_e(p2.get('signatureDate', ''))}</td></tr>"
    )

    standard_terms_html = _md_to_html(_read_template("Mutual-NDA.md"))

    body = f"""
<h1>Mutual Non-Disclosure Agreement</h1>
<h2>Cover Page</h2>
<table class="cover-table">{cover_rows}</table>
<div class="standard-terms">
<div class="standard-terms-title">Standard Terms</div>
{standard_terms_html}
</div>
<h2>Signatures</h2>
<table class="sig-table">
  <thead>
    <tr>
      <th style="width:200px"></th>
      <th>{_e(p1.get('companyName', 'Party 1'))}</th>
      <th>{_e(p2.get('companyName', 'Party 2'))}</th>
    </tr>
  </thead>
  <tbody>
    {sig_rows}
  </tbody>
</table>
"""
    return _html_doc("Mutual Non-Disclosure Agreement", body)


# ── csa ───────────────────────────────────────────────────────────────────────

_CSA_SYSTEM_PROMPT = """\
You are a friendly legal assistant helping a user complete a Cloud Service Agreement (CSA).

Your job is to have a natural conversation to collect all required information, asking one or two items at a time.

Fields to collect:
- Provider: company name, notice address
- Customer: company name, notice address
- Effective Date: when the agreement starts (YYYY-MM-DD)
- Order Date: the date of the order form (YYYY-MM-DD)
- Subscription Period: duration of the subscription (e.g. "12 months", "1 year")
- Payment Process: how payment will be made (e.g. "net 30 invoice", "credit card")
- Governing Law: US state name or country
- Chosen Courts: court jurisdiction (e.g. "Delaware Court of Chancery")

Keep track of all information and include it in partial_data. Use null for fields not yet collected.
If you still need more information to complete all fields, ALWAYS end your response with a question. Never give a pure statement unless all required fields are confirmed.
"""

_CSA_MSG_SCHEMA = {
    "type": "object",
    "properties": {
        "message": {"type": "string"},
        "partial_data": {
            "type": "object",
            "properties": {
                "provider": _provider_customer_nullable(),
                "customer": _provider_customer_nullable(),
                "effectiveDate": _null_str(),
                "orderDate": _null_str(),
                "subscriptionPeriod": _null_str(),
                "paymentProcess": _null_str(),
                "governingLaw": _null_str(),
                "chosenCourts": _null_str(),
            },
            "required": [
                "provider", "customer", "effectiveDate", "orderDate",
                "subscriptionPeriod", "paymentProcess", "governingLaw", "chosenCourts",
            ],
            "additionalProperties": False,
        },
    },
    "required": ["message", "partial_data"],
    "additionalProperties": False,
}

_CSA_GEN_SCHEMA = {
    "type": "object",
    "properties": {
        "provider": _provider_customer_required(),
        "customer": _provider_customer_required(),
        "effectiveDate": {"type": "string"},
        "orderDate": {"type": "string"},
        "subscriptionPeriod": {"type": "string"},
        "paymentProcess": {"type": "string"},
        "governingLaw": {"type": "string"},
        "chosenCourts": {"type": "string"},
    },
    "required": [
        "provider", "customer", "effectiveDate", "orderDate",
        "subscriptionPeriod", "paymentProcess", "governingLaw", "chosenCourts",
    ],
    "additionalProperties": False,
}


def _render_csa(fields: dict) -> str:
    prov = fields["provider"]
    cust = fields["customer"]
    cover_rows = (
        _row("Effective Date", fields.get("effectiveDate", ""))
        + _row("Order Date", fields.get("orderDate", ""))
        + _row("Provider", prov.get("companyName", ""), prov.get("noticeAddress", ""))
        + _row("Customer", cust.get("companyName", ""), cust.get("noticeAddress", ""))
        + _row("Subscription Period", fields.get("subscriptionPeriod", ""))
        + _row("Payment Process", fields.get("paymentProcess", ""))
        + _row("Governing Law", fields.get("governingLaw", ""))
        + _row("Chosen Courts", fields.get("chosenCourts", ""))
    )
    standard_terms_html = _md_to_html(_read_template("CSA.md"))
    body = f"""
<h1>Cloud Service Agreement</h1>
<h2>Cover Page</h2>
<table class="cover-table">{cover_rows}</table>
<div class="standard-terms">
<div class="standard-terms-title">Standard Terms</div>
{standard_terms_html}
</div>
"""
    return _html_doc("Cloud Service Agreement", body)


# ── design_partner ────────────────────────────────────────────────────────────

_DESIGN_PARTNER_SYSTEM_PROMPT = """\
You are a friendly legal assistant helping a user complete a Design Partner Agreement.

Your job is to have a natural conversation to collect all required information, asking one or two items at a time.

Fields to collect:
- Provider: company name, notice address
- Partner: company name, notice address
- Effective Date (YYYY-MM-DD)
- Term: duration of the agreement (e.g. "12 months")
- Program: name of the design partner program
- Product Description: description of the product being evaluated
- Governing Law: US state name or country
- Chosen Courts: court jurisdiction

Keep track of all information and include it in partial_data. Use null for fields not yet collected.
If you still need more information to complete all fields, ALWAYS end your response with a question. Never give a pure statement unless all required fields are confirmed.
"""

_DESIGN_PARTNER_MSG_SCHEMA = {
    "type": "object",
    "properties": {
        "message": {"type": "string"},
        "partial_data": {
            "type": "object",
            "properties": {
                "provider": _provider_customer_nullable(),
                "partner": _provider_customer_nullable(),
                "effectiveDate": _null_str(),
                "term": _null_str(),
                "program": _null_str(),
                "productDescription": _null_str(),
                "governingLaw": _null_str(),
                "chosenCourts": _null_str(),
            },
            "required": [
                "provider", "partner", "effectiveDate", "term",
                "program", "productDescription", "governingLaw", "chosenCourts",
            ],
            "additionalProperties": False,
        },
    },
    "required": ["message", "partial_data"],
    "additionalProperties": False,
}

_DESIGN_PARTNER_GEN_SCHEMA = {
    "type": "object",
    "properties": {
        "provider": _provider_customer_required(),
        "partner": _provider_customer_required(),
        "effectiveDate": {"type": "string"},
        "term": {"type": "string"},
        "program": {"type": "string"},
        "productDescription": {"type": "string"},
        "governingLaw": {"type": "string"},
        "chosenCourts": {"type": "string"},
    },
    "required": [
        "provider", "partner", "effectiveDate", "term",
        "program", "productDescription", "governingLaw", "chosenCourts",
    ],
    "additionalProperties": False,
}


def _render_design_partner(fields: dict) -> str:
    prov = fields["provider"]
    part = fields["partner"]
    cover_rows = (
        _row("Effective Date", fields.get("effectiveDate", ""))
        + _row("Provider", prov.get("companyName", ""), prov.get("noticeAddress", ""))
        + _row("Partner", part.get("companyName", ""), part.get("noticeAddress", ""))
        + _row("Term", fields.get("term", ""))
        + _row("Program", fields.get("program", ""))
        + _row("Product Description", fields.get("productDescription", ""))
        + _row("Governing Law", fields.get("governingLaw", ""))
        + _row("Chosen Courts", fields.get("chosenCourts", ""))
    )
    standard_terms_html = _md_to_html(_read_template("design-partner-agreement.md"))
    body = f"""
<h1>Design Partner Agreement</h1>
<h2>Cover Page</h2>
<table class="cover-table">{cover_rows}</table>
<div class="standard-terms">
<div class="standard-terms-title">Standard Terms</div>
{standard_terms_html}
</div>
"""
    return _html_doc("Design Partner Agreement", body)


# ── sla ───────────────────────────────────────────────────────────────────────

_SLA_SYSTEM_PROMPT = """\
You are a friendly legal assistant helping a user complete a Service Level Agreement (SLA).

Your job is to have a natural conversation to collect all required information, asking one or two items at a time.

Fields to collect:
- Provider: company name
- Customer: company name
- Agreement: the name or reference of the main agreement this SLA supplements
- Target Uptime: e.g. "99.9%"
- Target Response Time: e.g. "4 business hours for P1 issues"
- Support Channel: how support is provided (e.g. "email at support@example.com", "in-app ticketing")

Keep track of all information and include it in partial_data. Use null for fields not yet collected.
If you still need more information to complete all fields, ALWAYS end your response with a question. Never give a pure statement unless all required fields are confirmed.
"""

_SLA_MSG_SCHEMA = {
    "type": "object",
    "properties": {
        "message": {"type": "string"},
        "partial_data": {
            "type": "object",
            "properties": {
                "provider": _company_only_nullable(),
                "customer": _company_only_nullable(),
                "agreement": _null_str(),
                "targetUptime": _null_str(),
                "targetResponseTime": _null_str(),
                "supportChannel": _null_str(),
            },
            "required": [
                "provider", "customer", "agreement",
                "targetUptime", "targetResponseTime", "supportChannel",
            ],
            "additionalProperties": False,
        },
    },
    "required": ["message", "partial_data"],
    "additionalProperties": False,
}

_SLA_GEN_SCHEMA = {
    "type": "object",
    "properties": {
        "provider": _company_only_required(),
        "customer": _company_only_required(),
        "agreement": {"type": "string"},
        "targetUptime": {"type": "string"},
        "targetResponseTime": {"type": "string"},
        "supportChannel": {"type": "string"},
    },
    "required": [
        "provider", "customer", "agreement",
        "targetUptime", "targetResponseTime", "supportChannel",
    ],
    "additionalProperties": False,
}


def _render_sla(fields: dict) -> str:
    prov = fields["provider"]
    cust = fields["customer"]
    cover_rows = (
        _row("Provider", prov.get("companyName", ""))
        + _row("Customer", cust.get("companyName", ""))
        + _row("Agreement", fields.get("agreement", ""))
        + _row("Target Uptime", fields.get("targetUptime", ""))
        + _row("Target Response Time", fields.get("targetResponseTime", ""))
        + _row("Support Channel", fields.get("supportChannel", ""))
    )
    standard_terms_html = _md_to_html(_read_template("sla.md"))
    body = f"""
<h1>Service Level Agreement</h1>
<h2>Cover Page</h2>
<table class="cover-table">{cover_rows}</table>
<div class="standard-terms">
<div class="standard-terms-title">Standard Terms</div>
{standard_terms_html}
</div>
"""
    return _html_doc("Service Level Agreement", body)


# ── psa ───────────────────────────────────────────────────────────────────────

_PSA_SYSTEM_PROMPT = """\
You are a friendly legal assistant helping a user complete a Professional Services Agreement (PSA).

Your job is to have a natural conversation to collect all required information, asking one or two items at a time.

Fields to collect:
- Provider: company name, notice address
- Customer: company name, notice address
- Effective Date (YYYY-MM-DD)
- Services: description of the professional services to be performed
- Deliverables: what will be delivered
- Fees: payment amount and structure (e.g. "$10,000 fixed fee", "$150/hour")
- Payment Period: when payment is due (e.g. "net 30", "upon delivery")
- Governing Law: US state name or country
- Chosen Courts: court jurisdiction

Keep track of all information and include it in partial_data. Use null for fields not yet collected.
If you still need more information to complete all fields, ALWAYS end your response with a question. Never give a pure statement unless all required fields are confirmed.
"""

_PSA_MSG_SCHEMA = {
    "type": "object",
    "properties": {
        "message": {"type": "string"},
        "partial_data": {
            "type": "object",
            "properties": {
                "provider": _provider_customer_nullable(),
                "customer": _provider_customer_nullable(),
                "effectiveDate": _null_str(),
                "services": _null_str(),
                "deliverables": _null_str(),
                "fees": _null_str(),
                "paymentPeriod": _null_str(),
                "governingLaw": _null_str(),
                "chosenCourts": _null_str(),
            },
            "required": [
                "provider", "customer", "effectiveDate", "services",
                "deliverables", "fees", "paymentPeriod", "governingLaw", "chosenCourts",
            ],
            "additionalProperties": False,
        },
    },
    "required": ["message", "partial_data"],
    "additionalProperties": False,
}

_PSA_GEN_SCHEMA = {
    "type": "object",
    "properties": {
        "provider": _provider_customer_required(),
        "customer": _provider_customer_required(),
        "effectiveDate": {"type": "string"},
        "services": {"type": "string"},
        "deliverables": {"type": "string"},
        "fees": {"type": "string"},
        "paymentPeriod": {"type": "string"},
        "governingLaw": {"type": "string"},
        "chosenCourts": {"type": "string"},
    },
    "required": [
        "provider", "customer", "effectiveDate", "services",
        "deliverables", "fees", "paymentPeriod", "governingLaw", "chosenCourts",
    ],
    "additionalProperties": False,
}


def _render_psa(fields: dict) -> str:
    prov = fields["provider"]
    cust = fields["customer"]
    cover_rows = (
        _row("Effective Date", fields.get("effectiveDate", ""))
        + _row("Provider", prov.get("companyName", ""), prov.get("noticeAddress", ""))
        + _row("Customer", cust.get("companyName", ""), cust.get("noticeAddress", ""))
        + _row("Services", fields.get("services", ""))
        + _row("Deliverables", fields.get("deliverables", ""))
        + _row("Fees", fields.get("fees", ""))
        + _row("Payment Period", fields.get("paymentPeriod", ""))
        + _row("Governing Law", fields.get("governingLaw", ""))
        + _row("Chosen Courts", fields.get("chosenCourts", ""))
    )
    standard_terms_html = _md_to_html(_read_template("psa.md"))
    body = f"""
<h1>Professional Services Agreement</h1>
<h2>Cover Page</h2>
<table class="cover-table">{cover_rows}</table>
<div class="standard-terms">
<div class="standard-terms-title">Standard Terms</div>
{standard_terms_html}
</div>
"""
    return _html_doc("Professional Services Agreement", body)


# ── dpa ───────────────────────────────────────────────────────────────────────

_DPA_SYSTEM_PROMPT = """\
You are a friendly legal assistant helping a user complete a Data Processing Agreement (DPA).

Your job is to have a natural conversation to collect all required information, asking one or two items at a time.

Fields to collect:
- Provider: company name, notice address
- Customer: company name, notice address
- Agreement: the name or reference of the main agreement this DPA supplements (e.g. "Cloud Service Agreement dated 2026-01-01")
- Categories of Personal Data: types of personal data to be processed (e.g. "names, email addresses, IP addresses")
- Categories of Data Subjects: who the data subjects are (e.g. "Customer's end users and employees")
- Nature and Purpose of Processing: why and how the data will be processed
- Duration of Processing: how long data will be processed (e.g. "for the term of the Agreement")

Keep track of all information and include it in partial_data. Use null for fields not yet collected.
If you still need more information to complete all fields, ALWAYS end your response with a question. Never give a pure statement unless all required fields are confirmed.
"""

_DPA_MSG_SCHEMA = {
    "type": "object",
    "properties": {
        "message": {"type": "string"},
        "partial_data": {
            "type": "object",
            "properties": {
                "provider": _provider_customer_nullable(),
                "customer": _provider_customer_nullable(),
                "agreement": _null_str(),
                "categoriesOfPersonalData": _null_str(),
                "categoriesOfDataSubjects": _null_str(),
                "natureAndPurposeOfProcessing": _null_str(),
                "durationOfProcessing": _null_str(),
            },
            "required": [
                "provider", "customer", "agreement",
                "categoriesOfPersonalData", "categoriesOfDataSubjects",
                "natureAndPurposeOfProcessing", "durationOfProcessing",
            ],
            "additionalProperties": False,
        },
    },
    "required": ["message", "partial_data"],
    "additionalProperties": False,
}

_DPA_GEN_SCHEMA = {
    "type": "object",
    "properties": {
        "provider": _provider_customer_required(),
        "customer": _provider_customer_required(),
        "agreement": {"type": "string"},
        "categoriesOfPersonalData": {"type": "string"},
        "categoriesOfDataSubjects": {"type": "string"},
        "natureAndPurposeOfProcessing": {"type": "string"},
        "durationOfProcessing": {"type": "string"},
    },
    "required": [
        "provider", "customer", "agreement",
        "categoriesOfPersonalData", "categoriesOfDataSubjects",
        "natureAndPurposeOfProcessing", "durationOfProcessing",
    ],
    "additionalProperties": False,
}


def _render_dpa(fields: dict) -> str:
    prov = fields["provider"]
    cust = fields["customer"]
    cover_rows = (
        _row("Provider", prov.get("companyName", ""), prov.get("noticeAddress", ""))
        + _row("Customer", cust.get("companyName", ""), cust.get("noticeAddress", ""))
        + _row("Agreement", fields.get("agreement", ""))
        + _row("Categories of Personal Data", fields.get("categoriesOfPersonalData", ""))
        + _row("Categories of Data Subjects", fields.get("categoriesOfDataSubjects", ""))
        + _row("Nature and Purpose of Processing", fields.get("natureAndPurposeOfProcessing", ""))
        + _row("Duration of Processing", fields.get("durationOfProcessing", ""))
    )
    standard_terms_html = _md_to_html(_read_template("DPA.md"))
    body = f"""
<h1>Data Processing Agreement</h1>
<h2>Cover Page</h2>
<table class="cover-table">{cover_rows}</table>
<div class="standard-terms">
<div class="standard-terms-title">Standard Terms</div>
{standard_terms_html}
</div>
"""
    return _html_doc("Data Processing Agreement", body)


# ── software_license ──────────────────────────────────────────────────────────

_SOFTWARE_LICENSE_SYSTEM_PROMPT = """\
You are a friendly legal assistant helping a user complete a Software License Agreement.

Your job is to have a natural conversation to collect all required information, asking one or two items at a time.

Fields to collect:
- Provider: company name, notice address
- Customer: company name, notice address
- Effective Date (YYYY-MM-DD)
- Subscription Period: duration of the license (e.g. "12 months", "perpetual")
- Permitted Uses: what the customer is allowed to do with the software
- License Limits: any restrictions (e.g. "up to 50 named users", "single production environment")
- Payment Process: how payment will be made
- Governing Law: US state name or country
- Chosen Courts: court jurisdiction

Keep track of all information and include it in partial_data. Use null for fields not yet collected.
If you still need more information to complete all fields, ALWAYS end your response with a question. Never give a pure statement unless all required fields are confirmed.
"""

_SOFTWARE_LICENSE_MSG_SCHEMA = {
    "type": "object",
    "properties": {
        "message": {"type": "string"},
        "partial_data": {
            "type": "object",
            "properties": {
                "provider": _provider_customer_nullable(),
                "customer": _provider_customer_nullable(),
                "effectiveDate": _null_str(),
                "subscriptionPeriod": _null_str(),
                "permittedUses": _null_str(),
                "licenseLimits": _null_str(),
                "paymentProcess": _null_str(),
                "governingLaw": _null_str(),
                "chosenCourts": _null_str(),
            },
            "required": [
                "provider", "customer", "effectiveDate", "subscriptionPeriod",
                "permittedUses", "licenseLimits", "paymentProcess",
                "governingLaw", "chosenCourts",
            ],
            "additionalProperties": False,
        },
    },
    "required": ["message", "partial_data"],
    "additionalProperties": False,
}

_SOFTWARE_LICENSE_GEN_SCHEMA = {
    "type": "object",
    "properties": {
        "provider": _provider_customer_required(),
        "customer": _provider_customer_required(),
        "effectiveDate": {"type": "string"},
        "subscriptionPeriod": {"type": "string"},
        "permittedUses": {"type": "string"},
        "licenseLimits": {"type": "string"},
        "paymentProcess": {"type": "string"},
        "governingLaw": {"type": "string"},
        "chosenCourts": {"type": "string"},
    },
    "required": [
        "provider", "customer", "effectiveDate", "subscriptionPeriod",
        "permittedUses", "licenseLimits", "paymentProcess",
        "governingLaw", "chosenCourts",
    ],
    "additionalProperties": False,
}


def _render_software_license(fields: dict) -> str:
    prov = fields["provider"]
    cust = fields["customer"]
    cover_rows = (
        _row("Effective Date", fields.get("effectiveDate", ""))
        + _row("Provider", prov.get("companyName", ""), prov.get("noticeAddress", ""))
        + _row("Customer", cust.get("companyName", ""), cust.get("noticeAddress", ""))
        + _row("Subscription Period", fields.get("subscriptionPeriod", ""))
        + _row("Permitted Uses", fields.get("permittedUses", ""))
        + _row("License Limits", fields.get("licenseLimits", ""))
        + _row("Payment Process", fields.get("paymentProcess", ""))
        + _row("Governing Law", fields.get("governingLaw", ""))
        + _row("Chosen Courts", fields.get("chosenCourts", ""))
    )
    standard_terms_html = _md_to_html(_read_template("Software-License-Agreement.md"))
    body = f"""
<h1>Software License Agreement</h1>
<h2>Cover Page</h2>
<table class="cover-table">{cover_rows}</table>
<div class="standard-terms">
<div class="standard-terms-title">Standard Terms</div>
{standard_terms_html}
</div>
"""
    return _html_doc("Software License Agreement", body)


# ── partnership ───────────────────────────────────────────────────────────────

_PARTNERSHIP_SYSTEM_PROMPT = """\
You are a friendly legal assistant helping a user complete a Partnership Agreement.

Your job is to have a natural conversation to collect all required information, asking one or two items at a time.

Fields to collect:
- Company: company name, notice address
- Partner: company name, notice address
- Effective Date (YYYY-MM-DD)
- End Date: when the agreement expires (YYYY-MM-DD)
- Obligations: description of each party's obligations
- Territory: the geographic territory covered
- Governing Law: US state name or country
- Chosen Courts: court jurisdiction

Keep track of all information and include it in partial_data. Use null for fields not yet collected.
If you still need more information to complete all fields, ALWAYS end your response with a question. Never give a pure statement unless all required fields are confirmed.
"""

_PARTNERSHIP_MSG_SCHEMA = {
    "type": "object",
    "properties": {
        "message": {"type": "string"},
        "partial_data": {
            "type": "object",
            "properties": {
                "company": _provider_customer_nullable(),
                "partner": _provider_customer_nullable(),
                "effectiveDate": _null_str(),
                "endDate": _null_str(),
                "obligations": _null_str(),
                "territory": _null_str(),
                "governingLaw": _null_str(),
                "chosenCourts": _null_str(),
            },
            "required": [
                "company", "partner", "effectiveDate", "endDate",
                "obligations", "territory", "governingLaw", "chosenCourts",
            ],
            "additionalProperties": False,
        },
    },
    "required": ["message", "partial_data"],
    "additionalProperties": False,
}

_PARTNERSHIP_GEN_SCHEMA = {
    "type": "object",
    "properties": {
        "company": _provider_customer_required(),
        "partner": _provider_customer_required(),
        "effectiveDate": {"type": "string"},
        "endDate": {"type": "string"},
        "obligations": {"type": "string"},
        "territory": {"type": "string"},
        "governingLaw": {"type": "string"},
        "chosenCourts": {"type": "string"},
    },
    "required": [
        "company", "partner", "effectiveDate", "endDate",
        "obligations", "territory", "governingLaw", "chosenCourts",
    ],
    "additionalProperties": False,
}


def _render_partnership(fields: dict) -> str:
    comp = fields["company"]
    part = fields["partner"]
    cover_rows = (
        _row("Effective Date", fields.get("effectiveDate", ""))
        + _row("End Date", fields.get("endDate", ""))
        + _row("Company", comp.get("companyName", ""), comp.get("noticeAddress", ""))
        + _row("Partner", part.get("companyName", ""), part.get("noticeAddress", ""))
        + _row("Obligations", fields.get("obligations", ""))
        + _row("Territory", fields.get("territory", ""))
        + _row("Governing Law", fields.get("governingLaw", ""))
        + _row("Chosen Courts", fields.get("chosenCourts", ""))
    )
    standard_terms_html = _md_to_html(_read_template("Partnership-Agreement.md"))
    body = f"""
<h1>Partnership Agreement</h1>
<h2>Cover Page</h2>
<table class="cover-table">{cover_rows}</table>
<div class="standard-terms">
<div class="standard-terms-title">Standard Terms</div>
{standard_terms_html}
</div>
"""
    return _html_doc("Partnership Agreement", body)


# ── pilot ─────────────────────────────────────────────────────────────────────

_PILOT_SYSTEM_PROMPT = """\
You are a friendly legal assistant helping a user complete a Pilot Agreement.

Your job is to have a natural conversation to collect all required information, asking one or two items at a time.

Fields to collect:
- Provider: company name, notice address
- Customer: company name, notice address
- Effective Date (YYYY-MM-DD)
- Pilot Period: how long the pilot lasts (e.g. "90 days", "3 months")
- Product Description: description of the product being piloted
- Evaluation Purposes: what the customer is evaluating the product for
- Governing Law: US state name or country
- Chosen Courts: court jurisdiction

Keep track of all information and include it in partial_data. Use null for fields not yet collected.
If you still need more information to complete all fields, ALWAYS end your response with a question. Never give a pure statement unless all required fields are confirmed.
"""

_PILOT_MSG_SCHEMA = {
    "type": "object",
    "properties": {
        "message": {"type": "string"},
        "partial_data": {
            "type": "object",
            "properties": {
                "provider": _provider_customer_nullable(),
                "customer": _provider_customer_nullable(),
                "effectiveDate": _null_str(),
                "pilotPeriod": _null_str(),
                "productDescription": _null_str(),
                "evaluationPurposes": _null_str(),
                "governingLaw": _null_str(),
                "chosenCourts": _null_str(),
            },
            "required": [
                "provider", "customer", "effectiveDate", "pilotPeriod",
                "productDescription", "evaluationPurposes", "governingLaw", "chosenCourts",
            ],
            "additionalProperties": False,
        },
    },
    "required": ["message", "partial_data"],
    "additionalProperties": False,
}

_PILOT_GEN_SCHEMA = {
    "type": "object",
    "properties": {
        "provider": _provider_customer_required(),
        "customer": _provider_customer_required(),
        "effectiveDate": {"type": "string"},
        "pilotPeriod": {"type": "string"},
        "productDescription": {"type": "string"},
        "evaluationPurposes": {"type": "string"},
        "governingLaw": {"type": "string"},
        "chosenCourts": {"type": "string"},
    },
    "required": [
        "provider", "customer", "effectiveDate", "pilotPeriod",
        "productDescription", "evaluationPurposes", "governingLaw", "chosenCourts",
    ],
    "additionalProperties": False,
}


def _render_pilot(fields: dict) -> str:
    prov = fields["provider"]
    cust = fields["customer"]
    cover_rows = (
        _row("Effective Date", fields.get("effectiveDate", ""))
        + _row("Provider", prov.get("companyName", ""), prov.get("noticeAddress", ""))
        + _row("Customer", cust.get("companyName", ""), cust.get("noticeAddress", ""))
        + _row("Pilot Period", fields.get("pilotPeriod", ""))
        + _row("Product Description", fields.get("productDescription", ""))
        + _row("Evaluation Purposes", fields.get("evaluationPurposes", ""))
        + _row("Governing Law", fields.get("governingLaw", ""))
        + _row("Chosen Courts", fields.get("chosenCourts", ""))
    )
    standard_terms_html = _md_to_html(_read_template("Pilot-Agreement.md"))
    body = f"""
<h1>Pilot Agreement</h1>
<h2>Cover Page</h2>
<table class="cover-table">{cover_rows}</table>
<div class="standard-terms">
<div class="standard-terms-title">Standard Terms</div>
{standard_terms_html}
</div>
"""
    return _html_doc("Pilot Agreement", body)


# ── baa ───────────────────────────────────────────────────────────────────────

_BAA_SYSTEM_PROMPT = """\
You are a friendly legal assistant helping a user complete a Business Associate Agreement (BAA) under HIPAA.

Your job is to have a natural conversation to collect all required information, asking one or two items at a time.

Fields to collect:
- Provider: company name (the Business Associate)
- Company: company name (the Covered Entity)
- Agreement: the name or reference of the main agreement this BAA supplements
- BAA Effective Date (YYYY-MM-DD)
- Breach Notification Period: how many days for breach notification (e.g. "60 days")

Keep track of all information and include it in partial_data. Use null for fields not yet collected.
If you still need more information to complete all fields, ALWAYS end your response with a question. Never give a pure statement unless all required fields are confirmed.
"""

_BAA_MSG_SCHEMA = {
    "type": "object",
    "properties": {
        "message": {"type": "string"},
        "partial_data": {
            "type": "object",
            "properties": {
                "provider": _company_only_nullable(),
                "company": _company_only_nullable(),
                "agreement": _null_str(),
                "baaEffectiveDate": _null_str(),
                "breachNotificationPeriod": _null_str(),
            },
            "required": [
                "provider", "company", "agreement",
                "baaEffectiveDate", "breachNotificationPeriod",
            ],
            "additionalProperties": False,
        },
    },
    "required": ["message", "partial_data"],
    "additionalProperties": False,
}

_BAA_GEN_SCHEMA = {
    "type": "object",
    "properties": {
        "provider": _company_only_required(),
        "company": _company_only_required(),
        "agreement": {"type": "string"},
        "baaEffectiveDate": {"type": "string"},
        "breachNotificationPeriod": {"type": "string"},
    },
    "required": [
        "provider", "company", "agreement",
        "baaEffectiveDate", "breachNotificationPeriod",
    ],
    "additionalProperties": False,
}


def _render_baa(fields: dict) -> str:
    prov = fields["provider"]
    comp = fields["company"]
    cover_rows = (
        _row("BAA Effective Date", fields.get("baaEffectiveDate", ""))
        + _row("Provider (Business Associate)", prov.get("companyName", ""))
        + _row("Company (Covered Entity)", comp.get("companyName", ""))
        + _row("Agreement", fields.get("agreement", ""))
        + _row("Breach Notification Period", fields.get("breachNotificationPeriod", ""))
    )
    standard_terms_html = _md_to_html(_read_template("BAA.md"))
    body = f"""
<h1>Business Associate Agreement</h1>
<h2>Cover Page</h2>
<table class="cover-table">{cover_rows}</table>
<div class="standard-terms">
<div class="standard-terms-title">Standard Terms</div>
{standard_terms_html}
</div>
"""
    return _html_doc("Business Associate Agreement", body)


# ── ai_addendum ───────────────────────────────────────────────────────────────

_AI_ADDENDUM_SYSTEM_PROMPT = """\
You are a friendly legal assistant helping a user complete an AI Addendum to a software agreement.

Your job is to have a natural conversation to collect all required information, asking one or two items at a time.

Fields to collect:
- Provider: company name
- Customer: company name
- Agreement: the name or reference of the main agreement this addendum supplements
- Effective Date (YYYY-MM-DD)
- Training Restrictions: any restrictions on using customer data to train AI models (e.g. "Provider may not use Customer Inputs to train any Model" or "None")
- Improvement Restrictions: restrictions on using data for non-training improvements (e.g. "None" or specific restrictions)

Keep track of all information and include it in partial_data. Use null for fields not yet collected.
If you still need more information to complete all fields, ALWAYS end your response with a question. Never give a pure statement unless all required fields are confirmed.
"""

_AI_ADDENDUM_MSG_SCHEMA = {
    "type": "object",
    "properties": {
        "message": {"type": "string"},
        "partial_data": {
            "type": "object",
            "properties": {
                "provider": _company_only_nullable(),
                "customer": _company_only_nullable(),
                "agreement": _null_str(),
                "effectiveDate": _null_str(),
                "trainingRestrictions": _null_str(),
                "improvementRestrictions": _null_str(),
            },
            "required": [
                "provider", "customer", "agreement", "effectiveDate",
                "trainingRestrictions", "improvementRestrictions",
            ],
            "additionalProperties": False,
        },
    },
    "required": ["message", "partial_data"],
    "additionalProperties": False,
}

_AI_ADDENDUM_GEN_SCHEMA = {
    "type": "object",
    "properties": {
        "provider": _company_only_required(),
        "customer": _company_only_required(),
        "agreement": {"type": "string"},
        "effectiveDate": {"type": "string"},
        "trainingRestrictions": {"type": "string"},
        "improvementRestrictions": {"type": "string"},
    },
    "required": [
        "provider", "customer", "agreement", "effectiveDate",
        "trainingRestrictions", "improvementRestrictions",
    ],
    "additionalProperties": False,
}


def _render_ai_addendum(fields: dict) -> str:
    prov = fields["provider"]
    cust = fields["customer"]
    cover_rows = (
        _row("Effective Date", fields.get("effectiveDate", ""))
        + _row("Provider", prov.get("companyName", ""))
        + _row("Customer", cust.get("companyName", ""))
        + _row("Agreement", fields.get("agreement", ""))
        + _row("Training Restrictions", fields.get("trainingRestrictions", ""))
        + _row("Improvement Restrictions", fields.get("improvementRestrictions", ""))
    )
    standard_terms_html = _md_to_html(_read_template("AI-Addendum.md"))
    body = f"""
<h1>AI Addendum</h1>
<h2>Cover Page</h2>
<table class="cover-table">{cover_rows}</table>
<div class="standard-terms">
<div class="standard-terms-title">Standard Terms</div>
{standard_terms_html}
</div>
"""
    return _html_doc("AI Addendum", body)


# ── Registry ──────────────────────────────────────────────────────────────────

DOC_REGISTRY: dict[str, dict] = {
    "mutual_nda": {
        "display_name": "Mutual Non-Disclosure Agreement",
        "system_prompt": _MUTUAL_NDA_SYSTEM_PROMPT,
        "msg_schema": _MUTUAL_NDA_MSG_SCHEMA,
        "gen_schema": _MUTUAL_NDA_GEN_SCHEMA,
        "render": _render_mutual_nda,
    },
    "csa": {
        "display_name": "Cloud Service Agreement",
        "system_prompt": _CSA_SYSTEM_PROMPT,
        "msg_schema": _CSA_MSG_SCHEMA,
        "gen_schema": _CSA_GEN_SCHEMA,
        "render": _render_csa,
    },
    "design_partner": {
        "display_name": "Design Partner Agreement",
        "system_prompt": _DESIGN_PARTNER_SYSTEM_PROMPT,
        "msg_schema": _DESIGN_PARTNER_MSG_SCHEMA,
        "gen_schema": _DESIGN_PARTNER_GEN_SCHEMA,
        "render": _render_design_partner,
    },
    "sla": {
        "display_name": "Service Level Agreement",
        "system_prompt": _SLA_SYSTEM_PROMPT,
        "msg_schema": _SLA_MSG_SCHEMA,
        "gen_schema": _SLA_GEN_SCHEMA,
        "render": _render_sla,
    },
    "psa": {
        "display_name": "Professional Services Agreement",
        "system_prompt": _PSA_SYSTEM_PROMPT,
        "msg_schema": _PSA_MSG_SCHEMA,
        "gen_schema": _PSA_GEN_SCHEMA,
        "render": _render_psa,
    },
    "dpa": {
        "display_name": "Data Processing Agreement",
        "system_prompt": _DPA_SYSTEM_PROMPT,
        "msg_schema": _DPA_MSG_SCHEMA,
        "gen_schema": _DPA_GEN_SCHEMA,
        "render": _render_dpa,
    },
    "software_license": {
        "display_name": "Software License Agreement",
        "system_prompt": _SOFTWARE_LICENSE_SYSTEM_PROMPT,
        "msg_schema": _SOFTWARE_LICENSE_MSG_SCHEMA,
        "gen_schema": _SOFTWARE_LICENSE_GEN_SCHEMA,
        "render": _render_software_license,
    },
    "partnership": {
        "display_name": "Partnership Agreement",
        "system_prompt": _PARTNERSHIP_SYSTEM_PROMPT,
        "msg_schema": _PARTNERSHIP_MSG_SCHEMA,
        "gen_schema": _PARTNERSHIP_GEN_SCHEMA,
        "render": _render_partnership,
    },
    "pilot": {
        "display_name": "Pilot Agreement",
        "system_prompt": _PILOT_SYSTEM_PROMPT,
        "msg_schema": _PILOT_MSG_SCHEMA,
        "gen_schema": _PILOT_GEN_SCHEMA,
        "render": _render_pilot,
    },
    "baa": {
        "display_name": "Business Associate Agreement",
        "system_prompt": _BAA_SYSTEM_PROMPT,
        "msg_schema": _BAA_MSG_SCHEMA,
        "gen_schema": _BAA_GEN_SCHEMA,
        "render": _render_baa,
    },
    "ai_addendum": {
        "display_name": "AI Addendum",
        "system_prompt": _AI_ADDENDUM_SYSTEM_PROMPT,
        "msg_schema": _AI_ADDENDUM_MSG_SCHEMA,
        "gen_schema": _AI_ADDENDUM_GEN_SCHEMA,
        "render": _render_ai_addendum,
    },
}


def render_document(doc_type: str, fields: dict) -> str:
    return DOC_REGISTRY[doc_type]["render"](fields)
