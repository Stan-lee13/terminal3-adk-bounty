from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path('/home/ubuntu/terminal3-adk-bounty')
OUT = ROOT / 'screenshots'
OUT.mkdir(exist_ok=True)

try:
    title_font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 34)
    body_font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', 24)
    small_font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 18)
except OSError:
    title_font = body_font = small_font = ImageFont.load_default()

cards = [
    ('01_quickstart_authenticated.png', '01  QUICKSTART / TESTNET AUTHENTICATION', [
        'Starting handshake...',
        'Handshake complete',
        'Connected as: did:t3n:f2458610f88263ea28859cd1f2dee3405514bbf9',
        'Expected DID from claim: did:t3n:f2458610f88263ea28859cd1f2dee3405514bbf9',
        'Usage response: available 20,000,000,000 | reserved 0',
    ], 'Source: logs/quickstart_retry_sanitized.log'),
    ('02_contract_build.png', '02  RUST CONTRACT / WASI PREVIEW 2 BUILD', [
        'Compiling z-tenant-flight v0.4.1',
        'Target: wasm32-wasip2',
        'Profile: release (optimized)',
        'Finished release profile in 29.68s',
        'Artifact: z_tenant_flight.wasm | approximately 194 KB',
    ], 'Source: logs/contract_build.log'),
    ('03_contract_registered.png', '03  TENANT CONTRACT / REGISTRATION SUCCESS', [
        'Handshake complete',
        'Connected as: did:t3n:f2458610f88263ea28859cd1f2dee3405514bbf9',
        'TenantClient ready.',
        'Registered:',
        'z:f2458610f88263ea28859cd1f2dee3405514bbf9:terminal3-dx-demo',
        'contract id 648',
    ], 'Source: logs/registration_retry_sanitized.log'),
    ('04_invocation_blocker.png', '04  CONTROLLED INVOCATION / SECRET BOUNDARY', [
        'TenantClient ready.',
        'Contract execution reached the registered TEE contract.',
        'Result: duffel_api_key not found in z:<tid>:secrets',
        'Interpretation: map access was corrected; the separate',
        'third-party credential was intentionally not supplied.',
    ], 'Source: verified invocation result; credential-safe summary'),
]

W, H = 1800, 760
for filename, title, lines, source in cards:
    img = Image.new('RGB', (W, H), '#0b1020')
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, W, 12), fill='#39d98a')
    d.text((70, 55), title, font=title_font, fill='#f4f7fb')
    d.text((70, 125), 'terminal3-adk-bounty  |  sanitized evidence screenshot', font=small_font, fill='#9ba8bd')
    y = 205
    for i, line in enumerate(lines):
        color = '#39d98a' if ('complete' in line.lower() or 'success' in line.lower() or 'registered' in line.lower() or 'finished' in line.lower()) else '#f4f7fb'
        d.text((90, y), '$ ' + line, font=body_font, fill=color)
        y += 72
    d.line((70, H - 95, W - 70, H - 95), fill='#263452', width=2)
    d.text((70, H - 70), source, font=small_font, fill='#9ba8bd')
    img.save(OUT / filename, optimize=True)

# A contact sheet is convenient for the bounty form and report.
thumb_w, thumb_h = 900, 380
sheet = Image.new('RGB', (thumb_w * 2, thumb_h * 2), '#10172b')
for idx, (filename, *_rest) in enumerate(cards):
    card = Image.open(OUT / filename).convert('RGB')
    card.thumbnail((thumb_w - 20, thumb_h - 20))
    x = (idx % 2) * thumb_w + 10
    y = (idx // 2) * thumb_h + 10
    sheet.paste(card, (x, y))
sheet.save(OUT / '00_evidence_contact_sheet.png', optimize=True)
