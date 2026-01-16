/**
 * Verifica se l'utente può modificare una procedura
 * 
 * @param {Object} user - Utente autenticato
 * @param {Object} procedure - Procedura da verificare
 * @returns {boolean}
 */
function canEdit(user, procedure) {
  if (!user || !procedure) return false;
  
  // Superuser ha sempre accesso
  if (user.isSuperuser) return true;
  
  // Admin può modificare tutto
  if (user.profile && user.profile.role === 'admin') return true;
  
  // Editor può modificare solo le proprie
  if (user.profile && user.profile.role === 'editor') {
    return procedure.ownerId === user.id;
  }
  
  return false;
}

/**
 * Verifica se l'utente può eliminare una procedura
 * 
 * @param {Object} user - Utente autenticato
 * @param {Object} procedure - Procedura da verificare
 * @returns {boolean}
 */
function canDelete(user, procedure) {
  if (!user || !procedure) return false;
  
  // Superuser ha sempre accesso
  if (user.isSuperuser) return true;
  
  // Admin può eliminare tutto
  if (user.profile && user.profile.role === 'admin') return true;
  
  // Editor può eliminare solo le proprie
  if (user.profile && user.profile.role === 'editor') {
    return procedure.ownerId === user.id;
  }
  
  return false;
}

/**
 * Verifica se l'utente può visualizzare una procedura
 * 
 * @param {Object} user - Utente autenticato (può essere null per utenti non autenticati)
 * @param {Object} procedure - Procedura da verificare
 * @returns {boolean}
 */
function canView(user, procedure) {
  if (!procedure) return false;
  
  // Se procedura pubblica, tutti possono vedere
  if (procedure.isPublic) return true;
  
  if (!user) return false;
  
  // Superuser e Admin possono vedere tutto
  if (user.isSuperuser) return true;
  if (user.profile && user.profile.role === 'admin') return true;
  
  // Owner può vedere le proprie
  if (procedure.ownerId === user.id) return true;
  
  return false;
}

/**
 * Verifica se l'utente può creare procedure
 * 
 * @param {Object} user - Utente autenticato
 * @returns {boolean}
 */
function canCreate(user) {
  if (!user) return false;
  
  // Superuser può sempre creare
  if (user.isSuperuser) return true;
  
  // Admin ed Editor possono creare
  if (user.profile && ['admin', 'editor'].includes(user.profile.role)) {
    return true;
  }
  
  return false;
}

/**
 * Verifica se l'utente è admin
 * 
 * @param {Object} user - Utente autenticato
 * @returns {boolean}
 */
function isAdmin(user) {
  if (!user) return false;
  if (user.isSuperuser) return true;
  return user.profile && user.profile.role === 'admin';
}

/**
 * Verifica se l'utente può gestire altri utenti
 * 
 * @param {Object} user - Utente autenticato
 * @returns {boolean}
 */
function canManageUsers(user) {
  return isAdmin(user);
}

module.exports = {
  canEdit,
  canDelete,
  canView,
  canCreate,
  isAdmin,
  canManageUsers,
};
