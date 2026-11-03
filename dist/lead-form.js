/* Same-origin submission only. Google credentials never enter this file. */
window.HoneysLeads = (() => {
  const form = document.getElementById('consult-form');
  const consent = document.getElementById('quote-consent');
  const privacy = document.getElementById('quote-privacy');
  const error = document.getElementById('quote-send-error');
  let busy = false;
  let previousPayload = '';
  let receiptId = '';
  let config;
  const configuration = fetch('/api/quotes', { headers: { Accept: 'application/json' }, cache: 'no-store' })
    .then(response => response.ok ? response.json() : null)
    .then(value => {
      config = value;
      if (!value?.enabled) return;
      privacy.hidden = false;
      consent.required = true;
      document.getElementById('quote-retention').textContent = value.retention;
      document.getElementById('quote-operator').textContent = value.businessName;
      form.querySelector('.preview-note').textContent = '신청하신 내용으로 견적 상담을 안내해 드립니다.';
      document.querySelector('.footer-bottom > p').textContent = value.businessName + '의 견적 상담 신청 페이지입니다.';
    }).catch(() => { config = null; });

  function showError(message) {
    error.textContent = message;
    error.hidden = false;
    error.focus({ preventScroll: true });
    error.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  async function submit(payload) {
    if (busy) return 'busy';
    busy = true;
    error.hidden = true;
    let disabled = [];
    try {
      await configuration;
      if (!config?.enabled) return 'preview';
      if (!consent.checked) {
        consent.reportValidity();
        showError('상담을 위한 개인정보 수집·이용에 동의해 주세요.');
        consent.focus();
        return 'invalid';
      }
      payload.consent = true;
      payload.policyVersion = config.policyVersion;
      payload.website = document.getElementById('quote-website').value;
      const fingerprint = JSON.stringify(payload);
      if (fingerprint !== previousPayload) {
        previousPayload = fingerprint;
        receiptId = crypto.randomUUID();
      }
      disabled = [...document.querySelectorAll('#calculator input, #calculator select, #calculator button, #comparison button, #comparison input, #consult-form input, #consult-form select, #consult-form textarea, #consult-form button, #dock-action, .hero-destination')]
        .map(element => [element, element.disabled]);
      disabled.forEach(([element]) => { element.disabled = true; });
      form.setAttribute('aria-busy', 'true');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 26000);
      let response;
      try {
        response = await fetch('/api/quotes', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: receiptId }), signal: controller.signal
        });
      } finally { clearTimeout(timer); }
      const result = await response.json();
      if (!response.ok || result.ok !== true || result.id !== receiptId) {
        throw new Error(result.message || '접수를 완료하지 못했습니다. 다시 시도해 주세요.');
      }
      const box = document.getElementById('form-result');
      box.querySelector('strong').textContent = '견적 상담 신청이 접수됐어요.';
      box.querySelector('p').textContent = '선택한 안내 방식으로 연락드리겠습니다. 접수번호 ' + result.id;
      box.hidden = false;
      box.focus();
      return 'saved';
    } catch (cause) {
      showError(cause.name === 'AbortError' || cause instanceof TypeError
        ? '접수 결과를 확인하지 못했습니다. 입력 내용은 유지되니 다시 눌러 주세요.' : cause.message);
      return 'error';
    } finally {
      disabled.forEach(([element, wasDisabled]) => { element.disabled = wasDisabled; });
      form.removeAttribute('aria-busy');
      busy = false;
    }
  }

  return { submit, clear() { previousPayload = ''; receiptId = ''; error.hidden = true; } };
})();
