// api/pedidos/listar.js - Obtener pedidos del usuario
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { usuario_id } = req.query;

    if (!usuario_id) {
      return res.status(400).json({ error: 'usuario_id requerido' });
    }

    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('usuario_id', usuario_id)
      .order('fecha_pedido', { ascending: false });

    if (error) {
      throw error;
    }

    res.status(200).json({ 
      success: true,
      pedidos: pedidos || [],
      total: pedidos?.length || 0
    });

  } catch (error) {
    console.error('Error listando pedidos:', error);
    res.status(500).json({ 
      error: 'Error al obtener pedidos',
      details: error.message 
    });
  }
}
