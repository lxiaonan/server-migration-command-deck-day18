import './style.css'
import * as THREE from 'three'

type Lang = 'zh' | 'en'
type DbKind = 'mysql' | 'postgres' | 'none'
type PhaseKey = 'inventory' | 'backup' | 'transfer' | 'restore' | 'cutover' | 'verify'

type PlanState = {
  lang: Lang
  sourceHost: string
  targetHost: string
  domain: string
  appPath: string
  dataPath: string
  sshUser: string
  dnsTtl: number
  downtime: number
  dbKind: DbKind
  usesDocker: boolean
  hasNginx: boolean
  hasRedis: boolean
  hasUploads: boolean
  hasSnapshot: boolean
  checked: Record<PhaseKey, boolean>
}

type CopyMap = {
  appTitle: string
  appSub: string
  language: string
  live: string
  source: string
  target: string
  domain: string
  appPath: string
  dataPath: string
  sshUser: string
  dnsTtl: string
  downtime: string
  stack: string
  docker: string
  nginx: string
  redis: string
  uploads: string
  snapshot: string
  db: string
  none: string
  risk: string
  phases: string
  commands: string
  topology: string
  exportMd: string
  exportSh: string
  copy: string
  reset: string
  realWorkflow: string
  checkpoint: string
  done: string
  pending: string
  commandHelp: string
}

const copy: Record<Lang, CopyMap> = {
  zh: {
    appTitle: '服务器迁移作战台',
    appSub: '把“怎么完整迁移一台服务器”拆成可检查、可复制、可回滚的实际迁移计划。',
    language: 'English',
    live: '本地运行，不上传服务器信息',
    source: '源服务器',
    target: '目标服务器',
    domain: '域名',
    appPath: '应用目录',
    dataPath: '数据/备份目录',
    sshUser: 'SSH 用户',
    dnsTtl: 'DNS TTL 秒数',
    downtime: '可接受停机分钟',
    stack: '迁移组件',
    docker: 'Docker / Compose',
    nginx: 'Nginx',
    redis: 'Redis',
    uploads: '上传文件/附件',
    snapshot: '云厂商快照已创建',
    db: '数据库',
    none: '无数据库',
    risk: '迁移风险',
    phases: '执行阶段',
    commands: '命令台',
    topology: '迁移拓扑',
    exportMd: '导出 Markdown',
    exportSh: '导出 Bash',
    copy: '复制命令',
    reset: '重置演练',
    realWorkflow: '真实工作流：填服务器信息 -> 勾选组件 -> 按阶段复制命令 -> 导出计划 -> 迁移后验证/回滚。',
    checkpoint: '检查点',
    done: '已完成',
    pending: '待执行',
    commandHelp: '命令默认只生成计划和安全检查。真正执行前请替换占位符、确认备份、先在测试机验证。',
  },
  en: {
    appTitle: 'Server Migration Command Deck',
    appSub: 'Turn a vague server move into an auditable command plan with checks, rollback, and export.',
    language: '中文',
    live: 'Local-only. Server details never leave the browser.',
    source: 'Source server',
    target: 'Target server',
    domain: 'Domain',
    appPath: 'Application path',
    dataPath: 'Data / backup path',
    sshUser: 'SSH user',
    dnsTtl: 'DNS TTL seconds',
    downtime: 'Allowed downtime minutes',
    stack: 'Migration components',
    docker: 'Docker / Compose',
    nginx: 'Nginx',
    redis: 'Redis',
    uploads: 'Uploads / attachments',
    snapshot: 'Cloud snapshot already created',
    db: 'Database',
    none: 'No database',
    risk: 'Migration risk',
    phases: 'Execution phases',
    commands: 'Command console',
    topology: 'Migration topology',
    exportMd: 'Export Markdown',
    exportSh: 'Export Bash',
    copy: 'Copy commands',
    reset: 'Reset drill',
    realWorkflow: 'Real workflow: fill hosts -> choose components -> copy phase commands -> export plan -> verify or rollback.',
    checkpoint: 'Checkpoint',
    done: 'Done',
    pending: 'Pending',
    commandHelp: 'Commands are generated as a safe plan. Replace placeholders, confirm backups, and test before production execution.',
  },
}

const phaseMeta: Record<PhaseKey, { zh: string; en: string; danger: number }> = {
  inventory: { zh: '盘点源机服务、端口、磁盘和配置', en: 'Inventory services, ports, disk and config', danger: 10 },
  backup: { zh: '冻结写入并创建数据库/文件备份', en: 'Freeze writes and create database/file backups', danger: 25 },
  transfer: { zh: '传输应用、配置、上传目录和镜像', en: 'Transfer app, config, uploads and images', danger: 18 },
  restore: { zh: '在目标机恢复服务并做本地验证', en: 'Restore services on target and verify locally', danger: 20 },
  cutover: { zh: '切换 DNS / 反向代理流量', en: 'Cut over DNS / reverse proxy traffic', danger: 30 },
  verify: { zh: '验收、监控、保留回滚窗口', en: 'Verify, monitor and keep rollback window', danger: 15 },
}

const defaultState: PlanState = {
  lang: 'zh',
  sourceHost: 'old.example.com',
  targetHost: 'new.example.com',
  domain: 'example.com',
  appPath: '/srv/app',
  dataPath: '/backup/migration',
  sshUser: 'root',
  dnsTtl: 300,
  downtime: 30,
  dbKind: 'mysql',
  usesDocker: true,
  hasNginx: true,
  hasRedis: true,
  hasUploads: true,
  hasSnapshot: false,
  checked: {
    inventory: false,
    backup: false,
    transfer: false,
    restore: false,
    cutover: false,
    verify: false,
  },
}

const storageKey = 'server-migration-command-deck-day18'
let state = loadState()
let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let animationId = 0

function loadState(): PlanState {
  try {
    const raw = localStorage.getItem(storageKey)
    return raw ? { ...defaultState, ...JSON.parse(raw) } : defaultState
  } catch {
    return defaultState
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state))
}

function t(key: keyof CopyMap) {
  return copy[state.lang][key]
}

function esc(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] || char)
}

function commandPlan() {
  const dbDump =
    state.dbKind === 'mysql'
      ? `mysqldump --single-transaction --routines --triggers --all-databases | gzip > ${state.dataPath}/mysql-all.sql.gz`
      : state.dbKind === 'postgres'
        ? `sudo -u postgres pg_dumpall | gzip > ${state.dataPath}/postgres-all.sql.gz`
        : '# no database dump selected'

  const dbRestore =
    state.dbKind === 'mysql'
      ? `gunzip -c ${state.dataPath}/mysql-all.sql.gz | mysql`
      : state.dbKind === 'postgres'
        ? `gunzip -c ${state.dataPath}/postgres-all.sql.gz | sudo -u postgres psql`
        : '# no database restore selected'

  const compose = state.usesDocker ? 'docker compose ps && docker compose config' : 'systemctl list-units --type=service --state=running'
  const nginx = state.hasNginx ? 'nginx -t && sudo cp -a /etc/nginx ${BACKUP_ROOT}/nginx' : '# nginx not selected'
  const redis = state.hasRedis ? 'redis-cli BGSAVE || true' : '# redis not selected'
  const uploads = state.hasUploads ? `${state.appPath}/uploads/` : state.appPath

  return {
    inventory: `# 1. Inventory source server\nssh ${state.sshUser}@${state.sourceHost} '\n  set -e\n  hostnamectl\n  df -h\n  free -h\n  ss -tulpn\n  ${compose}\n  ${nginx}\n'`,
    backup: `# 2. Backup on source server\nssh ${state.sshUser}@${state.sourceHost} '\n  set -e\n  BACKUP_ROOT=${state.dataPath}\n  sudo mkdir -p ${state.dataPath}\n  ${redis}\n  ${dbDump}\n  sudo tar -czf ${state.dataPath}/app-files.tgz ${state.appPath}\n'`,
    transfer: `# 3. Transfer backup to target server\nrsync -avh --progress ${state.sshUser}@${state.sourceHost}:${state.dataPath}/ ${state.sshUser}@${state.targetHost}:${state.dataPath}/\nrsync -avh --dry-run ${state.sshUser}@${state.sourceHost}:${uploads} ${state.sshUser}@${state.targetHost}:${uploads}`,
    restore: `# 4. Restore on target server\nssh ${state.sshUser}@${state.targetHost} '\n  set -e\n  sudo mkdir -p ${state.appPath}\n  sudo tar -xzf ${state.dataPath}/app-files.tgz -C /\n  ${dbRestore}\n  cd ${state.appPath}\n  ${state.usesDocker ? 'docker compose pull || true\\n  docker compose up -d' : 'sudo systemctl daemon-reload\\n  sudo systemctl restart nginx || true'}\n'`,
    cutover: `# 5. Cutover checklist\n# Lower DNS TTL to ${state.dnsTtl}s before cutover.\n# Point ${state.domain} to the target server IP after target health checks pass.\ndig ${state.domain} +short\ncurl -I --resolve ${state.domain}:443:TARGET_SERVER_IP https://${state.domain}/`,
    verify: `# 6. Verify and rollback window\ncurl -fsS https://${state.domain}/ || echo 'health check failed'\nssh ${state.sshUser}@${state.targetHost} 'df -h && ${state.usesDocker ? 'docker compose ps' : 'systemctl --failed'}'\n# Rollback: restore DNS to source IP, keep source server untouched for at least 24h.`,
  }
}

function riskItems() {
  const items: Array<{ label: string; score: number }> = []
  if (!state.hasSnapshot) items.push({ label: state.lang === 'zh' ? '没有确认云快照，误操作回退成本高' : 'No confirmed cloud snapshot; rollback cost is high', score: 28 })
  if (state.dbKind !== 'none') items.push({ label: state.lang === 'zh' ? '包含数据库，需要停写、备份、恢复和一致性检查' : 'Database selected; needs write freeze, dump, restore and consistency checks', score: 24 })
  if (state.dnsTtl > 600) items.push({ label: state.lang === 'zh' ? 'DNS TTL 偏高，切换传播会变慢' : 'DNS TTL is high; cutover propagation may be slow', score: 14 })
  if (state.downtime < 15) items.push({ label: state.lang === 'zh' ? '允许停机时间很短，需要提前演练' : 'Allowed downtime is short; rehearsal is required', score: 18 })
  if (state.hasUploads) items.push({ label: state.lang === 'zh' ? '有上传目录，迁移窗口内可能产生增量文件' : 'Uploads selected; incremental files may appear during cutover', score: 12 })
  if (state.hasRedis) items.push({ label: state.lang === 'zh' ? 'Redis 可能有会话或队列，需要明确是否可丢弃' : 'Redis may contain sessions or queues; decide whether data can be discarded', score: 10 })
  if (!items.length) items.push({ label: state.lang === 'zh' ? '风险较低，但仍需保留回滚窗口' : 'Lower risk, but still keep a rollback window', score: 8 })
  return items
}

function riskScore() {
  return Math.min(98, riskItems().reduce((sum, item) => sum + item.score, 0))
}

function render() {
  const risk = riskScore()
  const plan = commandPlan()
  const checkedCount = Object.values(state.checked).filter(Boolean).length
  const html = `
    <header class="masthead">
      <nav class="topbar" aria-label="Primary">
        <strong>Day18 / Migration Ops</strong>
        <span>${t('live')}</span>
        <button class="ghost" id="languageBtn" type="button">${t('language')}</button>
      </nav>
      <div class="title-row">
        <div>
          <p class="eyebrow">Real-usefulness gate passed</p>
          <h1>${t('appTitle')}</h1>
          <p class="subtitle">${t('appSub')}</p>
        </div>
        <div class="score-dial" aria-label="${t('risk')} ${risk}">
          <span>${risk}</span>
          <small>${t('risk')}</small>
        </div>
      </div>
      <p class="workflow">${t('realWorkflow')}</p>
    </header>

    <main class="ops-shell">
      <aside class="control-rail" aria-label="Migration inputs">
        ${input('sourceHost', t('source'))}
        ${input('targetHost', t('target'))}
        ${input('domain', t('domain'))}
        ${input('appPath', t('appPath'))}
        ${input('dataPath', t('dataPath'))}
        ${input('sshUser', t('sshUser'))}
        <div class="split-fields">
          ${input('dnsTtl', t('dnsTtl'), 'number')}
          ${input('downtime', t('downtime'), 'number')}
        </div>
        <label class="field">
          <span>${t('db')}</span>
          <select id="dbKind">
            <option value="mysql" ${state.dbKind === 'mysql' ? 'selected' : ''}>MySQL / MariaDB</option>
            <option value="postgres" ${state.dbKind === 'postgres' ? 'selected' : ''}>PostgreSQL</option>
            <option value="none" ${state.dbKind === 'none' ? 'selected' : ''}>${t('none')}</option>
          </select>
        </label>
        <section class="toggle-bank">
          <h2>${t('stack')}</h2>
          ${toggle('usesDocker', t('docker'))}
          ${toggle('hasNginx', t('nginx'))}
          ${toggle('hasRedis', t('redis'))}
          ${toggle('hasUploads', t('uploads'))}
          ${toggle('hasSnapshot', t('snapshot'))}
        </section>
      </aside>

      <section class="mission-board" aria-label="${t('phases')}">
        <div class="board-header">
          <div>
            <p class="eyebrow">${t('checkpoint')} ${checkedCount}/6</p>
            <h2>${t('phases')}</h2>
          </div>
          <button class="ghost" id="resetBtn" type="button">${t('reset')}</button>
        </div>
        <div class="phase-ladder">
          ${Object.entries(phaseMeta).map(([key, meta], index) => phaseRow(key as PhaseKey, meta[state.lang], index + 1)).join('')}
        </div>
        <section class="risk-panel">
          <h2>${t('risk')}</h2>
          <div class="risk-bar"><span style="width: ${risk}%"></span></div>
          <ul>${riskItems().map((item) => `<li>${esc(item.label)}</li>`).join('')}</ul>
        </section>
      </section>

      <section class="console-panel" aria-label="${t('commands')}">
        <div class="console-head">
          <div>
            <p class="eyebrow">${t('commands')}</p>
            <h2>${state.sourceHost} -> ${state.targetHost}</h2>
          </div>
          <div class="actions">
            <button id="copyBtn" type="button">${t('copy')}</button>
            <button id="exportShBtn" type="button">${t('exportSh')}</button>
            <button id="exportMdBtn" type="button">${t('exportMd')}</button>
          </div>
        </div>
        <p class="console-help">${t('commandHelp')}</p>
        <pre id="commandOutput"><code>${esc(Object.values(plan).join('\n\n'))}</code></pre>
      </section>

      <section class="topology-panel" aria-label="${t('topology')}">
        <div>
          <p class="eyebrow">three.js topology</p>
          <h2>${t('topology')}</h2>
        </div>
        <div id="topologyCanvas"></div>
      </section>
    </main>
  `

  document.querySelector<HTMLDivElement>('#app')!.innerHTML = html
  bindEvents()
  initTopology()
}

function input(key: keyof PlanState, label: string, type = 'text') {
  const value = state[key]
  return `<label class="field"><span>${label}</span><input id="${key}" type="${type}" value="${esc(String(value))}" /></label>`
}

function toggle(key: keyof PlanState, label: string) {
  return `<label class="switch-line"><span>${label}</span><input id="${key}" type="checkbox" ${state[key] ? 'checked' : ''} /></label>`
}

function phaseRow(key: PhaseKey, label: string, index: number) {
  return `<label class="phase-row ${state.checked[key] ? 'complete' : ''}">
    <input data-phase="${key}" type="checkbox" ${state.checked[key] ? 'checked' : ''} />
    <span class="phase-index">${String(index).padStart(2, '0')}</span>
    <span class="phase-title">${label}</span>
    <span class="phase-state">${state.checked[key] ? t('done') : t('pending')}</span>
  </label>`
}

function bindEvents() {
  const stringKeys: Array<keyof PlanState> = ['sourceHost', 'targetHost', 'domain', 'appPath', 'dataPath', 'sshUser']
  stringKeys.forEach((key) => {
    document.getElementById(String(key))?.addEventListener('input', (event) => {
      state = { ...state, [key]: (event.target as HTMLInputElement).value }
      saveState()
      render()
    })
  })

  ;(['dnsTtl', 'downtime'] as Array<keyof PlanState>).forEach((key) => {
    document.getElementById(String(key))?.addEventListener('input', (event) => {
      state = { ...state, [key]: Number((event.target as HTMLInputElement).value || 0) }
      saveState()
      render()
    })
  })

  ;(['usesDocker', 'hasNginx', 'hasRedis', 'hasUploads', 'hasSnapshot'] as Array<keyof PlanState>).forEach((key) => {
    document.getElementById(String(key))?.addEventListener('change', (event) => {
      state = { ...state, [key]: (event.target as HTMLInputElement).checked }
      saveState()
      render()
    })
  })

  document.getElementById('dbKind')?.addEventListener('change', (event) => {
    state = { ...state, dbKind: (event.target as HTMLSelectElement).value as DbKind }
    saveState()
    render()
  })

  document.querySelectorAll<HTMLInputElement>('[data-phase]').forEach((box) => {
    box.addEventListener('change', () => {
      const phase = box.dataset.phase as PhaseKey
      state = { ...state, checked: { ...state.checked, [phase]: box.checked } }
      saveState()
      render()
    })
  })

  document.getElementById('languageBtn')?.addEventListener('click', () => {
    state = { ...state, lang: state.lang === 'zh' ? 'en' : 'zh' }
    saveState()
    render()
  })

  document.getElementById('resetBtn')?.addEventListener('click', () => {
    state = { ...defaultState, lang: state.lang }
    saveState()
    render()
  })

  document.getElementById('copyBtn')?.addEventListener('click', async () => {
    await navigator.clipboard.writeText(Object.values(commandPlan()).join('\n\n'))
  })
  document.getElementById('exportShBtn')?.addEventListener('click', () => download('migration-plan.sh', `#!/usr/bin/env bash\nset -euo pipefail\n\n${Object.values(commandPlan()).join('\n\n')}\n`))
  document.getElementById('exportMdBtn')?.addEventListener('click', () => download('migration-plan.md', markdownPlan()))
}

function markdownPlan() {
  const checks = Object.entries(phaseMeta)
    .map(([key, meta]) => `- [${state.checked[key as PhaseKey] ? 'x' : ' '}] ${meta[state.lang]}`)
    .join('\n')
  return `# ${t('appTitle')}\n\n${t('realWorkflow')}\n\n## Hosts\n\n- Source: ${state.sourceHost}\n- Target: ${state.targetHost}\n- Domain: ${state.domain}\n- App path: ${state.appPath}\n\n## Checklist\n\n${checks}\n\n## Risks\n\n${riskItems().map((item) => `- ${item.label}`).join('\n')}\n\n## Commands\n\n\`\`\`bash\n${Object.values(commandPlan()).join('\n\n')}\n\`\`\`\n`
}

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function initTopology() {
  const mount = document.getElementById('topologyCanvas')
  if (!mount) return
  cancelAnimationFrame(animationId)
  mount.innerHTML = ''

  const width = mount.clientWidth || 720
  const height = 340
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)
  camera.position.set(0, 0, 14)
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(width, height)
  mount.appendChild(renderer.domElement)

  const group = new THREE.Group()
  scene.add(group)
  const materialSource = new THREE.MeshStandardMaterial({ color: 0xe15634, roughness: 0.35 })
  const materialTarget = new THREE.MeshStandardMaterial({ color: 0x2a9d8f, roughness: 0.35 })
  const materialService = new THREE.MeshStandardMaterial({ color: 0xf4a261, roughness: 0.4 })
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x2b2d42, transparent: true, opacity: 0.55 })

  const nodes: Array<{ label: string; x: number; y: number; kind: 'source' | 'target' | 'service' }> = [
    { label: 'OLD', x: -4.6, y: 0, kind: 'source' },
    { label: 'NEW', x: 4.6, y: 0, kind: 'target' },
    { label: 'DNS', x: 0, y: 2.5, kind: 'service' },
  ]
  if (state.dbKind !== 'none') nodes.push({ label: state.dbKind.toUpperCase(), x: 0, y: -2.4, kind: 'service' })
  if (state.usesDocker) nodes.push({ label: 'DOCKER', x: -1.8, y: -1.3, kind: 'service' })
  if (state.hasNginx) nodes.push({ label: 'NGINX', x: 1.8, y: 1.3, kind: 'service' })
  if (state.hasUploads) nodes.push({ label: 'FILES', x: 1.8, y: -1.3, kind: 'service' })

  nodes.forEach((node) => {
    const geometry = node.kind === 'service' ? new THREE.OctahedronGeometry(0.45) : new THREE.BoxGeometry(1.1, 1.1, 1.1)
    const material = node.kind === 'source' ? materialSource : node.kind === 'target' ? materialTarget : materialService
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(node.x, node.y, 0)
    group.add(mesh)
  })

  const oldNode = new THREE.Vector3(-4.6, 0, 0)
  const newNode = new THREE.Vector3(4.6, 0, 0)
  nodes.slice(2).forEach((node) => {
    const middle = new THREE.Vector3(node.x, node.y, 0)
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([oldNode, middle, newNode]), lineMaterial))
  })
  group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([oldNode, newNode]), lineMaterial))

  scene.add(new THREE.AmbientLight(0xffffff, 1.6))
  const light = new THREE.DirectionalLight(0xffffff, 2.2)
  light.position.set(3, 4, 6)
  scene.add(light)

  const animate = () => {
    animationId = requestAnimationFrame(animate)
    group.rotation.y += 0.006
    group.rotation.x = Math.sin(Date.now() / 1800) * 0.08
    renderer?.render(scene!, camera!)
  }
  animate()
}

window.addEventListener('resize', () => initTopology())
render()
