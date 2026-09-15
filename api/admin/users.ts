import { createClient } from "@supabase/supabase-js";

// Protección simple: mismo nivel que el resto del panel de admin (contraseña compartida).
// TODO recomendado a futuro: reemplazar por una verdadera sesión de admin.
const ADMIN_PASSWORD = process.env.ADMIN_PANEL_PASSWORD || "apsdev";

export default async function handler(req: any, res: any) {
  const providedPassword = req.headers["x-admin-password"] || "";
  if (providedPassword !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "No autorizado." });
  }

  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: "Configuración de Supabase faltante en el servidor." });
  }
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  if (req.method === "GET") {
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, email, nombre, rol, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Traemos los negocios para poder mostrar, si es comercio, cuál es su negocio
      const { data: shops } = await supabase.from("negocios").select("id, nombre, owner_id");

      const enriched = (profiles || []).map((p: any) => {
        const shop = shops?.find((s: any) => s.owner_id === p.id);
        return {
          id: p.id,
          email: p.email,
          nombre: p.nombre,
          rol: p.rol,
          createdAt: p.created_at,
          shopName: shop ? shop.nombre : null,
        };
      });

      return res.status(200).json(enriched);
    } catch (err: any) {
      console.error("Error listando usuarios:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: "Falta el ID del usuario." });
      }

      // Elimina el usuario de Supabase Auth; el trigger/FK con "on delete cascade"
      // se encarga de borrar su fila en "profiles", y "negocios.owner_id" queda en null.
      const { error } = await supabase.auth.admin.deleteUser(id as string);
      if (error) throw error;

      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.error("Error eliminando usuario:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed." });
}