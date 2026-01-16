/**
 * Middleware per verificare che l'utente abbia uno dei ruoli specificati
 * @param  {...string} allowedRoles - Ruoli consentiti ('admin', 'editor', 'viewer')
 */
const roleCheck = (...allowedRoles) => {
  return (req, res, next) => {
    // Verifica che l'utente sia autenticato
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Autenticazione richiesta',
      });
    }

    // Superuser ha sempre accesso
    if (req.user.isSuperuser) {
      return next();
    }

    // Verifica ruolo utente
    if (!req.user.profile) {
      return res.status(403).json({
        success: false,
        error: 'Profilo utente non trovato',
      });
    }

    const userRole = req.user.profile.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Permessi insufficienti',
        required: allowedRoles,
        current: userRole,
      });
    }

    next();
  };
};

/**
 * Shortcut per admin only
 */
const adminOnly = roleCheck('admin');

/**
 * Shortcut per admin o editor
 */
const editorOrAdmin = roleCheck('admin', 'editor');

module.exports = {
  roleCheck,
  adminOnly,
  editorOrAdmin,
};
