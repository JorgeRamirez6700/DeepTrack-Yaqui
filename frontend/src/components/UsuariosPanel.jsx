import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api.js';
import { useDialog } from './useDialog.js';

const ROLES = ['ADMINISTRADOR','ANALISTA','DIRECTOR','CONSULTA'];

function UsuarioForm({ cuenta, currentUser, onClose, onSaved }) {
  const ref = useRef(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [form,setForm] = useState({ nombreCompleto:cuenta?.nombreCompleto ?? '', usuarioLogin:cuenta?.usuarioLogin ?? '', password:'', rol:cuenta?.rol ?? 'CONSULTA', estado:cuenta?.estado ?? 'ACTIVO' });
  const own = cuenta?.usuarioLogin === currentUser;
  useDialog(ref, () => { if (!busy) onClose(); });
  const change = key => e => setForm(f => ({...f,[key]:e.target.value}));
  async function save(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      if (cuenta) await api.actualizarUsuario(cuenta.idUsuario,{nombreCompleto:form.nombreCompleto,rol:form.rol,estado:form.estado});
      else await api.crearUsuario({nombreCompleto:form.nombreCompleto,usuarioLogin:form.usuarioLogin,password:form.password,rol:form.rol});
      onSaved();
    } catch(e) { setError(e.message); setBusy(false); }
  }
  return <div className="modal-backdrop"><div ref={ref} className="modal narrow" role="dialog" aria-modal="true" aria-labelledby="user-form-title" tabIndex={-1}>
    <div className="modal-head"><h3 id="user-form-title">{cuenta?'Editar cuenta':'Nueva cuenta'}</h3><button className="modal-close" type="button" disabled={busy} onClick={onClose} aria-label="Cerrar">×</button></div>
    <form onSubmit={save}>
      {error && <p className="error-msg" role="alert">{error}</p>}
      <div className="field"><label htmlFor="u-name">Nombre completo</label><input id="u-name" required maxLength={120} value={form.nombreCompleto} onChange={change('nombreCompleto')} /></div>
      <div className="field"><label htmlFor="u-login">Usuario</label><input id="u-login" required maxLength={60} disabled={!!cuenta} autoComplete="off" value={form.usuarioLogin} onChange={change('usuarioLogin')} /></div>
      {!cuenta && <div className="field"><label htmlFor="u-password">Contraseña inicial (mínimo 8 caracteres)</label><input id="u-password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} value={form.password} onChange={change('password')} /></div>}
      <div className="form-row"><div className="field"><label htmlFor="u-role">Rol</label><select id="u-role" value={form.rol} disabled={own} onChange={change('rol')}>{ROLES.map(r=><option key={r}>{r}</option>)}</select></div>
      {cuenta && <div className="field"><label htmlFor="u-state">Estado</label><select id="u-state" value={form.estado} disabled={own} onChange={change('estado')}><option>ACTIVO</option><option>INACTIVO</option></select></div>}</div>
      {own && <p className="users-note">No puedes retirar tus propios permisos ni desactivar tu cuenta.</p>}
      <div className="form-actions"><button type="button" className="btn-secondary" disabled={busy} onClick={onClose}>Cancelar</button><button className="btn-primary" disabled={busy}>{busy?'Guardando…':'Guardar'}</button></div>
    </form></div></div>;
}

export default function UsuariosPanel({currentUser}) {
  const [users,setUsers]=useState([]);
  const [search,setSearch]=useState('');
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [edit,setEdit]=useState(null);
  const load=useCallback(async()=>{setLoading(true);setError('');try{setUsers(await api.listarUsuarios());}catch(e){setError(e.message);}finally{setLoading(false);}},[]);
  useEffect(()=>{load();},[load]);
  const matches=users.filter(u=>[u.nombreCompleto,u.usuarioLogin,u.rol,u.estado].join(' ').toLowerCase().includes(search.trim().toLowerCase()));
  return <section className="users-panel" aria-label="Administración de usuarios">
    <div className="users-toolbar"><input type="search" aria-label="Buscar cuentas" placeholder="Buscar usuario, rol o estado" value={search} onChange={e=>setSearch(e.target.value)} /><button className="btn-primary" onClick={()=>{setNotice('');setEdit({cuenta:null});}}>＋ Nueva cuenta</button><button className="btn-small" disabled={loading} onClick={load}>Actualizar</button></div>
    {notice && <p role="status">{notice}</p>}
    {error && <p className="error-msg" role="alert">{error}</p>}
    {loading ? <p role="status">Cargando cuentas…</p> : <><p className="users-note">{matches.length} de {users.length} cuentas</p><div className="report-table-wrap"><table className="report-table"><thead><tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{matches.map(u=><tr key={u.idUsuario}><td>{u.nombreCompleto}</td><td>{u.usuarioLogin}{u.usuarioLogin===currentUser?' (tú)':''}</td><td>{u.rol}</td><td><span className={'badge '+(u.estado==='ACTIVO'?'ok':'unknown')}>{u.estado}</span></td><td><button className="btn-small" aria-label={'Editar '+u.usuarioLogin} onClick={()=>{setNotice('');setEdit({cuenta:u});}}>Editar</button></td></tr>)}</tbody></table></div>{!matches.length && <p className="empty-state">No hay cuentas que coincidan.</p>}</>}
    <p className="users-note">Desactivar una cuenta impide nuevos accesos y revoca su sesión en la siguiente petición protegida. No se eliminan cuentas.</p>
    {edit && <UsuarioForm cuenta={edit.cuenta} currentUser={currentUser} onClose={()=>setEdit(null)} onSaved={()=>{setEdit(null);setNotice('Cuenta guardada correctamente.');load();}} />}
  </section>;
}
