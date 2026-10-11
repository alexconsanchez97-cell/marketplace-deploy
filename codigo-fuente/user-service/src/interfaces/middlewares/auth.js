const jwt = require("jsonwebtoken");

function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "No se proporcionó un token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const datosUsuario = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = datosUsuario;
    next();
  } catch (error) {
    return res.status(401).json({ msg: "Token inválido o expirado" });
  }
}

function permitirRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ msg: "No tienes permiso para esta acción" });
    }
    next();
  };
}

module.exports = { verificarToken, permitirRoles };