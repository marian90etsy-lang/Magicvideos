// api/comentarios/listar.js - Obtener comentarios por personaje
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
    const { personaje_id } = req.query;

    let query = supabase
      .from('comentarios')
      .select('*')
      .eq('aprobado', true)
      .order('fecha', { ascending: false });

    if (personaje_id) {
      query = query.eq('personaje_id', personaje_id);
    }

    const { data: comentarios, error } = await query;

    if (error) {
      throw error;
    }

    const promedio = comentarios.length > 0
      ? comentarios.reduce((sum, c) => sum + c.calificacion, 0) / comentarios.length
      : 0;

    res.status(200).json({ 
      success: true,
      comentarios: comentarios || [],
      total: comentarios?.length || 0,
      promedio: Math.round(promedio * 10) / 10
    });

  } catch (error) {
    console.error('Error listando comentarios:', error);
    res.status(500).json({ 
      error: 'Error al obtener comentarios',
      details: error.message 
    });
  }
}
