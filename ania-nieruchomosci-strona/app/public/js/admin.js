// Skrypty panelu: potwierdzenia, dynamiczne wiersze, zdjęcia (kolejność, usuwanie), filtr tabeli.
(function () {
  // Potwierdzenie akcji destrukcyjnych.
  document.querySelectorAll('[data-confirm]').forEach((el) => {
    const handler = (e) => {
      if (!window.confirm(el.getAttribute('data-confirm'))) e.preventDefault();
    };
    if (el.tagName === 'FORM') el.addEventListener('submit', handler);
    else el.addEventListener('click', handler);
  });

  // Dodawanie / usuwanie wierszy (parametry, usługi, kroki, fakty).
  document.querySelectorAll('[data-add-row]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-add-row');
      const tpl = document.querySelector(`[data-row-template="${key}"]`);
      const box = document.querySelector(`[data-rows="${key}"]`);
      if (!tpl || !box) return;
      box.appendChild(tpl.content.cloneNode(true));
      box.lastElementChild.querySelector('input')?.focus();
    });
  });
  document.addEventListener('click', (e) => {
    const rm = e.target.closest('[data-remove-row]');
    if (rm) rm.closest('[data-row]')?.remove();
    const rp = e.target.closest('[data-remove-photo]');
    if (rp) rp.closest('[data-photo]')?.remove();
  });

  // Sortowanie zdjęć przeciąganiem.
  document.querySelectorAll('[data-sortable]').forEach((list) => {
    let dragged = null;
    list.addEventListener('dragstart', (e) => {
      dragged = e.target.closest('[data-photo]');
      if (dragged) dragged.classList.add('is-dragging');
    });
    list.addEventListener('dragend', () => {
      dragged?.classList.remove('is-dragging');
      dragged = null;
    });
    list.addEventListener('dragover', (e) => {
      e.preventDefault();
      const over = e.target.closest('[data-photo]');
      if (!dragged || !over || over === dragged) return;
      const rect = over.getBoundingClientRect();
      const after = e.clientX > rect.left + rect.width / 2;
      over.parentElement.insertBefore(dragged, after ? over.nextSibling : over);
    });
  });

  // Strefa upuszczania plików + licznik.
  document.querySelectorAll('[data-drop]').forEach((zone) => {
    const input = zone.querySelector('[data-file-input]');
    const count = zone.querySelector('[data-file-count]');
    const update = () => {
      const n = input.files.length;
      count.textContent = n ? `${n} ${n === 1 ? 'plik' : n < 5 ? 'pliki' : 'plików'} do wysłania` : '';
    };
    input.addEventListener('change', update);
    ['dragenter', 'dragover'].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.add('is-over'); }));
    ['dragleave', 'drop'].forEach((ev) => zone.addEventListener(ev, () => zone.classList.remove('is-over')));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer?.files?.length) {
        input.files = e.dataTransfer.files;
        update();
      }
    });
  });

  // Filtr tabeli nieruchomości.
  const table = document.querySelector('[data-filter-table]');
  if (table) {
    const q = document.querySelector('[data-filter-input]');
    const st = document.querySelector('[data-filter-status]');
    const empty = document.querySelector('[data-filter-empty]');
    const apply = () => {
      const text = (q.value || '').toLowerCase().trim();
      const status = st.value;
      let visible = 0;
      table.querySelectorAll('tbody tr').forEach((tr) => {
        const ok = (!text || tr.dataset.text.includes(text)) && (!status || tr.dataset.status === status);
        tr.hidden = !ok;
        if (ok) visible++;
      });
      empty.hidden = visible > 0;
    };
    q.addEventListener('input', apply);
    st.addEventListener('change', apply);
  }

  // Ostrzeżenie przed opuszczeniem strony z niezapisanymi zmianami.
  document.querySelectorAll('form[data-dirty]').forEach((form) => {
    let dirty = false;
    form.addEventListener('input', () => (dirty = true));
    form.addEventListener('submit', () => (dirty = false));
    window.addEventListener('beforeunload', (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  });
})();
