(function () {
  const STATUS = {
    pending: { label: '未开始', key: 'pending' },
    in_progress: { label: '进行中', key: 'in_progress' },
    done: { label: '已完成', key: 'done' }
  };

  const STORAGE_COMPACT = 'dailyTasksCompact';

  let tasks = [];
  let selectedDate = toYMD(new Date());
  let editingId = null;
  /** @type {string | null} */
  let contextTaskId = null;
  let compactMode = false;

  const el = {
    calTitle: document.getElementById('calTitle'),
    calGrid: document.getElementById('calGrid'),
    calPrev: document.getElementById('calPrev'),
    calNext: document.getElementById('calNext'),
    btnToday: document.getElementById('btnToday'),
    selectedDateLabel: document.getElementById('selectedDateLabel'),
    dayStats: document.getElementById('dayStats'),
    addForm: document.getElementById('addForm'),
    newTitle: document.getElementById('newTitle'),
    taskList: document.getElementById('taskList'),
    btnMinimize: document.getElementById('btnMinimize'),
    btnClose: document.getElementById('btnClose'),
    btnCompact: document.getElementById('btnCompact'),
    compactBanner: document.getElementById('compactBanner'),
    compactSub: document.getElementById('compactSub'),
    contextMenu: document.getElementById('taskContextMenu'),
    editModal: document.getElementById('editModal'),
    editTaskTitle: document.getElementById('editTaskTitle'),
    editStatus: document.getElementById('editStatus'),
    editNote: document.getElementById('editNote'),
    editCancel: document.getElementById('editCancel'),
    editSave: document.getElementById('editSave'),
    dataHint: document.getElementById('dataHint')
  };

  function toYMD(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function parseYMD(s) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function startOfWeekSunday(d) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() - x.getDay());
    return x;
  }

  function addDays(d, n) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() + n);
    return x;
  }

  function formatChineseDate(ymd) {
    const d = parseYMD(ymd);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  }

  function weekRangeTitle(ymd) {
    const d0 = startOfWeekSunday(parseYMD(ymd));
    const d6 = addDays(d0, 6);
    const y0 = d0.getFullYear();
    const y6 = d6.getFullYear();
    if (y0 !== y6) {
      return `${y0}年${d0.getMonth() + 1}月${d0.getDate()}日 – ${y6}年${d6.getMonth() + 1}月${d6.getDate()}日`;
    }
    if (d0.getMonth() === d6.getMonth()) {
      return `${y0}年 ${d0.getMonth() + 1}月 ${d0.getDate()}日–${d6.getDate()}日`;
    }
    return `${y0}年 ${d0.getMonth() + 1}月${d0.getDate()}日 – ${d6.getMonth() + 1}月${d6.getDate()}日`;
  }

  function tasksOn(ymd) {
    return tasks
      .filter((t) => t.date === ymd)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || String(a.id).localeCompare(String(b.id)));
  }

  /** 同一天内：未完成在前、已完成在后，组内按当前 order 排序后重写 order */
  function rebalanceDoneToEnd(ymd) {
    const onDay = tasks.filter((t) => t.date === ymd);
    if (onDay.length === 0) return;
    const active = onDay.filter((t) => t.status !== 'done').sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const done = onDay.filter((t) => t.status === 'done').sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    let o = 0;
    [...active, ...done].forEach((t) => {
      t.order = o;
      o += 10;
    });
  }

  /** 按拖拽后的 id 顺序写回 order，并强制「已完成」在末尾 */
  function applyListOrderFromIds(ymd, orderedIds) {
    const map = new Map(tasks.filter((t) => t.date === ymd).map((t) => [t.id, t]));
    const ordered = orderedIds.map((id) => map.get(id)).filter(Boolean);
    const active = ordered.filter((t) => t.status !== 'done');
    const done = ordered.filter((t) => t.status === 'done');
    let o = 0;
    [...active, ...done].forEach((t) => {
      t.order = o;
      o += 10;
    });
  }

  /** 旧数据无 order 时：按当前 tasks 数组里各日期的出现顺序编号，再把已完成置底 */
  function migrateTaskOrders() {
    if (!tasks.some((t) => t.order === undefined)) return false;
    const byDate = new Map();
    for (const t of tasks) {
      if (!byDate.has(t.date)) byDate.set(t.date, []);
      byDate.get(t.date).push(t);
    }
    byDate.forEach((list, ymd) => {
      let o = 0;
      list.forEach((t) => {
        t.order = o;
        o += 10;
      });
      rebalanceDoneToEnd(ymd);
    });
    return true;
  }

  function nextOrderForNewTask(ymd) {
    const list = tasksOn(ymd);
    const active = list.filter((t) => t.status !== 'done');
    if (active.length === 0) {
      const m = list.reduce((x, t) => Math.max(x, t.order ?? 0), 0);
      return m + 10;
    }
    return Math.max(...active.map((t) => t.order ?? 0)) + 10;
  }

  function inProgressTasks() {
    return tasks
      .filter((t) => t.status === 'in_progress')
      .sort((a, b) => (a.date === b.date ? a.title.localeCompare(b.title, 'zh-CN') : a.date.localeCompare(b.date)));
  }

  function dotClassForDay(ymd) {
    const list = tasksOn(ymd);
    if (list.length === 0) return 'none';
    const done = list.filter((t) => t.status === 'done').length;
    if (done === list.length) return 'all-done';
    if (done === 0) return 'todo';
    return 'partial';
  }

  function persist() {
    window.api.saveTasks({ tasks });
  }

  function hideContextMenu() {
    el.contextMenu.hidden = true;
    contextTaskId = null;
  }

  function showContextMenu(clientX, clientY, taskId) {
    contextTaskId = taskId;
    el.contextMenu.hidden = false;
    el.contextMenu.style.left = '0px';
    el.contextMenu.style.top = '0px';

    requestAnimationFrame(() => {
      const pad = 8;
      const mw = el.contextMenu.offsetWidth;
      const mh = el.contextMenu.offsetHeight;
      let left = clientX;
      let top = clientY;
      if (left + mw > window.innerWidth - pad) left = window.innerWidth - mw - pad;
      if (top + mh > window.innerHeight - pad) top = window.innerHeight - mh - pad;
      if (left < pad) left = pad;
      if (top < pad) top = pad;
      el.contextMenu.style.left = `${left}px`;
      el.contextMenu.style.top = `${top}px`;
    });
  }

  function updateCompactButton() {
    el.btnCompact.textContent = compactMode ? '完整' : '简洁';
    el.btnCompact.title = compactMode ? '恢复完整界面' : '简洁：仅显示进行中任务';
  }

  async function applyCompact() {
    document.documentElement.classList.toggle('compact', compactMode);
    try {
      localStorage.setItem(STORAGE_COMPACT, compactMode ? '1' : '0');
    } catch (_) {
      /* ignore */
    }
    updateCompactButton();
    try {
      await window.api.setCompactMode(compactMode);
    } catch (_) {
      /* ignore */
    }
    renderAll();
  }

  async function init() {
    try {
      compactMode = localStorage.getItem(STORAGE_COMPACT) === '1';
    } catch (_) {
      compactMode = false;
    }

    const res = await window.api.loadTasks();
    tasks = res.tasks || [];
    if (migrateTaskOrders()) await window.api.saveTasks({ tasks });
    try {
      const p = await window.api.getUserDataPath();
      const sep = p.indexOf('\\') >= 0 ? '\\' : '/';
      el.dataHint.textContent = `数据文件：${p}${sep}tasks.json`;
    } catch (_) {
      el.dataHint.textContent = '数据保存在本地 JSON（用户数据目录）';
    }
    bind();
    document.documentElement.classList.toggle('compact', compactMode);
    updateCompactButton();
    try {
      await window.api.setCompactMode(compactMode);
    } catch (_) {
      /* ignore */
    }
    renderAll();
  }

  function bind() {
    el.btnCompact.addEventListener('click', async () => {
      compactMode = !compactMode;
      hideContextMenu();
      await applyCompact();
    });

    el.calPrev.addEventListener('click', () => {
      const d = addDays(parseYMD(selectedDate), -7);
      selectedDate = toYMD(d);
      hideContextMenu();
      renderCalendar();
      renderDayList();
    });
    el.calNext.addEventListener('click', () => {
      const d = addDays(parseYMD(selectedDate), 7);
      selectedDate = toYMD(d);
      hideContextMenu();
      renderCalendar();
      renderDayList();
    });
    el.btnToday.addEventListener('click', () => {
      const now = new Date();
      selectedDate = toYMD(now);
      hideContextMenu();
      renderAll();
    });

    el.addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = (el.newTitle.value || '').trim();
      if (!title) return;
      const task = {
        id: crypto.randomUUID(),
        date: selectedDate,
        title,
        status: 'pending',
        note: '',
        order: nextOrderForNewTask(selectedDate)
      };
      tasks.push(task);
      rebalanceDoneToEnd(selectedDate);
      el.newTitle.value = '';
      persist();
      renderDayList();
      renderCalendar();
    });

    el.btnMinimize.addEventListener('click', () => {
      window.api.hideToTray();
    });

    el.btnClose.addEventListener('click', () => {
      if (confirm('确定要退出每日任务吗？')) {
        window.api.quitApp();
      }
    });

    el.editCancel.addEventListener('click', closeModal);
    el.editModal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
    el.editSave.addEventListener('click', saveEdit);

    el.contextMenu.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        const id = contextTaskId;
        hideContextMenu();
        if (!id) return;
        if (action === 'edit') openEdit(id, {});
        if (action === 'note') openEdit(id, { focusNote: true });
        if (action === 'delete') deleteTaskById(id);
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!el.editModal.hidden) closeModal();
        else hideContextMenu();
      }
    });

    document.addEventListener('click', (e) => {
      if (!el.contextMenu.hidden && !e.target.closest('.ctx-menu')) {
        hideContextMenu();
      }
    });

    el.taskList.addEventListener('scroll', () => {
      hideContextMenu();
    });

    const dragState = { id: null };

    el.taskList.addEventListener('dragstart', (e) => {
      if (compactMode) return;
      const li = e.target.closest('.task-item');
      if (!li || !el.taskList.contains(li)) return;
      if (e.target.closest('button')) {
        e.preventDefault();
        return;
      }
      dragState.id = li.dataset.taskId;
      li.classList.add('task-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', dragState.id);
    });

    el.taskList.addEventListener('dragend', (e) => {
      const li = e.target.closest('.task-item');
      if (li) li.classList.remove('task-dragging');
      dragState.id = null;
    });

    el.taskList.addEventListener('dragover', (e) => {
      if (compactMode || !dragState.id) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    el.taskList.addEventListener('drop', (e) => {
      if (compactMode || !dragState.id) return;
      e.preventDefault();
      const ymd = selectedDate;
      const ids = tasksOn(ymd).map((t) => t.id);
      const from = ids.indexOf(dragState.id);
      if (from === -1) return;
      const dragged = dragState.id;
      const rest = ids.filter((id) => id !== dragged);
      let insert = rest.length;
      const li = e.target.closest('.task-item');
      if (li && el.taskList.contains(li)) {
        const tid = li.dataset.taskId;
        let idx = rest.indexOf(tid);
        if (idx === -1) idx = rest.length;
        const rect = li.getBoundingClientRect();
        if (e.clientY > rect.top + rect.height / 2) idx += 1;
        insert = idx;
      }
      rest.splice(insert, 0, dragged);
      applyListOrderFromIds(ymd, rest);
      persist();
      hideContextMenu();
      renderDayList();
      renderCalendar();
    });
  }

  function deleteTaskById(id) {
    if (!confirm('确定删除这条任务？')) return;
    tasks = tasks.filter((x) => x.id !== id);
    persist();
    renderDayList();
    renderCalendar();
  }

  function renderAll() {
    renderCalendar();
    renderDayList();
    updateCompactBanner();
  }

  function updateCompactBanner() {
    if (!compactMode) {
      el.compactBanner.hidden = true;
      return;
    }
    el.compactBanner.hidden = false;
    const n = inProgressTasks().length;
    el.compactSub.textContent = n === 0 ? '暂无进行中的任务' : `共 ${n} 条进行中`;
  }

  function renderCalendar() {
    if (compactMode) return;
    el.calTitle.textContent = weekRangeTitle(selectedDate);

    const week0 = startOfWeekSunday(parseYMD(selectedDate));
    const todayYmd = toYMD(new Date());

    el.calGrid.innerHTML = '';
    const frag = document.createDocumentFragment();

    for (let i = 0; i < 7; i++) {
      const cellDate = addDays(week0, i);
      const ymd = toYMD(cellDate);
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cal-cell';
      if (ymd === todayYmd) cell.classList.add('today');
      if (ymd === selectedDate) cell.classList.add('selected');
      cell.dataset.date = ymd;

      const num = document.createElement('span');
      num.className = 'cal-cell-num';
      num.textContent = String(cellDate.getDate());
      cell.appendChild(num);

      const dot = document.createElement('span');
      dot.className = `cal-dot ${dotClassForDay(ymd)}`;
      cell.appendChild(dot);

      cell.addEventListener('click', () => {
        selectedDate = ymd;
        hideContextMenu();
        renderCalendar();
        renderDayList();
      });
      frag.appendChild(cell);
    }

    el.calGrid.appendChild(frag);
  }

  function renderDayList() {
    if (compactMode) {
      el.selectedDateLabel.textContent = '进行中任务';
      el.dayStats.textContent = '';
    } else {
      el.selectedDateLabel.textContent = formatChineseDate(selectedDate);
      const list0 = tasksOn(selectedDate);
      const done = list0.filter((t) => t.status === 'done').length;
      el.dayStats.textContent =
        list0.length === 0 ? '暂无任务' : `共 ${list0.length} 条 · 已完成 ${done}`;
    }

    const list = compactMode ? inProgressTasks() : tasksOn(selectedDate);

    el.taskList.innerHTML = '';
    if (list.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'task-empty';
      empty.textContent = compactMode
        ? '暂无进行中的任务'
        : '这一天还没有任务，在上方输入标题添加。';
      el.taskList.appendChild(empty);
      updateCompactBanner();
      return;
    }

    for (const t of list) {
      const li = document.createElement('li');
      li.className = 'task-item' + (t.status === 'done' ? ' done' : '');
      li.dataset.taskId = t.id;
      li.draggable = !compactMode;

      li.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e.clientX, e.clientY, t.id);
      });

      const top = document.createElement('div');
      top.className = 'task-top';

      const main = document.createElement('div');
      main.className = 'task-main';

      const titleBlock = document.createElement('div');
      titleBlock.className = 'task-title-block';

      const title = document.createElement('div');
      title.className = 'task-title' + (t.status === 'done' ? ' done-text' : '');
      title.textContent = t.title;

      titleBlock.appendChild(title);
      if (compactMode) {
        const meta = document.createElement('div');
        meta.className = 'task-date-meta';
        meta.textContent = formatChineseDate(t.date);
        titleBlock.appendChild(meta);
      }
      if (t.note && t.note.trim()) {
        const note = document.createElement('div');
        note.className = 'task-note-preview';
        note.textContent = t.note.trim();
        titleBlock.appendChild(note);
      }

      const statusBtn = document.createElement('button');
      statusBtn.type = 'button';
      statusBtn.draggable = false;
      statusBtn.className = `status-pill status-pill--btn ${t.status}`;
      statusBtn.textContent = STATUS[t.status].label;
      statusBtn.title = '点击切换状态';
      statusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        hideContextMenu();
        t.status = nextStatus(t.status);
        rebalanceDoneToEnd(t.date);
        persist();
        renderDayList();
        renderCalendar();
      });
      statusBtn.addEventListener('contextmenu', (e) => {
        e.stopPropagation();
      });

      main.appendChild(titleBlock);
      main.appendChild(statusBtn);

      top.appendChild(main);
      li.appendChild(top);
      el.taskList.appendChild(li);
    }

    updateCompactBanner();
  }

  function nextStatus(s) {
    if (s === 'pending') return 'in_progress';
    if (s === 'in_progress') return 'done';
    return 'pending';
  }

  /**
   * @param {string} id
   * @param {{ focusNote?: boolean }} opts
   */
  function openEdit(id, opts) {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    editingId = id;
    el.editTaskTitle.value = t.title;
    el.editStatus.value = t.status;
    el.editNote.value = t.note || '';
    el.editModal.hidden = false;
    hideContextMenu();
    const focusNote = opts && opts.focusNote;
    setTimeout(() => {
      if (focusNote) el.editNote.focus();
      else el.editTaskTitle.focus();
    }, 30);
  }

  function closeModal() {
    editingId = null;
    el.editModal.hidden = true;
  }

  function saveEdit() {
    if (!editingId) return;
    const t = tasks.find((x) => x.id === editingId);
    if (!t) return;
    const title = (el.editTaskTitle.value || '').trim();
    if (!title) {
      alert('标题不能为空');
      return;
    }
    t.title = title;
    t.status = el.editStatus.value;
    t.note = el.editNote.value || '';
    rebalanceDoneToEnd(t.date);
    persist();
    closeModal();
    renderDayList();
    renderCalendar();
  }

  init();
})();
