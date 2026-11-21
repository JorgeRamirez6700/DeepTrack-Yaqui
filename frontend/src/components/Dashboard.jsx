import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';
import MapView from './MapView.jsx';
import SondaPanel from './SondaPanel.jsx';
import SondaForm from './SondaForm.jsx';
import TrendModal from './TrendModal.jsx';
import ValleSummary from './ValleSummary.jsx';
import ValleReports from './ValleReports.jsx';
import { ThemeSelector } from './ThemeProvider.jsx';

const PAGES = [
  { id: 'inicio', icon: '◫', title: 'Inicio', subtitle: 'Vista general del monitoreo' },
  { id: 'mapa', icon: '⌖', title: 'Mapa de pozos', subtitle: 'Ubicación y estado de las sondas' },
  { id: 'estadisticas', icon: '▥', title: 'Estadísticas', subtitle: 'Indicadores y evolución del valle' },
  { id: 'reportes', icon: '▤', title: 'Reportes', subtitle: 'Informes mensuales y exportación' },
  { id: 'configuracion', icon: '⚙', title: 'Configuración', subtitle: 'Preferencias de visualización' },
];

export default function Dashboard({ user, onLogout }) {
  const canManage = ['ADMINISTRADOR', 'ANALISTA'].includes(user.rol);
  const [page, setPage] = useState('inicio');
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('deeptrack-sidebar-collapsed') === 'true'; }
    catch { return false; }
  });
  const [mobileMenu, setMobileMenu] = useState(false);
  const [sondas, setSondas] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [formState, setFormState] = useState(null);
  const [trendSonda, setTrendSonda] = useState(null);
  const [notice, setNotice] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(null), 4500); return () => clearTimeout(timer); }, [notice]);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      setSondas(await api.listarSondas());
      setLoadError('');
      setLastUpdate(new Date());
      setRevision(n => n + 1);
    } catch (err) {
      setLoadError(err.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => {
    try { localStorage.setItem('deeptrack-sidebar-collapsed', String(collapsed)); }
    catch { /* almacenamiento no disponible */ }
  }, [collapsed]);

  const elegirPagina = (target) => {
    setPage(target);
    setMobileMenu(false);
  };

  const handleSave = async (data, editingId) => {
    if (editingId) await api.actualizarSonda(editingId, data);
    else await api.crearSonda(data);
    setFormState(null);
    setNotice({ text: 'Sonda guardada correctamente', error: false });
    await cargar();
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`¿Eliminar permanentemente la sonda ${id} y sus lecturas?`)) return;
    try {
      await api.eliminarSonda(id);
      setFormState(null);
      setNotice({ text: 'Sonda eliminada correctamente', error: false });
      await cargar();
    } catch (err) {
      setNotice({ text: err.message, error: true });
    }
  };

  const activa = PAGES.find((item) => item.id === page);
  const activas = sondas.filter((s) => s.estado === 'ACTIVA').length;
  const alertas = sondas.filter((s) => s.enAlerta).length;
  const visible = sondas.filter(s => {
    const matches = `${s.idSonda} ${s.cuadrante}`.toLowerCase().includes(query.trim().toLowerCase());
    const alertMatches = filter === 'all' || (filter === 'alert' ? s.enAlerta : !s.enAlerta && s.profundidadActual != null);
    return matches && alertMatches && (stateFilter === 'all' || s.estado === stateFilter);
  });
  const mapaPanel = (
    <div className="dash-body">
      <MapView sondas={visible} onSelect={setTrendSonda} />
      <SondaPanel
        canManage={canManage}
        sondas={visible}
        total={sondas.length} query={query} onQuery={setQuery}
        filter={filter} onFilter={setFilter} stateFilter={stateFilter} onStateFilter={setStateFilter}
        onNew={() => setFormState({ sonda: null })}
        onEdit={(s) => setFormState({ sonda: s })}
        onDelete={handleDelete}
        onTrend={setTrendSonda}
      />
    </div>
  );

  return (
    <div className={`app-shell${collapsed ? ' shell-collapsed' : ''}`}>
      {mobileMenu && (
        <button className="sidebar-backdrop" aria-label="Cerrar navegación"
          onClick={() => setMobileMenu(false)} />
      )}
      <aside className={`app-sidebar${mobileMenu ? ' mobile-open' : ''}`} aria-label="Navegación principal">
        <div className="sidebar-brand">
          <span className="brand-symbol" aria-hidden="true">≈</span>
          <span className="brand-label"><strong>DeepTrack</strong><small>VALLE DEL YAQUI</small></span>
          <button type="button" className="sidebar-collapse" onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expandir barra lateral' : 'Plegar barra lateral'}
            title={collapsed ? 'Expandir' : 'Plegar'}>{collapsed ? '›' : '‹'}</button>
        </div>
        <nav className="sidebar-nav" aria-label="Secciones">
          <span className="nav-heading">PLATAFORMA</span>
          {PAGES.map((item) => (
            <button key={item.id} type="button" title={item.title}
              className={`nav-item${page === item.id ? ' selected' : ''}`}
              aria-current={page === item.id ? 'page' : undefined}
              onClick={() => elegirPagina(item.id)}>
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              <span className="nav-label">{item.title}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-user"><span className="avatar" aria-hidden="true">
            {(user.nombreCompleto || user.usuario || 'U').slice(0, 1).toUpperCase()}</span>
            <span className="sidebar-user-info"><strong>{user.nombreCompleto || user.usuario}</strong><small>{user.rol}</small></span>
          </div>
          <button type="button" className="nav-item sidebar-logout" onClick={onLogout}
            title="Cerrar sesión"><span className="nav-icon" aria-hidden="true">↪</span><span className="nav-label">Cerrar sesión</span></button>
        </div>
      </aside>

      <div className="app-content">
        <header className="app-topbar">
          <button className="mobile-menu-toggle" type="button" aria-label="Abrir navegación"
            aria-expanded={mobileMenu} onClick={() => setMobileMenu(true)}>☰</button>
          <div className="topbar-location"><span>MONITOREO HÍDRICO</span><strong>{activa.title}</strong></div>
          <div className="topbar-actions">
            <span className="live-indicator"><i aria-hidden="true" /> Datos de desarrollo</span>
            <ThemeSelector compact />
            <span className="topbar-avatar" title={user.nombreCompleto || user.usuario} aria-hidden="true">
              {(user.nombreCompleto || user.usuario || 'U').slice(0, 1).toUpperCase()}
            </span>
          </div>
        </header>

        <main className="app-main" id="main-content">
          <div className="page-heading">
            <div><span className="eyebrow">DEEPTRACK YAQUI</span>
              <h1>{activa.title}</h1><p>{activa.subtitle}</p></div>
            {page === 'mapa' && canManage && (
              <button type="button" className="btn-primary page-action"
                onClick={() => setFormState({ sonda: null })}>＋ Nueva sonda</button>
            )}
          </div>

          {page !== 'configuracion' && <div className="refresh-row"><span role="status">{loading ? 'Actualizando sondas…' : lastUpdate ? `Sondas: última consulta ${lastUpdate.toLocaleTimeString('es-MX')}${loadError ? ' (datos anteriores)' : ''}` : 'Sin datos cargados'}</span><button type="button" className="btn-small" disabled={loading} onClick={cargar}>↻ Actualizar datos</button></div>}
          {loadError && <div className="error-msg banner" role="alert">
            No se pudieron cargar las sondas: {loadError}. ¿Está funcionando el backend?
            <button type="button" className="btn-small" disabled={loading} onClick={cargar}>Reintentar</button>
          </div>}

          {page === 'inicio' && (
            <>
              <div className="overview-cards">
                <div className="overview-card"><span>Sondas registradas</span><strong>{lastUpdate ? sondas.length : '—'}</strong><small>Dispositivos en el sistema</small></div>
                <div className="overview-card"><span>Sondas activas</span><strong>{lastUpdate ? activas : '—'}</strong><small>Disponibles para monitoreo</small></div>
                <div className="overview-card"><span>Alertas de profundidad</span><strong>{lastUpdate ? alertas : '—'}</strong><small>Según umbral de desarrollo</small></div>
              </div>
              <ValleSummary revision={revision} />
              <div className="section-heading"><h2>Mapa y sondas</h2>
                <button className="btn-small" type="button" onClick={() => elegirPagina('mapa')}>Abrir mapa completo ›</button>
              </div>
              {mapaPanel}
            </>
          )}

          {page === 'mapa' && mapaPanel}

          {page === 'estadisticas' && (
            <>
              <ValleSummary revision={revision} />
              <ValleReports mode="trend" revision={revision} />
            </>
          )}

          {page === 'reportes' && <ValleReports mode="report" revision={revision} />}

          {page === 'configuracion' && (
            <section className="settings-card">
              <div className="settings-icon" aria-hidden="true">◐</div>
              <div><h2>Personalizar apariencia</h2>
                <p>Selecciona cómo deseas visualizar DeepTrack. El modo oscuro utiliza grises azulados suaves.</p></div>
              <ThemeSelector />
              <div className="settings-note">La apariencia y el estado de la barra lateral se guardan en este navegador. Estas opciones no cambian los permisos ni los datos del servidor.</div>
            </section>
          )}
        </main>
      </div>

      {notice && <div className={`monitor-toast${notice.error ? ' toast-error' : ''}`} role={notice.error ? 'alert' : 'status'}>{notice.text}<button type="button" aria-label="Cerrar aviso" onClick={() => setNotice(null)}>×</button></div>}
      {formState && <SondaForm
        sonda={formState.sonda} onSave={handleSave} onDelete={handleDelete}
        onClose={() => setFormState(null)} />}
      {trendSonda && <TrendModal sonda={trendSonda} onClose={() => setTrendSonda(null)} />}
    </div>
  );
}
