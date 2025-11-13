// api/pedidos/actualizar.js - Actualizar estado/progreso de pedido
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pedido_id, estado, progreso, video_url } = req.body;

    if (!pedido_id) {
      return res.status(400).json({ error: 'pedido_id requerido' });
    }

    const updateData = {};
    if (estado) updateData.estado = estado;
    if (progreso !== undefined) updateData.progreso = progreso;
    if (video_url) updateData.video_url = video_url;

    const { data, error } = await supabase
      .from('pedidos')
      .update(updateData)
      .eq('id', pedido_id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(200).json({ 
      success: true,
      pedido: data,
      message: 'Pedido actualizado correctamente'
    });

  } catch (error) {
    console.error('Error actualizando pedido:', error);
    res.status(500).json({ 
      error: 'Error al actualizar pedido',
      details: error.message 
    });
  }
}
