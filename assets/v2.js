// upzen v2 — waitlist forms, shelf filters, live chart dates.
(function () {
  // ── Waitlist forms → Kit (ConvertKit). Every .waitlist form on the page posts the same way. ──
  document.querySelectorAll('form.waitlist').forEach(function (form) {
    var fields = form.querySelector('.waitlist-fields');
    var emailEl = form.querySelector('input[type="email"]');
    var msgEl = form.querySelector('.waitlist-msg');
    var btn = form.querySelector('.waitlist-btn');
    var hp = form.querySelector('.waitlist-hp');

    function showMsg(text, type) {
      msgEl.textContent = text;
      msgEl.className = 'waitlist-msg' + (type ? ' ' + type : '');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // Bot check: humans can't see the honeypot, so a filled value = bot.
      if (hp && hp.value) return;
      if (!emailEl.value || !emailEl.checkValidity()) {
        showMsg('Please enter a valid email address.', 'error');
        emailEl.focus();
        return;
      }
      btn.disabled = true;
      showMsg('', '');
      // URL-encoded (not multipart) — Kit's endpoint parses this reliably.
      var body = new URLSearchParams();
      body.append('email_address', emailEl.value.trim());
      fetch(form.action, { method: 'POST', headers: { 'Accept': 'application/json' }, body: body })
        .then(function (r) {
          return r.text().then(function (t) {
            var data = null;
            try { data = JSON.parse(t); } catch (err) {}
            return { ok: r.ok, data: data };
          });
        })
        .then(function (res) {
          btn.disabled = false;
          var errored = res.data && (res.data.error || res.data.errors);
          if (res.ok && !errored) {
            if (fields) fields.hidden = true;
            showMsg("You're on the list. Check your inbox to confirm your spot. 🎉", 'success');
          } else {
            var apiMsg = res.data && (res.data.message || res.data.error || (res.data.errors && res.data.errors[0]));
            showMsg(apiMsg || 'Hmm, that didn’t go through. Please try again.', 'error');
          }
        })
        .catch(function () {
          btn.disabled = false;
          showMsg('Network error — please check your connection and try again.', 'error');
        });
    });
  });

  // ── Shelf filters: show one area or all. ──
  var chips = document.querySelectorAll('.chip[data-area]');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var area = chip.getAttribute('data-area');
      chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
      document.querySelectorAll('.area[data-area]').forEach(function (el) {
        el.hidden = !(area === 'all' || el.getAttribute('data-area') === area);
      });
    });
  });

  // ── Hero graph axis: the last tick is today, earlier ticks step back a week each. ──
  var dates = document.querySelector('[data-live-dates]');
  if (dates) {
    var fmt = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' });
    dates.innerHTML = '';
    [4, 3, 2, 1, 0].forEach(function (w) {
      var d = new Date();
      d.setDate(d.getDate() - w * 7);
      var s = document.createElement('span');
      s.textContent = fmt.format(d);
      dates.appendChild(s);
    });
  }
})();
