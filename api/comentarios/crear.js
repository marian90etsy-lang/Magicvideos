// api/comentarios/crear.js - Crear comentario/review
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      usuario_id, 
      pedido_id, 
      personaje_id, 
      personaje_nombre,
      calificacion, 
      comentario 
    } = req.body;

    if (!usuario_id || !personaje_id || !calificacion || !comentario) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    if (calificacion < 1 || calificacion > 5) {
      return res.status(400).json({ error: 'Calificación debe estar entre 1 y 5' });
    }

    if (pedido_id) {
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', pedido_id)
        .eq('usuario_id', usuario_id)
        .eq('estado', 'completado')
        .single();

      if (pedidoError || !pedido) {
        return res.status(403).json({ error: 'Pedido no válido para calificar' });
      }

      if (pedido.calificado) {
        return res.status(400).json({ error: 'Ya calificaste este pedido' });
      }
    }

    const { data: nuevoComentario, error: comentarioError } = await supabase
      .from('comentarios')
      .insert({
        usuario_id,
        pedido_id,
        personaje_id,
        personaje_nombre,
        calificacion,
        comentario: comentario.trim(),
        aprobado: true,
      })
      .select()
      .single();

    if (comentarioError) {
      throw comentarioError;
    }

    if (pedido_id) {
      await supabase
        .from('pedidos')
        .update({ calificado: true })
        .eq('id', pedido_id);
    }

    res.status(201).json({ 
      success: true,
      comentario: nuevoComentario,
      message: '¡Gracias por tu calificación!'
    });

  } catch (error) {
    console.error('Error creando comentario:', error);
    res.status(500).json({ 
      error: 'Error al crear comentario',
      details: error.message 
    });
  }
}
