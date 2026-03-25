const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// Your Anthropic API key
const API_KEY = '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';

// TekMatix webhook URL - add yours here when ready
const TEKMATIX_WEBHOOK = process.env.TEKMATIX_WEBHOOK || '';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Serve the main audit page ──────────────────────────────
app.get('/', (req, res) => {
  res.send(getHTML());
});

// ── Handle form submission ─────────────────────────────────
app.post('/submit', async (req, res) => {
  const { firstName, businessName, email, phone, websiteUrl, challenge } = req.body;

  // Send to TekMatix if webhook is configured
  if (TEKMATIX_WEBHOOK) {
    try {
      await fetch(TEKMATIX_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, businessName, email, phone, websiteUrl, challenge, source: 'Brand Audit Tool' })
      });
    } catch (e) {
      console.log('TekMatix webhook error:', e.message);
    }
  }

  res.json({ success: true });
});

// ── Fetch website content ──────────────────────────────────
app.get('/fetch-site', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 15000
    });
    const html = await response.text();
    res.json({ html });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// ── Run Claude analysis ────────────────────────────────────
app.post('/analyse', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'No prompt provided' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      }),
      timeout: 60000
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || 'API error' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Ellie Clare Brand Audit running on port ${PORT}`);
});

// ── HTML ───────────────────────────────────────────────────
function getHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Free Website Brand Audit — Ellie Clare</title>
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">
<style>
:root{--navy:#181f30;--teal:#15afb4;--teal-dim:rgba(21,175,180,0.12);--white:#fff;--grey:#8a94a8}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Open Sans',sans-serif;background:var(--navy);color:var(--white);min-height:100vh;overflow-x:hidden}
body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse 70% 50% at 10% 0%,rgba(21,175,180,.07) 0%,transparent 55%),radial-gradient(ellipse 50% 70% at 90% 100%,rgba(21,175,180,.05) 0%,transparent 55%);pointer-events:none;z-index:0}
.screen{display:none;position:relative;z-index:1}
.screen.active{display:block}
/* FORM SCREEN */
#s-form{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:60px 24px}
.form-inner{max-width:540px;width:100%;margin:0 auto;text-align:center}
.logo{display:inline-flex;align-items:center;gap:10px;margin-bottom:32px}
.ring{width:38px;height:38px;border-radius:50%;border:1.5px solid var(--teal);display:flex;align-items:center;justify-content:center}
.dot{width:6px;height:6px;border-radius:50%;background:var(--teal)}
.lname{font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--teal)}
.ftag{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--teal);border:1px solid rgba(21,175,180,.3);padding:5px 14px;border-radius:20px;margin-bottom:22px}
.form-inner h1{font-size:clamp(24px,5vw,40px);font-weight:700;line-height:1.15;letter-spacing:-.02em;margin-bottom:14px}
.form-inner h1 em{color:var(--teal);font-style:normal}
.form-inner>p{font-size:15px;font-weight:300;color:var(--grey);line-height:1.7;margin-bottom:32px}
.checks{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:32px;text-align:left}
.chk{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-radius:10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07)}
.cnum{width:20px;height:20px;border-radius:50%;flex-shrink:0;margin-top:1px;background:var(--teal-dim);border:1px solid rgba(21,175,180,.3);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--teal)}
.chk b{display:block;font-size:13px;font-weight:600;margin-bottom:2px}
.chk span{font-size:11px;color:var(--grey);font-weight:300}
.form-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:32px;text-align:left}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.field{margin-bottom:16px}
.field label{display:block;font-size:12px;font-weight:600;color:var(--grey);text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px}
.field input,.field select{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:9px;padding:13px 15px;font-family:'Open Sans',sans-serif;font-size:14px;color:var(--white);outline:none;transition:border-color .2s}
.field input::placeholder{color:var(--grey)}
.field input:focus,.field select:focus{border-color:var(--teal)}
.field select{appearance:none;cursor:pointer}
.field select option{background:#1e2740;color:var(--white)}
.btn-submit{width:100%;background:var(--teal);color:var(--navy);font-family:'Open Sans',sans-serif;font-size:14px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:17px;border-radius:10px;border:none;cursor:pointer;transition:all .25s;margin-top:8px}
.btn-submit:hover{background:#12c5cb;transform:translateY(-1px);box-shadow:0 12px 32px rgba(21,175,180,.3)}
.btn-submit:disabled{opacity:.5;cursor:not-allowed;transform:none;box-shadow:none}
.form-note{margin-top:14px;font-size:12px;color:var(--grey);font-weight:300;text-align:center}
/* LOADING SCREEN */
#s-loading{min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:24px;padding:60px 24px;text-align:center}
.spinner{width:52px;height:52px;border:3px solid rgba(21,175,180,.15);border-top-color:var(--teal);border-radius:50%;animation:spin .9s linear infinite}
.load-name{font-size:15px;font-weight:600;color:var(--teal)}
.steps-list{display:flex;flex-direction:column;gap:9px;max-width:340px;width:100%}
.step{display:flex;align-items:center;gap:12px;padding:12px 15px;border-radius:10px;font-size:13px;color:var(--grey);font-weight:300;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);transition:all .35s}
.step .si{font-size:15px;width:22px;text-align:center;flex-shrink:0}
.step .sl{flex:1;text-align:left}
.step .sc{width:18px;height:18px;border-radius:50%;flex-shrink:0;border:1.5px solid rgba(255,255,255,.1);transition:all .35s;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700}
.step.active{color:var(--white);background:var(--teal-dim);border-color:rgba(21,175,180,.25)}
.step.active .sc{border-color:var(--teal);animation:pulse 1s ease infinite}
.step.done{color:var(--teal);background:rgba(21,175,180,.05);border-color:rgba(21,175,180,.15)}
.step.done .sc{background:var(--teal);border-color:var(--teal);color:var(--navy)}
/* RESULTS SCREEN */
#s-results{padding:60px 24px 100px}
.rw{max-width:720px;margin:0 auto}
.rh{margin-bottom:32px}
.rm{display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap}
.rtag{font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--teal);border:1px solid rgba(21,175,180,.3);padding:5px 14px;border-radius:20px}
.rname{font-size:13px;color:var(--grey);font-weight:600}
.rh h2{font-size:clamp(20px,3.5vw,30px);font-weight:700;letter-spacing:-.02em;line-height:1.2;margin-bottom:10px}
.rh h2 span{color:var(--teal)}
.rh p{font-size:15px;color:var(--grey);font-weight:300;line-height:1.65}
.oc{background:linear-gradient(135deg,rgba(21,175,180,.1) 0%,rgba(21,175,180,.03) 100%);border:1px solid rgba(21,175,180,.25);border-radius:16px;padding:32px;margin-bottom:20px;position:relative;overflow:hidden}
.oc::before{content:'';position:absolute;top:-1px;left:40px;right:40px;height:2px;background:linear-gradient(90deg,transparent,var(--teal),transparent)}
.oi{display:flex;align-items:center;gap:24px}
.srw{position:relative;flex-shrink:0}
.sr{transform:rotate(-90deg)}
.rb{fill:none;stroke:rgba(255,255,255,.07);stroke-width:8}
.rf{fill:none;stroke:var(--teal);stroke-width:8;stroke-linecap:round;stroke-dasharray:283;stroke-dashoffset:283;transition:stroke-dashoffset 1.6s cubic-bezier(.16,1,.3,1) .5s}
.rn{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.rnum{font-size:26px;font-weight:700;color:var(--teal);line-height:1}
.rden{font-size:11px;color:var(--grey);font-weight:300}
.ot h3{font-size:19px;font-weight:700;margin-bottom:8px}
.ot p{font-size:14px;color:var(--grey);font-weight:300;line-height:1.65}
.pg{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px}
.pc{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:22px}
.sh{border-color:rgba(21,175,180,.25)}.sm{border-color:rgba(255,180,50,.2)}.sl{border-color:rgba(220,80,80,.2)}
.pt{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px}
.pn{font-size:12px;font-weight:700;max-width:120px;line-height:1.35}
.psb{font-size:17px;font-weight:700;padding:3px 9px;border-radius:7px;flex-shrink:0}
.sh .psb{color:var(--teal);background:var(--teal-dim)}.sm .psb{color:#f0b040;background:rgba(255,180,50,.1)}.sl .psb{color:#e06060;background:rgba(220,80,80,.1)}
.pbt{height:4px;border-radius:2px;background:rgba(255,255,255,.06);margin-bottom:14px;overflow:hidden}
.pbf{height:100%;border-radius:2px;width:0%;transition:width 1.3s cubic-bezier(.16,1,.3,1) .6s}
.sh .pbf{background:var(--teal)}.sm .pbf{background:#f0b040}.sl .pbf{background:#e06060}
.pv{font-size:13px;font-weight:600;margin-bottom:6px}
.pf{font-size:12px;color:var(--grey);font-weight:300;line-height:1.6}
.gb{margin-top:10px;padding:10px 12px;background:rgba(21,175,180,.06);border-left:2px solid rgba(21,175,180,.35);border-radius:0 6px 6px 0}
.gl{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--teal);margin-bottom:3px}
.gt{font-size:11px;color:rgba(255,255,255,.5);font-weight:300;line-height:1.55}
.acard{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:30px;margin-bottom:20px}
.st{font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--teal);margin-bottom:22px;display:flex;align-items:center;gap:10px}
.st::after{content:'';flex:1;height:1px;background:rgba(21,175,180,.2)}
.alist{display:flex;flex-direction:column;gap:12px}
.ai{display:flex;gap:12px;align-items:flex-start;padding:15px 16px;border-radius:10px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05)}
.an{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0}
.a1{background:var(--teal);color:var(--navy)}.a2{background:rgba(21,175,180,.3);color:var(--teal)}.a3{background:rgba(21,175,180,.12);color:var(--grey)}
.ati{font-size:13px;font-weight:600;margin-bottom:4px}
.ade{font-size:12px;color:var(--grey);font-weight:300;line-height:1.55}
.atg{display:inline-block;margin-top:7px;font-size:10px;font-weight:700;letter-spacing:.07em;color:var(--teal);background:var(--teal-dim);padding:2px 9px;border-radius:20px}
.cta-card{background:linear-gradient(135deg,rgba(21,175,180,.12) 0%,rgba(21,175,180,.04) 100%);border:1px solid rgba(21,175,180,.25);border-radius:16px;padding:40px 32px;text-align:center;margin-bottom:20px;position:relative;overflow:hidden}
.cta-card::before{content:'';position:absolute;top:-1px;left:40px;right:40px;height:2px;background:linear-gradient(90deg,transparent,var(--teal),transparent)}
.cta-card h3{font-size:22px;font-weight:700;margin-bottom:10px;letter-spacing:-.01em}
.cta-card p{font-size:14px;color:var(--grey);font-weight:300;line-height:1.7;max-width:440px;margin:0 auto 28px}
.btn-cta{display:inline-block;background:var(--teal);color:var(--navy);font-family:'Open Sans',sans-serif;font-size:14px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:17px 44px;border-radius:8px;border:none;cursor:pointer;text-decoration:none;transition:all .25s}
.btn-cta:hover{background:#12c5cb;transform:translateY(-2px);box-shadow:0 14px 36px rgba(21,175,180,.3)}
.cnote{margin-top:12px;font-size:12px;color:var(--grey);font-weight:300}
.btn-new{display:inline-block;margin-top:14px;font-size:12px;color:var(--grey);cursor:pointer;font-weight:300;text-decoration:underline;text-underline-offset:3px;background:none;border:none;font-family:'Open Sans',sans-serif;transition:color .2s}
.btn-new:hover{color:var(--white)}
.disc{padding:14px 18px;border:1px solid rgba(255,255,255,.05);border-radius:10px;font-size:11px;color:var(--grey);line-height:1.6;font-weight:300}
.disc strong{color:rgba(255,255,255,.35);font-weight:700;display:block;margin-bottom:3px;font-size:10px;letter-spacing:.1em;text-transform:uppercase}
/* ERROR */
#s-error{min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:18px;padding:60px 24px;text-align:center}
.eico{font-size:36px}.etit{font-size:20px;font-weight:700}
.emsg{font-size:14px;color:var(--grey);font-weight:300;max-width:440px;line-height:1.7}
.btn-back{background:var(--teal);color:var(--navy);font-family:'Open Sans',sans-serif;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:14px 30px;border-radius:8px;border:none;cursor:pointer;transition:all .25s;margin-top:6px}
.btn-back:hover{background:#12c5cb}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:560px){.pg{grid-template-columns:1fr}.checks{grid-template-columns:1fr}.form-row{grid-template-columns:1fr}.oi{flex-direction:column;text-align:center}}
</style>
</head>
<body>

<!-- FORM -->
<div class="screen active" id="s-form">
<div class="form-inner">
  <div class="logo"><div class="ring"><div class="dot"></div></div><span class="lname">Ellie Clare</span></div>
  <div class="ftag">Free Website Brand Audit</div>
  <h1>Find out what your website is <em>really</em> saying about your brand</h1>
  <p>Fill in your details below and we'll analyse your website across four key areas — giving you a personalised report in seconds.</p>
  <div class="checks">
    <div class="chk"><div class="cnum">1</div><div><b>Brand Message</b><span>Are you instantly clear?</span></div></div>
    <div class="chk"><div class="cnum">2</div><div><b>Trust Signals</b><span>Do you build confidence?</span></div></div>
    <div class="chk"><div class="cnum">3</div><div><b>Call to Action</b><span>Do visitors know what to do?</span></div></div>
    <div class="chk"><div class="cnum">4</div><div><b>Personal Brand</b><span>Is the real you visible?</span></div></div>
  </div>
  <div class="form-card">
    <div class="form-row">
      <div class="field"><label>First Name</label><input type="text" id="f-name" placeholder="Sarah" required></div>
      <div class="field"><label>Business Name</label><input type="text" id="f-biz" placeholder="Your Business" required></div>
    </div>
    <div class="form-row">
      <div class="field"><label>Email Address</label><input type="email" id="f-email" placeholder="sarah@yourbusiness.com" required></div>
      <div class="field"><label>Phone Number</label><input type="tel" id="f-phone" placeholder="+61 400 000 000"></div>
    </div>
    <div class="field"><label>Your Website URL</label><input type="text" id="f-url" placeholder="https://yourbusiness.com.au" required></div>
    <div class="field">
      <label>Biggest Marketing Challenge</label>
      <select id="f-challenge">
        <option value="" disabled selected>Select your biggest challenge...</option>
        <option value="dont-know-where-to-start">I don't know where to start</option>
        <option value="tried-but-not-working">I've tried marketing but nothing's working</option>
        <option value="inconsistent-leads">I'm not getting consistent leads</option>
        <option value="brand-not-me">My brand doesn't feel like me</option>
        <option value="no-time">I don't have time to keep up with marketing</option>
        <option value="spent-money-no-results">I've spent money on marketing and got nothing back</option>
        <option value="dont-trust-marketers">I don't trust marketers anymore</option>
      </select>
    </div>
    <button class="btn-submit" onclick="submitForm()">Analyse My Website →</button>
    <p class="form-note">Takes about 30 seconds &nbsp;·&nbsp; Free &nbsp;·&nbsp; No commitment</p>
  </div>
</div>
</div>

<!-- LOADING -->
<div class="screen" id="s-loading">
  <div class="spinner"></div>
  <div class="load-name" id="load-name"></div>
  <div class="steps-list">
    <div class="step" id="st1"><span class="si">🌐</span><span class="sl">Fetching your website</span><div class="sc"></div></div>
    <div class="step" id="st2"><span class="si">💬</span><span class="sl">Analysing brand message clarity</span><div class="sc"></div></div>
    <div class="step" id="st3"><span class="si">🔒</span><span class="sl">Checking trust signals</span><div class="sc"></div></div>
    <div class="step" id="st4"><span class="si">📣</span><span class="sl">Reviewing your call to action</span><div class="sc"></div></div>
    <div class="step" id="st5"><span class="si">👤</span><span class="sl">Assessing personal brand visibility</span><div class="sc"></div></div>
    <div class="step" id="st6"><span class="si">📋</span><span class="sl">Building your personalised report</span><div class="sc"></div></div>
  </div>
</div>

<!-- RESULTS -->
<div class="screen" id="s-results">
<div class="rw">
  <div class="rh">
    <div class="rm"><span class="rtag">Brand Audit Report</span><span class="rname" id="r-name"></span></div>
    <h2>Your website has <span id="r-hl">room to grow</span></h2>
    <p id="r-sum"></p>
  </div>
  <div class="oc">
    <div class="oi">
      <div class="srw">
        <svg class="sr" width="96" height="96" viewBox="0 0 96 96">
          <circle class="rb" cx="48" cy="48" r="45"/>
          <circle class="rf" id="rfill" cx="48" cy="48" r="45"/>
        </svg>
        <div class="rn"><span class="rnum" id="r-score">—</span><span class="rden">/100</span></div>
      </div>
      <div class="ot">
        <h3 id="r-lbl">Overall Brand Score</h3>
        <p id="r-desc"></p>
      </div>
    </div>
  </div>
  <div class="pg" id="pg"></div>
  <div class="acard"><div class="st">Your Priority Action Plan</div><div class="alist" id="alist"></div></div>
  <div class="cta-card">
    <h3>Want help making these changes?</h3>
    <p>You've seen where the gaps are. The next step is a quick brand fit call — we'll talk through your results and work out whether Ellie's approach is the right fit for where you're at right now.</p>
    <a href="https://ellieclare.com.au" class="btn-cta">Book a Free Brand Fit Call →</a>
    <p class="cnote">No obligation &nbsp;·&nbsp; 20 minutes &nbsp;·&nbsp; Honest conversation</p>
  </div>
  <div class="disc"><strong>About this audit</strong>Generated by AI analysis of your website's publicly available homepage. Scores reflect what a potential client experiences when they land on your site. This is a starting point — not a technical SEO audit.</div>
  <br><button class="btn-new" onclick="restart()">← Audit a different website</button>
</div>
</div>

<!-- ERROR -->
<div class="screen" id="s-error">
  <div class="eico">⚠️</div>
  <div class="etit" id="e-title">Something went wrong</div>
  <div class="emsg" id="e-msg">Please try again.</div>
  <button class="btn-back" onclick="restart()">← Try Again</button>
</div>

<script>
let userData = {};

function show(id){ document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active')); document.getElementById('s-'+id).classList.add('active'); window.scrollTo(0,0); }
function restart(){ show('form'); }
function showErr(t,m){ document.getElementById('e-title').textContent=t; document.getElementById('e-msg').textContent=m; show('error'); }

const SIDS=['st1','st2','st3','st4','st5','st6'];
function stepReset(){ SIDS.forEach(id=>document.getElementById(id).className='step'); }
function stepActive(n){ SIDS.forEach((s,i)=>{ const el=document.getElementById(s); if(i+1<n)el.className='step done'; else if(i+1===n)el.className='step active'; else el.className='step'; }); }
function allDone(){ SIDS.forEach(id=>{ const el=document.getElementById(id); el.className='step done'; el.querySelector('.sc').textContent='✓'; }); }

function norm(raw){ raw=(raw||'').trim(); if(!raw)return null; if(!/^https?:\\/\\//i.test(raw))raw='https://'+raw; try{new URL(raw);return raw;}catch{return null;} }

async function submitForm(){
  const name     = document.getElementById('f-name').value.trim();
  const biz      = document.getElementById('f-biz').value.trim();
  const email    = document.getElementById('f-email').value.trim();
  const phone    = document.getElementById('f-phone').value.trim();
  const rawUrl   = document.getElementById('f-url').value.trim();
  const challenge= document.getElementById('f-challenge').value;

  if(!name||!email||!rawUrl){ alert('Please fill in your name, email, and website URL.'); return; }
  const url = norm(rawUrl);
  if(!url){ alert('Please enter a valid website URL.'); return; }

  userData = { firstName:name, businessName:biz, email, phone, websiteUrl:url, challenge };
  document.getElementById('load-name').textContent = url.replace(/^https?:\\/\\//,'').replace(/\\/$/,'');
  stepReset();
  show('loading');

  // Submit form data to server (syncs to TekMatix)
  fetch('/submit', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(userData) }).catch(()=>{});

  try {
    // Step 1: Fetch website
    stepActive(1);
    const siteRes = await fetch('/fetch-site?url='+encodeURIComponent(url));
    const siteData = await siteRes.json();
    if(siteData.error) return showErr("Couldn't read that website", "The website may block automated access or require a login. Please check the URL and try again.");
    const html = siteData.html || '';
    if(html.length < 100) return showErr("Couldn't read that website", "We fetched the page but couldn't find enough content. Please make sure the URL goes to your homepage.");
    stepActive(2);

    // Strip HTML to text
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    tmp.querySelectorAll('script,style,noscript,svg,nav,footer,iframe,video,img').forEach(e=>e.remove());
    const txt = (tmp.innerText||tmp.textContent||'').replace(/[ \\t]{2,}/g,' ').replace(/\\n{3,}/g,'\\n\\n').trim().slice(0,7000);
    if(txt.length < 80) return showErr("Couldn't extract content", "We fetched the page but couldn't extract readable text. This sometimes happens with heavily animated websites.");

    // Steps 2-5 animate while Claude thinks
    let step=2;
    const tick = setInterval(()=>{ if(step<5){step++;stepActive(step);}else clearInterval(tick); },3500);

    // Step 2-5: Claude analysis
    const prompt = buildPrompt(url, txt, name, biz);
    const apiRes = await fetch('/analyse', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({prompt}) });
    clearInterval(tick);

    if(!apiRes.ok){ const e=await apiRes.json().catch(()=>({})); return showErr('Analysis failed', e.error||'Please try again in a moment.'); }

    const apiData = await apiRes.json();
    const rawText = (apiData.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');
    const js=rawText.indexOf('{'), je=rawText.lastIndexOf('}');
    if(js===-1||je===-1) return showErr('Unexpected response','The analysis returned an unexpected format. Please try again.');

    let report;
    try{ report=JSON.parse(rawText.slice(js,je+1)); }
    catch(e){ return showErr('Could not read the report','Please try again.'); }

    stepActive(6);
    allDone();
    setTimeout(()=>render(report,name,url),600);

  } catch(err){
    showErr('Something went wrong', err.name==='AbortError'?'The request timed out. Please try again.':'An unexpected error occurred. Please check your internet connection and try again.');
  }
}

function buildPrompt(url, txt, name, biz){
  return \`You are performing a website brand audit for Ellie Clare, a Personal Branding Specialist working with service-based business owners in Australia.

The person requesting this audit is \${name}\${biz?' from '+biz:''}.
Website being audited: \${url}

Homepage text content:
---
\${txt}
---

Analyse this across four areas and return ONLY a valid JSON object (start with { end with }, no markdown).

{
  "overall_score": <0-100>,
  "overall_label": "<Needs Work | Developing | On Track | Strong>",
  "overall_summary": "<2-3 honest plain-English sentences. What type of business is this? What does it do well and where does it fall short? Be a trusted advisor — specific, honest, kind.>",
  "pillars": {
    "message_clarity": {
      "score": <0-100>,
      "verdict": "<One sentence: the single most important observation about message clarity.>",
      "feedback": "<2-3 specific sentences. What does the homepage say? Who does it say it helps? Is that clear within 5 seconds?>",
      "what_good_looks_like": "<1-2 sentences: a concrete example for this type of business.>"
    },
    "trust_signals": {
      "score": <0-100>,
      "verdict": "<One sentence.>",
      "feedback": "<2-3 specific sentences. What trust signals exist? What is missing?>",
      "what_good_looks_like": "<1-2 concrete sentences.>"
    },
    "call_to_action": {
      "score": <0-100>,
      "verdict": "<One sentence.>",
      "feedback": "<2-3 specific sentences. Are there clear CTAs? Are they compelling or generic?>",
      "what_good_looks_like": "<1-2 concrete sentences.>"
    },
    "personal_brand": {
      "score": <0-100>,
      "verdict": "<One sentence.>",
      "feedback": "<2-3 specific sentences. Is a real person visible — name, story, voice, face? Be specific.>",
      "what_good_looks_like": "<1-2 concrete sentences.>"
    }
  },
  "priority_actions": [
    {"title":"<specific action>","description":"<2 plain-English sentences — what to do and why. No jargon. Specific to this site.>","impact":"<Highest Impact | Trust Builder | Quick Win | Long-term Growth>"},
    {"title":"<action>","description":"<2 sentences>","impact":"<label>"},
    {"title":"<action>","description":"<2 sentences>","impact":"<label>"}
  ]
}

Scoring: 0-39=Needs Work, 40-59=Developing, 60-79=On Track, 80-100=Strong. Order priority_actions by impact.\`;
}

function render(r, name, url){
  const score = typeof r.overall_score==='number'?r.overall_score:50;
  document.getElementById('r-name').textContent = name + ' · ' + url.replace(/^https?:\\/\\//,'').replace(/\\/$/,'');
  document.getElementById('r-hl').textContent = score<40?'significant gaps to address':score<60?'a foundation — but it\'s holding you back':score<75?'solid foundations — here\'s what to sharpen':'strong brand foundations';
  document.getElementById('r-sum').textContent = r.overall_summary||'';
  document.getElementById('r-score').textContent = score;
  document.getElementById('r-lbl').textContent = 'Overall Brand Score: '+(r.overall_label||'');
  document.getElementById('r-desc').textContent = 'This reflects how clearly your website communicates your brand, builds trust, and guides visitors toward reaching out.';
  setTimeout(()=>{ document.getElementById('rfill').style.strokeDashoffset=283-(score/100)*283; },400);

  const defs=[{key:'message_clarity',label:'Brand Message Clarity'},{key:'trust_signals',label:'Trust Signals'},{key:'call_to_action',label:'Call to Action'},{key:'personal_brand',label:'Personal Brand Visibility'}];
  const grid=document.getElementById('pg'); grid.innerHTML='';
  defs.forEach((d,i)=>{
    const p=(r.pillars||{})[d.key]||{}, s=typeof p.score==='number'?p.score:50;
    const cls=s>=70?'sh':s>=45?'sm':'sl';
    const c=document.createElement('div'); c.className='pc '+cls; c.style.animation='fadeUp .6s ease '+(0.1+i*.08)+'s both';
    c.innerHTML='<div class="pt"><div class="pn">'+d.label+'</div><div class="psb">'+s+'/100</div></div><div class="pbt"><div class="pbf" data-w="'+s+'"></div></div><div class="pv">'+( p.verdict||'')+'</div><div class="pf">'+(p.feedback||'')+'</div>'+(p.what_good_looks_like?'<div class="gb"><div class="gl">What good looks like</div><div class="gt">'+p.what_good_looks_like+'</div></div>':'');
    grid.appendChild(c);
  });
  setTimeout(()=>{ document.querySelectorAll('.pbf').forEach(b=>b.style.width=b.dataset.w+'%'); },500);

  const al=document.getElementById('alist'); al.innerHTML='';
  (r.priority_actions||[]).slice(0,3).forEach((a,i)=>{
    const el=document.createElement('div'); el.className='ai'; el.style.cssText='opacity:0;animation:fadeUp .5s ease '+(0.1+i*.12)+'s forwards';
    el.innerHTML='<div class="an a'+(i+1)+'">'+(i+1)+'</div><div><div class="ati">'+(a.title||'')+'</div><div class="ade">'+(a.description||'')+'</div><span class="atg">'+(a.impact||'')+'</span></div>';
    al.appendChild(el);
  });

  show('results');
}
</script>
</body>
</html>`;
}
