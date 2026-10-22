// upzen v2 — waitlist forms, live chart dates, nav + scroll motion.
(function () {
  // One Kit form per page, so Kit's per-form subscriber counts show which page converts.
  // Forms name their page with data-kit-form; set each page's Kit form ID here (the markup action is the no-JS fallback).
  var KIT_FORMS = { home: '9920214', charts: '10081023' };

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
      // Kit stores the referrer on the subscriber, which also tells hero signups from end-of-page ones.
      body.append('referrer', location.href.split('#')[0] + '#' + (form.id || emailEl.id));
      var kitId = KIT_FORMS[form.getAttribute('data-kit-form')];
      var url = kitId ? 'https://app.kit.com/forms/' + kitId + '/subscriptions' : form.action;
      fetch(url, { method: 'POST', headers: { 'Accept': 'application/json' }, body: body })
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
            var note = form.querySelector('.waitlist-note');
            if (note) note.hidden = true;
            // Single opt-in: no confirmation email to wait for, so the form says so in its own words (data-success).
            showMsg(form.getAttribute('data-success') || "You're on the list. 🎉", 'success');
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

  // ── Nav frosts once the page scrolls under it. ──
  var nav = document.querySelector('.nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('stuck', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ── Scroll reveals: blocks rise in once as they enter view. Skipped entirely for reduced motion. ──
  var reveals = document.querySelectorAll('[data-reveal]');
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reveals.length && !calm && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('anim');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  }
})();
