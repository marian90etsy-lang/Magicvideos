import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { carrito, usuario } = req.body;

    if (!carrito || carrito.length === 0) {
      return res.status(400).json({ error: 'Carrito vacío' });
    }

    if (!usuario || !usuario.id) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const lineItems = carrito.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${item.personaje.nombre} - ${item.tipoVideo.nombre}`,
          description: `Video personalizado: ${item.mensaje.substring(0, 100)}`,
        },
        unit_amount: Math.round((item.precioBase + item.duracion.precioExtra + item.velocidadEntrega.precioExtra) * 100),
      },
      quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `https://magicvideos.vercel.app/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://magicvideos.vercel.app/checkout`,
      client_reference_id: usuario.id,
      metadata: {
        usuario_id: usuario.id,
        usuario_email: usuario.email,
        cantidad_items: carrito.length.toString(),
      },
    });

    const pedidosPromises = carrito.map(item => 
      supabase.from('pedidos').insert({
        usuario_id: usuario.id,
        personaje_id: item.personaje.id,
        personaje_nombre: item.personaje.nombre,
        tipo_video: item.tipoVideo.id,
        duracion: item.duracion.id,
        velocidad_entrega: item.velocidadEntrega.id,
        mensaje_personalizado: item.mensaje,
        precio_base: item.precioBase,
        precio_total: item.precioBase + item.duracion.precioExtra + item.velocidadEntrega.precioExtra,
        estado: 'pendiente',
        progreso: 0,
        stripe_session_id: session.id,
        fecha_estimada: new Date(Date.now() + item.velocidadEntrega.horas * 60 * 60 * 1000).toISOString(),
      })
    );

    await Promise.all(pedidosPromises);

    res.status(200).json({ 
      url: session.url,
      sessionId: session.id
    });

  } catch (error) {
    console.error('Error en checkout:', error);
    res.status(500).json({ 
      error: 'Error al crear sesión de pago',
      details: error.message 
    });
  }
}
