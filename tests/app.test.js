const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

class Element {
  constructor() {
    this.value = '';
    this.innerHTML = '';
    this.textContent = '';
    this.href = '';
    this.dataset = {};
    this.children = [];
    this.attributes = {};
    this.onclick = null;
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  appendChild(child) {
    this.children.push(child);
  }
}

function decodeHtml(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");
}

function createBrowser(seed = {}, search = '') {
  const elements = new Map();
  const data = new Map(Object.entries(seed).map(([key, value]) => [key, JSON.stringify(value)]));
  let lastLinks = [];
  const document = {
    body: new Element(),
    addEventListener() {},
    createElement() {
      const element = new Element();
      Object.defineProperty(element, 'innerHTML', {
        get() {
          return element.html;
        },
        set(value) {
          element.html = value;
        }
      });
      Object.defineProperty(element, 'textContent', {
        get() {
          return element.text;
        },
        set(value) {
          element.text = value;
          element.html = String(value).replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
          })[char]);
        }
      });
      return element;
    },
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new Element());
      return elements.get(id);
    },
    querySelectorAll(selector) {
      if (selector !== '[data-p]') return [];
      lastLinks = [...elements.get('patients').innerHTML.matchAll(/data-p="([^"]*)"/g)].map((match) => {
        const anchor = new Element();
        anchor.dataset.p = decodeHtml(match[1]);
        return anchor;
      });
      return lastLinks;
    }
  };
  let randomByte = 0;
  const context = vm.createContext({
    document,
    localStorage: {
      getItem(key) { return data.has(key) ? data.get(key) : null; },
      setItem(key, value) { data.set(key, String(value)); },
      removeItem(key) { data.delete(key); }
    },
    location: { href: '', search },
    navigator: { clipboard: { writeText: () => Promise.resolve() } },
    URLSearchParams,
    Uint8Array,
    crypto: {
      getRandomValues(bytes) {
        for (let index = 0; index < bytes.length; index += 1) bytes[index] = randomByte++;
        return bytes;
      }
    },
    window: {},
    setTimeout() {},
    console
  });

  return {
    context,
    document,
    data,
    element: id => document.getElementById(id),
    lastLinks: () => lastLinks,
    evaluate(expression) {
      return vm.runInContext(expression, context);
    },
    run(file) {
      vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
    },
    value(key) {
      const stored = data.get(key);
      return stored === undefined ? undefined : JSON.parse(stored);
    }
  };
}

function loadApp(browser) {
  browser.run('app.js');
}

function toastMessages(browser) {
  return browser.element('toasts').children.map(child => child.textContent).join('\n');
}

test('storage reads defaults, survives malformed data, and writes JSON', () => {
  const browser = createBrowser();
  loadApp(browser);

  assert.deepEqual(JSON.parse(JSON.stringify(browser.evaluate("DB.get('missing')"))), []);
  browser.data.set('broken', '{');
  assert.equal(browser.evaluate("DB.get('broken', null)"), null);
  browser.evaluate("DB.set('saved', { count: 2 })");
  assert.deepEqual(browser.value('saved'), { count: 2 });
});

test('login trims the display name and logout clears the user', () => {
  const browser = createBrowser();
  loadApp(browser);
  browser.evaluate("Auth.login('  Casey  ', 'consumer')");

  assert.deepEqual(browser.value('tn_user'), { name: 'Casey', role: 'consumer' });
  browser.evaluate('Auth.logout()');
  assert.equal(browser.value('tn_user'), undefined);
  assert.equal(browser.context.location.href, 'index.html');
});

test('role guard redirects anonymous and wrong-role users', () => {
  const browser = createBrowser({ tn_user: { name: 'Casey', role: 'consumer' } });
  loadApp(browser);

  assert.equal(browser.evaluate("Auth.require('provider')"), null);
  assert.equal(browser.context.location.href, 'index.html');
  browser.context.location.href = '';
  browser.evaluate("Auth.login('Casey', 'provider')");
  assert.equal(browser.evaluate("Auth.require('provider').role"), 'provider');
});

test('HTML escaping and room generation are safe and unique', () => {
  const browser = createBrowser();
  loadApp(browser);

  assert.equal(browser.evaluate("esc('<script>alert(1)</script>')"), '&lt;script&gt;alert(1)&lt;/script&gt;');
  const roomA = browser.evaluate('roomName()');
  const roomB = browser.evaluate('roomName()');
  assert.match(roomA, /^AegisTelenutri-[0-9a-f]{16}$/);
  assert.notEqual(roomA, roomB);
});

test('login rejects a blank name and routes each role to the correct page', () => {
  const browser = createBrowser();
  loadApp(browser);
  const scriptTags = [...fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)];
  vm.runInContext(scriptTags.at(-1)[1], browser.context);

  browser.element('go').onclick();
  assert.equal(browser.evaluate('Auth.user()'), null);
  assert.match(toastMessages(browser), /Please enter your name/);

  browser.element('name').value = ' Taylor ';
  browser.element('role').value = 'consumer';
  browser.element('go').onclick();
  assert.equal(browser.context.location.href, 'consumer.html');
  assert.deepEqual(browser.value('tn_user'), { name: 'Taylor', role: 'consumer' });

  browser.element('role').value = 'provider';
  browser.element('go').onclick();
  assert.equal(browser.context.location.href, 'provider.html');
});

test('consumer meal logging validates input, persists, renders, and escapes food', () => {
  const browser = createBrowser({ tn_user: { name: 'Avery', role: 'consumer' } });
  loadApp(browser);
  browser.run('consumer.js');

  assert.match(browser.element('meals').innerHTML, /No meals yet/);
  browser.element('food').value = '   ';
  browser.element('cal').value = '400';
  browser.element('addMeal').onclick();
  assert.equal(browser.value('tn_meals'), undefined);
  assert.match(toastMessages(browser), /Enter food and calories/);

  browser.element('food').value = '<b>Oats</b>';
  browser.element('cal').value = '250';
  browser.element('type').value = 'Breakfast';
  browser.element('addMeal').onclick();
  const [meal] = browser.value('tn_meals');
  assert.equal(meal.patient, 'Avery');
  assert.equal(meal.food, '<b>Oats</b>');
  assert.equal(meal.cal, 250);
  assert.match(browser.element('meals').innerHTML, /&lt;b&gt;Oats&lt;\/b&gt;/);
  assert.equal(browser.element('food').value, '');
  assert.equal(browser.element('cal').value, '');
});

test('consumer appointment booking prevents duplicate slots and provides a join link', () => {
  const browser = createBrowser({ tn_user: { name: 'Avery', role: 'consumer' } });
  loadApp(browser);
  browser.run('consumer.js');

  browser.element('date').value = '2026-12-01';
  browser.element('time').value = '10:00';
  browser.element('diet').value = 'Dr. Santos';
  browser.element('book').onclick();
  const [appointment] = browser.value('tn_appts');
  assert.equal(appointment.patient, 'Avery');
  assert.match(appointment.room, /^AegisTelenutri-[0-9a-f]{16}$/);
  assert.match(browser.element('appts').innerHTML, new RegExp(`session\\.html\\?room=${appointment.room}`));

  browser.element('book').onclick();
  assert.equal(browser.value('tn_appts').length, 1);
  assert.match(toastMessages(browser), /slot is already taken/i);

  browser.element('time').value = '11:00';
  browser.element('book').onclick();
  assert.equal(browser.value('tn_appts').length, 2);
});

test('consumer sees only their own appointments, meals, and provider notes', () => {
  const browser = createBrowser({
    tn_user: { name: 'Avery', role: 'consumer' },
    tn_meals: [{ patient: 'Other', type: 'Lunch', food: 'Soup', cal: 100, when: 'yesterday' }],
    tn_appts: [{ patient: 'Other', date: '2026-12-01', time: '10:00', dietitian: 'Dr. Santos', room: 'room-other' }],
    tn_notes: [
      { patient: 'Avery', text: 'Add more vegetables', when: 'today' },
      { patient: 'Other', text: 'Private note', when: 'today' }
    ]
  });
  loadApp(browser);
  browser.run('consumer.js');

  assert.match(browser.element('notes').innerHTML, /Add more vegetables/);
  assert.doesNotMatch(browser.element('notes').innerHTML, /Private note/);
  assert.match(browser.element('appts').innerHTML, /No appointments/);
  assert.match(browser.element('meals').innerHTML, /No meals yet/);
});

test('provider can select a patient, review meals, and save a note for that patient', () => {
  const browser = createBrowser({
    tn_user: { name: 'Dr. Lee', role: 'provider' },
    tn_meals: [{ patient: 'Avery', type: 'Dinner', food: 'Salad', cal: 320, when: 'today' }],
    tn_appts: [{ patient: 'Jordan', date: '2026-12-01', time: '10:00', dietitian: 'Dr. Lee', room: 'room-one' }]
  });
  loadApp(browser);
  browser.run('provider.js');

  assert.match(browser.element('patients').innerHTML, /Avery/);
  assert.match(browser.element('patients').innerHTML, /Jordan/);
  const patientLink = browser.lastLinks().find(link => link.dataset.p === 'Avery');
  patientLink.onclick({ preventDefault() {} });
  assert.equal(browser.element('ptitle').textContent, 'Chart: Avery');
  assert.match(browser.element('pmeals').innerHTML, /Salad/);

  browser.element('note').value = 'Increase water intake';
  browser.element('saveNote').onclick();
  assert.deepEqual(browser.value('tn_notes')[0].patient, 'Avery');
  assert.match(browser.element('pnotes').innerHTML, /Increase water intake/);
  assert.equal(browser.element('note').value, '');
});

test('provider requires patient selection before saving a note', () => {
  const browser = createBrowser({ tn_user: { name: 'Dr. Lee', role: 'provider' } });
  loadApp(browser);
  browser.run('provider.js');
  browser.element('note').value = 'A note';
  browser.element('saveNote').onclick();

  assert.equal(browser.value('tn_notes'), undefined);
  assert.match(toastMessages(browser), /Select a patient first/);
});

test('provider session list links to the booked room', () => {
  const browser = createBrowser({
    tn_user: { name: 'Dr. Lee', role: 'provider' },
    tn_appts: [{ patient: 'Avery', date: '2026-12-01', time: '10:00', dietitian: 'Dr. Lee', room: 'room-one' }]
  });
  loadApp(browser);
  browser.run('provider.js');

  assert.match(browser.element('appts').innerHTML, /Avery/);
  assert.match(browser.element('appts').innerHTML, /session\.html\?room=room-one/);
});

test('session page handles a missing room and a missing Jitsi API', () => {
  const noRoom = createBrowser({ tn_user: { name: 'Avery', role: 'consumer' } });
  loadApp(noRoom);
  noRoom.run('session.js');
  assert.match(noRoom.element('jitsi').innerHTML, /No session selected/);

  const noApi = createBrowser({ tn_user: { name: 'Avery', role: 'consumer' } }, '?room=room-one');
  loadApp(noApi);
  noApi.run('session.js');
  assert.match(noApi.element('jitsi').innerHTML, /Could not load Jitsi/);
  assert.equal(noApi.element('openTab').href, 'https://meet.jit.si/room-one');
});

test('session initializes Jitsi with the appointment room and user display name', async () => {
  const browser = createBrowser({ tn_user: { name: 'Avery', role: 'consumer' } }, '?room=private-room');
  loadApp(browser);
  let jitsiArgs;
  browser.context.JitsiMeetExternalAPI = function (domain, options) {
    jitsiArgs = { domain, options };
  };
  browser.context.location.href = 'https://example.test/session.html?room=private-room';
  browser.run('session.js');

  assert.equal(jitsiArgs.domain, 'meet.jit.si');
  assert.equal(jitsiArgs.options.roomName, 'private-room');
  assert.equal(jitsiArgs.options.userInfo.displayName, 'Avery');
  assert.equal(jitsiArgs.options.configOverwrite.startWithAudioMuted, true);

  await browser.element('copyLink').onclick();
  assert.match(toastMessages(browser), /Invite link copied/);
});
