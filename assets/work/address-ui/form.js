'use strict';

const byId = id => document.getElementById(id);
const form = byId('form');
const fieldset = byId('fields');
const controls = form.elements;
const regions = {
  CN: ['중국 (China Mainland)', '中国', '+86', 'China'],
  TW: ['대만 (Taiwan)', '臺灣', '+886', 'Taiwan'],
  HK: ['홍콩 (Hong Kong)', '홍콩 (Hong Kong)', '+852', 'Hong Kong'],
  JP: ['일본 (Japan)', '일본 (Japan)', '+81', 'Japan'],
  KR: ['대한민국 (South Korea)', '대한민국', '+82', 'South Korea']
};
const example = {
  country: 'CN', dial: 'CN', nickname: '우리집', recipient: 'CHEN WEI TING',
  email: 'young@example.com', phone: '138 1234 5678', province: '广东省', city: '深圳市',
  district: '南山区', street: '南海大道3688号', unit: 'A座1201室', postal: '518000', remember: true
};
const readings = {
  '广东省': 'Guangdong', '深圳市': 'Shenzhen', '南山区': 'Nanshan District', '福田区': 'Futian District',
  '南海大道3688号': '3688 Nanhai Avenue', 'A座1201室': 'Room 1201, Block A',
  '臺北市': 'Taipei City', '大安區': 'Da’an District', '信義區': 'Xinyi District',
  '金山南路二段55號3樓': '3F, 55 Jinshan South Road Section 2',
  '東京都': 'Tokyo', '渋谷区': 'Shibuya', '神宮前': 'Jingumae',
  '서울특별시 중구 세종대로 110': '110 Sejong-daero, Jung-gu, Seoul', '101호': 'Unit 101'
};
let saved = null;

for (const [code, [country, dial, prefix]] of Object.entries(regions)) {
  controls.country.add(new Option(country, code));
  controls.dial.add(new Option(dial + '(' + prefix + ')', code));
}
for (const label of form.querySelectorAll('label:has([required])')) {
  const caption = document.createElement('span');
  caption.textContent = label.firstChild.textContent;
  label.firstChild.replaceWith(caption);
}

function field(name, title, hint, settings = {}) {
  const box = document.createElement('div');
  if (settings.half) box.className = 'half';
  const label = document.createElement('label');
  const caption = document.createElement('span');
  caption.textContent = title;
  const input = document.createElement(settings.options ? 'select' : 'input');
  input.name = name;
  input.required = !settings.optional && !settings.auto;
  if (settings.options) {
    input.add(new Option(hint, ''));
    for (const value of settings.options) input.add(new Option(value, value));
  } else {
    input.placeholder = hint;
    input.readOnly = Boolean(settings.auto);
    if (settings.max) input.maxLength = settings.max;
  }
  label.append(caption, input);
  box.append(label);
  fieldset.append(box);
  if (settings.reading) {
    const note = document.createElement('small');
    note.setAttribute('aria-live', 'polite');
    box.append(note);
    input.addEventListener('input', () => { note.textContent = readings[input.value.trim()] || ''; });
  }
  return input;
}

function regionFields() {
  const code = controls.country.value;
  fieldset.replaceChildren();
  controls.dial.value = code;
  document.querySelectorAll('#ezway,.tw').forEach(el => { el.hidden = code !== 'TW'; });
  controls.phone.placeholder = {CN:'예: 138 1234 5678', HK:'예: 9123 4567', TW:'예: 912 345 678', JP:'예: 090-1234-5678', KR:'예: 010-1234-5678'}[code];
  if (code === 'CN') {
    field('province','성','예: 广东省',{half:true, options:['广东省'], reading:true});
    field('city','시','예: 深圳市',{half:true, options:['深圳市'], reading:true});
    field('district','구/현','예: 南山区',{options:['南山区','福田区'], reading:true});
    field('street','상세주소 1','예: 南海大道3688号',{max:35, reading:true});
    field('unit','상세주소 2','예: 深圳清华大学研究院A座1201室',{optional:true,max:35,reading:true});
  } else if (code === 'TW') {
    field('city','시/현','예: 臺北市',{half:true,options:['臺北市']});
    const district = field('district','구/향/진','예: 大安區',{half:true,options:['大安區','信義區']});
    const postal = field('postal','우편번호(자동입력)','예: 110',{auto:true});
    district.oninput = () => { postal.value = {'大安區':'106','信義區':'110'}[district.value] || ''; };
    field('street','상세주소','예: 金山南路二段55號3樓');
  } else if (code === 'HK' || code === 'JP' || code === 'KR') {
    const choices = {
      HK: ['주소 검색','예: 도로명 또는 건물명',['150 Kennedy Road','Central Plaza']],
      JP: ['우편번호','우편번호로 주소 찾기',['150-0001']],
      KR: ['기본주소','도로명 또는 지번 검색',['서울특별시 중구 세종대로 110']]
    };
    const [title, hint, options] = choices[code];
    const search = field('lookup',title,hint);
    const list = document.createElement('datalist');
    list.id = 'search-results';
    options.forEach(value => list.append(new Option(value)));
    fieldset.append(list);
    search.setAttribute('list',list.id);
    const autoFields = code === 'HK' ? ['지역','도로명 및 번지','건물 / 단지'] : code === 'JP' ? ['도도부현','시구정촌','정(町) / 지역'] : [];
    const matches = code === 'HK' ? [['Hong Kong','150 Kennedy Road','Kennedy Heights'],['Hong Kong','18 Harbour Road','Central Plaza']] : [['東京都','渋谷区','神宮前']];
    const autofill = autoFields.map((title,i) => field('auto'+i,title+'(자동입력)',matches[0][i],{auto:true,half:code === 'JP' && i < 2}));
    search.oninput = () => {
      const index = options.indexOf(search.value);
      search.setCustomValidity(index < 0 ? '목록에서 예시 주소를 선택해 주세요.' : '');
      autofill.forEach((input,i) => { input.value = matches[index]?.[i] || ''; });
    };
    if (code === 'HK') {
      field('floor','층','예: 12F',{half:true});
      field('unit','호','예: Flat 24',{half:true});
    } else field('unit',code === 'JP' ? '번지 · 건물명 · 호실' : '상세주소',code === 'JP' ? '예: 1－2－3 〇〇マンション' : '예: 101호');
  }
  const note = document.createElement('small');
  note.textContent = (code === 'CN' ? '성·시·구/현을 순서대로 선택한 뒤 상세 주소를 입력해 주세요. ' : '') + '상세 주소에 같은 주소를 한 번 더 입력하지 않게 주의해 주세요. 잘못 입력한 주소로 인한 배송 지연, 오배송, 반송의 책임은 구매자에게 있습니다.';
  fieldset.append(note);
  if (code === 'CN') field('postal','우편번호','예: 123456');
}

function restore(data) {
  form.reset();
  controls.country.value = data?.country || 'CN';
  regionFields();
  for (const [name,value] of Object.entries(data || {})) {
    const input = controls.namedItem(name);
    if (!input) continue;
    if (input.type === 'checkbox') input.checked = value;
    else input.value = value;
    input.dispatchEvent(new Event('input'));
  }
}

function showSummary() {
  byId('editor').hidden = true;
  byId('summary').hidden = false;
  byId('summary-body').hidden = false;
  byId('toggle').setAttribute('aria-expanded','true');
  byId('edit').focus({preventScroll:true});
}

controls.country.onchange = regionFields;
controls.source.onchange = () => {
  const source = controls.source.value;
  restore(source === '예시 배송지' ? example : null);
  controls.source.value = source;
};
form.onsubmit = event => {
  event.preventDefault();
  saved = Object.fromEntries(new FormData(form));
  saved.remember = controls.remember.checked;
  const region = regions[saved.country];
  const keys = {
    CN:['province','city','district','street','unit'], TW:['city','district','street'],
    HK:['auto0','auto1','auto2','floor','unit'], JP:['auto0','auto1','auto2','unit'], KR:['lookup','unit']
  }[saved.country];
  const parts = keys.map(key => saved[key]?.trim()).filter(Boolean);
  const postal = saved.country === 'JP' ? saved.lookup : saved.postal;
  const prefix = postal ? '(' + postal + ') ' : '';
  byId('who').textContent = saved.recipient + '(' + saved.nickname + ')';
  byId('phone').textContent = regions[saved.dial][2] + ' ' + saved.phone;
  byId('local').textContent = prefix + parts.join(' ');
  byId('english').textContent = prefix + parts.reverse().map(value => readings[value] || value).concat(region[3]).join(', ');
  byId('edit').lastChild.textContent = '변경';
  showSummary();
};
function cancel() {
  if (!saved) byId('edit').lastChild.textContent = '배송지 입력';
  showSummary();
}
byId('cancel').onclick = cancel;
document.querySelector('.close').onclick = cancel;
byId('edit').onclick = () => {
  restore(saved);
  byId('editor').hidden = false;
  byId('summary').hidden = true;
  controls.source.focus({preventScroll:true});
};
byId('toggle').onclick = () => {
  byId('summary-body').hidden = !byId('summary-body').hidden;
  byId('toggle').setAttribute('aria-expanded',String(!byId('summary-body').hidden));
};
restore(null);
if (window.frameElement) {
  new ResizeObserver(() => {
    window.frameElement.style.height = (document.querySelector('main').offsetHeight + 20) + 'px';
  }).observe(document.querySelector('main'));
}
