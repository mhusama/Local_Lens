export function requireAdmin(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;

    if (!token) {
        return res.status(401).json({ message: "Admin authentication required" });
    }

    let payload;
    try {
        payload = JSON.parse(Buffer.from(token, "base64").toString("utf8"));
    } catch {
        return res.status(401).json({ message: "Invalid admin token" });
    }

    if (payload?.type !== "admin" || !payload?.id) {
        return res.status(401).json({ message: "Invalid admin token" });
    }

    req.admin = { id: payload.id, email: payload.email };
    next();
}
