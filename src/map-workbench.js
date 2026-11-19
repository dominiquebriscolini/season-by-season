function element(tag, className) {
  const node = document.createElement(tag)
  if (className) node.className = className
  return node
}

function compactTool(button, icon) {
  const caption = element('span', 'map-tool-label')
  caption.textContent = button.textContent
  const mark = element('span', 'map-tool-icon')
  mark.textContent = icon
  mark.setAttribute('aria-hidden', 'true')
  button.setAttribute('aria-label', caption.textContent)
  button.title ||= caption.textContent
  button.replaceChildren(mark, caption)
}

export function mountMapWorkbench(page, sources, hasDraft) {
  page.setAttribute('aria-label', 'Kartenansicht')
  const workspace = page.querySelector('.workspace')
  const tools = workspace.querySelector('.toolbar')
  const navigation = workspace.querySelector('.navigation')
  const status = workspace.querySelector('#status')
  const draftRow = element('div', 'map-draft-row')
  const footer = element('div', 'map-workbench-footer')
  const notices = element('div')
  notices.id = 'map-notices'
  const dock = page.querySelector('aside')
  dock.id = 'map-details'
  const phases = dock.querySelector('.steps')

  const toggle = element('button')
  toggle.id = 'map-details-toggle'
  toggle.type = 'button'
  toggle.textContent = 'Kartendetails'
  toggle.setAttribute('aria-controls', dock.id)
  compactTool(toggle, '☷')
  compactTool(navigation.querySelector('#pan'), '✥')
  compactTool(navigation.querySelector('#fit'), '⛶')
  navigation.append(toggle)
  dock.after(navigation)

  const heading = element('div', 'map-details-heading')
  const title = element('h2')
  title.textContent = 'Kartendetails'
  title.id = 'map-details-title'
  title.tabIndex = -1
  dock.removeAttribute('aria-label')
  dock.setAttribute('aria-labelledby', title.id)
  const close = element('button', 'map-details-close')
  close.type = 'button'
  close.textContent = '×'
  close.setAttribute('aria-label', 'Kartendetails schließen')
  close.title = 'Kartendetails schließen'
  heading.append(title, close)
  const details = element('div', 'map-details-body')
  draftRow.append(tools.querySelector('#draft-tools'))
  footer.append(phases, tools, draftRow, status, notices)
  details.append(...dock.children)
  dock.append(heading, details)
  sources.id = 'map-source-bar'
  page.prepend(sources)
  page.append(footer)

  function show(open, moveFocus = true) {
    dock.hidden = !open
    toggle.setAttribute('aria-expanded', String(open))
    if (moveFocus) (open ? title : toggle).focus({preventScroll: true})
  }

  function dismiss(event) {
    if (event.key !== 'Escape' || event.defaultPrevented || dock.hidden || hasDraft() ||
        event.target.closest('dialog[open]')) return
    event.preventDefault()
    show(false)
  }

  toggle.onclick = () => show(dock.hidden)
  close.onclick = () => show(false)
  toggle.addEventListener('keydown', dismiss)
  dock.addEventListener('keydown', dismiss)
  show(true, false)
}
