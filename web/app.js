const icons = {
  pulse: '<path d="M2 12h5l3-7 4 14 3-7h5"/>',
  edit: '<path d="M12 20h8M5 16l1-4L16 2l5 5L11 17l-5 1zM14 4l5 5"/>',
  book: '<path d="M12 5v16M4 4h4a4 4 0 0 1 4 4 4 4 0 0 1 4-4h4v15h-4a4 4 0 0 0-4 2 4 4 0 0 0-4-2H4z"/>',
  shield: '<path d="M12 22s7-3 7-11V5l-7-3-7 3v6c0 8 7 11 7 11zM9 12l2 2 4-4"/>',
  text: '<path d="M4 5h16M4 10h16M4 15h12M4 20h8"/>',
  mic: '<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3"/>',
  upload: '<path d="M12 16V3m-5 5 5-5 5 5M4 15v5h16v-5"/>',
  spark: '<path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z"/>',
  note: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8m-8 4h8"/>',
};

document.querySelectorAll('[data-icon]').forEach(element => {
  element.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[element.dataset.icon]}</svg>`;
});

const byId = id => document.getElementById(id);
const transcript = byId('transcript');
const audio = byId('audio');
const feedback = byId('feedback');
const number = new Intl.NumberFormat('en-US');
const sections = [
  ['chief_complaint', 'Chief complaint'],
  ['subjective', 'Subjective (S)'],
  ['objective', 'Objective (O)'],
  ['assessment', 'Assessment (A)'],
  ['plan', 'Plan (P)'],
];
let mode = 'text';
let current = null;
let busy = false;

function navigate() {
  const guide = location.hash === '#guide';
  byId('guide').hidden = !guide;
  byId('workspace').hidden = guide;
  byId('crumb').textContent = guide ? 'SOAP guide' : 'Visit documentation';
  document.querySelectorAll('[data-page]').forEach(link => {
    if (link.dataset.page === (guide ? 'guide' : 'workspace')) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}
window.addEventListener('hashchange', navigate);
navigate();

async function request(path, options) {
  const response = await fetch(path, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'The request failed.');
  return data;
}

request('/api/status').then(({configured}) => {
  byId('connection').textContent = configured ? 'Service key configured' : 'Sample mode';
  byId('connection').parentElement.dataset.live = configured;
}).catch(() => { byId('connection').textContent = 'Service unavailable'; });

document.querySelectorAll('[data-mode]').forEach(button => {
  button.addEventListener('click', () => {
    mode = button.dataset.mode;
    for (const item of document.querySelectorAll('[data-mode]')) {
      item.classList.toggle('active', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    }
    byId('text-input').hidden = mode !== 'text';
    byId('audio-input').hidden = mode !== 'audio';
    showFeedback('');
  });
});

function showFeedback(message) {
  feedback.textContent = message;
  feedback.hidden = !message;
}

function updateCount() {
  byId('count').textContent = `${number.format(transcript.value.length)} characters`;
}
transcript.addEventListener('input', updateCount);

function render(result) {
  current = result;
  const fields = byId('fields');
  fields.replaceChildren();
  for (const [key, label] of sections) {
    const section = document.createElement('section');
    section.className = 'field';
    const title = document.createElement('h3');
    title.textContent = label;
    const content = document.createElement('p');
    content.dir = 'auto';
    content.textContent = result.note[key];
    section.append(title, content);
    fields.append(section);
  }

  byId('source').textContent = result.transcript;
  byId('result-label').textContent = result.demo ? 'Sample draft' : 'Ready for review';
  byId('copy').textContent = 'Copy note';
  const flags = byId('flags');
  flags.replaceChildren();
  const status = document.createElement('strong');
  status.textContent = result.demo ? 'Sample SOAP note'
    : result.flags.length ? 'Claims to review' : 'No unsupported claims were flagged.';
  flags.append(status);
  if (result.flags.length) {
    const list = document.createElement('ul');
    for (const flag of result.flags) {
      const entry = document.createElement('li');
      entry.dir = 'auto';
      entry.textContent = `${flag.claim} — support score ${number.format(Math.round(flag.probability * 100))}%`;
      list.append(entry);
    }
    flags.append(list);
  }
  byId('empty').hidden = true;
  byId('result').hidden = false;
}

async function run(action) {
  if (busy) return;
  busy = true;
  showFeedback('');
  byId('submit').disabled = true;
  byId('sample').disabled = true;
  byId('submit-label').textContent = 'Processing…';
  try {
    await action();
  } catch (error) {
    showFeedback(error instanceof TypeError ? 'Could not connect to the server.' : error.message);
  } finally {
    busy = false;
    byId('submit').disabled = false;
    byId('sample').disabled = false;
    byId('submit-label').textContent = 'Generate SOAP note';
  }
}

byId('sample').addEventListener('click', () => run(async () => {
  const example = await request('/api/sample');
  transcript.value = example.transcript;
  updateCount();
  render(example);
}));

byId('scribe').addEventListener('submit', event => {
  event.preventDefault();
  run(async () => {
    if (mode === 'text') {
      if (!transcript.value.trim()) throw new Error('Enter a transcript first.');
      render(await request('/api/note', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({transcript: transcript.value.trim()}),
      }));
      return;
    }
    const file = audio.files[0];
    if (!file) throw new Error('Choose an audio file first.');
    if (file.size > 20 * 1024 * 1024) throw new Error('The audio file must be 20 MB or smaller.');
    render(await request('/api/audio', {
      method: 'POST',
      headers: {'Content-Type': 'application/octet-stream', 'X-Audio-Extension': file.name.split('.').pop()},
      body: file,
    }));
  });
});

byId('copy').addEventListener('click', async event => {
  const button = event.currentTarget;
  if (!current) return;
  try {
    await navigator.clipboard.writeText(sections.map(([key, label]) => `${label}\n${current.note[key]}`).join('\n\n'));
    button.textContent = 'Copied';
  } catch {
    button.textContent = 'Could not copy';
  }
});
