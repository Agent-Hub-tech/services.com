(() => {
  'use strict';

  // Mobile nav toggle
  const navToggle = document.getElementById('navToggle');
  const primaryNav = document.getElementById('primaryNav');
  if (navToggle && primaryNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = primaryNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  // Dropdown: click-to-open for touch devices; desktop uses CSS hover
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  if (isTouch) {
    document.querySelectorAll('.dropdown').forEach(dd => {
      const btn = dd.querySelector('.dropdown-toggle');
      const menu = dd.querySelector('.dropdown-menu');
      if (!btn || !menu) return;

      function open() { dd.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
      function close(){ dd.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        dd.classList.contains('open') ? close() : open();
      });
      document.addEventListener('click', (e) => { if (!dd.contains(e.target)) close(); });
      dd.addEventListener('keydown', (e) => { if (e.key === 'Escape') { close(); btn.focus(); } });
    });
  }

  // Active nav link
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('[data-nav]').forEach(a => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    if ((path === '' && href.includes('index.html')) || href.includes(path)) {
      a.classList.add('current');
    }
  });

  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Contact form (if present)
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const note = document.getElementById('formNote');
      if (note) note.textContent = 'Thanks! We received your message and will get back within 1–2 business days.';
      contactForm.reset();
    });
  }

  // Accordion: one open at a time
  document.querySelectorAll('[data-accordion], [data-accordion-animated]').forEach(group => {
    const items = group.querySelectorAll('details');
    items.forEach(d => {
      d.addEventListener('toggle', () => {
        if (d.open) items.forEach(other => { if (other !== d) other.removeAttribute('open'); });
      });
    });
  });

  // Animate details open/close height (smooth dropdown)
  (() => {
    const groups = document.querySelectorAll('[data-accordion-animated]');
    if (!groups.length) return;

    groups.forEach(group => {
      group.querySelectorAll('details').forEach(det => {
        const panel = det.querySelector('.accordion-panel');
        if (!panel) return;

        det.addEventListener('toggle', () => {
          if (det.open) {
            panel.style.overflow = 'hidden';
            panel.style.height = '0px';
            requestAnimationFrame(() => {
              panel.style.transition = 'height .28s ease';
              panel.style.height = panel.scrollHeight + 'px';
            });
            panel.addEventListener('transitionend', function onEnd() {
              panel.style.height = '';
              panel.style.overflow = '';
              panel.style.transition = '';
              panel.removeEventListener('transitionend', onEnd);
            });
          } else {
            const current = panel.scrollHeight;
            panel.style.overflow = 'hidden';
            panel.style.height = current + 'px';
            panel.getBoundingClientRect(); // force reflow
            panel.style.transition = 'height .28s ease';
            panel.style.height = '0px';
            panel.addEventListener('transitionend', function onEnd() {
              panel.style.height = '';
              panel.style.overflow = '';
              panel.style.transition = '';
              panel.removeEventListener('transitionend', onEnd);
            });
          }
        });
      });
    });
  })();

  // Tabs (generic)
  document.querySelectorAll('[data-tabs]').forEach(container => {
    const tabs = container.querySelectorAll('.tab');
    const panels = container.querySelectorAll('.tab-panel');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetSel = tab.getAttribute('data-tab-target');
        if (!targetSel) return;
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const panel = container.querySelector(targetSel);
        if (panel) panel.classList.add('active');
      });
    });
  });

  // Services Selection mini-cart (global)
  (() => {
    const selected = new Set();
    const bar = document.getElementById('requestBar');
    const countEl = document.getElementById('selectedCount');
    const clearBtn = document.getElementById('clearSelection');
    const requestBtn = document.getElementById('requestQuote');

    function updateBar() {
      if (!bar || !countEl) return;
      const n = selected.size;
      countEl.textContent = n;
      bar.hidden = n === 0;
    }

    function toggle(card, name, btn) {
      if (selected.has(name)) {
        selected.delete(name);
        card.classList.remove('selected');
        if (btn) btn.textContent = 'Add';
      } else {
        selected.add(name);
        card.classList.add('selected');
        if (btn) btn.textContent = 'Added';
      }
      updateBar();
    }

    // Bind to selectable cards
    document.querySelectorAll('.selectable').forEach(card => {
      const name = card.getAttribute('data-service');
      const btn = card.querySelector('[data-select]');
      if (!name) return;

      card.addEventListener('click', (e) => {
        if (e.target.closest('a, [data-select], [data-quick]')) return;
        toggle(card, name, btn);
      });
      btn?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggle(card, name, btn);
      });
    });

    clearBtn?.addEventListener('click', () => {
      selected.clear();
      document.querySelectorAll('.selectable.selected').forEach(c => {
        c.classList.remove('selected');
        const b = c.querySelector('[data-select]');
        if (b) b.textContent = 'Add';
      });
      updateBar();
    });

    requestBtn?.addEventListener('click', () => {
      const services = Array.from(selected).join(', ');
      const url = new URL('contact.html', location.href);
      if (services) url.searchParams.set('services', services);
      location.href = url.toString();
    });

    updateBar();

    // Expose to Quick View "Add" button
    window.__addToQuote = (name) => {
      const card = Array.from(document.querySelectorAll('.selectable'))
        .find(c => c.getAttribute('data-service') === name);
      const btn = card?.querySelector('[data-select]');
      if (card) toggle(card, name, btn || null);
    };
  })();

  // Services filtering, search, sort, quick view (works on any page with #servicesGrid)
  (() => {
    const grid = document.getElementById('servicesGrid');
    if (!grid) return;

    const chips = Array.from(document.querySelectorAll('.chip-group .chip'));
    const search = document.getElementById('svcSearch');
    const sortSel = document.getElementById('svcSort');
    const clearBtn = document.getElementById('svcClear');
    const cards = Array.from(grid.querySelectorAll('[data-cat]'));

    const state = { cat: 'Video', q: '', sort: 'popular' };

    // Read URL params
    (() => {
      const p = new URLSearchParams(location.search);
      state.cat = p.get('cat') || state.cat;
      state.q = p.get('q') || state.q;
      state.sort = p.get('sort') || state.sort;
      // Apply UI defaults
      chips.forEach(c => {
        const m = c.getAttribute('data-filter') === state.cat;
        c.classList.toggle('active', m);
        c.setAttribute('aria-selected', m ? 'true' : 'false');
      });
      if (search && state.q) search.value = state.q;
      if (sortSel) sortSel.value = state.sort;
    })();

    function normalize(s) { return (s || '').toLowerCase().trim(); }

    function apply() {
      const q = normalize(state.q);
      const cat = state.cat;
      const sort = state.sort;

      // Filter
      cards.forEach(card => {
        const inCat = card.getAttribute('data-cat') === cat;
        const hay = [
          card.getAttribute('data-name'),
          card.getAttribute('data-tags'),
          card.getAttribute('data-service')
        ].join(' ').toLowerCase();
        const inSearch = !q || hay.includes(q);
        card.hidden = !(inCat && inSearch);
      });

      // Sort visible
      const vis = cards.filter(c => !c.hidden);
      const getNum = (el, key, def=9999) => parseInt(el.getAttribute(key) || def, 10);
      const getStr = (el, key) => (el.getAttribute(key) || '').toLowerCase();

      let cmp = (a,b) => getNum(b,'data-pop',0) - getNum(a,'data-pop',0); // popular
      if (sort === 'fast') cmp = (a,b) => getNum(a,'data-time',9999) - getNum(b,'data-time',9999);
      if (sort === 'alpha') cmp = (a,b) => getStr(a,'data-name').localeCompare(getStr(b,'data-name'));

      vis.sort(cmp).forEach(el => grid.appendChild(el));

      // Re-stagger animation
      vis.forEach((el, i) => {
        el.classList.remove('in');
        setTimeout(() => el.classList.add('in'), i * 90);
      });

      // Update URL (no reload)
      const url = new URL(location.href);
      url.searchParams.set('cat', state.cat);
      if (state.q) url.searchParams.set('q', state.q); else url.searchParams.delete('q');
      url.searchParams.set('sort', state.sort);
      history.replaceState(null, '', url);
    }

    // Chip clicks
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => { c.classList.remove('active'); c.setAttribute('aria-selected','false'); });
        chip.classList.add('active'); chip.setAttribute('aria-selected','true');
        state.cat = chip.getAttribute('data-filter') || 'Video';
        apply();
      });
    });

    // Jump links (menu/footer)
    document.querySelectorAll('[data-jump]').forEach(link => {
      link.addEventListener('click', (e) => {
        const cat = link.getAttribute('data-jump');
        const chip = chips.find(c => c.getAttribute('data-filter') === cat);
        if (chip) {
          e.preventDefault();
          chip.click();
          document.getElementById('services')?.scrollIntoView({ behavior:'smooth', block:'start' });
        }
      });
    });

    // Search + sort + clear
    search?.addEventListener('input', () => { state.q = search.value; apply(); });
    sortSel?.addEventListener('change', () => { state.sort = sortSel.value; apply(); });
    clearBtn?.addEventListener('click', () => {
      state.q = '';
      if (search) search.value = '';
      chips[0]?.click(); // back to first
      state.sort = 'popular';
      if (sortSel) sortSel.value = 'popular';
      apply();
    });

    // Quick View modal
    const modal = document.getElementById('quickView');
    const qvTitle = document.getElementById('qvTitle');
    const qvDesc = document.getElementById('qvDesc');
    const qvCat  = document.getElementById('qvCat');
    const qvTime = document.getElementById('qvTime');
    const qvMedia = document.getElementById('qvMedia');
    const qvLearn = document.getElementById('qvLearn');
    const qvAdd = document.getElementById('qvAdd');

    function openQv(card) {
      const name = card.getAttribute('data-name') || card.getAttribute('data-service') || '';
      const cat  = card.getAttribute('data-cat') || '';
      const time = card.getAttribute('data-time') || '';
      const img  = card.getAttribute('data-img') || '';
      const desc = card.querySelector('p')?.textContent || '';

      qvTitle.textContent = name;
      qvDesc.textContent = desc;
      qvCat.textContent = cat;
      qvTime.textContent = (time ? `${time}h typical` : '');
      qvMedia.style.backgroundImage = img ? `url('${img}')` : '';
      qvLearn.href = card.querySelector('a.link-arrow')?.getAttribute('href') || '#';
      qvAdd.onclick = () => window.__addToQuote?.(name);

      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      setTimeout(() => modal.classList.add('open'), 10);
    }
    function closeQv() {
      modal.classList.remove('open');
      modal.addEventListener('transitionend', function onEnd() {
        modal.hidden = true;
        document.body.style.overflow = '';
        modal.removeEventListener('transitionend', onEnd);
      });
    }

    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-quick]');
      if (!btn) return;
      const card = btn.closest('[data-cat]');
      if (card) openQv(card);
    });
    modal?.addEventListener('click', (e) => { if (e.target.hasAttribute('data-close')) closeQv(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeQv(); });

    // Sticky filter shadow
    (() => {
      const wrap = document.getElementById('filterWrap');
      if (!wrap) return;
      const sentinel = document.createElement('div');
      sentinel.style.position = 'absolute';
      sentinel.style.top = '-1px';
      sentinel.style.height = '1px';
      wrap.parentElement?.insertBefore(sentinel, wrap);
      const io = new IntersectionObserver(entries => {
        entries.forEach(en => { wrap.classList.toggle('stuck', !en.isIntersecting); });
      }, { rootMargin: '-70px 0px 0px 0px', threshold: 0 });
      io.observe(sentinel);
    })();

    // Initial apply
    apply();
  })();

  // Back to top
  (() => {
    const btn = document.getElementById('backTop');
    if (!btn) return;
    window.addEventListener('scroll', () => { btn.hidden = window.scrollY < 600; });
    btn.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));
  })();

  // Contact prefill with selected services (when coming from Request quote)
  (() => {
    const params = new URLSearchParams(location.search);
    const picked = params.get('services');
    if (!picked) return;
    const msg = document.getElementById('message');
    if (msg) {
      const prefix = 'Selected services: ' + picked + '\n\n';
      msg.value = prefix + (msg.value || '');
    }
  })();

  // On-scroll sequences (staggered reveals)
  (() => {
    if (!('IntersectionObserver' in window)) return;

    // Elements that should fade in individually
    document.querySelectorAll('.hero-copy, .hero-ill, .section-title')
      .forEach(el => el.classList.add('reveal'));

    // Containers that should stagger their children
    document.querySelectorAll('.advanced-grid, .how-grid, .slides, .card-grid, .value-grid')
      .forEach(el => el.setAttribute('data-seq', ''));

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('in');

        if (el.hasAttribute('data-seq')) {
          const kids = Array.from(el.children).filter(k => !k.hidden);
          kids.forEach((kid, i) => {
            setTimeout(() => kid.classList.add('in'), i * 90);
          });
        }
        io.unobserve(el);
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.reveal, [data-seq]').forEach(el => io.observe(el));
  })();
})();