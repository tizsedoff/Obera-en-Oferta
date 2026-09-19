import { createClient } from "@supabase/supabase-js";

// --- Autenticación de administradores (reemplaza la contraseña compartida) ---
// Verifica el JWT de Supabase Auth enviado en "Authorization: Bearer <token>" y confirma
// que el usuario figure en public.admins con un rol habilitado para usar el panel.
const PANEL_ROLES = ["superadmin", "admin"];

async function getAdminFromRequest(req: any, supabase: any): Promise<{ userId: string; role: string } | null> {
  const authHeader = req.headers?.authorization || "";
  const token = typeof authHeader === "string" && authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token || !supabase) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;

  const { data: row, error: rowError } = await supabase
    .from("admins")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();
  if (rowError || !row || !PANEL_ROLES.includes(row.role)) return null;

  return { userId: data.user.id, role: row.role };
}

export default async function handler(req: any, res: any) {
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: "Configuración de Supabase faltante en el servidor." });
  }
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const admin = await getAdminFromRequest(req, supabase);
  if (!admin) {
    return res.status(401).json({ error: "No autorizado." });
  }

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
      if (id === admin.userId) {
        return res.status(400).json({ error: "No podés eliminar tu propia cuenta desde el panel." });
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