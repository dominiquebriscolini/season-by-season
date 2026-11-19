const preferenceKey = 'season-by-season.theme.v1'
const themes = ['system', 'light', 'dark']

export function mountWorkbenchTheme(app, trigger) {
  let preference = 'system'
  let openedBy
  try {
    const saved = localStorage.getItem(preferenceKey)
    if (themes.includes(saved)) preference = saved
  } catch {
    // The choice remains available for the session if storage is blocked.
  }

  const dialog = document.createElement('dialog')
  dialog.className = 'workbench-theme-dialog'
  dialog.setAttribute('aria-labelledby', 'workbench-theme-title')
  dialog.innerHTML = `
    <form method="dialog">
      <div class="library-heading">
        <h2 id="workbench-theme-title">Farbschema</h2>
        <button>Schließen</button>
      </div>
      <div class="workbench-theme-choices">
        <label><input type="radio" name="theme" value="system"> System</label>
        <label><input type="radio" name="theme" value="light"> Hell</label>
        <label><input type="radio" name="theme" value="dark"> Dunkel</label>
      </div>
    </form>`
  app.append(dialog)
  const choices = dialog.querySelectorAll('input')

  function apply() {
    app.dataset.theme = preference === 'dark' ? 'dark' : 'light'
    for (const choice of choices) choice.checked = choice.value === preference
  }

  dialog.addEventListener('change', event => {
    preference = event.target.value
    apply()
    try { localStorage.setItem(preferenceKey, preference) } catch { /* Keep the session choice. */ }
  })
  function open(invoker) {
    openedBy = invoker
    dialog.showModal()
    dialog.querySelector('input:checked').focus()
  }
  trigger.onclick = () => open(trigger)
  dialog.addEventListener('close', () => openedBy.focus({preventScroll: true}))
  apply()
  return open
}
